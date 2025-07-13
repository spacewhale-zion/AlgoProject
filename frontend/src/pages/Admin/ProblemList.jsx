import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../services/axios';

export default function ProblemsList() {
  const [problems, setProblems] = useState([]);
  const navigate = useNavigate();

  const fetchProblems = () => {
    axios.get('/problems').then(res => setProblems(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
        await axios.delete(`/problems/${id}`);
      fetchProblems();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Problems</h1>
        <Link to="/admin/problems/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Add Problem
        </Link>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Difficulty</th>
              <th className="px-4 py-2">Tags</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map(p => (
              <tr key={p._id} className="border-t">
                <td className="px-4 py-2">{p.title}</td>
                <td className="px-4 py-2">{p.difficulty}</td>
                <td className="px-4 py-2">{(p.tags || []).join(', ')}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => navigate(`/admin/problems/edit/${p._id}`)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => navigate(`/admin/testcases/${p._id}`)} className="text-yellow-600 hover:underline">Testcases</button>
                  <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
