import express from "express"
import { deleteUser, getAllUsers, getSpecificUser, newUser } from "../controllers/user.js";
import { isAdmin } from "../middlewares/auth.js";

const userRoute = express.Router();

// Route - api/v1/user/new  --->  create a new user
userRoute.post("/new", newUser);

// Route - api/v1/user/all  --->  get all users
userRoute.get("/all", isAdmin, getAllUsers);

// Route - api/v1/user/:id  --->  get a specific user and delete a user
userRoute.route("/:id").get(getSpecificUser).delete(isAdmin, deleteUser);


export default userRoute;