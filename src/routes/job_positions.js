import express from 'express';
import { body } from 'express-validator';
import { createJobPosition, getJobPositions, getJobPositionById, updateJobPosition, deleteJobPosition } from '../controllers/job_positions.js';
import { authenticate, requireRole } from '../middlewares/webToken.js';

const router = express.Router();

router.get('/',
  authenticate,
  requireRole('empresa'),
  getJobPositions
);

router.get('/:id',
  authenticate,
  requireRole('empresa'),
  getJobPositionById
);

router.put('/:id',
  authenticate,
  requireRole('empresa'),
  [
    body('titulo').optional().notEmpty().withMessage('El título no puede estar vacío'),
    body('nivel').optional().isIn(['junior', 'mid', 'senior']).withMessage('Nivel inválido'),
    body('tecnologias').optional().isArray().withMessage('Tecnologías debe ser un array'),
    body('descripcion').optional().isString().withMessage('Descripción debe ser string')
  ],
  updateJobPosition
);

router.delete('/:id',
  authenticate,
  requireRole('empresa'),
  deleteJobPosition
);

router.post('/',
  authenticate,
  requireRole('empresa'),
  [
    body('titulo').notEmpty().withMessage('El título es obligatorio'),
    body('nivel').isIn(['junior', 'mid', 'senior']).withMessage('Nivel inválido'),
    body('tecnologias').optional().isArray().withMessage('Tecnologías debe ser un array'),
    body('descripcion').optional().isString()
  ],
  createJobPosition
);

export default router;