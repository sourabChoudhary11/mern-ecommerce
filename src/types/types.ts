import { NextFunction, Request, Response } from "express";

export interface New_User_Request_Body {
    name: string;
    email: string;
    gender: string;
    dob: Date;
    password: string;
}
export interface Login_User_Request_Body {
    email: string;
    password: string;
}

export interface New_Product_Request_Body {
    name: string;
    price: number;
    stock: number;
    category: string;
}

export type Controller_Type = (
    req: Request<any>,
    res: Response,
    next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type Search_Request_Query = {
    name?: string;
    price?: string;
    sort?: string;
    category?: string;
    page?: string;
}

export type Base_Query = {
    name?: {
        $regex: string;
        $options: string;
    };
    price?: {
        $lte: number;
    };
    category?: string;
}

export type Invalidate_Caches_Props = {
    product?: boolean;
    order?: boolean;
    admin?: boolean;
    userId?: string;
    orderId?: string;
    productId?: string | string[];
}

export type Shipping_Info_Type = {
    address: string,
    city: string,
    state: string,
    country: string,
    pinCode: number,

}

export type Order_Item_Type = {
    name: string;
    photo: string;
    price: number;
    quantity: number;
    productId: string;
}

export interface New_Order_Request_Body {
    shippingInfo: Shipping_Info_Type;
    user: string;
    subTotal: number;
    tax: number,
    shippingCharges: number,
    discount: number,
    total: number,
    orderItems: Order_Item_Type[],
}