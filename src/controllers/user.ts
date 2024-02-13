import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { Login_User_Request_Body, New_User_Request_Body } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-errorHandler-class.js";
import bcrpyt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AvatarGenerator } from "random-avatar-generator";

const avatarGenerator = new AvatarGenerator();

export const newUser = TryCatch(
    async (
        req: Request<{}, {}, New_User_Request_Body>,
        res: Response,
        next: NextFunction
    ) => {
        const { name, email, gender, dob, password } = req.body;

        if (!name || !email || !gender || !dob || !password) {
            throw new ErrorHandler("Please Add All Fields", 400);
        }

        let user = await User.findOne({email});
        console.log(user);

        if (user) {
            return res.status(400).json({
                success: false,
                message: "User Already Exist",
            });
        }

        // secure password before creating user
        const hashedPassword = bcrpyt.hashSync(password, 20);

        // create avatar
        const avatar = avatarGenerator.generateRandomAvatar(email);

        // create user
        user = await User.create({
            name,
            email,
            photo: avatar,
            gender,
            dob,
            password: hashedPassword
        })

        // generate token
        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET_KEY as string);

        // set cookie and send response
        res.status(201).cookie("token", token, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: "none",
            secure: true,
        }).json({
            success: true,
            message: `Welcome, ${user.name}`,
        })
    }
);

export const loginUser = TryCatch(async (
    req: Request<{}, {}, Login_User_Request_Body>,
    res: Response,
    next: NextFunction

) => {
    const { email, password } = req.body;

    if (!email || !password) throw new ErrorHandler("Please Add All Fields", 400);

    const isExist = await User.findOne({ email });

    if (!isExist) throw new ErrorHandler("Incorrect Email or Password", 400);

    // compare password
    const isPasswordMatched = bcrpyt.compareSync(password, isExist.password);

    if(!isPasswordMatched) throw new ErrorHandler("Incorrect Email or Password", 400);

    // generate token
    const token = jwt.sign({ _id: isExist._id }, process.env.TOKEN_SECRET_KEY as string);

    console.log(token);

    res.status(200).cookie("token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "none",
        secure: true,
    }).json({
        success: true,
        message: `Welcome back, ${isExist.name}`
    })
})

export const logOut = TryCatch(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { token } = req.cookies;
    if (token) res.status(200).cookie("token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 0,
    });
})

export const getAllUsers = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({});
    return res.status(200).json({
        success: true,
        users,
    })
})

export const getSpecificUser = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) throw new ErrorHandler("Invalid Id", 400);

    return res.status(200).json({
        success: true,
        user,
    })
})

export const deleteUser = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) throw new ErrorHandler("Invalid Id", 400);

    await user.deleteOne();

    return res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    })
})