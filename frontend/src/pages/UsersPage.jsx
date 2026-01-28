import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import { Users, Trash2, Shield } from 'lucide-react';

function UsersPage({ user }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
      setError('');
    } catch (err) {
      console.error('Load users error:', err);
      setError('Hiba történt a felhasználók betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) return;

    try {
      await axios.delete(`/users/${id}`);
      setSuccess('Felhasználó sikeresen törölve!');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err.response?.data?.error || 'Törlési hiba');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.patch(`/users/${id}/role`, { role: newRole });
      setSuccess(`Szerepkör sikeresen módosítva: ${newRole === 'admin' ? 'Admin' : 'Felhasználó'}`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Role change error:', err);
      setError(err.response?.data?.error || 'Hiba történt a szerepkör módosítása során');
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Betöltés...</span>
        </div>
        <p className="mt-3 text-white">Felhasználók betöltése...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4 py-md-5">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold text-white">
            <Users className="me-2" />
            Felhasználók Kezelése
          </h2>
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

      <Card className="shadow mb-4">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="d-none d-md-table-cell">ID</th>
                  <th>Felhasználó</th>
                  <th className="d-none d-lg-table-cell">Email</th>
                  <th>Szerepkör</th>
                  <th className="d-none d-md-table-cell">Létrehozva</th>
                  <th style={{ width: '100px' }}>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="align-middle d-none d-md-table-cell">
                      <Badge bg="secondary">#{u.id}</Badge>
                    </td>
                    <td className="align-middle">
                      <div>
                        <strong>{u.username}</strong>
                        {u.id === user.id && (
                          <Badge bg="info" className="ms-2">Te</Badge>
                        )}
                        <div className="d-lg-none">
                          <small className="text-muted text-break">{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle d-none d-lg-table-cell">
                      <span className="text-break">{u.email}</span>
                    </td>
                    <td className="align-middle">
                      <Form.Select
                        size="sm"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user.id}
                        style={{ minWidth: '130px' }}
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">🛡️ Admin</option>
                      </Form.Select>
                    </td>
                    <td className="align-middle d-none d-md-table-cell">
                      <small className="text-muted">
                        {new Date(u.created_at).toLocaleDateString('hu-HU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </small>
                    </td>
                    <td className="align-middle">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === user.id}
                        title="Törlés"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {users.length === 0 && (
            <Alert variant="info" className="text-center m-3 mb-0">
              Nincsenek felhasználók az adatbázisban
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <h5 className="mb-3">
            <Shield className="me-2" />
            Jogosultságok magyarázata
          </h5>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Badge bg="primary" className="me-2 mb-2">👤 Felhasználó</Badge>
                <p className="mb-0 text-muted small">
                  Megtekintheti a gépeket, de nem módosíthat semmit.
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <Badge bg="danger" className="me-2 mb-2">🛡️ Admin</Badge>
                <p className="mb-0 text-muted small">
                  Teljes hozzáférés: gépek és felhasználók kezelése.
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default UsersPage;