import { NextFunction, Request, Response } from "express";
import { Product } from "../models/product.js";
import { TryCatch } from "../middlewares/error.js";
import { Base_Query, New_Product_Request_Body, Search_Request_Query } from "../types/types.js";
import ErrorHandler from "../utils/utility-errorHandler-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidateCaches } from "../utils/features.js";

export const newProduct = TryCatch(async (
    req: Request<{}, {}, New_Product_Request_Body>,
    res: Response,
    next: NextFunction
) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) throw new ErrorHandler("Please Enter Photo", 400);

    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("Photo Deleted Successfully");
        })
        throw new ErrorHandler("Please Add All Fields", 400);
    }

    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo?.path,
    })

    invalidateCaches({product:true, admin: true});

    return res.status(201).json({
        success: true,
        message: "Product Created Successfully",
    })
})

export const getAllProducts = TryCatch(async (
    req: Request<{}, {}, New_Product_Request_Body>,
    res: Response,
    next: NextFunction
) => {

    let products: any[] = [];

    if (myCache.has("all_products")) {
        products = JSON.parse(myCache.get("all_products") as string);
    } else {
        products = await Product.find({});
        myCache.set("all_products", JSON.stringify(products));
    }

    return res.status(200).json({
        success: true,
        products,
    })
})

export const getLatestProducts = TryCatch(async (
    req: Request<{}, {}, New_Product_Request_Body>,
    res: Response,
    next: NextFunction
) => {

    let products: any[] = [];

    if (myCache.has("latest_products")) {
        products = JSON.parse(myCache.get("latest_products") as string);
    } else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(4);
        myCache.set("latest_products", JSON.stringify(products));
    }

    return res.status(200).json({
        success: true,
        products,
    })
})

export const getAllCategories = TryCatch(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    let categories: any[] = [];

    if (myCache.has("categories")) {
        categories = JSON.parse(myCache.get("categories") as string);
    } else {
        categories = await Product.distinct("category");
        myCache.set("categories", JSON.stringify(categories));
    }

    return res.status(200).json({
        success: true,
        categories,
    })
})

export const getSpecificProduct = TryCatch(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const { id } = req.params;

    let product: any;

    if (myCache.has(`specific_${id}`)) {
        product = JSON.parse(myCache.get(`specific_${id}`) as string);
    }
    else {
        let getProduct = await Product.findById(id);
        if(getProduct){
            product = getProduct;
            myCache.set(`specific_${id}`, JSON.stringify(product));
        } 
    }


    if (!product) throw new ErrorHandler("Product Not Found", 404);

    return res.status(200).json({
        success: true,
        product,
    })
})

export const deleteProduct = TryCatch(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const product = await Product.findById(req.params.id);
    if (!product) throw new ErrorHandler("Product Not Found", 404);

    rm(product.photo, () => {
        console.log("Photo Also Deleted");
    });

    await product.deleteOne();

    invalidateCaches({product:true, admin: true, productId: String(product._id)});

    return res.status(200).json({
        success: true,
        message: "Product Deleted Successfully",
    })
})

export const updateProduct = TryCatch(async (
    req: Request<{ id: string }, {}, New_Product_Request_Body>,
    res: Response,
    next: NextFunction
) => {

    const { name, price, stock, category } = req.body;
    const photo = req.file;

    const product = await Product.findById(req.params.id);
    if (!product) throw new ErrorHandler("Product Not Found", 404);

    if (photo) {
        rm(product.photo, () => {
            console.log("Old Photo Deleted");
        });
        product.photo = photo.path;
    }

    if (stock) product.stock = stock;
    if (category) product.category = category;
    if (price) product.price = price;
    if (name) product.name = name;

    await product.save();

    invalidateCaches({product:true, admin: true, productId: String(product._id)});

    return res.status(200).json({
        success: true,
        message: "Updated Product Successfully"
    })
})

export const searchProducts = TryCatch(async (
    req: Request<{}, {}, {}, Search_Request_Query>,
    res: Response,
    next: NextFunction
) => {

    const { name, price, category, sort } = req.query;
    const page = Number(req.query.page);

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    const skip = (page - 1) * limit;

    const baseQuery: Base_Query = {};

    if (name) baseQuery.name = {
        $regex: name,
        $options: "i",
    }

    if (price) baseQuery.price = {
        $lte: Number(price),
    }

    if (category) baseQuery.category = category;

    const [products, filteredProducts] = await Promise.all([
        Product.find(baseQuery)
            .sort(sort && {
                price: sort === "asc" ? 1 : -1,
            })
            .limit(limit)
            .skip(skip),
        Product.find(baseQuery)
    ])

    const totalPages = Math.ceil(filteredProducts?.length / limit);

    return res.status(200).json({
        success: true,
        products,
        totalPages
    })
})

