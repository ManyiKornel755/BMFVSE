import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isCoach } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div>
          <Link to="/">Hirdető tábla</Link>
          <Link to="/trainings">Edzések</Link>
          {isAdmin() && <Link to="/race-reports">Versenyjelentések</Link>}
          <Link to="/messages">Üzenetek</Link>
          {isAdmin() && <Link to="/users">Felhasználók</Link>}
          {isAdmin() && <Link to="/roles">Szerepkörök</Link>}
          {(isAdmin() || isCoach()) && <Link to="/groups">Csoportok</Link>}
          {isAdmin() && <Link to="/emails">Email küldés</Link>}
          {isAdmin() && <Link to="/iskolaigazolas">Iskolaigazolás</Link>}
        </div>
        <div className="navbar-user-section">
          <Link to="/profile">{user?.firstName} {user?.lastName}</Link>
          <button onClick={handleLogout} className="btn navbar-logout-btn">Kijelentkezés</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
