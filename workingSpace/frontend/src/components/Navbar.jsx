import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isCoach } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [trainingsDropdownOpen, setTrainingsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <>
      {/* Menu Overlay */}
      <div
        className={`menu-overlay ${menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      />

      {/* Side Menu */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <span className="menu-title">Menü</span>
          <button className="menu-toggle" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div className="menu-items">
          <Link to="/" className="menu-item" onClick={closeMenu}>
            Hirdető tábla
          </Link>

          {/* Edzések lenyíló menü */}
          <div className="menu-item-with-dropdown">
            <div
              className={`menu-item menu-item-dropdown ${trainingsDropdownOpen ? 'active' : ''}`}
              onClick={() => setTrainingsDropdownOpen(!trainingsDropdownOpen)}
            >
              Edzések
              <span className="dropdown-arrow">{trainingsDropdownOpen ? '▼' : '▶'}</span>
            </div>
            {trainingsDropdownOpen && (
              <div className="submenu">
                <Link to="/trainings" className="submenu-item" onClick={closeMenu}>
                  Edzések kezelése
                </Link>
                <Link to="/trainings/stats" className="submenu-item" onClick={closeMenu}>
                  Edzés statisztika
                </Link>
                {isAdmin() && (
                  <Link to="/trainings/log" className="submenu-item" onClick={closeMenu}>
                    Edzésnapló
                  </Link>
                )}
              </div>
            )}
          </div>

          {isAdmin() && (
            <Link to="/race-reports" className="menu-item" onClick={closeMenu}>
              Versenyjegyzőkönyvek
            </Link>
          )}
          <Link to="/messages" className="menu-item" onClick={closeMenu}>
            Közlemények
          </Link>
          {isAdmin() && (
            <Link to="/users" className="menu-item" onClick={closeMenu}>
              Felhasználók
            </Link>
          )}
          {isAdmin() && (
            <Link to="/roles" className="menu-item" onClick={closeMenu}>
              Szerepkörök
            </Link>
          )}
          {(isAdmin() || isCoach()) && (
            <Link to="/groups" className="menu-item" onClick={closeMenu}>
              Csoportok
            </Link>
          )}
          {/* {isAdmin() && (
            <Link to="/emails" className="menu-item" onClick={closeMenu}>
              Email küldés
            </Link>
          )} */}
          {isAdmin() && (
            <Link to="/iskolaigazolas" className="menu-item" onClick={closeMenu}>
              Iskolaigazolás
            </Link>
          )}
        </div>
      </div>

      {/* Top Bar */}
      <div className="top-bar">
        <button className="hamburger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div style={{ position: 'relative' }}>
          {location.pathname === '/profile' ? (
            <button
              className="back-button"
              onClick={() => navigate(-1)}
              title="Vissza"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
          ) : (
            <>
              <div
                onClick={toggleProfileDropdown}
                style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer'}}
              >
                <button
                  className="profile-button hide-indicator"
                  style={{padding: 0, overflow: 'hidden'}}
                >
                  {user?.profile_image ? (
                    <img
                      src={getImageUrl(user.profile_image)}
                      alt="Profil"
                      style={{width: '56px', height: '56px', objectFit: 'cover', display: 'block'}}
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </button>
                <span style={{color: 'white', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>{user?.name || user?.email}</span>
              </div>

              {/* Profile Dropdown */}
              <div className={`profile-dropdown ${profileDropdownOpen ? 'active' : ''}`}>
            <div style={{
              padding: '12px',
              borderBottom: '1px solid rgba(13, 71, 161, 0.1)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {user?.profile_image ? (
                <img
                  src={getImageUrl(user.profile_image)}
                  alt="Profil"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1976D2, #42A5F5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '28px', height: '28px', fill: 'white'}}>
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div>
                <div style={{fontWeight: 600, color: '#0D47A1'}}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{fontSize: '12px', color: '#1976D2', marginTop: '4px'}}>
                  {user?.email}
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              className="dropdown-item"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '16px', height: '16px', marginRight: '8px', verticalAlign: 'middle', fill: '#0D47A1'}}>
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Profil megtekintése
            </Link>
            <button
              className="dropdown-item"
              onClick={() => {
                setProfileDropdownOpen(false);
                handleLogout();
              }}
              style={{color: '#dc3545'}}
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '16px', height: '16px', marginRight: '8px', verticalAlign: 'middle', fill: '#dc3545'}}>
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Kijelentkezés
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
