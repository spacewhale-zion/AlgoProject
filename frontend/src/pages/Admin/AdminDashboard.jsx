// src/pages/AdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <p className="text-gray-700 mb-1">Logged in as:</p>
        <div className="text-sm text-gray-900 font-semibold">{user?.name} ({user?.email})</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem Management */}
        <AdminCard
          title="Problem Management"
          description="Create, update, or delete coding problems."
          link="/admin/problems"
          color="bg-blue-50"
        />

        {/* Testcase Management */}
        <AdminCard
          title="Testcase Management"
          description="Manage sample and hidden test cases per problem."
          link="/admin/testcases"
          color="bg-yellow-50"
        />
      
      </div>
    </div>
  );
}

function AdminCard({ title, description, link, color }) {
  return (
    <div className={`p-5 rounded shadow-sm ${color}`}>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <Link
        to={link}
        className="inline-block text-sm text-blue-600 hover:underline font-medium"
      >
        Go to {title} →
      </Link>
    </div>
  );
}
