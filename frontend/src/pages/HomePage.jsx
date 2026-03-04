import { useState, useEffect } from 'react';
import axios from 'axios';
import EquipmentCard from '../components/EquipmentCard';

function HomePage({ user }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/equipment')
      .then((res) => setEquipment(res.data))
      .catch(() => setError('Nem sikerült betölteni a gépeket. Ellenőrizd, hogy a szerver fut-e.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page">
      <div className="container">
        <div className="hero">
          <p className="hero__eyebrow">Nehézgép bérlés — Baranya megye</p>
          <h1 className="hero__title">
            Profi gépek,<br /><em>azonnal elérhető</em>
          </h1>
          <p className="hero__sub">
            Kotrók, rakodók, buldózerek — napi és heti bérlési lehetőséggel.
            Hívj minket, egyeztetünk.
          </p>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            Gépek betöltése...
          </div>
        )}

        {error && (
          <div className="alert alert--danger">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="section-header">
              <span className="section-title">Elérhető gépek</span>
              {equipment.length > 0 && (
                <span className="section-count">{equipment.length} db</span>
              )}
            </div>

            {equipment.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🔧</div>
                <p className="empty-state__text">Jelenleg nincs elérhető gép</p>
              </div>
            ) : (
              <div className="equipment-grid">
                {equipment.map((item) => (
                  <EquipmentCard key={item.id} equipment={item} user={user} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default HomePage;