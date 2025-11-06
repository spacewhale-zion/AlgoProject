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
        ? `cmd /c "type \"${input}\" | \"${exe}\""`
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
        problem: problemId,
        code,
        language,
        verdict: 'Pending',
        submittedAt: new Date()
      });
  
      await submission.save();

      // 🛑 THE FIX: Instead of inline judging, we call the judge function and await the result.
      await judgeSubmission(submission._id);

      // Fetch the updated submission to return the final result to the client
      const updatedSubmission = await Submission.findById(submission._id)
        .select('verdict executionTime memoryUsed testResults errorDetails')
        .populate('problem', 'title difficulty');
  
      if (!updatedSubmission) {
         // Should ideally never happen, but good for defensive programming
         return res.status(500).json({ msg: 'Internal error: Submission disappeared after judging' });
      }

      const responseData = {
        msg: 'Submission evaluated',
        verdict: updatedSubmission.verdict,
        executionTime: updatedSubmission.executionTime,
        memoryUsed: updatedSubmission.memoryUsed,
        // The frontend can parse this array to show detailed results
        testResults: updatedSubmission.testResults,
        errorDetails: updatedSubmission.errorDetails || undefined
      };

      // Send appropriate status codes for various verdicts
      if (updatedSubmission.verdict === 'Accepted') {
         res.json(responseData);
      } else if (updatedSubmission.verdict === 'Compilation Error') {
         res.status(400).json(responseData);
      } else {
         res.status(200).json(responseData); // All other failures (WA, TLE, RE) return 200/OK
      }
      
    } catch (err) {
      console.error('Evaluation error:', err);
      // In a real system, you would log this and update the submission status to 'Internal Error'
      res.status(500).json({ msg: 'Server error', error: err.message });
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
  const TEMP_DIR = path.join(process.cwd(), "temp", `submission-${submissionId}`);
  
  try {
    const submission = await Submission.findById(submissionId)
      .populate("problem");
    if (!submission) return;

    const problem = submission.problem;
    // Problem.js defines timeLimit in seconds. Convert to milliseconds for execAsync timeout.
    const TIME_LIMIT = (problem.timeLimit || 2) * 1000; 
    const testcases = await Testcase.find({ problemId: problem._id }); // Use problemId for consistency

    await fs.ensureDir(TEMP_DIR);

    const config = languageConfigs[submission.language];
    if (!config) throw new Error(`Unsupported language: ${submission.language}`);

    // Build paths
    const EXEC = path.join(TEMP_DIR, isWindows ? "Main.exe" : "Main.out");
    const SRC = path.join(TEMP_DIR, `Main.${config.extension}`);

    // Write source file (if not already done by a previous step)
    await fs.writeFile(SRC, submission.code); 

    // Compile (if needed)
    if (config.compile) {
      try {
        await execAsync(config.compile(SRC, EXEC));
      } catch (err) {
        await Submission.findByIdAndUpdate(submissionId, { verdict: "Compilation Error", errorDetails: err.stderr || err.message });
        await fs.remove(TEMP_DIR);
        return;
      }
    }
    // For compiled languages, ensure the executable exists
    const executablePath = submission.language === "cpp" ? EXEC : SRC;
    if (submission.language === "cpp" && !fs.existsSync(executablePath)) {
        // This case should be caught by the compile catch block, but kept for robustness
        await Submission.findByIdAndUpdate(submissionId, { verdict: "Compilation Error" });
        await fs.remove(TEMP_DIR);
        return;
    }
    
    const testResults = [];
    let overallVerdict = "Accepted";
    let maxExecutionTime = 0;
    let finalErrorDetails = '';

    for (const tc of testcases) {
      const inputPath = path.join(TEMP_DIR, `input-${tc._id}.txt`);
      await fs.writeFile(inputPath, tc.input);

      // Construct command using the correct executable/source file path
      const command = config.execute(executablePath, inputPath);

      let testcaseVerdict = 'Accepted';
      let executionTime = 0;
      let userOutput = '';
      
      const start = Date.now(); // Start time outside the try block for better time calculation

      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: TIME_LIMIT,
          killSignal: 'SIGTERM'
        });
        executionTime = Date.now() - start;
        userOutput = stdout.trim();
        finalErrorDetails = stderr.trim(); // Capture stderr even on success for info

        const expected = tc.expectedOutput.trim();
        
        if (userOutput !== expected) {
          testcaseVerdict = 'Wrong Answer';
          overallVerdict = 'Wrong Answer';
        } else {
          maxExecutionTime = Math.max(maxExecutionTime, executionTime);
        }
      } catch (err) {
        executionTime = Date.now() - start; // Record time even on failure

        if (err.killed || err.signal === 'SIGTERM' || err.message?.includes('timed out')) {
          testcaseVerdict = 'Time Limit Exceeded';
          overallVerdict = 'Time Limit Exceeded';
          userOutput = 'Execution exceeded time limit.';
        } else {
          // General runtime error
          testcaseVerdict = 'Runtime Error';
          overallVerdict = 'Runtime Error';
          const errorOutput = err.stderr?.trim() || err.message;
          finalErrorDetails = errorOutput;
          userOutput = errorOutput; 
        }
      }

      // Populate TestResult for the current testcase
      const result = {
        testcase: tc._id,
        verdict: testcaseVerdict === 'Time Limit Exceeded' ? 'Time Limit Exceeded' : testcaseVerdict,
        time: Math.round(executionTime),
        memory: 0, 
        userOutput: testcaseVerdict !== 'Accepted' ? userOutput : '', // Only store output/error if not accepted
        isSample:tc.isSample
      };
      
      testResults.push(result);

      // Stop the loop on first failure
      if (overallVerdict !== 'Accepted') {
          break;
      }
    }

    // Determine the final execution time for the submission
    const finalExecutionTime = overallVerdict === 'Accepted' 
                             ? Math.round(maxExecutionTime)
                             : testResults.length > 0 ? Math.round(testResults[testResults.length - 1].time) : 0;

    // Use $set to explicitly overwrite the entire testResults array (the fix from last step)
    await Submission.findByIdAndUpdate(submissionId, {
      $set: {
        verdict: overallVerdict,
        testResults,
        executionTime: finalExecutionTime,
        memoryUsed: 0,
        errorDetails: overallVerdict === 'Runtime Error' ? finalErrorDetails : ''
      }
    });

    await fs.remove(TEMP_DIR);

  } catch (err) {
    console.error("Judge Internal Error:", err);
    await Submission.findByIdAndUpdate(submissionId, {
      verdict: "Internal Error",
      errorDetails: err.message
    });
    
    // Final cleanup attempt in case of an error not caught above
    if (await fs.pathExists(TEMP_DIR)) {
      await fs.remove(TEMP_DIR);
    }
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
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

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
      .populate('testResults.testcase', 'input expectedOutput');

    if (!submission) return res.status(404).json({ msg: 'Submission not found' });

    if (submission.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }
    console.log(submission);
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