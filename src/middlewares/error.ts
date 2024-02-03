import { Request, Response, NextFunction } from "express"
import ErrorHandler from "../utils/utility-errorHandler-class.js";
import { Controller_Type } from "../types/types.js";

export const errorMiddleware = (
    err: ErrorHandler,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    err.message ||= "Internal Server Error";
    if(err.name === "CastError") err.message = "Invalid Id";
    err.statusCode ||= 500;
    res.status(err.statusCode).send({
        success: false,
        message: err.message,
    });
};

export const TryCatch = (func: Controller_Type) => {

    return (req: Request, res: Response, next: NextFunction) => {
        return Promise.resolve(func(req, res, next)).catch(next);
    }
};
