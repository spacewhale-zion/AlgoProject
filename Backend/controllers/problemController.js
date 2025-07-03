import Problem from '../models/Problem.js';
import mongoose from 'mongoose';

// GET /api/problems
export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 });
    res.json(problems);
  } catch (err) {
    console.error('Get all problems error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// GET /api/problems/:id
export const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ msg: 'Problem not found' });
    res.json(problem);
  } catch (err) {
    console.error('Get problem error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// POST /api/problems (admin only)
export const createProblem = async (req, res) => {
  const { title, statement, difficulty, constraints, tags } = req.body;

  try {
    const newProblem = new Problem({
      title,
      statement,
      difficulty,
      constraints,
      tags,
      addedBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newProblem.save();
    res.status(201).json({ msg: 'Problem created', problem: newProblem });
  } catch (err) {
    console.error('Create problem error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PUT /api/problems/:id (admin only)
export const updateProblem = async (req, res) => {
  const { title, statement, difficulty, constraints, tags } = req.body;

  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ msg: 'Problem not found' });

    if (title) problem.title = title;
    if (statement) problem.statement = statement;
    if (difficulty) problem.difficulty = difficulty;
    if (constraints) problem.constraints = constraints;
    if (tags) problem.tags = tags;

    problem.updatedAt = new Date();

    await problem.save();
    res.json({ msg: 'Problem updated', problem });
  } catch (err) {
    console.error('Update problem error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// DELETE /api/problems/:id (admin only)
export const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ msg: 'Problem not found' });

    await problem.deleteOne();
    res.json({ msg: 'Problem deleted' });
  } catch (err) {
    console.error('Delete problem error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
