import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/axios';
import useAuth from '../hooks/useAuth';
import CodeEditor from '../components/CodeEditor';
import VerdictBadge from '../components/VerdictBadge';

export default function ProblemPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Restore saved code from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem(`code-${id}-${language}`);
    if (savedCode) setCode(savedCode);
  }, [id, language]);
  useEffect(() => {
    if (!user) return; // Wait until user is available
  
    axios.get(`/problems/${id}`).then(res => setProblem(res.data));
    axios.get(`/submissions?problemId=${id}`).then(res => setSubmissions(res.data));
  }, [id, user]);
  

  // Save code to localStorage on change
  useEffect(() => {
    if (code) localStorage.setItem(`code-${id}-${language}`, code);
  }, [code, id, language]);
  console.log('ProblemPage user:', user);


  const handleRun = async () => {
    try {
      const res = await axios.post('/run', {
        code,
        language,
        input
      });
      setOutput(res.data.output || res.data.error);
    } catch (err) {
      setOutput('Runtime error or server issue');
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post('/submissions', {
        problemId: id,
        language,
        code
      });
      setVerdict(res.data.verdict);
      setOutput(null);
      axios.get(`/submissions?problemId=${id}`).then(res => setSubmissions(res.data));
    } catch (err) {
      setVerdict('Submission failed');
      console.error(err);
    }
  };

  if (!problem) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
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

      {/* Language selector */}
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

      {/* Code Editor */}
      <CodeEditor code={code} setCode={setCode} language={language} />

      {/* Custom input */}
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

      {/* Output section */}
      {output && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Output:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">{output}</pre>
        </div>
      )}

      {/* Verdict */}
      {verdict && (
        <div className="mt-4">
          <p className="text-sm">Final Verdict:</p>
          <VerdictBadge verdict={verdict} />
        </div>
      )}

      {/* Past Submissions */}
      <h2 className="mt-10 text-xl font-semibold">Your Submissions</h2>
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
            {submissions.map(sub => (
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
  <button
    onClick={() => window.open(`/submissions/${id}`, '_blank')}
    className="text-sm text-blue-600 underline hover:text-blue-800"
  >
    View All Submissions for this Problem →
  </button>
</div>

      </div>
    </div>
  );
}
