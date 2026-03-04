import { useState, useEffect } from 'react';
import { Phone, X, Info, Calendar, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:3000';

const fmt = (d) => d.toISOString().split('T')[0];
const todayDate = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOfMonth(year, month) { return (new Date(year, month, 1).getDay() + 6) % 7; }

function EquipmentCard({ equipment, user }) {
  const [imgError, setImgError]     = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rentOpen, setRentOpen]     = useState(false);

  const now = new Date();
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate]     = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  const [bookedRanges, setBookedRanges] = useState([]);
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const imgSrc = equipment.image
    ? equipment.image.startsWith('http') ? equipment.image : `${API}${equipment.image}`
    : null;
  const showFallback = !imgSrc || imgError;

  const loadBooked = async () => {
    try {
      const res = await axios.get(`/rentals/equipment/${equipment.id}`);
      setBookedRanges(res.data.map(r => ({
        start: new Date(r.start_date + 'T00:00:00'),
        end:   new Date(r.end_date   + 'T00:00:00'),
      })));
    } catch {}
  };

  useEffect(() => { if (rentOpen) loadBooked(); }, [rentOpen]);

  const isPast   = (d) => d < todayDate();
  const isBooked = (d) => bookedRanges.some(r => d >= r.start && d <= r.end);

  const getDayStatus = (d) => {
    if (isBooked(d)) return 'booked';
    const rangeEnd = endDate || hoverDate;
    if (startDate && d.getTime() === startDate.getTime()) return 'selected';
    if (rangeEnd   && d.getTime() === rangeEnd.getTime())   return 'selected';
    if (startDate && rangeEnd && d > startDate && d < rangeEnd) return 'inrange';
    return 'free';
  };

  const handleDayClick = (d) => {
    if (isPast(d) || isBooked(d)) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(d); setEndDate(null); setError('');
    } else {
      if (d <= startDate) { setStartDate(d); setEndDate(null); return; }
      const cur = new Date(startDate);
      while (cur <= d) {
        if (isBooked(cur)) { setError('A kijelölt tartományban foglalt nap van.'); return; }
        cur.setDate(cur.getDate() + 1);
      }
      setEndDate(d); setError('');
    }
  };

  const handleSubmit = async () => {
    if (!user) { setError('A bérléshez be kell jelentkezni.'); return; }
    if (!startDate || !endDate) { setError('Jelölj ki kezdő és záró dátumot.'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/rentals', {
        equipment_id: equipment.id,
        start_date: fmt(startDate),
        end_date:   fmt(endDate),
        notes: notes.trim() || null,
      });
      setSuccess('Bérlési kérelem elküldve! Hamarosan visszajelzünk.');
      setStartDate(null); setEndDate(null); setNotes('');
      loadBooked();
    } catch (err) {
      setError(err.response?.data?.error || 'Hiba történt, próbáld újra.');
    } finally { setLoading(false); }
  };

  const closeRent = () => {
    setRentOpen(false); setStartDate(null); setEndDate(null);
    setNotes(''); setError(''); setSuccess('');
  };

  const DAYS   = ['H','K','Sz','Cs','P','Sz','V'];
  const MONTHS = ['Január','Február','Március','Április','Május','Június',
                  'Július','Augusztus','Szeptember','Október','November','December'];

  const renderCalendar = () => {
    const days   = daysInMonth(calYear, calMonth);
    const offset = firstDayOfMonth(calYear, calMonth);
    const cells  = [];
    for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= days; d++) {
      const date   = new Date(calYear, calMonth, d);
      const past   = isPast(date);
      const status = past ? 'past' : getDayStatus(date);
      cells.push(
        <button
          key={d}
          className={`cal__day cal__day--${status}`}
          onClick={() => handleDayClick(date)}
          onMouseEnter={() => startDate && !endDate && setHoverDate(date)}
          onMouseLeave={() => setHoverDate(null)}
          disabled={past || status === 'booked'}
        >
          {d}
        </button>
      );
    }
    return cells;
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); }
    else setCalMonth(m => m-1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); }
    else setCalMonth(m => m+1);
  };

  return (
    <>
      {/* KÁRTYA */}
      <div className="card card--hover" onClick={() => setDetailOpen(true)} style={{ cursor:'pointer' }}>
        <div className="card__img-wrap">
          {showFallback
            ? <div className="card__img-fallback">🚜</div>
            : <img src={imgSrc} alt={equipment.name} onError={() => setImgError(true)} />}
        </div>
        <div className="card__body">
          <div className="card__title">{equipment.name}</div>
          <p className="card__text" style={{ display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {equipment.description}
          </p>
        </div>
        <div className="card__footer">
          <Phone size={15} color="var(--accent)" />
          <span><span className="card__footer-label">Elérhetőség&nbsp;</span>{equipment.contact}</span>
          <Info size={14} color="var(--text-dim)" style={{ marginLeft:'auto' }} />
        </div>
      </div>

      {/* RÉSZLET MODAL */}
      {detailOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDetailOpen(false)}>
          <div className="modal equipment-modal">
            <button className="equipment-modal__close" onClick={() => setDetailOpen(false)}>
              <X size={20} />
            </button>
            <div className="equipment-modal__img-wrap">
              {showFallback
                ? <div className="equipment-modal__img-fallback">🚜</div>
                : <img src={imgSrc} alt={equipment.name} className="equipment-modal__img" />}
            </div>
            <div className="equipment-modal__body">
              <h2 className="equipment-modal__title">{equipment.name}</h2>
              <div className="equipment-modal__section">
                <span className="equipment-modal__label">Leírás</span>
                <p className="equipment-modal__desc">{equipment.description}</p>
              </div>
              <div className="equipment-modal__section">
                <span className="equipment-modal__label">Elérhetőség</span>
                <div className="equipment-modal__contact">
                  <Phone size={16} color="var(--accent)" />
                  <span>{equipment.contact}</span>
                </div>
              </div>
              <button
                className="btn btn--primary"
                style={{ width:'100%', marginTop:20 }}
                onClick={() => { setDetailOpen(false); setRentOpen(true); }}
              >
                <Calendar size={16} />
                Időpontfoglalás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BÉRLÉS MODAL */}
      {rentOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeRent()}>
          <div className="modal rental-modal">
            <div className="modal__header">
              <span className="modal__title">
                <Calendar size={16} style={{ marginRight:8, verticalAlign:'middle' }} />
                Időpontfoglalás — {equipment.name}
              </span>
              <button className="btn btn--ghost btn--sm" onClick={closeRent}><X size={18} /></button>
            </div>

            <div className="modal__body">
              {error   && <div className="alert alert--danger">{error}</div>}
              {success ? (
                <div className="alert alert--success" style={{ display:'flex', alignItems:'center', gap:8, padding:'20px 16px' }}>
                  <CheckCircle size={20} />
                  <span>{success}</span>
                </div>
              ) : (
                <>
                  <div className="cal__legend">
                    <span className="cal__legend-item"><span className="cal__dot cal__dot--free" />Szabad</span>
                    <span className="cal__legend-item"><span className="cal__dot cal__dot--selected" />Kijelölt</span>
                    <span className="cal__legend-item"><span className="cal__dot cal__dot--booked" />Foglalt</span>
                  </div>

                  <div className="cal__nav">
                    <button className="cal__nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
                    <span className="cal__nav-title">{MONTHS[calMonth]} {calYear}</span>
                    <button className="cal__nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
                  </div>

                  <div className="cal__grid">
                    {DAYS.map(d => <div key={d} className="cal__header-day">{d}</div>)}
                    {renderCalendar()}
                  </div>

                  <div className="cal__selection">
                    <div className="cal__selection-item">
                      <span className="cal__selection-label">Kezdő dátum</span>
                      <span className="cal__selection-value">
                        {startDate ? startDate.toLocaleDateString('hu-HU') : '—'}
                      </span>
                    </div>
                    <div className="cal__selection-arrow">→</div>
                    <div className="cal__selection-item">
                      <span className="cal__selection-label">Záró dátum</span>
                      <span className="cal__selection-value">
                        {endDate ? endDate.toLocaleDateString('hu-HU') : '—'}
                      </span>
                    </div>
                  </div>

                  {startDate && endDate && (
                    <div className="form-group" style={{ marginTop:16 }}>
                      <label className="form-label">Megjegyzés (opcionális)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="pl. szállítás szükséges, egyéb igény..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {!success && (
              <div className="modal__footer">
                <button className="btn btn--outline" onClick={closeRent}>Mégse</button>
                <button
                  className="btn btn--primary"
                  onClick={handleSubmit}
                  disabled={!startDate || !endDate || loading}
                >
                  {loading ? 'Küldés...' : 'Bérlési kérelem küldése'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default EquipmentCard;