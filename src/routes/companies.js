import express from 'express';
import { getCompanies } from '../controllers/companies.js';

const router = express.Router();

// GET /companies
router.get('/', getCompanies);

export default router;
