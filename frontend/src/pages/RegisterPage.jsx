import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

function RegisterPage({ login }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.username.length < 3) {
      setError('A felhasználónév legalább 3 karakter legyen.');
      return;
    }
    if (form.password.length < 6) {
      setError('A jelszónak legalább 6 karakternek kell lennie.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('A két jelszó nem egyezik.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'A regisztráció nem sikerült.');
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
              <UserPlus size={22} strokeWidth={2.5} />
            </div>
            <div className="form-card__title">Regisztráció</div>
            <div className="form-card__sub">Hozz létre egy új fiókot</div>
          </div>

          {error && <div className="alert alert--danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Felhasználónév</label>
              <input
                className="form-control"
                type="text"
                placeholder="Minimum 3 karakter"
                value={form.username}
                onChange={set('username')}
                required
                minLength={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email cím</label>
              <input
                className="form-control"
                type="email"
                placeholder="pelda@email.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jelszó</label>
              <input
                className="form-control"
                type="password"
                placeholder="Minimum 6 karakter"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jelszó megerősítése</label>
              <input
                className="form-control"
                type="password"
                placeholder="Jelszó újra"
                value={form.confirm}
                onChange={set('confirm')}
                required
              />
            </div>

            <button
              className="btn btn--primary btn--lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {loading ? 'Regisztráció...' : 'Fiók létrehozása'}
            </button>
          </form>

          <hr className="divider" />

          <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
            Már van fiókod?{' '}
            <Link to="/login" className="link">Lépj be itt</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default RegisterPage;
