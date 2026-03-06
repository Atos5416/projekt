import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar, ChevronLeft, ChevronRight, X, Edit2, Trash2,
  CheckCircle, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

const fmt    = (d) => new Date(d + 'T00:00:00').toLocaleDateString('hu-HU');
const fmtISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayD = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y, m)    { return (new Date(y, m, 1).getDay() + 6) % 7; }

const STATUS_META = {
  pending:   { label: 'Függőben',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  active:    { label: 'Aktív',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle },
  completed: { label: 'Befejezett', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: CheckCircle },
};

function DatePicker({ label, value, onChange, bookedRanges = [] }) {
  const init  = value ? new Date(value + 'T00:00:00') : new Date();
  const [year, setYear]   = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [open, setOpen]   = useState(false);

  const selected = value ? new Date(value + 'T00:00:00') : null;
  const isBooked = (d) => bookedRanges.some(r => d >= r.start && d <= r.end);
  const isPast   = (d) => d < todayD();

  const DAYS   = ['H','K','Sz','Cs','P','Sz','V'];
  const MONTHS = ['Jan','Feb','Már','Ápr','Máj','Jún','Júl','Aug','Sze','Okt','Nov','Dec'];

  const cells = [];
  const off   = firstDay(year, month);
  const days  = daysInMonth(year, month);
  for (let i = 0; i < off; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= days; d++) {
    const date   = new Date(year, month, d);
    const past   = isPast(date);
    const booked = isBooked(date);
    const sel    = selected && date.getTime() === selected.getTime();
    cells.push(
      <button key={d}
        className={`cal__day cal__day--${sel ? 'selected' : past || booked ? 'past' : 'free'}`}
        style={{ fontSize: 12 }}
        disabled={past || booked}
        onClick={() => { onChange(fmtISO(date)); setOpen(false); }}
      >{d}</button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <button type="button" className="form-control"
        style={{ textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
        onClick={() => setOpen(o => !o)}
      >
        <Calendar size={14} color="var(--accent)" />
        {value ? fmt(value) : 'Válassz dátumot'}
      </button>
      {open && (
        <div style={{
          position:'absolute', zIndex:300, top:'calc(100% + 6px)', left:0,
          background:'var(--bg-card)', border:'1px solid var(--border)',
          padding:14, minWidth:260, boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div className="cal__nav" style={{ marginBottom:8 }}>
            <button className="cal__nav-btn" onClick={() => {
              if (month===0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1);
            }}><ChevronLeft size={14}/></button>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:'uppercase' }}>
              {MONTHS[month]} {year}
            </span>
            <button className="cal__nav-btn" onClick={() => {
              if (month===11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1);
            }}><ChevronRight size={14}/></button>
          </div>
          <div className="cal__grid" style={{ gap:2 }}>
            {DAYS.map(d => <div key={d} className="cal__header-day" style={{ fontSize:10 }}>{d}</div>)}
            {cells}
          </div>
        </div>
      )}
    </div>
  );
}

function RentalsPage({ user }) {
  const [rentals, setRentals]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [filterStatus, setFilter]     = useState('all');

  const [editRental, setEditRental]   = useState(null);
  const [editStart, setEditStart]     = useState('');
  const [editEnd, setEditEnd]         = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/rentals');
      setRentals(res.data);
    } catch {
      setError('Nem sikerült betölteni a bérléseket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const flashErr = (msg) => { setError(msg); setTimeout(() => setError(''), 3000); };

  // Inline státusz változtatás
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.post(`/rentals/${id}/status`, { status: newStatus });
      setRentals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      flash('Státusz módosítva.');
    } catch (err) {
      flashErr(err.response?.data?.error || 'Nem sikerült módosítani.');
    }
  };

  // Törlés – véglegesen az adatbázisból
  const handleDelete = async (id) => {
    if (!confirm('Biztosan törlöd ezt a bérlést? Ez nem visszavonható.')) return;
    try {
      await axios.delete(`/rentals/${id}`);
      setRentals(prev => prev.filter(r => r.id !== id));
      flash('Bérlés törölve.');
    } catch {
      flashErr('A törlés nem sikerült.');
    }
  };

  // Szerkesztés megnyitása
  const openEdit = async (r) => {
    setEditRental(r);
    setEditStart(r.start_date);
    setEditEnd(r.end_date);
    setEditError('');
    try {
      const res = await axios.get(`/rentals/equipment/${r.equipment_id}`);
      setBookedRanges(
        res.data
          .filter(b => b.id !== r.id)
          .map(b => ({
            start: new Date(b.start_date + 'T00:00:00'),
            end:   new Date(b.end_date   + 'T00:00:00'),
          }))
      );
    } catch { setBookedRanges([]); }
  };

  // Dátum mentése
  const handleSave = async () => {
    if (!editStart || !editEnd) { setEditError('Mindkét dátum megadása kötelező.'); return; }
    const s = new Date(editStart + 'T00:00:00');
    const e = new Date(editEnd   + 'T00:00:00');
    if (e <= s) { setEditError('A záró dátumnak a kezdő után kell lennie.'); return; }

    setEditLoading(true); setEditError('');
    try {
      const dateChanged = editStart !== editRental.start_date || editEnd !== editRental.end_date;
      if (dateChanged) {
        await axios.delete(`/rentals/${editRental.id}`);
        await axios.post('/rentals', {
          equipment_id: editRental.equipment_id,
          start_date:   editStart,
          end_date:     editEnd,
          notes:        editRental.notes,
        });
      }
      setEditRental(null);
      flash('Dátum sikeresen módosítva.');
      load();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Hiba történt.');
    } finally {
      setEditLoading(false);
    }
  };

  const FILTERS = ['all', 'pending', 'active', 'completed'];
  const filtered = filterStatus === 'all' ? rentals : rentals.filter(r => r.status === filterStatus);
  const counts   = rentals.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <main className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-header__top">
            <h1 className="page-title">Bérlések kezelése</h1>
            <button className="btn btn--outline btn--sm" onClick={load}>
              <RefreshCw size={14} /> Frissítés
            </button>
          </div>
        </div>

        {error   && <div className="alert alert--danger">{error}</div>}
        {success && <div className="alert alert--success">{success}</div>}

        {/* Összesítő kártyák */}
        <div className="rentals-summary">
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key}
                className={`summary-card${filterStatus === key ? ' summary-card--active' : ''}`}
                style={{ '--card-color': meta.color }}
                onClick={() => setFilter(filterStatus === key ? 'all' : key)}
              >
                <Icon size={20} color={meta.color} />
                <div>
                  <div className="summary-card__count">{counts[key] || 0}</div>
                  <div className="summary-card__label">{meta.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Szűrő */}
        <div className="filter-bar">
          {FILTERS.map(s => (
            <button key={s}
              className={`btn btn--sm ${filterStatus === s ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all'
                ? `Összes (${rentals.length})`
                : `${STATUS_META[s]?.label}${counts[s] ? ` (${counts[s]})` : ''}`}
            </button>
          ))}
        </div>

        {/* Táblázat */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="card">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Gép</th>
                    <th>Bérlő</th>
                    <th>Időszak</th>
                    <th>Státusz</th>
                    <th>Megjegyzés</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ color:'var(--text-dim)', fontSize:13 }}>#{r.id}</td>
                      <td><strong style={{ fontSize:14 }}>{r.equipment_name}</strong></td>
                      <td>
                        <div style={{ fontSize:13 }}>{r.username}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize:13, whiteSpace:'nowrap' }}>
                          <span style={{ color:'var(--accent)', fontWeight:600 }}>{fmt(r.start_date)}</span>
                          <span style={{ color:'var(--text-dim)', margin:'0 6px' }}>→</span>
                          <span style={{ color:'var(--text-muted)' }}>{fmt(r.end_date)}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          className="role-select"
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          style={{
                            color: STATUS_META[r.status]?.color || 'var(--text-muted)',
                            borderColor: STATUS_META[r.status]?.color || 'var(--border-light)',
                          }}
                        >
                          <option value="pending">Függőben</option>
                          <option value="active">Aktív</option>
                          <option value="completed">Befejezett</option>
                        </select>
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:160 }}>
                        {r.notes || <span style={{ color:'var(--text-dim)' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn--outline btn--sm" onClick={() => openEdit(r)} title="Dátum szerkesztése">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn--danger btn--sm" onClick={() => handleDelete(r.id)} title="Törlés">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state__icon">📋</div>
                  <p className="empty-state__text">
                    {filterStatus === 'all' ? 'Még nincs bérlés' : 'Nincs ilyen státuszú bérlés'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DÁTUM SZERKESZTŐ MODAL */}
      {editRental && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditRental(null)}>
          <div className="modal" style={{ maxWidth:500 }}>
            <div className="modal__header">
              <span className="modal__title">
                <Edit2 size={15} style={{ marginRight:8, verticalAlign:'middle' }} />
                Dátum szerkesztése — #{editRental.id}
              </span>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditRental(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal__body">
              {editError && <div className="alert alert--danger">{editError}</div>}

              <div style={{
                padding:'10px 14px', background:'var(--bg-elevated)',
                border:'1px solid var(--border)', marginBottom:20,
                fontSize:13, color:'var(--text-muted)',
              }}>
                <strong style={{ color:'var(--text)' }}>{editRental.equipment_name}</strong>
                <span style={{ margin:'0 8px', color:'var(--text-dim)' }}>·</span>
                {editRental.username}
                <span style={{ margin:'0 8px', color:'var(--text-dim)' }}>·</span>
                {editRental.email}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <DatePicker label="Kezdő dátum" value={editStart} onChange={setEditStart} bookedRanges={bookedRanges} />
                <DatePicker label="Záró dátum"  value={editEnd}   onChange={setEditEnd}   bookedRanges={bookedRanges} />
              </div>

              <div style={{
                marginTop:16, padding:'10px 14px',
                background:'rgba(245,158,11,0.07)',
                border:'1px solid rgba(245,158,11,0.2)',
                fontSize:12, color:'var(--text-muted)',
                display:'flex', gap:8, alignItems:'flex-start',
              }}>
                <AlertCircle size={14} color="var(--accent)" style={{ flexShrink:0, marginTop:1 }} />
                Ha a dátumot módosítod, a régi bérlés törlésre kerül és egy új jön létre az új időponttal.
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setEditRental(null)} disabled={editLoading}>Mégse</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={editLoading}>
                {editLoading ? 'Mentés...' : 'Dátum mentése'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default RentalsPage;