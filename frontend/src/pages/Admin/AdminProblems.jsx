import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../services/axios';

export default function AdminProblems() {
  const [problems, setProblems] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', statement: '', difficulty: 'Easy', constraints: '', tags: '' });
  const [editing, setEditing] = useState(null);

  const fetchProblems = () => {
    axios.get('/admin/problems').then(res => setProblems(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim())
    };

    try {
      if (editing) {
        await axios.put(`/admin/problems/${editing}`, data);
      } else {
        await axios.post('/admin/problems', data);
      }
      setForm({ title: '', statement: '', difficulty: 'Easy', constraints: '', tags: '' });
      setEditing(null);
      fetchProblems();
    } catch (err) {
      console.error('Failed to save problem:', err);
    }
  };

  const handleEdit = (p) => {
    setForm({
      title: p.title,
      statement: p.statement,
      difficulty: p.difficulty,
      constraints: p.constraints,
      tags: (p.tags || []).join(', ')
    });
    setEditing(p._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
      await axios.delete(`/admin/problems/${id}`);
      fetchProblems();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{editing ? 'Edit' : 'Create'} Problem</h1>

      {/* Problem Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-8 space-y-3">
        <input type="text" required placeholder="Title"
          className="w-full border px-3 py-2 rounded"
          value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <textarea rows={4} required placeholder="Statement"
          className="w-full border px-3 py-2 rounded"
          value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })}
        />
        <input type="text" placeholder="Constraints"
          className="w-full border px-3 py-2 rounded"
          value={form.constraints} onChange={e => setForm({ ...form, constraints: e.target.value })}
        />
        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
          className="w-full border px-3 py-2 rounded">
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <input type="text" placeholder="Tags (comma separated)"
          className="w-full border px-3 py-2 rounded"
          value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
        />
        <button type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {editing ? 'Update Problem' : 'Create Problem'}
        </button>
      </form>

      {/* Problems Table */}
      <h2 className="text-lg font-semibold mb-2">All Problems</h2>
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
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">Edit</button>
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
