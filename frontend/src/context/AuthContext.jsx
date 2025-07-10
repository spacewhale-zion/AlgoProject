import React, { createContext, useState, useEffect } from 'react';
import axios from '../services/axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false); // no token, nothing to fetch
        return;
      }
  
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        jwtDecode(token); // validate
        const res = await axios.get('/users/me');
        setUser(res.data);
      } catch {
        logout();
      } finally {
        setLoading(false); // always stop loading
      }
    };
  
    fetchUser();
  }, [token]);
  
  console.log(user)

  const login = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ token,loading, user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
