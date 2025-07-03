import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: { type: String, required: true },
  language: { type: String, required: true },
  verdict: {
    type: String,
    enum: ['Pending', 'Accepted', 'Wrong Answer', 'TLE', 'MLE', 'Compilation Error'],
    default: 'Pending'
  },
  executionTime: { type: Number },  // in ms
  memoryUsed: { type: Number },     // in KB
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Submission', submissionSchema);
