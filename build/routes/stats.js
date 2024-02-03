import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../controllers/stats.js";
const dashboardRoute = express.Router();
// Route - api/v1/dashboard/stats  --->  get dashboard stats
dashboardRoute.get("/stats", isAdmin, getDashboardStats);
// Route - api/v1/dashboard/pie  --->  get pie charts stats
dashboardRoute.get("/pie", isAdmin, getPieCharts);
// Route - api/v1/dashboard/line  --->  get line charts stats
dashboardRoute.get("/line", isAdmin, getLineCharts);
// Route - api/v1/dashboard/bar  ---> get bar charts stats
dashboardRoute.get("/bar", isAdmin, getBarCharts);
export default dashboardRoute;
