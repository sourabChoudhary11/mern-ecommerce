import mongoose, { Error } from "mongoose";
import { Product } from "../models/product.js";
import { myCache } from "../app.js";
export const connectDB = (uri) => {
    mongoose.connect(uri, {
        dbName: "Mern_Ecommerce",
    }).then(c => {
        console.log(`DB connected to ${c.connection.host}`);
    }).catch((e) => {
        console.log(`The error is ${e}`);
    });
};
export const invalidateCaches = ({ product, order, admin, userId, orderId, productId }) => {
    if (product) {
        const productKeys = ["all_products", "categories", "latest_products",];
        if (typeof productId === "string")
            productKeys.push(`specific_${productId}`);
        if (typeof productId === "object")
            productId.forEach(i => productKeys.push(`specific_${i}`));
        myCache.del(productKeys);
    }
    if (order) {
        const orderKeys = ["orders", `orders_${userId}`, `order_${orderId}`];
        myCache.del(orderKeys);
    }
    if (admin) {
        myCache.del(["pie_stats", "dashboard_stats", "bar_stats", "line_stats"]);
    }
};
export const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const { productId, quantity } = order;
        const product = await Product.findById(productId);
        if (!product)
            throw new Error("Product Not Found");
        product.stock -= quantity;
        await product?.save();
    }
};
export const calculatePercentage = (currentMonth, lastMonth) => {
    if (lastMonth === 0)
        return currentMonth * 100;
    const percent = (currentMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));
};
export const getInventory = async ({ categories, productCount }) => {
    const categoryCount = [];
    const categoriesProductsCount = await Promise.all(categories.map(category => Product.countDocuments({ category })));
    categories.forEach((category, index) => {
        categoryCount.push({
            [category]: Math.round((categoriesProductsCount[index] / productCount) * 100)
        });
    });
    return categoryCount;
};
export const getChartData = ({ length, dataArr, today, property }) => {
    const data = new Array(length).fill(0);
    dataArr.forEach(i => {
        const createDate = i.createdAt;
        const monthDiff = (today.getMonth() - createDate.getMonth() + 12) % 12;
        if (monthDiff < length) {
            data[length - monthDiff - 1] += property ? i[property] : 1;
        }
    });
    return data;
};
