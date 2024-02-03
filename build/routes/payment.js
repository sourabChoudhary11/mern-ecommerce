import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { createPaymentIntent, deleteCoupon, discount, getAllCoupons, newCoupon } from "../controllers/payment.js";
const paymentRoute = express.Router();
// Route - /api/v1/payment/create  --->  create order product payment
paymentRoute.post("/create", createPaymentIntent);
// Route - /api/v1/payment/discount  --->  create a new coupon
paymentRoute.get("/discount", discount);
// Route - /api/v1/payment/coupon/new  --->  create a new coupon
paymentRoute.post("/coupon/new", isAdmin, newCoupon);
// Route - /api/v1/payment/coupon/all  --->  get all coupons
paymentRoute.get("/coupon/all", isAdmin, getAllCoupons);
// Route - /api/v1/payment/coupon/delete  --->  delete a coupon
paymentRoute.delete("/coupon/:id", isAdmin, deleteCoupon);
export default paymentRoute;
