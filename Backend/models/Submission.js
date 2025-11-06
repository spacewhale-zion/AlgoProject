import mongoose from 'mongoose';



const TestResultSchema = new mongoose.Schema({
    testcase: {
        // We only store the ID here. The detailed input/output will be fetched separately if needed.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Testcase',
        required: true
    },
    verdict: {
        type: String,
        enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Internal Error'],
        required: true
    },
    time: { // Time taken in milliseconds
        type: Number,
        default: 0
    },
    memory: { // Memory used in kilobytes or megabytes
        type: Number,
        default: 0
    },
    // Storing the user's output for the sample tests helps with debugging in the frontend
    userOutput: {
        type: String,
        default: ''
    },
    isSample: { type: Boolean, default: false }


}, { _id: false });


const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: { type: String, required: true },
  language: { type: String, required: true },
  verdict: {
   type: String,
        enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Internal Error'],
        default: 'Pending'
  },
  testResults: [TestResultSchema],
    // Optional field for compilation or detailed runtime messages
    errorDetails: {
        type: String,
        default: ''
    }
},{ timestamps: true });

export default mongoose.model('Submission', submissionSchema);
