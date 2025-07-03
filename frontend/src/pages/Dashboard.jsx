import React from 'react';

import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import axios from '../services/axios';
import VerdictBadge from '../components/VerdictBadge';



export default function Dashboard() {
  const { user,logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('Dashboard user:', user);
  // Fetch submissions
  useEffect(() => {
    if (user) {
      axios
        .get(`/submissions?${user._id}`) // Your backend route: /api/submissions
        .then(res => {
          setSubmissions(res.data || []);
        })
        .catch(err => {
          console.error('Failed to fetch submissions:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const accepted = submissions.filter(s => s.verdict === 'Accepted').length;
  const total = submissions.length;
  const rejected = total - accepted;

  return (
    <div className="p-6">
     <div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name}</h1>
    <p className="text-sm text-gray-600">{user?.email}</p>
  </div>
  <button
    onClick={logout}
    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
  >
    Logout
  </button>
</div>


      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Submissions" value={total} color="bg-blue-100" />
        <StatCard title="Accepted" value={accepted} color="bg-green-100" />
        <StatCard title="Rejected" value={rejected} color="bg-red-100" />
      </div>

      {/* Submission Table */}
      <h2 className="text-xl font-semibold mb-2">Recent Submissions</h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : total === 0 ? (
        <p className="text-gray-400 italic">No submissions yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full bg-white">
          <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">Problem</th>
            <th className="px-4 py-2">Difficulty</th> {/* 👈 New */}
            <th className="px-4 py-2">Language</th>
            <th className="px-4 py-2">Verdict</th>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Memory</th>
          </tr>
        </thead>

        <tbody>
  {submissions.slice(0, 10).map(s => (
    <tr key={s._id} className="border-t text-sm">
      <td className="px-4 py-2">{s.problemId?.title || '—'}</td>
      <td className="px-4 py-2">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            s.problemId?.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
            s.problemId?.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
            s.problemId?.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-500'
          }`}
        >
          {s.problemId?.difficulty || '—'}
        </span>
      </td>
      <td className="px-4 py-2 capitalize">{s.language}</td>
      <td className="px-4 py-2"><VerdictBadge verdict={s.verdict} /></td>
      <td className="px-4 py-2">{s.executionTime ?? '-'} ms</td>
      <td className="px-4 py-2">{s.memoryUsed ?? '-'} KB</td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`rounded shadow-sm p-4 ${color}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}


