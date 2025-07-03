
import React from 'react';
// src/components/VerdictBadge.jsx
export default function VerdictBadge({ verdict }) {
    const colors = {
      'Accepted': 'bg-green-100 text-green-700',
      'Wrong Answer': 'bg-red-100 text-red-700',
      'Compilation Error': 'bg-yellow-100 text-yellow-800',
      'TLE': 'bg-orange-100 text-orange-700',
      'MLE': 'bg-purple-100 text-purple-700',
      'Pending': 'bg-gray-100 text-gray-600'
    };
  
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[verdict] || 'bg-gray-200 text-gray-700'}`}>
        {verdict}
      </span>
    );
  }
  
  