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
import Navbar from './components/Navbar';
import RequireAdmin from './context/RequireAdmin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProblemsList from './pages/Admin/ProblemList';
import ProblemForm from './pages/Admin/ProblemForm';
import AdminTestcases from './pages/Admin/AdminTestcase';
import AdminTestcaseSelect from './pages/Admin/AdminTestcaseSelect';
// import RouteAdmin from './routes/RouteAdmin'; // 👈 import

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/problems/:id" element={<ProblemPage />} />
        <Route path="/submissions/:problemId" element={<AllSubmissionsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
    <Route path="/admin/problems" element={<RequireAdmin><ProblemsList /></RequireAdmin>} />
    <Route path="/admin/problems/new" element={<RequireAdmin><ProblemForm /></RequireAdmin>} />
    <Route path="/admin/problems/edit/:id" element={<RequireAdmin><ProblemForm /></RequireAdmin>} />
    <Route path="/admin/testcases" element={<RequireAdmin><AdminTestcaseSelect /></RequireAdmin>} />
    <Route path="/admin/testcases/:problemId" element={<RequireAdmin><AdminTestcases /></RequireAdmin>} />
      </Routes>
    </>
  );
}

export default App;
