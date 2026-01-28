import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import { Plus, Edit2, Trash2, Settings } from 'lucide-react';

function AdminPage({ user }) {
  const [equipment, setEquipment] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact: '',
    image: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadEquipment();
    }
  }, [user]);

  const loadEquipment = async () => {
    try {
      const res = await axios.get('/equipment');
      setEquipment(res.data);
    } catch (err) {
      console.error('Load equipment error:', err);
      setError('Hiba történt a gépek betöltése során');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('description', formData.description.trim());
    data.append('contact', formData.contact.trim());
    
    // Ha van új kép, azt adjuk hozzá
    if (formData.image && formData.image instanceof File) {
      data.append('image', formData.image);
    }

    try {
      if (editingId) {
        await axios.put(`/equipment/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Gép sikeresen módosítva!');
      } else {
        await axios.post('/equipment', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Gép sikeresen hozzáadva!');
      }
      
      setFormData({ name: '', description: '', contact: '', image: null });
      setShowModal(false);
      setEditingId(null);
      loadEquipment();
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || 'Hiba történt a művelet során');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      contact: item.contact,
      image: null
    });
    setEditingId(item.id);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a gépet?')) return;

    try {
      await axios.delete(`/equipment/${id}`);
      setSuccess('Gép sikeresen törölve!');
      loadEquipment();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Törlési hiba történt');
    }
  };

  const handleNewEquipment = () => {
    setFormData({ name: '', description: '', contact: '', image: null });
    setEditingId(null);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', description: '', contact: '', image: null });
    setEditingId(null);
    setError('');
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <Container className="py-4 py-md-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2 className="fw-bold mb-0 text-white">
              <Settings className="me-2" />
              Gépek Kezelése
            </h2>
            <Button variant="primary" onClick={handleNewEquipment}>
              <Plus size={20} className="me-2" />
              Új Gép
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <strong>Hiba!</strong> {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          <strong>Siker!</strong> {success}
        </Alert>
      )}

      <Card className="shadow">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '100px' }} className="d-none d-md-table-cell">Kép</th>
                  <th>Név</th>
                  <th className="d-none d-lg-table-cell">Leírás</th>
                  <th className="d-none d-sm-table-cell">Elérhetőség</th>
                  <th style={{ width: '120px' }}>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map(item => {
                  const imageUrl = item.image?.startsWith('http') 
                    ? item.image 
                    : `http://localhost:3000${item.image}`;
                  
                  return (
                    <tr key={item.id}>
                      <td className="d-none d-md-table-cell">
                        {item.image ? (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="30">🚜</text></svg>';
                            }}
                          />
                        ) : (
                          <div className="bg-secondary text-white d-flex align-items-center justify-content-center" 
                               style={{ width: '80px', height: '60px', borderRadius: '4px' }}>
                            🚜
                          </div>
                        )}
                      </td>
                      <td className="align-middle">
                        <strong className="d-block">{item.name}</strong>
                        <small className="text-muted d-sm-none">{item.contact}</small>
                      </td>
                      <td className="align-middle d-none d-lg-table-cell">
                        <small className="text-muted">
                          {item.description.substring(0, 60)}...
                        </small>
                      </td>
                      <td className="align-middle d-none d-sm-table-cell">
                        <Badge bg="success">{item.contact}</Badge>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            title="Szerkesztés"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Törlés"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {equipment.length === 0 && (
            <Alert variant="info" className="text-center m-3 mb-0">
              Még nincsenek hozzáadott gépek. Kattints az "Új Gép" gombra a hozzáadáshoz!
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Equipment Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? '✏️ Gép Szerkesztése' : '➕ Új Gép Hozzáadása'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Gép neve *</Form.Label>
              <Form.Control
                type="text"
                placeholder="pl. CAT 320D Lánctalpas Kotrógép"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                minLength={3}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Leírás *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Részletes leírás a gépről..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Elérhetőség *</Form.Label>
              <Form.Control
                type="text"
                placeholder="pl. +36 30 123 4567"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kép feltöltése</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
              />
              <Form.Text className="text-muted">
                Maximális fájlméret: 5MB. Támogatott formátumok: JPG, PNG, GIF, WebP
              </Form.Text>
              {formData.image && formData.image instanceof File && (
                <Alert variant="success" className="mt-2 mb-0 py-2">
                  <small>✅ Kiválasztott fájl: {formData.image.name}</small>
                </Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
              Mégse
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Mentés...
                </>
              ) : (
                editingId ? '💾 Módosítás' : '➕ Hozzáadás'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default AdminPage;