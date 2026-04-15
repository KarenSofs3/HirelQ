import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Question from '../models/Question.js';
import JobPosition from '../models/JobPosition.js';

export const createQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { position_id, pregunta, categoria, dificultad } = req.body;
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    if (!mongoose.Types.ObjectId.isValid(position_id)) {
      return res.status(404).json({ message: 'Posición no encontrada' });
    }

    const position = await JobPosition.findOne({
      _id: position_id,
      company_id,
      activo: true
    });

    if (!position) {
      return res.status(404).json({ message: 'Posición no encontrada' });
    }

    const newQuestion = new Question({
      company_id,
      position_id,
      pregunta,
      categoria,
      dificultad,
      generada_por_ia: false
    });

    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error('Error creando pregunta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    const filter = {
      company_id,
      activa: true
    };

    if (req.query.categoria) {
      filter.categoria = req.query.categoria;
    }

    if (req.query.dificultad) {
      filter.dificultad = req.query.dificultad;
    }

    if (req.query.position_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.position_id)) {
        return res.status(400).json({ message: 'position_id inválido' });
      }
      filter.position_id = req.query.position_id;
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter)
      .populate('position_id')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: questions,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const deletedQuestion = await Question.findOneAndUpdate(
      { _id: id, company_id, activa: true },
      { activa: false },
      { new: true }
    );

    if (!deletedQuestion) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }

    res.status(200).json(deletedQuestion);
  } catch (error) {
    console.error('Error eliminando pregunta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
