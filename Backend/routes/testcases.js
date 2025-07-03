import express from 'express';
import {
  createTestcase,
  getTestcasesByProblem,
  updateTestcase,
  deleteTestcase
} from '../controllers/testcaseController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, adminMiddleware, createTestcase);
router.get('/:problemId', authMiddleware, adminMiddleware, getTestcasesByProblem);
router.put('/:id', authMiddleware, adminMiddleware, updateTestcase);
router.delete('/:id', authMiddleware, adminMiddleware, deleteTestcase);

export default router;
