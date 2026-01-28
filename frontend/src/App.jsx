import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import NavigationBar from './components/Navbar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import UsersPage from './pages/UsersPage';

const API_URL = 'http://localhost:3000/api';

// Axios globális konfiguráció
axios.defaults.baseURL = API_URL;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - automatikus kijelentkezés lejárt token esetén
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token lejárt vagy érvénytelen
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get('/me');
        console.log('✅ User authenticated:', res.data);
        setUser(res.data);
      } catch (err) {
        console.log('❌ Auth failed:', err.response?.data?.error || err.message);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = (token, userData) => {
    console.log('🔐 Login successful:', userData);
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    console.log('👋 Logout');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Betöltés...</span>
          </div>
          <p className="mt-3 text-white">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <NavigationBar user={user} logout={logout} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage login={login} />} />
          <Route path="/register" element={<RegisterPage login={login} />} />
          <Route path="/admin" element={<AdminPage user={user} />} />
          <Route path="/users" element={<UsersPage user={user} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;