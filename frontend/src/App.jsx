import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProblemPage from './pages/ProblemPage';
import AllSubmissionsPage from './pages/AllSubmissionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/problems/:id" element={<ProblemPage />} />
        <Route path="/submissions/:problemId" element={<AllSubmissionsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

   

      </Routes>
    </>
  );
}

export default App;
