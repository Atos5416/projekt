import { useState } from 'react';
import { Phone, X, Info } from 'lucide-react';

const API = 'http://localhost:3000';

function EquipmentCard({ equipment }) {
  const [imgError, setImgError] = useState(false);
  const [open, setOpen] = useState(false);

  const imgSrc = equipment.image
    ? equipment.image.startsWith('http')
      ? equipment.image
      : `${API}${equipment.image}`
    : null;

  const showFallback = !imgSrc || imgError;

  return (
    <>
      <div className="card card--hover" onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
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
          <p className="card__text" style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {equipment.description}
          </p>
        </div>

        <div className="card__footer">
          <Phone size={15} color="var(--accent)" />
          <span>
            <span className="card__footer-label">Elérhetőség&nbsp;</span>
            {equipment.contact}
          </span>
          <Info size={14} color="var(--text-dim)" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      {open && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="modal equipment-modal">
            <button
              className="equipment-modal__close"
              onClick={() => setOpen(false)}
              aria-label="Bezárás"
            >
              <X size={20} />
            </button>

            <div className="equipment-modal__img-wrap">
              {showFallback ? (
                <div className="equipment-modal__img-fallback">🚜</div>
              ) : (
                <img
                  src={imgSrc}
                  alt={equipment.name}
                  className="equipment-modal__img"
                />
              )}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EquipmentCard;
