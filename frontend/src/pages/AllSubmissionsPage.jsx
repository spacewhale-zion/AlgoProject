import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/axios';
import VerdictBadge from '../components/VerdictBadge';
import SubmissionDetailsModal from '../components/SubmissionDetailsModal'; // Import the new modal

export default function AllSubmissionsPage() {
  const { problemId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null); // New state for modal

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        // NOTE: The submission route needs to be updated in the backend
        // to calculate the average time and memory from testResults 
        // OR fetch the last test case result if not AC.
        const res = await axios.get(`/submissions/all/${problemId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log(res);
        setSubmissions(res.data);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
      }
      setLoading(false);
    };
    fetchSubmissions();
  }, [problemId]);

  const handleViewDetails = (id) => {
    setSelectedSubmissionId(id);
  };

  const handleCloseModal = () => {
    setSelectedSubmissionId(null);
  };

  // Helper function to extract overall execution time/memory from the results array
  // Find the max time/memory used across all successful or the first failing test.
  const getMetrics = (sub) => {
    if (!sub.testResults || sub.testResults.length === 0) {
        return { time: '-', memory: '-' };
    }
    
    let maxTime = 0;
    let maxMemory = 0;
    
    // Find the relevant test (first non-AC, or the last one if all passed)
    const finalTest = sub.testResults.find(r => r.verdict !== 'Accepted') || sub.testResults[sub.testResults.length - 1];

    // Calculate max time and memory across all executed tests
    sub.testResults.forEach(res => {
        if (res.time > maxTime) maxTime = res.time;
        if (res.memory > maxMemory) maxMemory = res.memory;
    });

    return { 
        time: maxTime.toFixed(3), 
        memory: maxMemory.toFixed(2)
    };
  };


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">All Submissions for Problem ID: {problemId.slice(0, 8)}...</h1>

      {loading ? (
        <div className="text-center p-8">
            <p className="text-gray-500">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-gray-400 italic p-8">No submissions found for this problem.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-lg">
          <table className="min-w-full bg-white divide-y divide-gray-200">
            <thead className="bg-indigo-50 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-indigo-700">User</th>
                <th className="px-4 py-3 text-left font-semibold text-indigo-700">Language</th>
                <th className="px-4 py-3 text-left font-semibold text-indigo-700">Verdict</th>
                <th className="px-4 py-3 text-left font-semibold text-indigo-700">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-indigo-700">Memory</th>
                <th className="px-4 py-3 text-left font-semibold text-indigo-700">Submitted</th>
                <th className="px-4 py-3 text-left font-semibold text-indigo-700">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub) => {
                const metrics = getMetrics(sub);
                return (
                  <tr key={sub._id} className="text-sm hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700">{sub.userId?.name || 'Anonymous'}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.language}</td>
                    <td className="px-4 py-3">
                      <VerdictBadge verdict={sub.verdict} />
                    </td>
                    {/* Display max recorded time and memory from the test run */}
                    <td className="px-4 py-3 font-mono">{metrics.time} ms</td>
                    <td className="px-4 py-3 font-mono">{metrics.memory} MB</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(sub.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                       {sub.verdict !== 'Pending' ? (
                            <button
                                onClick={() => handleViewDetails(sub._id)}
                                className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors"
                            >
                                View Details
                            </button>
                       ) : (
                            <span className="text-xs text-gray-400">Processing...</span>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for detailed test results */}
      {selectedSubmissionId && (
        <SubmissionDetailsModal 
          submissionId={selectedSubmissionId} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}