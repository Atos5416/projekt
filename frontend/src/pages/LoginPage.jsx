import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';

function LoginPage({ login }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      // Hibás jelszó vagy email esetén csak a jelszót töröljük, az emailt megtartjuk
      setPassword('');
      const status = err.response?.status;
      if (status === 401 || status === 400) {
        setError('Hibás email cím vagy jelszó.');
      } else {
        setError(err.response?.data?.error || 'Nem sikerült bejelentkezni, próbáld újra.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="container">
        <div className="form-card">
          <div className="form-card__header">
            <div className="form-card__icon">
              <LogIn size={22} strokeWidth={2.5} />
            </div>
            <div className="form-card__title">Belépés</div>
            <div className="form-card__sub">Jelentkezz be a fiókodba</div>
          </div>

          {error && <div className="alert alert--danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email cím</label>
              <input
                className="form-control"
                type="email"
                placeholder="pelda@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jelszó</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              className="btn btn--primary btn--lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {loading ? 'Belépés...' : 'Belépés'}
            </button>
          </form>

          <hr className="divider" />

          <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>
            Még nincs fiókod?{' '}
            <Link to="/register" className="link">Regisztrálj itt</Link>
          </p>

          <div className="demo-box">
            <div className="demo-box__label">Demo admin fiók</div>
            <div className="demo-box__row"><strong>Email:</strong> admin@nehezgep.hu</div>
            <div className="demo-box__row"><strong>Jelszó:</strong> admin123</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;