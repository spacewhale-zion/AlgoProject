import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from '../services/axios';
import useAuth from '../hooks/useAuth';
import CodeEditor from '../components/CodeEditor';
import VerdictBadge from '../components/VerdictBadge';
import CodeReviewButton from '../components/CodeReveiw';

export default function ProblemPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(null);
  const [expectedOutput, setExpectedOutput] = useState('');
  const [actualOutput, setActualOutput] = useState('');
  const [tc, setTc] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('All');

  // Restore saved code from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem(`code-${id}-${language}`);
    if (savedCode) setCode(savedCode);
  }, [id, language]);

  useEffect(() => {
    if (!user) return;
    axios.get(`/problems/${id}`).then(res => setProblem(res.data));
    axios.get(`/submissions/${id}`).then(res => setSubmissions(res.data));
  }, [id, user]);

  useEffect(() => {
    if (code) localStorage.setItem(`code-${id}-${language}`, code);
  }, [code, id, language]);

  const handleRun = async () => {
    try {
      const res = await axios.post('/submissions/run', { code, language, input });
      console.log("I am running")
      console.log(res.data);
      setOutput(res.data.output || res.data.error);
    } catch (err) {
      setOutput('Runtime error or server issue');
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post('/submissions', { problemId: id, language, code });
      setVerdict(res.data.verdict);
      setOutput(null);

      if (res.data.expectedOutput || res.data.actualOutput) {
        setTc(res.data.actualInput);
        setExpectedOutput(res.data.expectedOutput);
        setActualOutput(res.data.actualOutput);
        setOutput(`❌ Wrong Answer\nExpected: ${res.data.expectedOutput}\nYour Output: ${res.data.actualOutput}`);
      }

      axios.get(`/submissions/${id}`).then(res => setSubmissions(res.data));
    } catch (err) {
      setVerdict('Submission failed');
      console.error(err);
    }
  };

  const filteredSubmissions = submissions
    .filter(sub => sub.verdict === 'Accepted' || sub.verdict === 'Wrong Answer')
    .filter(sub => (filter === 'All' ? true : sub.verdict === filter))
    .slice(0, 10);

  if (!problem) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-end">
        <CodeReviewButton code={code} />
      </div>

      <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
      <p className="text-sm text-gray-500 mb-4">Difficulty:
        <span className={`ml-2 ${
          problem.difficulty === 'Easy' ? 'text-green-600' :
          problem.difficulty === 'Medium' ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {problem.difficulty}
        </span>
      </p>

      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap mb-6">{problem.statement}</pre>

      <div className="mb-4">
        <label className="text-sm mr-2">Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>

      <CodeEditor code={code} setCode={setCode} language={language} />

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Custom Input (Optional):</label>
        <textarea
          rows="3"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type input here..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleRun}
          className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          Run Code
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Code
        </button>
      </div>
      {output && (
  <div className="bg-gray-100 mt-4 p-4 rounded whitespace-pre-wrap text-sm">
    <strong>Output:</strong>
    <pre className="mt-2 text-gray-800">{output}</pre>
  </div>
)}
      <div className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap mt-4">
        {verdict === 'Wrong Answer' && (
          <div className="mt-3">
            <p><strong>Input:</strong></p>
            <pre className="bg-green-100 p-2 rounded">{tc}</pre>
            <p><strong>Expected Output:</strong></p>
            <pre className="bg-green-100 p-2 rounded">{expectedOutput}</pre>
            <p className="mt-2"><strong>Your Output:</strong></p>
            <pre className="bg-red-100 p-2 rounded">{actualOutput}</pre>
          </div>
        )}
      </div>

      {verdict && (
        <div className="mt-4">
          <p className="text-sm">Final Verdict:</p>
          <VerdictBadge verdict={verdict} />
        </div>
      )}

      <h2 className="mt-10 text-xl font-semibold">Your Submissions</h2>

      <div className="flex items-center gap-4 mt-4">
        <label className="text-sm font-medium">Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="All">All</option>
          <option value="Accepted">Accepted</option>
          <option value="Wrong Answer">Wrong Answer</option>
        </select>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full bg-white border mt-2">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">Language</th>
              <th className="px-4 py-2 text-left">Verdict</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Memory</th>
              <th className="px-4 py-2 text-left">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map(sub => (
              <tr key={sub._id} className="border-t text-sm">
                <td className="px-4 py-2">{sub.language}</td>
                <td className="px-4 py-2"><VerdictBadge verdict={sub.verdict} /></td>
                <td className="px-4 py-2">{sub.executionTime ?? '-'} ms</td>
                <td className="px-4 py-2">{sub.memoryUsed ?? '-'} KB</td>
                <td className="px-4 py-2">{new Date(sub.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4">
          <Link
            to={`/submissions/${id}`}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            View All Submissions →
          </Link>
        </div>
     
      </div>
    </div>
  );
}
