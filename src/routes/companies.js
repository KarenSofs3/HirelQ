import express from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } from '../controllers/companies.js';
import { authenticate, requireRole } from '../middlewares/webToken.js';

const router = express.Router();

// GET /companies
router.get('/', getCompanies);

// GET /companies/:id
router.get('/:id', getCompanyById);

// POST /companies
router.post('/', createCompany);

// PUT /companies/:id
router.put('/:id', updateCompany);

// DELETE /companies/:id
router.delete('/:id', authenticate, requireRole('admin'), deleteCompany);

export default router;
