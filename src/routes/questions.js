import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middlewares/webToken.js';
import { createQuestion, getQuestions, deleteQuestion, generateAiQuestions } from '../controllers/questions.js';

const router = express.Router();

router.get('/',
  authenticate,
  requireRole('empresa'),
  getQuestions
);

router.post('/',
  authenticate,
  requireRole('empresa'),
  [
    body('position_id').notEmpty().withMessage('position_id es obligatorio'),
    body('pregunta').notEmpty().withMessage('pregunta es obligatoria'),
    body('categoria').notEmpty().withMessage('categoria es obligatoria'),
    body('dificultad')
      .notEmpty().withMessage('dificultad es obligatoria')
      .isIn(['facil', 'medio', 'dificil']).withMessage('Dificultad inválida')
  ],
  createQuestion
);

router.delete('/:id',
  authenticate,
  requireRole('empresa'),
  deleteQuestion
);

router.post('/generate-ai',
  authenticate,
  requireRole('empresa'),
  [
    body('position_id').notEmpty().withMessage('position_id es obligatorio'),
    body('categoria').notEmpty().withMessage('categoria es obligatoria'),
    body('dificultad')
      .notEmpty().withMessage('dificultad es obligatoria')
      .isIn(['facil', 'medio', 'dificil']).withMessage('Dificultad inválida')
  ],
  generateAiQuestions
);

export default router;
