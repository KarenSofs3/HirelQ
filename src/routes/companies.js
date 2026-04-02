import express from 'express';
import { getCompanies, getCompanyById, createCompany } from '../controllers/companies.js';

const router = express.Router();

// GET /companies
router.get('/', getCompanies);

// GET /companies/:id
router.get('/:id', getCompanyById);

// POST /companies
router.post('/', createCompany);

export default router;
