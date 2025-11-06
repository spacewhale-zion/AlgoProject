

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
        ? `cmd /c "type \"${input}\" | \"${exe}\""`   // ✅ fixed
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
        user: req.user.id,
        problem:problemId,
        code,
        language,
        verdict: 'Pending',
        submittedAt: new Date()
      });
  
      await submission.save();

      let expectedOutput = null;
      let actualOutput = null;
      let actualInput = null;
  
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
            console.log(`🔍 Testcase ${tc}:`);
            console.log(`📥 Output: "${output}"`);
            console.log(`✅ Expected: "${expected}"`);
            expectedOutput = expected;
            actualOutput = output;
            actualInput = tc.input;


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
  
      res.json({
        msg: 'Submission evaluated',
        verdict,
        expectedOutput: verdict === 'Accepted' ? undefined : expectedOutput,
        actualOutput: verdict === 'Accepted' ? undefined : actualOutput,
        actualInput: verdict === 'Accepted' ? undefined : actualInput
      });
      
      
  
    } catch (err) {
      console.error('Evaluation error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  };


  export const runCode = async (req, res) => {
    const { code = '', language = 'cpp', input = '2 5' } = req.body;
  
    try {
      const config = languageConfigs[language.toLowerCase()];
      if (!config) return res.status(400).json({ error: `Unsupported language: ${language}` });
  
      /* 1. prepare temporary workspace */
      const jobId = uuid();
      const tempDir = path.join('temp', `run-${jobId}`);
      await fs.ensureDir(tempDir);
  
      const srcFile = path.join(tempDir, `Main.${config.extension}`);
      await fs.writeFile(srcFile, code);
  
      /* 2. optional compile */
      let exeFile = srcFile;
      if (language === 'cpp') {
        exeFile = path.join(tempDir, isWindows ? 'Main.exe' : 'Main.out');
      }
  
      if (config.compile) {
        try {
          await execAsync(config.compile(srcFile, exeFile));
        } catch (err) {
          await fs.remove(tempDir);
          return res.json({ error: err.stderr || 'Compilation Error' });
        }
      }
  
      /* 3. write input file */
      const inputPath = path.join(tempDir, 'input.txt');
      await fs.writeFile(inputPath, input);
  
      /* 4. execute */
      let stdout = '', stderr = '';
      try {
        const { stdout: out, stderr: err } = await execAsync(
          config.execute(exeFile, inputPath),
          { timeout: 4000 } // 4‑second hard limit
        );
        stdout = out;
        stderr = err;
      } catch (err) {
        stderr = err.stderr || err.message;
      }
  
      await fs.remove(tempDir);
  
      /* 5. respond */
      if (stderr) return res.json({ error: stderr.trim() || 'Runtime Error' });
      return res.json({ output: stdout.trim() || '(no output)' });
  
    } catch (e) {
      console.error('Run endpoint error:', e);
      res.status(500).json({ error: 'Server error' });
    }
  };
  

  const getVerdictFromExitCode = (code, stderr) => {
    // Windows Exit Codes are less standardized for signals than Linux.
    // We primarily rely on exit code and stderr content for diagnosis.
    
    if (code === null || code === undefined) {
        // This might happen if the process was killed externally (e.g., by a Node.js signal or manual intervention)
        return 'Internal Error (Process Interrupted)'; 
    }
    
    if (code !== 0) {
        // Specific checks based on common Windows/runtime errors
        if (stderr.includes("Segmentation fault") || stderr.includes("Access violation")) {
            return 'Runtime Error (Segmentation Fault)'; // Indicates illegal memory access
        }
        if (stderr.includes("divide by zero")) {
            return 'Runtime Error (Floating Point Exception)';
        }
        
        // General non-zero exit usually means an unhandled exception or non-standard exit.
        return `Runtime Error (Exit Code ${code})`; 
    }
    
    // If code is 0 but execution failed due to Node.js timeout, another function handles it.
    return 'Internal Error'; 
};


export const judgeSubmission = async (submissionId) => {
  try {
    const submission = await Submission.findById(submissionId)
      .populate("problem");
    if (!submission) return;

    const problem = submission.problem;
    const TIME_LIMIT = problem.timeLimit || 2000; // ms
    const testcases = await Testcase.find({ problem: problem._id });

    const TEMP_DIR = path.join(process.cwd(), "temp", `submission-${submissionId}`);
    await fs.ensureDir(TEMP_DIR);

    // Build paths
    const EXEC = path.join(TEMP_DIR, isWindows ? "Main.exe" : "Main.out");
    const SRC = path.join(TEMP_DIR, `Main.${languageConfigs[submission.language].extension}`);

    // If code was not compiled (e.g., compile error previously)
    if (!fs.existsSync(EXEC) && submission.language === "cpp") {
      await Submission.findByIdAndUpdate(submissionId, { verdict: "Compilation Error" });
      return;
    }

    const testResults = [];
    let overallVerdict = "Accepted";

    for (const tc of testcases) {
      const start = Date.now();
      let output = "";
      let errorOutput = "";
      let timedOut = false;

      try {
        const command = languageConfigs[submission.language].execute(EXEC || SRC, null);
        const { stdout } = await execAsync(command, {
          input: tc.input,
          timeout: TIME_LIMIT
        });
        output = stdout.trim();
      } catch (err) {
        if (err.killed || err.signal === "SIGTERM") {
          overallVerdict = "TLE";
          testResults.push({ testcase: tc._id, verdict: "TLE" });
          break;
        }
        errorOutput = err.stderr?.trim() || err.message;
        overallVerdict = "Runtime Error";
        testResults.push({ testcase: tc._id, verdict: "Runtime Error", userOutput: errorOutput });
        break;
      }

      const expected = tc.expectedOutput.trim();
      if (output !== expected) {
        overallVerdict = "Wrong Answer";
        testResults.push({ testcase: tc._id, verdict: "Wrong Answer", userOutput: output, expectedOutput: expected });
        break;
      }

      testResults.push({ testcase: tc._id, verdict: "Accepted" });
    }

    await Submission.findByIdAndUpdate(submissionId, {
      verdict: overallVerdict,
      testResults
    });

    await fs.remove(TEMP_DIR);

  } catch (err) {
    console.error("Judge Error:", err);
    await Submission.findByIdAndUpdate(submissionId, {
      verdict: "Internal Error",
      errorDetails: err.message
    });
  }
};


  
// GET /api/submissions?problemId=...
export const getSubmissionsByProblem = async (req, res) => {
  const { problemId } = req.query;

  try {
    const query = { user: req.user.id };
    if (problemId) query.problem = problemId;

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .populate('problem', 'title difficulty');

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

    const submissions = await Submission.find({ problem: problemId })
      .populate('user', 'name email')   // correct populate
      .sort({ createdAt: -1 });         // use createdAt if available

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
      createdAt: { $gte: firstDayOfMonth }
    }
  },
  {
    $lookup: {
      from: 'problems',
      localField: 'problem',
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
      _id: '$user',
      totalPoints: { $sum: '$difficultyPoints' },
      latestSubmission: { $max: '$createdAt' }
    }
  },
  { $sort: { totalPoints: -1, latestSubmission: 1 } },
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

//  Submissions done by user
// GET /api/submissions/:id
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title difficulty')
      .populate('testResults.testcase', 'input expectedOutput'); // ✅ Add this

    if (!submission) return res.status(404).json({ msg: 'Submission not found' });

    if (submission.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
      
          $match: { user: new mongoose.Types.ObjectId(req.user.id) }
       
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