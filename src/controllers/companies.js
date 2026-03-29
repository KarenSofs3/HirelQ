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
