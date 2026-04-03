import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  rol: {
    type: String,
    enum: ['admin', 'empresa', 'candidato'],
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);