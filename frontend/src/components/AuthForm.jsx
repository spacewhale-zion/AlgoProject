// src/components/AuthForm.jsx
import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/auth';

export default function AuthForm({ mode }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const fn = isLogin ? loginUser : registerUser;
      const payload = { ...formData };
      if (formData.role === 'admin') {
        payload.adminKey = adminKey;
      }

      const res = await fn(payload);
      localStorage.setItem('token', res.token);
      login(res.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md p-8 w-full max-w-md rounded-md"
    >
      <h2 className="text-2xl font-bold text-center mb-6">
        {isLogin ? 'Login' : 'Register'}
      </h2>

      {!isLogin && (
        <>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === 'admin' && (
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">Admin Access Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
            </div>
          )}
        </>
      )}

      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium">Email</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1 text-sm font-medium">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
      >
        {isLogin ? 'Login' : 'Register'}
      </button>

      <div className="text-sm text-center mt-4">
        {isLogin ? (
          <>Don't have an account? <a href="/register" className="text-blue-600 underline">Register</a></>
        ) : (
          <>Already have an account? <a href="/login" className="text-blue-600 underline">Login</a></>
        )}
      </div>
    </form>
  );
}
