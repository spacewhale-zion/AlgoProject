// src/services/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // change if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authorization header is set in AuthContext on login
export default instance;
