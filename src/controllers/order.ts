import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { New_Order_Request_Body } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidateCaches, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-errorHandler-class.js";
import { myCache } from "../app.js";


export const newOrder = TryCatch(async (
    req: Request<{}, {}, New_Order_Request_Body>,
    res: Response,
    next: NextFunction,
) => {

    const { shippingCharges, discount, shippingInfo, subTotal, total, orderItems, tax, user } = req.body;

    if (!shippingCharges || !discount || !shippingInfo || !subTotal || !total || !orderItems || !tax || !user) {
        throw new ErrorHandler("Please Enter All Fields", 400);
    }

    await Order.create({ shippingCharges, discount, shippingInfo, subTotal, total, orderItems, tax, user });

    await reduceStock(orderItems);

    invalidateCaches({ product: true, order: true, admin: true, userId: user, productId:orderItems.map(i=>String(i.productId))});

    return res.status(201).json({
        success: true,
        message: "Order Placed Successfully",
    })

})


export const myOrders = TryCatch(async (
    req: Request<{}, {}, {}, { id?: string }>,
    res: Response,
    next: NextFunction,
) => {

    const { id } = req.query;

    let orders = [];

    const key = `orders_${id}`;

    if (myCache.has(key)) {
        orders = JSON.parse(myCache.get(key) as string);
    }
    else {
        orders = await Order.find({ user: id });
        myCache.set(key, JSON.stringify(orders));
    }

    return res.status(200).json({
        success: true,
        orders,
    })
})

export const getAllOrders = TryCatch(async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {

    let orders = [];

    if (myCache.has("orders")) {
        orders = JSON.parse(myCache.get("orders") as string);
    }
    else {
        orders = await Order.find({}).populate("user", "name");
        myCache.set("orders", JSON.stringify(orders));
    }

    return res.status(200).json({
        success: true,
        orders,
    })
})

export const getSpecificOrder = TryCatch(async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
) => {

    const { id } = req.params;

    let order;

    const key = `order_${id}`;

    if (myCache.has(key)) {
        order = JSON.parse(myCache.get(key) as string);
    }
    else {
        order = await Order.findById(id).populate("user", "name");
        myCache.set(key, JSON.stringify(order));
    }

    if (!order) throw new ErrorHandler("Order Not Found", 404);

    return res.status(200).json({
        success: true,
        order,
    })
})

export const processOrder = TryCatch(async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) throw new ErrorHandler("Order Not Found", 404);

    order.status = order.status === "Processing" ? "Shipped" : "Delievered";
    await order.save();

    invalidateCaches({ order: true, admin: true, userId: order.user, orderId:String(order._id) });
    
    return res.status(200).json({
        success: true,
        message: "Order Processed Successfully",
    })

})

export const deleteOrder = TryCatch(async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
) => {

    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) throw new ErrorHandler("Order Not Found", 404);
    
    await order.deleteOne();
    
    invalidateCaches({ order: true, admin: true, userId: order.user, orderId:String(order._id) });

    return res.status(200).json({
        success: true,
        message: "Order Deleted Successfully",
    })

})