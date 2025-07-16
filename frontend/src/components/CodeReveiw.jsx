// src/components/CodeReviewButton.jsx
import React, { useState } from 'react';
import axios from '../services/axios';

export default function CodeReviewButton({ code }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    setFeedback('');
    try {
      const res = await axios.post('/gemini/review', { code });
      setFeedback(res.data.feedback || 'No feedback received.');
      setShowFeedback(true);
    } catch (err) {
      setFeedback('Error getting AI feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end mb-4">
      <button
        onClick={handleReview}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
      >
        {loading ? 'Reviewing...' : 'Get Code Review'}
      </button>

      {showFeedback && (
        <div className="mt-2 w-full md:w-2/3 bg-gray-100 border rounded p-3 text-sm relative">
          <button
            className="absolute top-1 right-2 text-xs text-blue-600 hover:underline"
            onClick={() => setShowFeedback(false)}
          >
            Collapse
          </button>
          <p className="font-semibold mb-1 text-gray-700">AI Feedback:</p>
          <pre className="whitespace-pre-wrap">{feedback}</pre>
        </div>
      )}
    </div>
  );
}
