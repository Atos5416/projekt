import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const API = 'http://localhost:3000';

function AdminPage({ user }) {
  const [equipment, setEquipment] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', contact: '', image: null });
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user]);

  const load = async () => {
    try {
      const res = await axios.get('/equipment');
      setEquipment(res.data);
    } catch {
      setError('Nem sikerült betölteni a gépeket.');
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openNew = () => {
    setForm({ name: '', description: '', contact: '', image: null });
    setFileName('');
    setEditingId(null);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setForm({ name: item.name, description: item.description, contact: item.contact, image: null });
    setFileName('');
    setEditingId(item.id);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ name: '', description: '', contact: '', image: null });
    setFileName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = new FormData();
    data.append('name', form.name.trim());
    data.append('description', form.description.trim());
    data.append('contact', form.contact.trim());
    if (form.image instanceof File) data.append('image', form.image);

    try {
      if (editingId) {
        await axios.put(`/equipment/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Gép sikeresen módosítva.');
      } else {
        await axios.post('/equipment', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Gép hozzáadva.');
      }
      closeModal();
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Hiba történt.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Biztosan törlöd ezt: ${name}?`)) return;
    try {
      await axios.delete(`/equipment/${id}`);
      setSuccess('Gép törölve.');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('A törlés nem sikerült.');
    }
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  return (
    <main className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-header__top">
            <h1 className="page-title">Gépkezelés</h1>
            <button className="btn btn--primary" onClick={openNew}>
              <Plus size={16} />
              Új gép
            </button>
          </div>
        </div>

        {error && <div className="alert alert--danger">{error}</div>}
        {success && <div className="alert alert--success">{success}</div>}

        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kép</th>
                  <th>Név</th>
                  <th>Leírás</th>
                  <th>Elérhetőség</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => {
                  const imgSrc = item.image?.startsWith('http')
                    ? item.image
                    : `${API}${item.image}`;
                  return (
                    <tr key={item.id}>
                      <td>
                        {item.image ? (
                          <img
                            className="thumb"
                            src={imgSrc}
                            alt={item.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="thumb-fallback"
                          style={{ display: item.image ? 'none' : 'flex' }}
                        >
                          🚜
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: 14 }}>{item.name}</strong>
                      </td>
                      <td style={{ maxWidth: 260 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {item.description.length > 70
                            ? item.description.slice(0, 70) + '...'
                            : item.description}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>{item.contact}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn--outline btn--sm"
                            onClick={() => openEdit(item)}
                            title="Szerkesztés"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Törlés"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {equipment.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__icon">🔧</div>
                <p className="empty-state__text">Még nincs felvett gép</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal__header">
              <span className="modal__title">
                {editingId ? 'Gép szerkesztése' : 'Új gép felvétele'}
              </span>
              <button className="btn btn--ghost btn--sm" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {error && <div className="alert alert--danger">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Gép neve *</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="pl. CAT 320D Lánctalpas Kotrógép"
                    value={form.name}
                    onChange={set('name')}
                    required
                    minLength={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Leírás *</label>
                  <textarea
                    className="form-control"
                    placeholder="Részletes leírás a gépről..."
                    value={form.description}
                    onChange={set('description')}
                    required
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Elérhetőség *</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="pl. +36 30 123 4567"
                    value={form.contact}
                    onChange={set('contact')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kép feltöltése</label>
                  <div className="file-input-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          setForm((prev) => ({ ...prev, image: f }));
                          setFileName(f.name);
                        }
                      }}
                    />
                    <div className={`file-input-display${fileName ? ' has-file' : ''}`}>
                      {fileName || 'Kattints a fájl kiválasztásához — max. 5 MB'}
                    </div>
                  </div>
                  <p className="form-hint">JPG, PNG, GIF, WebP formátumok támogatottak</p>
                </div>
              </div>

              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Mégse
                </button>
                <button className="btn btn--primary" type="submit" disabled={loading}>
                  {loading
                    ? 'Mentés...'
                    : editingId
                    ? 'Módosítás mentése'
                    : 'Gép hozzáadása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminPage;
