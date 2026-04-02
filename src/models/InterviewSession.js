const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const interviewSessionSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosition',
    required: true
  },
  preguntas: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Question',
    default: []
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_curso', 'completada', 'expirada'],
    default: 'pendiente'
  },
  puntaje_total: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  token_acceso: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  fecha_inicio: {
    type: Date,
    default: null
  },
  fecha_fin: {
    type: Date,
    default: null
  },
  fecha_expiracion: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);