import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';


const app = express();

app.use(cors());
app.use(express.json());
console.log('Testing ENV:', process.env.PORT);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import problemRoutes from './routes/problems.js';
import submissionRoutes from './routes/submissions.js';
import testcaseRoutes from './routes/testcases.js';


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/testcases', testcaseRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
