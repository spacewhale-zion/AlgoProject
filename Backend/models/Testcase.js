import mongoose from 'mongoose';

const TestcaseSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },

  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isSample: { type: Boolean, default: false }
});

const Testcase = mongoose.model('Testcase', TestcaseSchema);
export default Testcase;
