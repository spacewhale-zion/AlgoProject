import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProblemPage from './pages/ProblemPage';
import AllSubmissionsPage from './pages/AllSubmissionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import RequireAdmin from './context/RequireAdmin';
import useAuth from './hooks/useAuth';
import AdminProblems from './pages/Admin/AdminProblems';
import AdminTestcases from './pages/Admin/AdminTestcase';
import AdminTestcaseSelect from './pages/Admin/AdminTestcaseSelect';
import Navbar from './components/Navbar';


function App() {



  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/problems/:id" element={<ProblemPage />} />
        <Route path="/submissions/:problemId" element={<AllSubmissionsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/admin" element={ <AdminDashboard /> } />
<Route path="/admin/problems" element={<RequireAdmin><AdminProblems /></RequireAdmin>} />

<Route path="/admin/testcases" element={<RequireAdmin><AdminTestcaseSelect /></RequireAdmin>} />
<Route path="/admin/testcases/:problemId" element={<RequireAdmin><AdminTestcases /></RequireAdmin>} />



   

      </Routes>
    </>
  );
}

export default App;
