import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  position_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosition',
    required: true
  },
  pregunta: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  dificultad: {
    type: String,
    enum: ['facil', 'medio', 'dificil'],
    required: true
  },
  generada_por_ia: {
    type: Boolean,
    default: false
  },
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Question', questionSchema);