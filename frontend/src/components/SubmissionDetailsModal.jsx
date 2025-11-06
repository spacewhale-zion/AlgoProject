import React, { useState, useEffect } from 'react';
import axios from '../services/axios'; // Assuming your custom axios instance is here
import VerdictBadge from './VerdictBadge'; // Assuming you have a VerdictBadge component

const ExecutionMetric = ({ label, value, unit, isBad }) => (
  <div className={`p-2 rounded-lg ${isBad ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
    <span className="font-semibold">{label}:</span> {value} {unit}
  </div>
);

const CodeBlock = ({ title, content, color = 'bg-gray-800', textColor = 'text-gray-200' }) => (
  <div className="mt-4">
    <h4 className="font-semibold text-sm mb-1">{title}</h4>
    <pre className={`p-3 rounded-lg text-sm overflow-x-auto ${color} ${textColor}`}>
      {content || 'No output captured.'}
    </pre>
  </div>
);

const SubmissionDetailsModal = ({ submissionId, onClose }) => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTest, setExpandedTest] = useState(null);

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!submissionId) return;

      setLoading(true);
      setError(null);
      try {
        // Assuming your backend supports population of the testcase data via the submissions route
        const response = await axios.get(`/submissions/single/${submissionId}`);
        setSubmission(response.data);
      } catch (err) {
        console.error('Error fetching submission details:', err);
        setError('Failed to load submission details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissionDetails();
  }, [submissionId]);

  if (loading) return (
    <div className="p-8 text-center bg-white rounded-lg shadow-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
      <p className="mt-4">Loading submission details...</p>
    </div>
  );
  if (error) return <div className="p-8 text-red-500 bg-red-100 rounded-lg shadow-xl">{error}</div>;
  if (!submission) return null;
  console.log(submission);
  const totalTests = submission.testResults.length;
  const passedTests = submission.testResults.filter(r => r.verdict === 'Accepted').length;
  const sampleTests = submission.testResults.filter(r => r.testcase?.isSample);
  const hiddenTests = submission.testResults.filter(r => !r.testcase?.isSample);
  const passedHiddenTests = hiddenTests.filter(r => r.verdict === 'Accepted').length;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
      <div className="relative w-full max-w-4xl mx-auto my-10 p-6 bg-white rounded-xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Submission Details (ID: {submissionId.slice(0, 8)}...)</h2>

        <div className="mb-8 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Overall Verdict</h3>
          <div className="flex items-center space-x-4">
            <VerdictBadge verdict={submission.verdict} />
            {submission.verdict !== 'Accepted' && submission.verdict !== 'Compilation Error' && (
              <span className="text-sm text-red-600 font-medium">
                Failed on first failing test with: {submission.verdict}
              </span>
            )}
          </div>
        </div>

        {/* Display Compilation Error Details if applicable */}
        {submission.verdict === 'Compilation Error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Compilation Error</h3>
            <pre className="text-sm overflow-x-auto text-red-800">{submission.errorDetails}</pre>
          </div>
        )}
        
        {/* Summary Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <ExecutionMetric 
                label="Overall Status" 
                value={submission.verdict === 'Accepted' ? 'All Passed' : 'Failed'}
                isBad={submission.verdict !== 'Accepted'}
            />
            <ExecutionMetric 
                label="Tests Passed" 
                value={`${passedTests}/${totalTests}`} 
                unit="Tests"
                isBad={passedTests !== totalTests}
            />
             <ExecutionMetric 
                label="Hidden Tests" 
                value={`${passedHiddenTests}/${hiddenTests.length}`} 
                unit="Hidden"
                isBad={passedHiddenTests !== hiddenTests.length && hiddenTests.length > 0}
            />
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">Sample Test Case Results ({sampleTests.length})</h3>
        
        {/* Sample Test Case Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verdict</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (ms)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory (MB)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleTests.map((res, index) => (
                <React.Fragment key={res.testcase?._id || index}>
                  <tr className={res.verdict === 'Accepted' ? 'hover:bg-green-50' : 'hover:bg-red-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Sample {index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><VerdictBadge verdict={res.verdict} /></td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${res.verdict === 'Time Limit Exceeded' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {res.time ? `${res.time} ms` : 'N/A'}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${res.verdict === 'Memory Limit Exceeded' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {res.memory ? `${res.memory} MB` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedTest(expandedTest === index ? null : index)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs"
                      >
                        {expandedTest === index ? 'Hide Details' : 'Show Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedTest === index && (
                    <tr>
                      <td colSpan="5" className="p-4 bg-gray-50">
                        <CodeBlock title="Input" content={res.testcase?.input} color="bg-gray-700" textColor="text-white"/>
                        <CodeBlock title="Expected Output" content={res.testcase?.output} color="bg-gray-200" textColor="text-gray-800"/>
                        <CodeBlock 
                          title="Your Output" 
                          content={res.userOutput} 
                          color={res.verdict === 'Accepted' ? 'bg-green-200' : 'bg-red-200'}
                          textColor="text-gray-900"
                        />
                        {res.verdict === 'Runtime Error' && (
                           <CodeBlock title="Runtime Error Details" content={res.userOutput} color="bg-red-600" textColor="text-white" />
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table >
        </div>
        
        <div className="mt-8 pt-4 border-t">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Submission Information</h3>
            <p className="text-gray-600">Language: <span className="font-semibold">{submission.language}</span></p>
            <p className="text-gray-600">Submitted At: <span className="font-semibold">{new Date(submission.submittedAt).toLocaleString()}</span></p>
        </div>

      </div>
    </div>
  );
};

export default SubmissionDetailsModal;