import React from 'react';
import { useEffect, useState } from 'react';
import axios from '../services/axios';

export default function LeaderboardPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('/submissions/leaderboard/global')
      .then(res => setData(res.data))
      .catch(err => console.error('Failed to fetch leaderboard:', err));
  }, []);
 console.log('Leaderboard data:', data);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🏆 Global Leaderboard</h1>

      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="px-4 py-2 text-left">Rank</th>
            <th className="px-4 py-2 text-left">User</th>
            <th className="px-4 py-2 text-left">Points</th>
            <th className="px-4 py-2 text-left">Last Solved</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, idx) => (
            <tr key={idx} className="border-t text-sm">
              <td className="px-4 py-2">{idx + 1}</td>
              <td className="px-4 py-2">{entry.name}</td>
              <td className="px-4 py-2">{entry.totalPoints}</td>
              <td className="px-4 py-2">{new Date(entry.lastSolved).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
