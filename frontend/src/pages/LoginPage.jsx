import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { LogIn } from 'lucide-react';

function LoginPage({ login }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Bejelentkezési hiba történt. Kérjük, próbálja újra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ minHeight: 'calc(100vh - 56px)' }} className="d-flex align-items-center justify-content-center py-5">
      <Row className="justify-content-center w-100">
        <Col xs={12} sm={10} md={8} lg={5} xl={4}>
          <Card className="shadow-lg">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <LogIn size={56} className="text-primary" />
                </div>
                <h2 className="fw-bold mb-2">Bejelentkezés</h2>
                <p className="text-muted small">Jelentkezz be a fiókodba</p>
              </div>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email cím</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="pelda@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    size="lg"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Jelszó</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    size="lg"
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-3"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Bejelentkezés...
                    </>
                  ) : (
                    'Belépés'
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <p className="mb-3">
                  Még nincs fiókod?{' '}
                  <Link to="/register" className="text-decoration-none fw-bold">
                    Regisztrálj itt
                  </Link>
                </p>
                
                <Alert variant="info" className="mb-0 py-3">
                  <div className="small">
                    <strong>🔑 Demo admin fiók:</strong>
                    <div className="mt-2">
                      <strong>Email:</strong> admin@nehezgep.hu<br />
                      <strong>Jelszó:</strong> admin123
                    </div>
                  </div>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;