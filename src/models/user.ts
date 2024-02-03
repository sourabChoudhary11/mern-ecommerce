import mongoose, { Date } from "mongoose";
import isEmail from "validator/lib/isEmail.js";

interface IUser extends Document {
    _id: string;
    name: string;
    photo: string;
    email: string,
    role: "admin" | "user";
    gender: "male" | "female";
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
    // Virtual Attribute
    age: number;
}

const schema = new mongoose.Schema({
    _id: {
        type: String,
        required: [true, "Please Enter ID"],
    },
    name: {
        type: String,
        required: [true, "Please Enter Name"],
    },
    email: {
        type: String,
        unique: [true, "Email Already Exist"],
        required: [true, "Please Enter Email"],
        validate: [isEmail, "Please Enter Valid Email"]
    },
    photo: {
        type: String,
        required: [true, "Please Add Photo"],
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, "Please Enter Gender"],
    },
    dob: {
        type: Date,
        required: [true, "Please Enter DOB"],
    },

},{
        timestamps: true
    })

schema.virtual("age").get(function () {
    const today = new Date();
    const dob = this.dob;
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
})

export const User = mongoose.model<IUser>("User", schema);