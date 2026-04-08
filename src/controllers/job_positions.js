import JobPosition from '../models/JobPosition.js';
import { validationResult } from 'express-validator';

export const createJobPosition = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { titulo, nivel, tecnologias, descripcion } = req.body;
    const company_id = req.user.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    const newPosition = new JobPosition({
      company_id,
      titulo,
      nivel,
      tecnologias: tecnologias || [],
      descripcion: descripcion || null
    });

    const savedPosition = await newPosition.save();
    res.status(201).json(savedPosition);
  } catch (error) {
    console.error('Error creando posición:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getJobPositions = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    // Construir filtro base
    const filter = { company_id };

    // Filtro de activo: por defecto excluir inactivos, permitir override explícito
    const activoParam = req.query.activo;
    if (activoParam === 'false') {
      filter.activo = false;
    } else if (activoParam === 'true' || !activoParam) {
      filter.activo = true;
    }

    // Filtro de nivel
    if (req.query.nivel) {
      filter.nivel = req.query.nivel;
    }

    // Filtro de título (búsqueda parcial, case-insensitive)
    if (req.query.titulo) {
      filter.titulo = { $regex: req.query.titulo, $options: 'i' };
    }

    // Filtro de tecnologías (usa $in para encontrar posiciones que contengan al menos una de las tecnologías)
    if (req.query.tecnologias) {
      const tecArray = Array.isArray(req.query.tecnologias)
        ? req.query.tecnologias
        : [req.query.tecnologias];
      filter.tecnologias = { $in: tecArray };
    }

    // Paginación
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    // Ejecutar queries
    const total = await JobPosition.countDocuments(filter);
    const positions = await JobPosition.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: positions,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error obteniendo posiciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getJobPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    // Validar que el ID sea un ObjectId válido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Buscar posición por ID, verificando ownership y que esté activa
    const position = await JobPosition.findOne({
      _id: id,
      company_id,
      activo: true
    });

    if (!position) {
      return res.status(404).json({ message: 'Posición no encontrada' });
    }

    res.status(200).json(position);
  } catch (error) {
    console.error('Error obteniendo posición:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateJobPosition = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    // Validar que el ID sea un ObjectId válido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Verificar que la posición existe, pertenece a la empresa y está activa
    const position = await JobPosition.findOne({
      _id: id,
      company_id,
      activo: true
    });

    if (!position) {
      return res.status(404).json({ message: 'Posición no encontrada' });
    }

    // Preparar datos para actualizar (solo campos permitidos)
    const updateData = {};
    if (req.body.titulo !== undefined) {
      updateData.titulo = req.body.titulo;
    }
    if (req.body.nivel !== undefined) {
      updateData.nivel = req.body.nivel;
    }
    if (req.body.tecnologias !== undefined) {
      updateData.tecnologias = req.body.tecnologias;
    }
    if (req.body.descripcion !== undefined) {
      updateData.descripcion = req.body.descripcion;
    }

    // Actualizar posición
    const updatedPosition = await JobPosition.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPosition);
  } catch (error) {
    console.error('Error actualizando posición:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteJobPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    // Validar que el ID sea un ObjectId válido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Verificar que la posición existe, pertenece a la empresa y está activa
    const position = await JobPosition.findOne({
      _id: id,
      company_id,
      activo: true
    });

    if (!position) {
      return res.status(404).json({ message: 'Posición no encontrada' });
    }

    // Soft delete: cambiar activo a false
    const deletedPosition = await JobPosition.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    res.status(200).json(deletedPosition);
  } catch (error) {
    console.error('Error eliminando posición:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};