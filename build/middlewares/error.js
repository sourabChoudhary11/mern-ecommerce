export const errorMiddleware = (err, req, res, next) => {
    err.message || (err.message = "Internal Server Error");
    if (err.name === "CastError")
        err.message = "Invalid Id";
    err.statusCode || (err.statusCode = 500);
    res.status(err.statusCode).send({
        success: false,
        message: err.message,
    });
};
export const TryCatch = (func) => {
    return (req, res, next) => {
        return Promise.resolve(func(req, res, next)).catch(next);
    };
};
