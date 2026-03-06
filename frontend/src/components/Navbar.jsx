import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, Menu, X, LogOut, Settings, Users, CalendarCheck } from 'lucide-react';

function Navbar({ user, logout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__inner">
          <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
            <div className="navbar__logo-box">
              <Wrench size={18} strokeWidth={2.5} />
            </div>
            <span className="navbar__brand-text">
              Nehéz<span>Gép</span>
            </span>
          </Link>

          <div className={`navbar__nav${open ? ' open' : ''}`}>
            <Link
              to="/"
              className={`nav-link${isActive('/') ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              Gépeink
            </Link>

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`nav-link${isActive('/admin') ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Settings size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Gépkezelés
                </Link>
                <Link
                  to="/rentals"
                  className={`nav-link${isActive('/rentals') ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <CalendarCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Bérlések
                </Link>
                <Link
                  to="/users"
                  className={`nav-link${isActive('/users') ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Users size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Felhasználók
                </Link>
              </>
            )}

            {user ? (
              <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                <LogOut size={14} />
                Kilépés
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`nav-link${isActive('/login') ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  Belépés
                </Link>
                <Link
                  to="/register"
                  className="btn btn--primary btn--sm"
                  onClick={() => setOpen(false)}
                >
                  Regisztráció
                </Link>
              </>
            )}
          </div>

          <button
            className="navbar__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menü"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;