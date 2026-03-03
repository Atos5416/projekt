import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Shield } from 'lucide-react';

function UsersPage({ user }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user]);

  const load = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch {
      setError('Nem sikerült betölteni a felhasználókat.');
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Biztosan törlöd ezt a felhasználót?')) return;
    try {
      await axios.delete(`/users/${id}`);
      flash('Felhasználó törölve.');
      load();
    } catch (err) {
      flash(err.response?.data?.error || 'A törlés nem sikerült.', true);
    }
  };

  const handleRole = async (id, role) => {
    try {
      await axios.post(`/users/${id}/role`, { role });
      flash(`Szerepkör módosítva: ${role === 'admin' ? 'Admin' : 'Felhasználó'}`);
      load();
    } catch (err) {
      flash(err.response?.data?.error || 'Hiba a módosításnál.', true);
    }
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner" />
            Betöltés...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-header__top">
            <h1 className="page-title">Felhasználók</h1>
            <span className="section-count">{users.length} fiók</span>
          </div>
        </div>

        {error && <div className="alert alert--danger">{error}</div>}
        {success && <div className="alert alert--success">{success}</div>}

        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Felhasználó</th>
                  <th>Email</th>
                  <th>Szerepkör</th>
                  <th>Regisztrálva</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>#{u.id}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{u.username}</span>
                      {u.id === user.id && (
                        <span className="badge badge--me" style={{ marginLeft: 8 }}>Te</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</span>
                    </td>
                    <td>
                      <select
                        className="role-select"
                        value={u.role}
                        onChange={(e) => handleRole(u.id, e.target.value)}
                        disabled={u.id === user.id}
                      >
                        <option value="user">Felhasználó</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {new Date(u.created_at).toLocaleDateString('hu-HU')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === user.id}
                        title="Törlés"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__icon">👤</div>
                <p className="empty-state__text">Nincsenek felhasználók</p>
              </div>
            )}
          </div>
        </div>

        <div className="perm-box">
          <div className="perm-box__title">
            <Shield size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Jogosultságok
          </div>
          <div className="perm-row">
            <span className="badge badge--user">Felhasználó</span>
            <p>Megtekintheti a gépeket, bérlési kérelmet adhat le.</p>
          </div>
          <div className="perm-row">
            <span className="badge badge--admin">Admin</span>
            <p>Teljes hozzáférés: gépek és felhasználók kezelése, bérlések jóváhagyása.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default UsersPage;