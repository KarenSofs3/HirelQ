import express from 'express';
import { body } from 'express-validator';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } from '../controllers/companies.js';
import { authenticate, requireRole } from '../middlewares/webToken.js';

const router = express.Router();

// GET /companies
router.get('/', getCompanies);

// GET /companies/:id
router.get('/:id', getCompanyById);

// POST /companies
//validaciones con express-validator
router.post( '/',
  [
    body('nombre')
      .notEmpty().withMessage('El nombre es obligatorio'),

    body('email_contacto')
      .isEmail().withMessage('Debe ser un email válido'),

    body('plan')
      .optional()
      .isIn(['free', 'pro', 'enterprise']).withMessage('Plan inválido')
  ],
  createCompany
);

// PUT /companies/:id
router.put('/:id', updateCompany);

// DELETE /companies/:id
router.delete('/:id', authenticate, requireRole('admin'), deleteCompany);


export default router;
