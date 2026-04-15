import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
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
  preguntas: [
    {
      question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      respuesta: {
        type: String,
        default: null
      },
      respondida: {
        type: Boolean,
        default: false
      }
    }
  ],
  estado: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'finalizada'],
    default: 'pendiente'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Session', sessionSchema);