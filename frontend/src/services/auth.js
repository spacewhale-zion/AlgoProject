// src/services/auth.js
import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/auth`; // change if needed

export const loginUser = (data) =>
  axios.post(`${BASE_URL}/login`, data).then((res) => res.data);

export const registerUser = (data) =>
  axios.post(`${BASE_URL}/register`, data).then((res) => res.data);
