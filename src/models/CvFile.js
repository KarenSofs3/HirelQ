const mongoose = require('mongoose');

const cvFileSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  original_name: {
    type: String,
    required: true
  },
  mime_type: {
    type: String,
    required: true,
    enum: ['application/pdf', 'image/jpeg', 'image/png']
  },
  size_bytes: {
    type: Number,
    required: true,
    max: 5242880
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CvFile', cvFileSchema);