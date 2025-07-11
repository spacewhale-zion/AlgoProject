

import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import Testcase from '../models/Testcase.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { v4 as uuid } from 'uuid';

const execAsync = util.promisify(exec);
const isWindows = process.platform === 'win32';

const languageConfigs = {
  cpp: {
    extension: 'cpp',
    compile: (src, exe) => `g++ "${src}" -o "${exe}"`,
    execute: (exe, input) =>
      isWindows
        ? `powershell -Command "& { Get-Content '${input}' | .\\${path.basename(exe)} }"`
        : `timeout 2s ${exe} < ${input}`
  },
  python: {
    extension: 'py',
    compile: null,
    execute: (src, input) =>
      isWindows
        ? `powershell -Command "& { Get-Content '${input}' | python '${src}' }"`
        : `timeout 2s python3 ${src} < ${input}`
  },
  java: {
    extension: 'java',
    compile: (src) => `javac "${src}"`,
    execute: (src, input) => {
      const dir = path.dirname(src);
      return isWindows
        ? `powershell -Command "& { Get-Content '${input}' | java -cp '${dir}' Main }"`
        : `timeout 2s java -cp ${dir} Main < ${input}`;
    }
  }
};


export const createSubmission = async (req, res) => {
    const { problemId, code, language = 'cpp' } = req.body;
  
    try {
      const problem = await Problem.findById(problemId);
      if (!problem) return res.status(404).json({ msg: 'Problem not found' });
  
      const submission = new Submission({
        _id: new mongoose.Types.ObjectId(),
        userId: req.user.id,
        problemId,
        code,
        language,
        verdict: 'Pending',
        submittedAt: new Date()
      });
  
      await submission.save();
  
      const config = languageConfigs[language.toLowerCase()];
      if (!config) return res.status(400).json({ msg: `Unsupported language: ${language}` });
  
      const testcases = await Testcase.find({ problemId });
      const jobId = uuid();
      const tempDir = path.join('temp', `submission-${jobId}`);
      await fs.ensureDir(tempDir);
  
      const fileName = `Main.${config.extension}`;
      const srcPath = path.join(tempDir, fileName);
      await fs.writeFile(srcPath, code);
      console.log('✅ Source file:', srcPath);
  
      // Only create exePath for C++
      let exePath = null;
      if (language === 'cpp') {
        exePath = path.join(tempDir, isWindows ? 'Main.exe' : 'Main.out');
      }
  
      // Compile (if needed)
      try {
        if (config.compile) {
          console.log('🛠 Compile command:', config.compile(srcPath, exePath));
          await execAsync(config.compile(srcPath, exePath));
        }
      } catch (err) {
        await Submission.findByIdAndUpdate(submission._id, { verdict: 'Compilation Error' });
        await fs.remove(tempDir);
        return res.json({ msg: 'Compilation Error', verdict: 'Compilation Error' });
      }
  
      // Evaluate testcases
      let verdict = 'Accepted';
      let executionTime = 0;
  
      for (const tc of testcases) {
        const inputPath = path.join(tempDir, 'input.txt');
        await fs.writeFile(inputPath, tc.input);
  
        const command = config.execute(exePath || srcPath, inputPath);
        console.log('🚀 Running:', command);
  
        try {
          const start = Date.now();
          const { stdout } = await execAsync(command);
          const end = Date.now();
  
          const output = stdout.trim();
          const expected = tc.expectedOutput.trim();
          console.log(`🔍 Testcase ${tc}:`);
          console.log(`📥 Output: "${output}"`);
          console.log(`✅ Expected: "${expected}"`);
          if (output !== expected) {
            console.log(`❌ Testcase failed: ${tc._id}`);

            await Submission.findByIdAndUpdate(submission._id, {
              failedTestcaseId: tc._id, // 👈 add this
              actualOutput: output,     // 👈 and this (optional)
              expectedOutput: expected
            });
           
            verdict = 'Wrong Answer';
            break;
          }
          
          executionTime = Math.max(executionTime, end - start);
        } catch (err) {
          console.error('💥 Runtime error:', err.stderr || err.message);
          verdict = err.killed || err.signal === 'SIGTERM' || err.stderr?.includes('timed out')
            ? 'TLE'
            : 'Runtime Error';
          break;
        }
      }
  
      await Submission.findByIdAndUpdate(submission._id, {
        verdict,
        executionTime: Math.round(executionTime),
        memoryUsed: 0
      });
  
      await fs.remove(tempDir);
  
      res.json({ msg: 'Submission evaluated', verdict });
  
    } catch (err) {
      console.error('Evaluation error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  
  
// GET /api/submissions?problemId=...
export const getSubmissionsByProblem = async (req, res) => {
  const { problemId } = req.query;

  try {
    const query = { userId: req.user.id };
    if (problemId) query.problemId = problemId;

    const submissions = await Submission.find(query).sort({ submittedAt: -1 })
    .populate('problemId', 'title difficulty');
    res.json(submissions);

  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getAllSubmissionsForProblem = async (req, res) => {
  try {
    const problemId = req.params.id;
    if (!problemId) return res.status(400).json({ msg: 'Problem ID is required' });

    const submissions = await Submission.find({ problemId })
      .populate('userId', 'name email') // include user's name and email
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    console.error('Get all submissions error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getGlobalLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Match only accepted submissions from this month
    const submissions = await Submission.aggregate([
      {
        $match: {
          verdict: 'Accepted',
          submittedAt: { $gte: firstDayOfMonth }
        }
      },
      {
        $lookup: {
          from: 'problems',
          localField: 'problemId',
          foreignField: '_id',
          as: 'problem'
        }
      },
      { $unwind: '$problem' },
      {
        $addFields: {
          difficultyPoints: {
            $switch: {
              branches: [
                { case: { $eq: ['$problem.difficulty', 'Easy'] }, then: 1 },
                { case: { $eq: ['$problem.difficulty', 'Medium'] }, then: 3 },
                { case: { $eq: ['$problem.difficulty', 'Normal'] }, then: 3 },
                { case: { $eq: ['$problem.difficulty', 'Hard'] }, then: 10 }
              ],
              default: 0
            }
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$difficultyPoints' },
          latestSubmission: { $max: '$submittedAt' }
        }
      },
      {
        $sort: {
          totalPoints: -1,
          latestSubmission: 1
        }
      },
      { $limit: 100 }
    ]);

    // Fetch user data
    const users = await User.find({ _id: { $in: submissions.map(u => u._id) } })
      .select('name email');

    const result = submissions.map(entry => {
      const user = users.find(u => u._id.toString() === entry._id.toString());
      return {
        name: user?.name || 'Anonymous',
        email: user?.email || '',
        totalPoints: entry.totalPoints,
        lastSolved: entry.latestSubmission
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};


// GET /api/submissions/:id
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
    .populate('problemId', 'title difficulty');
    if (!submission) return res.status(404).json({ msg: 'Submission not found' });

    // Only allow access if user is owner or admin
    if (submission.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    res.json(submission);
  } catch (err) {
    console.error('Get submission error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PUT /api/submissions/:id/verdict (used by judge/worker)
export const updateVerdict = async (req, res) => {
  const { verdict, executionTime, memoryUsed } = req.body;

  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ msg: 'Submission not found' });

    submission.verdict = verdict;
    submission.executionTime = executionTime;
    submission.memoryUsed = memoryUsed;

    await submission.save();
    res.json({ msg: 'Verdict updated' });

  } catch (err) {
    console.error('Update verdict error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};


export const getActivityHeatmap = async (req, res) => {
  try {
    const stats = await Submission.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error('❌ Error in /submissions/activity route:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};