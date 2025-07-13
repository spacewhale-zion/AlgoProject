import React from 'react';
import { Route } from 'react-router-dom';
import RequireAdmin from '../context/RequireAdmin';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import ProblemsList from '../pages/Admin/ProblemList';
import ProblemForm from '../pages/Admin/ProblemForm';
import AdminTestcases from '../pages/Admin/AdminTestcase';
import AdminTestcaseSelect from '../pages/Admin/AdminTestcaseSelect';

const RouteAdmin = () => (
  <>
    <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
    <Route path="/admin/problems" element={<RequireAdmin><ProblemsList /></RequireAdmin>} />
    <Route path="/admin/problems/new" element={<RequireAdmin><ProblemForm /></RequireAdmin>} />
    <Route path="/admin/problems/edit/:id" element={<RequireAdmin><ProblemForm /></RequireAdmin>} />
    <Route path="/admin/testcases" element={<RequireAdmin><AdminTestcaseSelect /></RequireAdmin>} />
    <Route path="/admin/testcases/:problemId" element={<RequireAdmin><AdminTestcases /></RequireAdmin>} />
  </>
);

export default RouteAdmin;
