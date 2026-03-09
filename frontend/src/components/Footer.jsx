import { Link } from 'react-router-dom';
import { Wrench, Phone, Mail, MapPin, Clock, ChevronRight } from 'lucide-react';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Felső sáv – accent vonal */}
      <div className="footer__topbar" />

      <div className="footer__main">
        <div className="container">
          <div className="footer__grid">

            {/* Márka + leírás */}
            <div className="footer__col footer__col--brand">
              <Link to="/" className="footer__brand">
                <div className="footer__logo-box">
                  <Wrench size={18} strokeWidth={2.5} />
                </div>
                <span className="footer__brand-text">
                  Nehéz<span>Gép</span>
                </span>
              </Link>
              <p className="footer__desc">
                Professzionális nehézgép bérlési szolgáltatások építőipari vállalkozások
                és magánszemélyek számára. Megbízható géppark, rugalmas időpontok.
              </p>
              <div className="footer__tagline">
                <span className="footer__tagline-line" />
                <span className="footer__tagline-text">Erő, Megbízhatóság, Pontosság,</span>
                <span className="footer__tagline-line" />
              </div>
            </div>

            {/* Gyors linkek */}
            <div className="footer__col">
              <div className="footer__col-title">Navigáció</div>
              <ul className="footer__links">
                <li><Link to="/" className="footer__link"><ChevronRight size={12} />Gépeink</Link></li>
                <li><Link to="/login" className="footer__link"><ChevronRight size={12} />Bejelentkezés</Link></li>
                <li><Link to="/register" className="footer__link"><ChevronRight size={12} />Regisztráció</Link></li>
              </ul>
            </div>

            {/* Általános infók */}
            <div className="footer__col">
              <div className="footer__col-title">Információk</div>
              <ul className="footer__links">
                <li><span className="footer__link footer__link--static"><ChevronRight size={12} />Bérlési feltételek</span></li>
                <li><span className="footer__link footer__link--static"><ChevronRight size={12} />Adatvédelmi tájékoztató</span></li>
                <li><span className="footer__link footer__link--static"><ChevronRight size={12} />ÁSZF</span></li>
                <li><span className="footer__link footer__link--static"><ChevronRight size={12} />Karbantartási rend</span></li>
              </ul>
            </div>

            {/* Elérhetőségek */}
            <div className="footer__col">
              <div className="footer__col-title">Elérhetőség</div>
              <ul className="footer__contact-list">
                <li className="footer__contact-item">
                  <Phone size={14} color="var(--accent)" />
                  <div>
                    <div className="footer__contact-label">Telefon</div>
                    <a href="tel:+3630123456" className="footer__contact-value">+36 20 448 0300</a>
                  </div>
                </li>
                <li className="footer__contact-item">
                  <Mail size={14} color="var(--accent)" />
                  <div>
                    <div className="footer__contact-label">Email</div>
                    <a href="mailto:info@nehezgep.hu" className="footer__contact-value">info@nehezgep.hu</a>
                  </div>
                </li>
                <li className="footer__contact-item">
                  <MapPin size={14} color="var(--accent)" />
                  <div>
                    <div className="footer__contact-label">Cím</div>
                    <span className="footer__contact-value">5516 Körösladány, Dózsa György út 81.</span>
                  </div>
                </li>
                <li className="footer__contact-item">
                  <Clock size={14} color="var(--accent)" />
                  <div>
                    <div className="footer__contact-label">Nyitvatartás</div>
                    <span className="footer__contact-value">H–P: 7:00–18:00</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Alsó sáv – copyright */}
      <div className="footer__bottom">
        <div className="container">
          <div className="footer__bottom-inner">
            <span className="footer__copy">
              © {year} NehézGép Kft. — Minden jog fenntartva.
            </span>
            <span className="footer__copy footer__copy--dim">
              Fejlesztve: NehézGép Dev Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
