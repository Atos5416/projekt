import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { Phone } from 'lucide-react';

function EquipmentCard({ equipment }) {
  const API_URL = 'http://localhost:3000';
  const [imageError, setImageError] = useState(false);
  
  // Kép URL meghatározása - külső URL vagy lokális
  const getImageUrl = () => {
    if (!equipment.image) return null;
    if (equipment.image.startsWith('http')) {
      return equipment.image; // Külső URL
    }
    return `${API_URL}${equipment.image}`; // Lokális kép
  };

  const imageUrl = getImageUrl();
  const showFallback = !imageUrl || imageError;

  return (
    <Card className="h-100 shadow-sm hover-card">
      {!showFallback ? (
        <div style={{ height: '200px', overflow: 'hidden', background: '#f0f0f0' }}>
          <Card.Img 
            variant="top" 
            src={imageUrl} 
            alt={equipment.name}
            style={{ 
              height: '200px', 
              width: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div 
          className="d-flex align-items-center justify-content-center text-white"
          style={{ 
            height: '200px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <span style={{ fontSize: '4rem' }}>🚜</span>
        </div>
      )}
      
      <Card.Body>
        <Card.Title className="text-primary fw-bold">{equipment.name}</Card.Title>
        <Card.Text className="text-muted">
          {equipment.description}
        </Card.Text>
      </Card.Body>
      
      <Card.Footer className="bg-light">
        <div className="d-flex align-items-center text-dark flex-wrap">
          <Phone size={18} className="me-2 text-success flex-shrink-0" />
          <strong className="me-2">Elérhetőség:</strong>
          <span className="text-break">{equipment.contact}</span>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default EquipmentCard;