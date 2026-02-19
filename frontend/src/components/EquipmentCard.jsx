import { useState } from 'react';
import { Phone } from 'lucide-react';

const API = 'http://localhost:3000';

function EquipmentCard({ equipment }) {
  const [imgError, setImgError] = useState(false);

  const imgSrc = equipment.image
    ? equipment.image.startsWith('http')
      ? equipment.image
      : `${API}${equipment.image}`
    : null;

  const showFallback = !imgSrc || imgError;

  return (
    <div className="card card--hover">
      <div className="card__img-wrap">
        {showFallback ? (
          <div className="card__img-fallback">🚜</div>
        ) : (
          <img
            src={imgSrc}
            alt={equipment.name}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="card__body">
        <div className="card__title">{equipment.name}</div>
        <p className="card__text">{equipment.description}</p>
      </div>

      <div className="card__footer">
        <Phone size={15} color="var(--accent)" />
        <span>
          <span className="card__footer-label">Elérhetőség&nbsp;</span>
          {equipment.contact}
        </span>
      </div>
    </div>
  );
}

export default EquipmentCard;
