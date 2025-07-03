// src/services/auth.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/auth'; // change if needed

export const loginUser = (data) =>
  axios.post(`${BASE_URL}/login`, data).then((res) => res.data);

export const registerUser = (data) =>
  axios.post(`${BASE_URL}/register`, data).then((res) => res.data);
