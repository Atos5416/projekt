import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import UsersPage from './pages/UsersPage';

axios.defaults.baseURL = 'http://localhost:3000/api';

// Token csatolása minden kéréshez
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Csak valóban lejárt/érvénytelen token esetén jelent ki (401)
// 403-at NEM kezeljük itt – az csak "nincs jogosultság" és nem kijelentkezés
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    axios.get('/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="fullpage-loader">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} logout={logout} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/login" element={<LoginPage login={login} />} />
        <Route path="/register" element={<RegisterPage login={login} />} />
        <Route path="/admin" element={<AdminPage user={user} />} />
        <Route path="/users" element={<UsersPage user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;