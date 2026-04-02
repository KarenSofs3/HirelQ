import mongoose from 'mongoose';
import Company from '../models/companies.js';

export const getCompanies = async (req, res) => {
    try {
        const { page = '1', limit = '10', plan, activa } = req.query;

        const pageNum = Number.parseInt(page, 10);
        const limitNum = Number.parseInt(limit, 10);

        if (!Number.isInteger(pageNum) || pageNum < 1 || !Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ message: 'Parámetros de paginación inválidos' });
        }

        const allowedPlans = ['free', 'pro', 'enterprise'];
        if (plan && !allowedPlans.includes(plan)) {
            return res.status(400).json({ message: 'Plan inválido. Debe ser free, pro o enterprise' });
        }

        const queryParams = {
            page: pageNum,
            limit: limitNum,
            ...(plan ? { plan } : {}),
            ...((activa === 'true' || activa === 'false') ? { activa: activa === 'true' } : {}),
        };

        const data = await Company.obtenerConFiltros(queryParams);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener compañías:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que el id sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de compañía inválido' });
        }

        // Buscar la compañía por ID
        const company = await Company.findOne({ _id: id, activa: true });

        // Si no se encuentra la compañía
        if (!company) {
            return res.status(404).json({ message: 'Compañía no encontrada' });
        }

        // Retornar la compañía encontrada
        res.status(200).json({
            message: 'Compañía obtenida exitosamente',
            company
        });
    } catch (error) {
        console.error('Error al obtener compañía por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const createCompany = async (req, res) => {
    try {
        const { nombre, email_contacto, plan, activa } = req.body;

        // Validar campos obligatorios
        if (!nombre || !email_contacto) {
            return res.status(400).json({ message: 'Los campos nombre y email_contacto son obligatorios' });
        }

        // Crear nueva compañía
        const nuevaCompania = new Company({
            nombre,
            email_contacto,
            plan,
            activa
        });

        // Guardar en la base de datos
        const companiaGuardada = await nuevaCompania.save();

        // Retornar la compañía creada
        res.status(201).json({
            message: 'Compañía creada exitosamente',
            company: companiaGuardada
        });
    } catch (error) {
        console.error('Error al crear compañía:', error);

        // Manejar error de email duplicado
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email_contacto) {
            return res.status(409).json({ message: 'El email de contacto ya está registrado' });
        }

        // Otros errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Errores de validación', errores });
        }

        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que el id sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de compañía inválido' });
        }

        // Campos permitidos para actualizar
        const allowedFields = ['nombre', 'email_contacto', 'plan', 'activa'];
        const updateData = {};

        // Filtrar solo los campos permitidos
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // Verificar que al menos un campo válido se esté actualizando
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar' });
        }

        // Validar unicidad del email_contacto si se está actualizando
        if (updateData.email_contacto) {
            const existingCompany = await Company.findOne({ email_contacto: updateData.email_contacto, _id: { $ne: id } });
            if (existingCompany) {
                return res.status(400).json({ message: 'El email de contacto ya está registrado en otra compañía' });
            }
        }

        // Actualizar la compañía
        const updatedCompany = await Company.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        // Si no se encuentra la compañía
        if (!updatedCompany) {
            return res.status(404).json({ message: 'Compañía no encontrada' });
        }

        // Retornar la compañía actualizada
        res.status(200).json({
            message: 'Compañía actualizada exitosamente',
            company: updatedCompany
        });
    } catch (error) {
        console.error('Error al actualizar compañía:', error);

        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Errores de validación', errores });
        }

        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de compañía inválido' });
        }

        const company = await Company.findOne({ _id: id, activa: true });

        if (!company) {
            return res.status(404).json({ message: 'Compañía no encontrada o ya inactiva' });
        }

        company.activa = false;
        await company.save();

        res.status(200).json({ message: 'Compañía desactivada con éxito' });

    } catch (error) {
        console.error('Error al eliminar compañía:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
