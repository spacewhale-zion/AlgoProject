import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <nav className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold text-blue-600">AlgoJudge</Link>

      <div className="flex items-center gap-4 text-sm">
        <Link
          to="/leaderboard"
          className="text-gray-700 hover:text-blue-600 font-medium"
        >
          Leaderboard
        </Link>

        {isLoggedIn ? (
          <>
            <div className="text-gray-700 text-right">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Link
              to="/dashboard"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Dashboard
            </Link>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
