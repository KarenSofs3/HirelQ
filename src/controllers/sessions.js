import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Session from '../models/Session.js';
import JobPosition from '../models/JobPosition.js';
import Question from '../models/Question.js';

export const createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { position_id } = req.body;
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(403).json({ message: 'Usuario no asociado a una empresa' });
    }

    if (!mongoose.Types.ObjectId.isValid(position_id)) {
      return res.status(404).json({ message: 'Posición no encontrada' });
    }

    // Verificar que la posición existe, pertenece a la empresa y está activa
    const position = await JobPosition.findOne({
      _id: position_id,
      company_id,
      activo: true
    });

    if (!position) {
      return res.status(404).json({ message: 'Posición no encontrada' });
    }

    // Obtener preguntas activas para esta posición
    const questions = await Question.find({
      position_id,
      company_id,
      activa: true
    });

    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'No hay preguntas disponibles para esta posición' });
    }

    // Construir array de preguntas para la sesión
    const sessionQuestions = questions.map(question => ({
      question_id: question._id,
      respuesta: null,
      respondida: false
    }));

    // Generar token UUID
    const token = crypto.randomUUID();

    // Crear nueva sesión
    const newSession = new Session({
      company_id,
      position_id,
      preguntas: sessionQuestions,
      token
    });

    // Guardar en base de datos
    const savedSession = await newSession.save();

    res.status(201).json({ data: savedSession });
  } catch (error) {
    console.error('Error creando sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getSessionByToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar sesión por token y activa
    const session = await Session.findOne({
      token,
      activa: true
    }).populate('position_id');

    if (!session) {
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    // Retornar solo campos necesarios (sin company_id)
    const sessionData = {
      _id: session._id,
      position_id: session.position_id,
      estado: session.estado,
      preguntas: session.preguntas,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };

    res.status(200).json({ data: sessionData });
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const respondToQuestion = async (req, res) => {
  try {
    const { token } = req.params;
    const { question_id, respuesta } = req.body;

    // Validar datos de entrada
    if (!question_id || !mongoose.Types.ObjectId.isValid(question_id)) {
      return res.status(400).json({ message: 'question_id inválido' });
    }

    if (typeof respuesta !== 'string' || respuesta.trim() === '') {
      return res.status(400).json({ message: 'respuesta es requerida' });
    }

    // Buscar sesión por token y activa
    const session = await Session.findOne({
      token,
      activa: true
    });

    if (!session) {
      return res.status(404).json({ message: 'Sesión no encontrada' });
    }

    // No permitir responder si la sesión está finalizada
    if (session.estado === 'finalizada') {
      return res.status(400).json({ message: 'La sesión ya está finalizada' });
    }

    // Buscar pregunta específica en el array
    const questionIndex = session.preguntas.findIndex(
      p => p.question_id.toString() === question_id
    );

    if (questionIndex === -1) {
      return res.status(404).json({ message: 'Pregunta no encontrada en la sesión' });
    }

    // Actualizar respuesta
    session.preguntas[questionIndex].respuesta = respuesta.trim();
    session.preguntas[questionIndex].respondida = true;

    // Actualizar estado de la sesión
    if (session.estado === 'pendiente') {
      session.estado = 'en_progreso';
    }

    // Verificar si todas las preguntas están respondidas
    const allAnswered = session.preguntas.every(p => p.respondida);
    if (allAnswered) {
      session.estado = 'finalizada';
    }

    // Guardar cambios
    await session.save();

    res.status(200).json({ data: session });
  } catch (error) {
    console.error('Error respondiendo pregunta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};