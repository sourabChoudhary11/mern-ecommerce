import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-errorHandler-class.js";
import { TryCatch } from "./error.js";

// middleware to know person is admin or not
export const isAdmin = TryCatch(async(req, res, next)=>{
    const {id} = req.query;
    if(!id) throw new ErrorHandler("Login First", 401);

    const user = await User.findById(id);
    if(!user) throw new ErrorHandler("Invalid Id", 401);

    if(user.role!=="admin") throw new ErrorHandler("Not Accessible For User", 401); 

    next();
})
