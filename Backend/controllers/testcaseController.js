import Testcase from '../models/Testcase.js';
import mongoose from 'mongoose';

// POST /api/testcases
export const createTestcase = async (req, res) => {
  const { problemId, input, expectedOutput, isSample = false } = req.body;

  if (!problemId || !input || !expectedOutput) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    const testcase = new Testcase({
      _id: new mongoose.Types.ObjectId(),
      problemId,
      input,
      expectedOutput,
      isSample
    });

    await testcase.save();
    res.status(201).json({ msg: 'Testcase created', testcase });
  } catch (err) {
    console.error('Create testcase error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// GET /api/testcases/:problemId
export const getTestcasesByProblem = async (req, res) => {
  const { problemId } = req.params;

  try {
    const testcases = await Testcase.find({ problemId });
    res.json(testcases);
  } catch (err) {
    console.error('Get testcases error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PUT /api/testcases/:id
export const updateTestcase = async (req, res) => {
  const { input, expectedOutput, isSample } = req.body;

  try {
    const testcase = await Testcase.findByIdAndUpdate(
      req.params.id,
      { input, expectedOutput, isSample },
      { new: true }
    );

    if (!testcase) return res.status(404).json({ msg: 'Testcase not found' });

    res.json({ msg: 'Testcase updated', testcase });
  } catch (err) {
    console.error('Update testcase error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// DELETE /api/testcases/:id
export const deleteTestcase = async (req, res) => {
  try {
    const testcase = await Testcase.findById(req.params.id);
    if (!testcase) return res.status(404).json({ msg: 'Testcase not found' });

    await testcase.deleteOne();
    res.json({ msg: 'Testcase deleted' });
  } catch (err) {
    console.error('Delete testcase error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
