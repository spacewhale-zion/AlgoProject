// src/pages/AdminTestcaseSelect.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/axios';

export default function AdminTestcaseSelect() {
  const [problems, setProblems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/problems')
      .then(res => setProblems(res.data || []))
      .catch(err => console.error('Failed to fetch problems:', err));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Select a Problem to Manage Testcases</h1>

      {problems.length === 0 ? (
        <p className="text-gray-500">No problems found.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {problems.map(problem => (
            <div
              key={problem._id}
              onClick={() => navigate(`/admin/testcases/${problem._id}`)}
              className="cursor-pointer border p-4 rounded shadow hover:shadow-md bg-white"
            >
              <h2 className="font-semibold text-lg mb-1">{problem.title}</h2>
              <p className="text-sm text-gray-600">Difficulty: {problem.difficulty}</p>
              <div className="text-xs mt-1 text-gray-500">
                Tags: {(problem.tags || []).join(', ') || '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
