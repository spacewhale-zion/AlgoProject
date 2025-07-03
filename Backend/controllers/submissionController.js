

import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import Testcase from '../models/Testcase.js';

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
  
          if (output !== expected) {
            console.log(`❌ Testcase failed: ${tc._id}`);
            console.log(`📥 Output: "${output}"`);
            console.log(`✅ Expected: "${expected}"`);
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
