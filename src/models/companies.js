import { Schema, model } from "mongoose";

const companySchema = new Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        email_contacto: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        plan: {
            type: String,
            enum: ["free", "pro", "enterprise"],
            default: "free"
        },
        activa: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export default model("Company", companySchema);