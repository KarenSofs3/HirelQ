import express from 'express';
import { register, login } from '../controllers/users.js';
import { authenticate, requireRole } from '../middlewares/webToken.js';

const router = express.Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
router.get('/admin-test', authenticate, requireRole('admin'), (req, res) => {
  res.json({ message: 'Eres admin 😎' });
});

export default router;