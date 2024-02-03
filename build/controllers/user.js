import { User } from "../models/user.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-errorHandler-class.js";
export const newUser = TryCatch(async (req, res, next) => {
    const { name, email, _id, photo, gender, role, dob } = req.body;
    let user = await User.findById(_id);
    if (user) {
        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}`,
        });
    }
    if (!name || !email || !_id || !photo || !gender || !role || !dob) {
        throw new ErrorHandler("Please Add All Fields", 400);
    }
    user = await User.create({
        _id,
        name,
        email,
        photo,
        gender,
        role,
        dob
    });
    res.status(201).json({
        success: true,
        message: `Welcome, ${user.name}`,
    });
});
export const getAllUsers = TryCatch(async (req, res, next) => {
    const users = await User.find({});
    return res.status(200).json({
        success: true,
        users,
    });
});
export const getSpecificUser = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user)
        throw new ErrorHandler("Invalid Id", 400);
    return res.status(200).json({
        success: true,
        user,
    });
});
export const deleteUser = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user)
        throw new ErrorHandler("Invalid Id", 400);
    await user.deleteOne();
    return res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    });
});
