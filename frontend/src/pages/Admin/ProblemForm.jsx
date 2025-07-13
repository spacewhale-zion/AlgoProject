import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/axios';

export default function ProblemForm() {
  const { id } = useParams(); // Will be undefined for /new
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    statement: '',
    difficulty: 'Easy',
    constraints: '',
    tags: ''
  });
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      // Fetch the existing problem data
      axios.get(`/problems/${id}`)
        .then(res => {
          const p = res.data;
          setForm({
            title: p.title,
            statement: p.statement,
            difficulty: p.difficulty,
            constraints: p.constraints,
            tags: (p.tags || []).join(', ')
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch problem:', err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim())
    };

    try {
      if (id) {
        await axios.put(`/problems/${id}`, data);
      } else {
        await axios.post('/problems', data);
      }
      navigate('/admin/problems');
    } catch (err) {
      console.error('Failed to save problem:', err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{id ? 'Edit' : 'Create'} Problem</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-3">
        <input
          type="text"
          required
          placeholder="Title"
          className="w-full border px-3 py-2 rounded"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          rows={4}
          required
          placeholder="Statement"
          className="w-full border px-3 py-2 rounded"
          value={form.statement}
          onChange={e => setForm({ ...form, statement: e.target.value })}
        />
        <input
          type="text"
          placeholder="Constraints"
          className="w-full border px-3 py-2 rounded"
          value={form.constraints}
          onChange={e => setForm({ ...form, constraints: e.target.value })}
        />
        <select
          value={form.difficulty}
          onChange={e => setForm({ ...form, difficulty: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <input
          type="text"
          placeholder="Tags (comma separated)"
          className="w-full border px-3 py-2 rounded"
          value={form.tags}
          onChange={e => setForm({ ...form, tags: e.target.value })}
        />
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {id ? 'Update Problem' : 'Create Problem'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/problems')}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
