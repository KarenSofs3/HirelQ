import express from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } from '../controllers/companies.js';

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
router.delete('/:id', deleteCompany);

export default router;
