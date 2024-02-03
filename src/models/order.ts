import mongoose from "mongoose";

const schema = new mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: [true, "Please Enter Address"]
        },
        city: {
            type: String,
            required: [true, "Please Enter City"]
        },
        state: {
            type: String,
            required: [true, "Please Enter State"]
        },
        country: {
            type: String,
            required: [true, "Please Enter Country"]
        },
        pinCode: {
            type: Number,
            required: [true, "Please Enter PinCode"]
        },
    },
    user: {
        type: String,
        ref: "User",
        required: true,
    },
    subTotal: {
        type: Number,
        required: [true, "Please Add Subtotal"]
    },
    tax: {
        type: Number,
        required: [true, "Please Add Tax"]
    },
    shippingCharges: {
        type: Number,
        required: [true, "Please Add shippingCharges"]
    },
    discount: {
        type: Number,
        required: [true, "Please Add Discount"]
    },
    total: {
        type: Number,
        required: [true, "Please Add Total"]
    },
    status: {
        type: String,
        enum: ["Processing", "Shipped", "Delievered"],
        default: "Processing"
    },

    orderItems: [
        {
            name: String,
            photo: String,
            price: Number,
            quantity: Number,
            productId: {
                type: mongoose.Types.ObjectId,
                ref: "Product",
            }
        }
    ]
}, {
    timestamps: true,
});

export const Order = mongoose.model('Order', schema);