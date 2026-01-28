import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Truck, LogOut, Users, Settings } from 'lucide-react';

function NavigationBar({ user, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <Truck size={28} className="me-2" />
          <span className="fw-bold d-none d-sm-inline">NehézGép Bérlés</span>
          <span className="fw-bold d-sm-none">NehézGép</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-lg-center">
            <Nav.Link as={Link} to="/">Gépek</Nav.Link>
            
            {user && user.role === 'admin' && (
              <>
                <Nav.Link as={Link} to="/admin">
                  <Settings size={18} className="me-1" />
                  <span>Admin</span>
                </Nav.Link>
                <Nav.Link as={Link} to="/users">
                  <Users size={18} className="me-1" />
                  <span>Felhasználók</span>
                </Nav.Link>
              </>
            )}
            
            {user ? (
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={handleLogout}
                className="ms-lg-2 mt-2 mt-lg-0"
              >
                <LogOut size={18} className="me-1" />
                <span className="d-none d-md-inline">Kilépés ({user.username})</span>
                <span className="d-md-none">Kilépés</span>
              </Button>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Belépés</Nav.Link>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="primary" 
                  size="sm"
                  className="ms-lg-2 mt-2 mt-lg-0"
                >
                  Regisztráció
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;