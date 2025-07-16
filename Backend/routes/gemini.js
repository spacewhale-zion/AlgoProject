// server/routes/gemini.js
import express from 'express';
import axios from 'axios';
import generateAiResponse from '../controllers/generateAiResponse.js';
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post('/review', async (req, res) => {
  const { code } = req.body;
  

  if (!code || code.trim() === '') {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const feedback = await generateAiResponse(code);
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error in /review route:', error.message);
    res.status(500).json({ error: 'Failed to get AI feedback' });
  }
});
export default router;
