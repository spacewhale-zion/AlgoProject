import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/axios';
import VerdictBadge from '../components/VerdictBadge';

export default function AllSubmissionsPage() {
  const { problemId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`/submissions/all/${problemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => setSubmissions(res.data))
    .catch((err) => console.error('Failed to fetch submissions:', err));
    setLoading(false);
  }, [problemId]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Submissions for Problem</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-400 italic">No submissions found.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Language</th>
                <th className="px-4 py-2 text-left">Verdict</th>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">Memory</th>
                <th className="px-4 py-2 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id} className="border-t text-sm">
                  <td className="px-4 py-2">{sub.userId?.name || '—'}</td>
                  <td className="px-4 py-2">{sub.language}</td>
                  <td className="px-4 py-2">
                    <VerdictBadge verdict={sub.verdict} />
                  </td>
                  <td className="px-4 py-2">{sub.executionTime ?? '-'} ms</td>
                  <td className="px-4 py-2">{sub.memoryUsed ?? '-'} KB</td>
                  <td className="px-4 py-2">{new Date(sub.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
