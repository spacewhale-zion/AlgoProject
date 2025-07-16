// src/services/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`, // change if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authorization header is set in AuthContext on login
export default instance;
