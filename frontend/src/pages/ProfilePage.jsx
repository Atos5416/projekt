import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Lock, Calendar, CheckCircle, Clock,
  ChevronRight, Save, Eye, EyeOff, RefreshCw
} from 'lucide-react';

const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('hu-HU');

const STATUS_META = {
  pending:   { label: 'Függőben',   color: '#f59e0b', cls: 'badge--pending' },
  active:    { label: 'Aktív',      color: '#22c55e', cls: 'badge--active' },
  completed: { label: 'Befejezett', color: '#3b82f6', cls: 'badge--completed' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, cls: 'badge--user' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

function ProfilePage({ user, setUser }) {
  // Bérlések
  const [rentals, setRentals]     = useState([]);
  const [rentLoading, setRentLoading] = useState(true);
  const [rentError, setRentError] = useState('');

  // Profil szerkesztés
  const [username, setUsername]   = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Jelszócsere
  const [oldPass, setOldPass]     = useState('');
  const [newPass, setNewPass]     = useState('');
  const [newPass2, setNewPass2]   = useState('');
  const [showOld, setShowOld]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [passMsg, setPassMsg]     = useState({ type: '', text: '' });
  const [passLoading, setPassLoading] = useState(false);

  if (!user) return <Navigate to="/login" />;

  useEffect(() => {
    setUsername(user.username || '');
    loadRentals();
  }, [user]);

  const loadRentals = async () => {
    setRentLoading(true);
    try {
      const res = await axios.get('/rentals/my');
      setRentals(res.data);
    } catch {
      setRentError('Nem sikerült betölteni a bérléseket.');
    } finally {
      setRentLoading(false);
    }
  };

  // Profil mentése (csak username)
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setProfileMsg({ type: 'danger', text: 'A felhasználónév nem lehet üres.' }); return; }
    if (username.trim() === user.username) { setProfileMsg({ type: 'warning', text: 'Nem változtattál semmit.' }); return; }

    setProfileLoading(true); setProfileMsg({ type: '', text: '' });
    try {
      const res = await axios.put('/me', { username: username.trim() });
      setUser(res.data);
      setProfileMsg({ type: 'success', text: 'Felhasználónév sikeresen frissítve.' });
    } catch (err) {
      setProfileMsg({ type: 'danger', text: err.response?.data?.error || 'Hiba történt.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Jelszócsere
  const handlePassSave = async (e) => {
    e.preventDefault();
    if (!oldPass || !newPass || !newPass2) { setPassMsg({ type: 'danger', text: 'Minden mező kitöltése kötelező.' }); return; }
    if (newPass !== newPass2) { setPassMsg({ type: 'danger', text: 'A két jelszó nem egyezik.' }); return; }
    if (newPass.length < 6) { setPassMsg({ type: 'danger', text: 'Az új jelszónak legalább 6 karakter.' }); return; }

    setPassLoading(true); setPassMsg({ type: '', text: '' });
    try {
      await axios.put('/me', { old_password: oldPass, new_password: newPass });
      setPassMsg({ type: 'success', text: 'Jelszó sikeresen megváltoztatva.' });
      setOldPass(''); setNewPass(''); setNewPass2('');
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.error || 'Hiba történt.' });
    } finally {
      setPassLoading(false);
    }
  };

  // Bérlés lemondása (pending-et törölheti a felhasználó)
  const handleCancelRental = async (id) => {
    if (!confirm('Biztosan lemondod ezt a bérlést?')) return;
    try {
      await axios.delete(`/rentals/${id}`);
      setRentals(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setRentError(err.response?.data?.error || 'Nem sikerült lemondani.');
      setTimeout(() => setRentError(''), 3000);
    }
  };

  // Statisztikák
  const stats = {
    total:     rentals.length,
    active:    rentals.filter(r => r.status === 'active').length,
    pending:   rentals.filter(r => r.status === 'pending').length,
    completed: rentals.filter(r => r.status === 'completed').length,
  };

  return (
    <main className="page">
      <div className="container">

        {/* Fejléc */}
        <div className="page-header">
          <div className="page-header__top">
            <h1 className="page-title">Profilom</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`badge ${user.role === 'admin' ? 'badge--admin' : 'badge--user'}`}>
                {user.role === 'admin' ? 'Admin' : 'Felhasználó'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="profile-layout">

          {/* BAL OLDAL – beállítások */}
          <div className="profile-sidebar">

            {/* Felhasználónév */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="profile-card-header">
                <User size={16} color="var(--accent)" />
                <span>Felhasználói adatok</span>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {profileMsg.text && (
                  <div className={`alert alert--${profileMsg.type}`}>{profileMsg.text}</div>
                )}
                <form onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label className="form-label">Email cím</label>
                    <input className="form-control" value={user.email} disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                    <span className="form-hint">Az email cím nem módosítható.</span>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Felhasználónév</label>
                    <input
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Felhasználónév"
                    />
                  </div>
                  <button
                    className="btn btn--primary btn--sm"
                    type="submit"
                    disabled={profileLoading}
                    style={{ marginTop: 16 }}
                  >
                    <Save size={13} />
                    {profileLoading ? 'Mentés...' : 'Mentés'}
                  </button>
                </form>
              </div>
            </div>

            {/* Jelszócsere */}
            <div className="card">
              <div className="profile-card-header">
                <Lock size={16} color="var(--accent)" />
                <span>Jelszó megváltoztatása</span>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {passMsg.text && (
                  <div className={`alert alert--${passMsg.type}`}>{passMsg.text}</div>
                )}
                <form onSubmit={handlePassSave}>
                  <div className="form-group">
                    <label className="form-label">Jelenlegi jelszó</label>
                    <div className="pass-wrap">
                      <input
                        className="form-control"
                        type={showOld ? 'text' : 'password'}
                        value={oldPass}
                        onChange={(e) => setOldPass(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button type="button" className="pass-eye" onClick={() => setShowOld(v => !v)}>
                        {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Új jelszó</label>
                    <div className="pass-wrap">
                      <input
                        className="form-control"
                        type={showNew ? 'text' : 'password'}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="min. 6 karakter"
                      />
                      <button type="button" className="pass-eye" onClick={() => setShowNew(v => !v)}>
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Új jelszó megerősítése</label>
                    <input
                      className="form-control"
                      type="password"
                      value={newPass2}
                      onChange={(e) => setNewPass2(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    className="btn btn--outline btn--sm"
                    type="submit"
                    disabled={passLoading}
                    style={{ marginTop: 16 }}
                  >
                    <Lock size={13} />
                    {passLoading ? 'Mentés...' : 'Jelszó módosítása'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* JOBB OLDAL – bérlések */}
          <div className="profile-main">

            {/* Stat kártyák */}
            <div className="profile-stats">
              {[
                { label: 'Összes bérlés', value: stats.total,     color: 'var(--text-muted)', icon: Calendar },
                { label: 'Aktív',         value: stats.active,    color: '#22c55e',            icon: CheckCircle },
                { label: 'Függőben',      value: stats.pending,   color: '#f59e0b',            icon: Clock },
                { label: 'Befejezett',    value: stats.completed, color: '#3b82f6',            icon: CheckCircle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="profile-stat-card">
                  <Icon size={18} color={color} />
                  <div>
                    <div className="profile-stat-value" style={{ color }}>{value}</div>
                    <div className="profile-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bérlések lista */}
            <div className="card">
              <div className="profile-card-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} color="var(--accent)" />
                  <span>Bérléseim</span>
                </div>
                <button className="btn btn--ghost btn--sm" onClick={loadRentals}>
                  <RefreshCw size={13} />
                </button>
              </div>

              {rentError && <div className="alert alert--danger" style={{ margin: '0 24px 16px' }}>{rentError}</div>}

              {rentLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                  <div className="spinner" />
                </div>
              ) : rentals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">📋</div>
                  <p className="empty-state__text">Még nincs bérlésed</p>
                  <a href="/" style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <ChevronRight size={13} /> Gépek böngészése
                  </a>
                </div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Gép</th>
                        <th>Kezdés</th>
                        <th>Lejárat</th>
                        <th>Státusz</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.map(r => (
                        <tr key={r.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {r.equipment_image ? (
                                <img
                                  src={r.equipment_image.startsWith('http') ? r.equipment_image : `http://localhost:3000${r.equipment_image}`}
                                  alt={r.equipment_name}
                                  className="thumb"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              ) : (
                                <div className="thumb-fallback">🚜</div>
                              )}
                              <strong style={{ fontSize: 13 }}>{r.equipment_name}</strong>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{fmt(r.start_date)}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmt(r.end_date)}</td>
                          <td><StatusBadge status={r.status} /></td>
                          <td>
                            {r.status === 'pending' && (
                              <button
                                className="btn btn--danger btn--sm"
                                onClick={() => handleCancelRental(r.id)}
                                title="Lemondás"
                              >
                                Lemondás
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
