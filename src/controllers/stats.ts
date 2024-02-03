import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventory } from "../utils/features.js";


export const getDashboardStats = TryCatch(async (req, res, next) => {

    let stats;
    if (myCache.has("dashboard_stats")) stats = JSON.parse(myCache.get("dashboard_stats") as string);
    else {

        const today = new Date();

        const currentMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        }

        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        }

        const currentMonthProductsPromise = Product.find({
            createdAt: {
                $gte: currentMonth.start,
                $lte: currentMonth.end
            }
        });

        const lastMonthProductsPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });

        const currentMonthUsersPromise = User.find({
            createdAt: {
                $gte: currentMonth.start,
                $lte: currentMonth.end
            }
        });

        const lastMonthUsersPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });

        const currentMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: currentMonth.start,
                $lte: currentMonth.end
            }
        });

        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });

        const lastSixMonths = new Date();
        lastSixMonths.setMonth(new Date().getMonth() - 6);

        const lastSixMonthsOrdersPromise = Order.find({
            createdAt: {
                $gte: lastSixMonths,
                $lte: today
            }
        })

        const [
            currentMonthProducts,
            currentMonthUsers,
            currentMonthOrders,
            lastMonthProducts,
            lastMonthUsers,
            lastMonthOrders,
            productCount,
            userCount,
            orders,
            lastSixMonthsOrders,
            categories,
            maleUserCount,
            latestTransaction
        ] = await Promise.all([
            currentMonthProductsPromise,
            currentMonthUsersPromise,
            currentMonthOrdersPromise,
            lastMonthProductsPromise,
            lastMonthUsersPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),
            lastSixMonthsOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: "male" }),
            Order.find({}).select(["discount", "orderItems", "status", "total"]).sort({ createdAt: -1 }).limit(3)
        ]);

        const currentMonthRevenue = currentMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);

        const percent = {
            revenue: calculatePercentage(currentMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(currentMonthProducts.length, lastMonthProducts.length),
            user: calculatePercentage(currentMonthUsers.length, lastMonthUsers.length),
            order: calculatePercentage(currentMonthOrders.length, lastMonthOrders.length)
        };

        const totalRevenue = orders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue: totalRevenue,
            product: productCount,
            user: userCount,
            order: orders.length
        }

        const lastSixMonthsOrdersCount = getChartData({ length: 6, today, dataArr: lastSixMonthsOrders});

        const lastSixMonthsOrdersRevenue = getChartData({ length: 6, today, dataArr: lastSixMonthsOrders, property: "total"});

        const categoryCount: Record<string, number>[] = await getInventory({ categories, productCount });

        const genderRatio = {
            male: maleUserCount,
            female: userCount - maleUserCount
        }

        const modifyLatestTransaction: Record<string, string | number>[] = latestTransaction.map(t => (
            {
                _id: String(t._id),
                amount: t.total,
                discount: t.discount,
                status: t.status,
                quantity: t.orderItems.length
            }
        ))


        stats = {
            percent,
            count,
            chart: {
                order: lastSixMonthsOrdersCount,
                revenue: lastSixMonthsOrdersRevenue
            },
            categoryCount,
            genderRatio,
            latestTransaction: modifyLatestTransaction
        };

        myCache.set("dashboard_stats", JSON.stringify(stats));
    }

    return res.status(200).json({
        success: true,
        stats
    })

})

export const getPieCharts = TryCatch(async (req, res, next) => {

    let pieCharts;

    if (myCache.has("pie_stats")) {
        pieCharts = JSON.parse(myCache.get("pie_stats") as string);
    }
    else {

        const [
            processingOrder,
            shippedOrder,
            delieveredOrder,
            categories,
            productCount,
            outOfStock,
            allOrders,
            allUsers,
            customers,
            admins
        ] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delievered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            Order.find({}).select(["total", "discount", "subTotal", "tax", "shippingCharges"]),
            User.find({}).select("dob"),
            User.countDocuments({ role: "user" }),
            User.countDocuments({ role: "admin" })
        ])

        const orderFullfillmentRatio = {
            processing: processingOrder,
            shipped: shippedOrder,
            delievered: delieveredOrder
        }

        const productCategoriesRatio: Record<string, number>[] = await getInventory({ categories, productCount });

        const stockAvailability = {
            inStock: productCount - outOfStock,
            outOfStock
        }

        const totalGrossIncome = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const discount = allOrders.reduce((total, order) => total + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((total, order) => total + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((total, order) => total + (order.tax || 0), 0);
        const marketingCost = Math.round(totalGrossIncome * (30 / 100));
        const netMargin = totalGrossIncome - discount - marketingCost - burnt - productionCost;

        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost
        };

        const usersAgeGroup = {
            teen: allUsers.filter(u => u.age < 20).length,
            adult: allUsers.filter(u => u.age >= 20 && u.age < 40).length,
            old: allUsers.filter(u => u.age >= 40).length
        }

        const adminCustomer = {
            admin: admins,
            user: customers
        };

        pieCharts = {
            orderFullfillmentRatio,
            productCategoriesRatio,
            stockAvailability,
            revenueDistribution,
            usersAgeGroup,
            adminCustomer
        }

        myCache.set("pie_stats", JSON.stringify(pieCharts));
    }

    return res.status(200).json({
        success: true,
        pieCharts
    })
})

export const getBarCharts = TryCatch(async (req, res, next) => {

    let barCharts;

    if (myCache.has("bar_stats")) {
        barCharts = JSON.parse(myCache.get("bar_stats") as string);
    }
    else {

        const today = new Date();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(new Date().getMonth() - 6);

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(new Date().getMonth() - 12);

        const [
            sixMonthsAgoProducts,
            sixMonthsAgoUsers,
            tweleveMonthsAgoOrders
        ] = await Promise.all([
            Product.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } }).select("createdAt"),
            User.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } }).select("createdAt"),
            Order.find({ createdAt: { $gte: twelveMonthsAgo, $lte: today } }).select("createdAt"),
        ]);

        const productCount = getChartData({ length: 6, today, dataArr: sixMonthsAgoProducts });

        const userCount = getChartData({ length: 6, today, dataArr: sixMonthsAgoUsers });

        const orderCount = getChartData({ length: 12, today, dataArr: tweleveMonthsAgoOrders });

        barCharts = {
            product: productCount,
            user: userCount,
            order: orderCount
        };
        myCache.set("bar_stats", JSON.stringify(barCharts));
    }

    return res.status(200).json({
        success: true,
        barCharts
    })

})

export const getLineCharts = TryCatch(async (req, res, next) => {

    let lineCharts;

    if (myCache.has("line_stats")) {
        lineCharts = JSON.parse(myCache.get("line_stats") as string);
    }
    else {

        const today = new Date();

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(new Date().getMonth() - 12);

        const findQuery = {
            createdAt: { $gte: twelveMonthsAgo, $lte: today }
        }

        const [
            twelveMonthsAgoProducts,
            tweleveMonthsAgoUsers,
            tweleveMonthsAgoOrders
        ] = await Promise.all([
            Product.find(findQuery).select("createdAt"),
            User.find(findQuery).select("createdAt"),
            Order.find(findQuery).select(["createdAt", "total", "discount"]),
        ]);


        const productCount = getChartData({ length: 12, today, dataArr: twelveMonthsAgoProducts });
        const userCount = getChartData({ length: 12, today, dataArr: tweleveMonthsAgoUsers });
        const discount = getChartData({ length: 12, today, dataArr: tweleveMonthsAgoOrders, property: "discount" });
        const revenue = getChartData({ length: 12, today, dataArr: tweleveMonthsAgoOrders, property: "total" });

        lineCharts = {
            product: productCount,
            user: userCount,
            discount,
            revenue
        };
        myCache.set("line_stats", JSON.stringify(lineCharts));
    }

    return res.status(200).json({
        success: true,
        lineCharts
    })

})