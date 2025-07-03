// src/pages/Login.jsx
import React from 'react';
import AuthForm from '../components/AuthForm';

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <AuthForm mode="login" />
    </div>
  );
}
