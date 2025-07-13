import express from 'express';
import {
  createSubmission,
  getSubmissionsByProblem,
  getSubmissionById,
  getAllSubmissionsForProblem,
  getGlobalLeaderboard,
  getActivityHeatmap,
  runCode
} from '../controllers/submissionController.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createSubmission);
router.post('/run', authMiddleware, runCode);
router.get('/activity', authMiddleware, getActivityHeatmap);
router.get('/:problemId', authMiddleware, getSubmissionsByProblem);
router.get('/:id', authMiddleware, getSubmissionById);
router.get('/all/:id', authMiddleware, getAllSubmissionsForProblem);
router.get('/leaderboard/global', getGlobalLeaderboard); 


export default router;
