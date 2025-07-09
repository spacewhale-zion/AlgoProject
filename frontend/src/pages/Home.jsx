import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axios from '../services/axios';
import Navbar from '../components/Navbar';


export default function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    axios.get('/problems')
      .then(res => setProblems(res.data || []))
      .catch(err => console.error('Failed to fetch problems:', err));
  }, []);

  const allTags = ['All', ...new Set(problems.flatMap(p => p.tags || []))];
  const filtered = filter === 'All' ? problems : problems.filter(p => (p.tags || []).includes(filter));

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-blue-50 to-white text-gray-800">

      
      {/* Hero Section */}
      <Navbar />
      
 

      {/* Available Problems Section */}
      <section className="mt-12 px-6 md:px-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Available Problems</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="text-gray-500 italic">No problems available.</p>
          ) : (
            filtered.map(problem => (
              <div key={problem._id} className="border rounded p-4 shadow-sm bg-white hover:shadow-md">
                <h3 className="font-semibold text-lg">{problem.title}</h3>
                <div className="text-sm text-gray-500 mb-2">Difficulty: 
                  <span className={`ml-2 font-medium ${
                    problem.difficulty === 'Easy' ? 'text-green-600' :
                    problem.difficulty === 'Medium' ? 'text-yellow-600' :
                    problem.difficulty === 'Hard' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {(problem.tags || []).map(tag => (
                    <span key={tag} className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 mr-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (isLoggedIn) {
                      navigate(`/problems/${problem._id}`);
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="mt-2 text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
                >
                  Solve
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t mt-16">
        © {new Date().getFullYear()} AlgoJudge. Practice. Submit. Improve.
      </footer>
    </div>
  );
}
