import express from "express";
import { deleteOrder, getAllOrders, getSpecificOrder, myOrders, newOrder, processOrder } from "../controllers/order.js";
import { isAdmin } from "../middlewares/auth.js";
const orderRoute = express.Router();
// Route - /api/v1/order/new  --->  create a new order
orderRoute.post("/new", newOrder);
// Route - /api/v1/order/my  --->  get specific user orders
orderRoute.get("/my", myOrders);
// Route - /api/v1/order/all  --->  get all orders
orderRoute.get("/all", isAdmin, getAllOrders);
// Route - /api/v1/order/:id  --->  get specific product, update and delete order
orderRoute.route("/:id").get(getSpecificOrder).put(processOrder).delete(deleteOrder);
export default orderRoute;
