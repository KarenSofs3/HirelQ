import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Question from '../models/Question.js';
import JobPosition from '../models/JobPosition.js';
import { generateGeminiText } from '../config/gemini.js';

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

export const generateAiQuestions = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { position_id, categoria, dificultad } = req.body;
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

    const prompt = `Genera exactamente 5 preguntas de entrevista para un cargo de ${position.titulo}, nivel ${position.nivel}, con tecnologías ${position.tecnologias.join(', ')}, categoría ${categoria} y dificultad ${dificultad}.

Responde SOLO con JSON válido en este formato exacto:
{
  "preguntas": [
    {
      "pregunta": "texto de la pregunta",
      "categoria": "${categoria}",
      "dificultad": "${dificultad}"
    }
  ]
}

NO incluyas texto adicional, explicaciones ni markdown. Solo JSON puro.`;

    const aiResponse = await generateGeminiText(prompt);

    // Limpiar respuesta de Gemini (remover markdown si existe)
    let cleanResponse = aiResponse.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parsear JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Error parseando respuesta de IA:', parseError);
      return res.status(500).json({ message: 'Error parseando respuesta de IA' });
    }

    // Validar estructura
    if (!parsedData.preguntas || !Array.isArray(parsedData.preguntas) || parsedData.preguntas.length === 0) {
      return res.status(500).json({ message: 'Respuesta de IA inválida' });
    }

    // Crear documentos para guardar en BD
    const questionsToSave = parsedData.preguntas.map(item => ({
      company_id,
      position_id,
      pregunta: item.pregunta,
      categoria: item.categoria,
      dificultad: item.dificultad,
      generada_por_ia: true,
      activa: true
    }));

    // Insertar en base de datos
    const savedQuestions = await Question.insertMany(questionsToSave);

    res.status(200).json({ data: savedQuestions });
  } catch (error) {
    console.error('Error generando preguntas con IA:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
