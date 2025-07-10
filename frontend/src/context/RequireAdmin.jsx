import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const RequireAdmin = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>; 
  console.log('RequireAdmin user:', user);

  return user?.role === 'admin' ? children : <Navigate to="/" />;
};

export default RequireAdmin;
