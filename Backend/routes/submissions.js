import express from 'express';
import {
  createSubmission,
  getSubmissionsByProblem,
  getSubmissionById
} from '../controllers/submissionController.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createSubmission);
router.get('/', authMiddleware, getSubmissionsByProblem); // ?problemId=123
router.get('/:id', authMiddleware, getSubmissionById);

export default router;
