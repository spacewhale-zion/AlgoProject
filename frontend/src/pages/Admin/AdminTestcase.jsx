import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../services/axios';

export default function AdminTestcases() {
  const { problemId } = useParams();
  const [testcases, setTestcases] = useState([]);
  const [form, setForm] = useState({ input: '', expectedOutput: '', isSample: true });
  const [editing, setEditing] = useState(null);
  const [problemTitle, setProblemTitle] = useState('');

  const fetchTestcases = async () => {
    try {
      const res = await axios.get(`/testcases/${problemId}`);
      setTestcases(res.data || []);
    } catch (err) {
      console.error('Failed to fetch testcases:', err);
    }
  };

  useEffect(() => {
    fetchTestcases();
  }, [problemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Normalise white‑space in input / output
    const payload = {
      ...form,
      input: form.input.trim(),
      expectedOutput: form.expectedOutput.trim(),
      problemId        // 👉 include the problem ID for all POST/PUT calls
    };
  
    try {
      if (editing) {
        // update existing testcase
        await axios.put(`/testcases/${editing}`, payload);
      } else {
        // create new testcase
        await axios.post('/testcases', payload);
      }
  
      // reset UI
      setForm({ input: '', expectedOutput: '', isSample: true });
      setEditing(null);
      fetchTestcases();
    } catch (err) {
      console.error('Error saving testcase:', err);
    }
  };
  

  const handleEdit = (tc) => {
    setForm({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isSample: tc.isSample
    });
    setEditing(tc._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this testcase?')) {
      await axios.delete(`/testcases/${id}`);
      fetchTestcases(); 
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Testcases for <span className="text-blue-600">{problemTitle}</span></h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded mb-8 space-y-3">
        <textarea
          placeholder="Input"
          rows={3}
          className="w-full border px-3 py-2 rounded"
          value={form.input}
          onChange={(e) => setForm({ ...form, input: e.target.value })}
          required
        />
        <textarea
          placeholder="Expected Output"
          rows={3}
          className="w-full border px-3 py-2 rounded"
          value={form.expectedOutput}
          onChange={(e) => setForm({ ...form, expectedOutput: e.target.value })}
          required
        />

        <label className="text-sm">
          <input
            type="checkbox"
            checked={form.isSample}
            onChange={(e) => setForm({ ...form, isSample: e.target.checked })}
            className="mr-2"
          />
          This is a <strong>sample</strong> testcase
        </label>
        <div className="flex justify-end">
    <button
      type="submit"
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {editing ? 'Update' : 'Add'} Testcase
    </button>
  </div>
      </form>

      {/* Testcases Table */}
      <h2 className="text-lg font-semibold mb-2">All Testcases</h2>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Input</th>
              <th className="px-4 py-2 text-left">Expected Output</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testcases.map(tc => (
              <tr key={tc._id} className="border-t">
                <td className="px-4 py-2">
                  {tc.isSample ? (
                    <span className="text-green-600 font-medium">Sample</span>
                  ) : (
                    <span className="text-gray-600">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-pre-wrap">{tc.input}</td>
                <td className="px-4 py-2 whitespace-pre-wrap">{tc.expectedOutput}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => handleEdit(tc)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(tc._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
