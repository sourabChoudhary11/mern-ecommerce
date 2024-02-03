import mongoose from "mongoose";

const schema = new mongoose.Schema({
    couponCode:{
        type: String,
        required: [true, "Please Enter Coupon Code"],
        unique: true
    },
    amount: {
        type: Number,
        required: [true, "Please Enter Amount"],
    }
});

export const Coupon = mongoose.model("Coupon", schema);