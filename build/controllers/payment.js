import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-errorHandler-class.js";
import { stripe } from "../app.js";
export const createPaymentIntent = TryCatch(async (req, res, next) => {
    const { amount } = req.body;
    if (!amount)
        throw new ErrorHandler("Please Enter Amount", 400);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(amount) * 100,
        currency: "inr",
    });
    return res.status(201).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
    });
});
export const newCoupon = TryCatch(async (req, res, next) => {
    const { coupon, amount } = req.body;
    if (!coupon || !amount)
        throw new ErrorHandler("Please Enter All Fields", 400);
    await Coupon.create({
        couponCode: coupon,
        amount
    });
    return res.status(201).json({
        success: true,
        message: `Coupon ${coupon} Created Successfully`
    });
});
export const getAllCoupons = TryCatch(async (req, res, next) => {
    const coupons = await Coupon.find({});
    return res.status(200).json({
        success: true,
        coupons
    });
});
export const discount = TryCatch(async (req, res, next) => {
    const { coupon } = req.query;
    const couponCode = await Coupon.findOne({ couponCode: coupon });
    if (!couponCode)
        throw new ErrorHandler("Invalid Coupon", 400);
    return res.status(200).json({
        success: true,
        coupon: couponCode
    });
});
export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon)
        throw new ErrorHandler("Coupon Not Found", 404);
    await coupon.deleteOne();
    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon.couponCode} Deleted Successfully`
    });
});
