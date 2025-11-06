import React, { useState, useEffect } from 'react';
import axios from '../services/axios';
import VerdictBadge from './VerdictBadge';

const ExecutionMetric = ({ label, value, unit, isBad }) => (
  <div className={`p-2 rounded-lg ${isBad ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
    <span className="font-semibold">{label}:</span> {value} {unit}
  </div>
);

const CodeBlock = ({ title, content, color = 'bg-gray-800', textColor = 'text-gray-200' }) => (
  <div className="mt-3">
    <h4 className="font-semibold text-sm mb-1">{title}</h4>
    <pre className={`p-3 rounded text-sm overflow-x-auto ${color} ${textColor}`}>
      {content || 'No output provided.'}
    </pre>
  </div>
);

const SubmissionDetailsModal = ({ submissionId, onClose }) => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTest, setExpandedTest] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/submissions/single/${submissionId}`);
        setSubmission(res.data);
      } catch {
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [submissionId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!submission) return <div className="p-8 text-red-500">Failed to load submission.</div>;

  const sampleTests = submission.testResults.filter(t => t.testcase?.isSample === true);
  const hiddenTests = submission.testResults.filter(t => !t.testcase?.isSample);

  const renderTable = (tests, title) => (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title} ({tests.length})</h3>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Verdict</th>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Memory</th>
            <th className="p-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((res, index) => (
            <React.Fragment key={index}>
              <tr className="border-b">
                <td className="p-2">Test {index + 1}</td>
                <td className="p-2"><VerdictBadge verdict={res.verdict} /></td>
                <td className="p-2">{res.time ?? 'N/A'} ms</td>
                <td className="p-2">{res.memory ?? 'N/A'} MB</td>
                <td className="p-2">
                  <button
                    className="text-indigo-600 text-xs"
                    onClick={() => setExpandedTest(expandedTest === `${title}-${index}` ? null : `${title}-${index}`)}
                  >
                    {expandedTest === `${title}-${index}` ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>

              {expandedTest === `${title}-${index}` && (
                <tr>
                  <td colSpan={5} className="p-4 bg-gray-50">
                    <CodeBlock title="Input" content={res.testcase?.input} />
                    <CodeBlock title="Expected Output" content={res.testcase?.expectedOutput} color="bg-gray-200" textColor="text-gray-900" />
                    <CodeBlock
                      title="Your Output"
                      content={res.userOutput}
                      color={res.verdict === 'Accepted' ? 'bg-green-200' : 'bg-red-200'}
                      textColor="text-gray-900"
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto z-50">
      <div className="bg-white w-full max-w-4xl p-6 mt-10 rounded shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-black">✕</button>
        <h2 className="text-2xl font-bold mb-4">Submission Details</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <ExecutionMetric label="Verdict" value={submission.verdict} />
          <ExecutionMetric label="Tests Passed" value={submission.testResults.filter(r => r.verdict === 'Accepted').length} unit={`/${submission.testResults.length}`} />
          <ExecutionMetric label="Language" value={submission.language} />
        </div>

        {renderTable(sampleTests, "Sample Tests")}
        {renderTable(hiddenTests, "Hidden Tests")}
      </div>
    </div>
  );
};

export default SubmissionDetailsModal;
