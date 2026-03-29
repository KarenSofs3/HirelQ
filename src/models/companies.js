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

// Método estático para obtener compañías con filtros y paginación
companySchema.statics.obtenerConFiltros = async function({ page = 1, limit = 10, plan, activa } = {}) {
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Number.parseInt(limit, 10) || 10);

    const query = {};

    // Filtros dinámicos aplicables
    if (plan) {
        query.plan = plan;
    }
    if (activa !== undefined) {
        query.activa = activa;
    }

    const skip = (pageNum - 1) * limitNum;

    const total = await this.countDocuments(query);
    const totalPaginas = limitNum > 0 ? Math.ceil(total / limitNum) : 1;

    const resultados = await this.find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente

    return {
        total,
        totalPaginas,
        page: pageNum,
        limit: limitNum,
        resultados,
    };
};

export default model("Company", companySchema);