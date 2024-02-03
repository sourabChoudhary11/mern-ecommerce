import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { deleteProduct, getAllCategories, getAllProducts, getLatestProducts, getSpecificProduct, newProduct, searchProducts, updateProduct } from "../controllers/product.js";
import { upload } from "../middlewares/multer.js";
const productRoute = express.Router();
// Route - api/v1/product/new  --->  create a new product
productRoute.post("/new", isAdmin, upload, newProduct);
// Route - api/v1/product/latest  --->  get latest products
productRoute.get("/latest", getLatestProducts);
// Route - api/v1/product/all  --->  get all products
productRoute.get("/all", isAdmin, getAllProducts);
// Route - api/v1/product/search  --->  get all products with filter
productRoute.get("/search", searchProducts);
// Route - api/v1/product/categories  --->  get all categories
productRoute.get("/categories", getAllCategories);
// Route - api/v1/product/:id  --->  get a specific product, update and delete product
productRoute.route("/:id").get(getSpecificProduct).put(isAdmin, upload, updateProduct).delete(isAdmin, deleteProduct);
export default productRoute;
