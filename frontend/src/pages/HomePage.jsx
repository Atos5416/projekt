import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import EquipmentCard from '../components/EquipmentCard';

function HomePage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const res = await axios.get('/equipment');
      setEquipment(res.data);
      setError('');
    } catch (err) {
      console.error('Equipment load error:', err);
      setError('Hiba történt a gépek betöltése során. Kérjük, próbálja újra később.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="light" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-white">Gépek betöltése...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Hero Section */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-white mb-3" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          Nehézmunkagép Bérlés
        </h1>
        <p className="lead text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
          Minőségi gépek, megbízható szolgáltatás
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
          <Alert.Heading>Hiba történt</Alert.Heading>
          <p className="mb-0">{error}</p>
        </Alert>
      )}

      {/* Equipment Grid */}
      {equipment.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {equipment.map(item => (
            <Col key={item.id}>
              <EquipmentCard equipment={item} />
            </Col>
          ))}
        </Row>
      ) : (
        !error && (
          <Alert variant="info" className="text-center">
            <h4>Jelenleg nincsenek elérhető gépek</h4>
            <p className="mb-0">Hamarosan bővítjük kínálatunkat!</p>
          </Alert>
        )
      )}
    </Container>
  );
}

export default HomePage;