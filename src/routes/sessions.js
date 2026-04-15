import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middlewares/webToken.js';
import { createSession, getSessionByToken, respondToQuestion } from '../controllers/sessions.js';

const router = express.Router();

router.get('/:token', getSessionByToken);

router.post('/:token/responder', respondToQuestion);

router.post('/',
  authenticate,
  requireRole('empresa'),
  [
    body('position_id').notEmpty().withMessage('position_id es obligatorio')
  ],
  createSession
);

export default router;