import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refreshToken, logout } from '../controllers/users.js';
import { authenticate, requireRole } from '../middlewares/webToken.js';

const router = express.Router();

// Rate limiter para el endpoint de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP
  message: {
    error: 'Demasiados intentos de login desde esta IP. Inténtalo de nuevo en 15 minutos.'
  },
  standardHeaders: true, // Incluye headers `RateLimit-*` en la respuesta
  legacyHeaders: false, // Desactiva headers `X-RateLimit-*`
});

// Rutas de autenticación
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/admin-test', authenticate, requireRole('admin'), (req, res) => {
  res.json({ message: 'Eres admin 😎' });
});

export default router;