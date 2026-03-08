import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      const [profileRes, certsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/certificates/my')
      ]);
      setProfile(profileRes.data);
      setCertificates(certsRes.data || []);
      setEditForm({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        phone: profileRes.data.phone || '',
        address: profileRes.data.address || ''
      });
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    try {
      await api.patch('/users/me', editForm);
      setProfileMsg({ type: 'success', text: 'Adatok sikeresen frissítve!' });
      fetchProfile();
    } catch(err) {
      setProfileMsg({ type: 'error', text: 'Hiba a mentés során!' });
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'Az új jelszók nem egyeznek!' });
      return;
    }
    try {
      await api.patch('/users/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwMsg({ type: 'success', text: 'Jelszó sikeresen megváltoztatva!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch(err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error?.message || 'Hiba a jelszóváltás során!' });
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setProfileMsg({ type: 'error', text: 'A fájl mérete maximum 5MB lehet!' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setProfileMsg({ type: 'error', text: 'Csak képfájlok tölthetők fel!' });
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleImageUpload() {
    if (!profileImage) {
      setProfileMsg({ type: 'error', text: 'Válasszon ki egy képet!' });
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', profileImage);

    try {
      const response = await api.post('/users/me/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfileMsg({ type: 'success', text: 'Profilkép sikeresen feltöltve!' });
      fetchProfile();
      setProfileImage(null);
      setImagePreview(null);
    } catch(err) {
      setProfileMsg({ type: 'error', text: 'Hiba a profilkép feltöltése során!' });
    }
  }

  function getImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  }

  return (
    <div className="main-content">
      <Navbar />
      <div className="profile-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            Profil Áttekintés
          </button>
          <button
            className={`tab ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            Profil Kezelő
          </button>
          <button
            className={`tab ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            Dokumentumok
          </button>
          <button
            className={`tab ${activeTab === 3 ? 'active' : ''}`}
            onClick={() => setActiveTab(3)}
          >
            Beállítások
          </button>
        </div>

        <div className="tab-content">
          {loading && (
            <div style={{textAlign: 'center', padding: '40px', color: 'white'}}>
              Betöltés...
            </div>
          )}

          {/* Tab 0 - Profil Áttekintés */}
          <div className={`tab-pane ${activeTab === 0 ? 'active' : ''}`}>
            {profile && (
              <div className="profile-layout">
                <div className="form-panel">
                  <h2>Profilkép</h2>
                  <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'}}>
                    <div className="profile-image-placeholder">
                      {profile?.profile_image ? (
                        <img src={getImageUrl(profile.profile_image)} alt="Profilkép" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                      ) : (
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#42A5F5"/>
                        </svg>
                      )}
                    </div>
                    <button className="btn-upload" onClick={() => setActiveTab(1)}>
                      Kép feltöltése
                    </button>
                  </div>
                </div>

                <div className="info-panel">
                  <div className="info-card">
                    <h3>Személyes Adatok</h3>
                    <p><strong>Név:</strong> {profile.name || profile.first_name + ' ' + profile.last_name}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Telefon:</strong> {profile.phone || '-'}</p>
                    <p><strong>Cím:</strong> {profile.address || '-'}</p>
                  </div>

                  <div className="info-card">
                    <h3>Szerepkörök</h3>
                    <p><strong>Felhasználói típus:</strong> {user?.roles?.map(r => r.name).join(', ') || 'Tag'}</p>
                    <p><strong>Regisztráció:</strong> {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bottom-card">
              <h3 style={{color: '#1976D2'}}>További Információk</h3>
              <div className="data-content">
                <div className="data-item">
                  <p><strong>Aktív edzések:</strong> -</p>
                  <p><strong>Részvételi arány:</strong> -</p>
                </div>
                <div className="data-item">
                  <p><strong>Üzenetek:</strong> -</p>
                  <p><strong>Legutóbbi aktivitás:</strong> {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 1 - Profil Kezelő */}
          <div className={`tab-pane ${activeTab === 1 ? 'active' : ''}`}>
            <div className="profile-layout">
              <div className="form-panel">
                <h2>Profilkép</h2>
                {profileMsg && (
                  <div className={`msg-feedback msg-feedback-${profileMsg.type}`}>
                    {profileMsg.text}
                  </div>
                )}
                <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'}}>
                  <div className="profile-image-placeholder">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Előnézet" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                    ) : profile?.profile_image ? (
                      <img src={getImageUrl(profile.profile_image)} alt="Profilkép" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                    ) : (
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#42A5F5"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{display: 'none'}}
                    id="profile-image-input"
                  />
                  <label htmlFor="profile-image-input" className="btn-upload" style={{cursor: 'pointer'}}>
                    Kép kiválasztása
                  </label>
                  {profileImage && (
                    <button className="btn-save" onClick={handleImageUpload} type="button">
                      Feltöltés
                    </button>
                  )}
                </div>
              </div>

              <div className="form-panel">
                <h2>Adatok Szerkesztése</h2>
                <form onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label>Név</label>
                    <input
                      className="form-input"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({...editForm, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input
                      className="form-input"
                      value={editForm.phone}
                      onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cím</label>
                    <input
                      className="form-input"
                      value={editForm.address}
                      onChange={e => setEditForm({...editForm, address: e.target.value})}
                    />
                  </div>
                  <button className="btn-save" type="submit">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                    </svg>
                    Mentés
                  </button>
                </form>
              </div>

              <div className="form-panel">
                <h2>Jelszó Változtatás</h2>
                {pwMsg && (
                  <div className={`msg-feedback msg-feedback-${pwMsg.type}`}>
                    {pwMsg.text}
                  </div>
                )}
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Jelenlegi jelszó</label>
                    <input
                      className="form-input"
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Új jelszó</label>
                    <input
                      className="form-input"
                      type="password"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Új jelszó megerősítése</label>
                    <input
                      className="form-input"
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                  <button className="btn-save" type="submit">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                    Jelszó Módosítása
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Tab 2 - Dokumentumok */}
          <div className={`tab-pane ${activeTab === 2 ? 'active' : ''}`}>
            <div className="form-panel center">
              <h2>Dokumentumok</h2>
              {certificates.length === 0 ? (
                <div className="info-card">
                  <p style={{color: '#1976D2'}}>Még nincsenek dokumentumaid.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {certificates.map(cert => (
                    <div key={cert.id} className="info-card">
                      <h3>{cert.title}</h3>
                      <p><strong>Kiállítva:</strong> {new Date(cert.issue_date).toLocaleDateString('hu-HU')}</p>
                      {cert.valid_until && (
                        <p><strong>Érvényes:</strong> {new Date(cert.valid_until).toLocaleDateString('hu-HU')}-ig</p>
                      )}
                      {cert.content && (
                        <div style={{marginTop: '12px', padding: '12px', background: 'rgba(30, 136, 229, 0.1)', borderRadius: '8px'}}>
                          <p style={{whiteSpace: 'pre-wrap', color: '#0D47A1'}}>{cert.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab 3 - Beállítások */}
          <div className={`tab-pane ${activeTab === 3 ? 'active' : ''}`}>
            <div className="form-panel center">
              <h2>Beállítások</h2>
              <div className="info-card">
                <h3>Értesítések</h3>
                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <input type="checkbox" defaultChecked />
                    <span>Email értesítések engedélyezése</span>
                  </label>
                </div>
                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <input type="checkbox" defaultChecked />
                    <span>Üzenet értesítések</span>
                  </label>
                </div>
                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <input type="checkbox" />
                    <span>Közlemények feliratkozás</span>
                  </label>
                </div>
              </div>

              <div className="info-card">
                <h3>Adatvédelem</h3>
                <p style={{marginBottom: '16px', color: '#1976D2'}}>
                  Az adataid biztonságban vannak. További információkért olvasd el az adatvédelmi szabályzatunkat.
                </p>
                <button className="btn-save" style={{background: '#dc3545'}}>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Fiók Törlése
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
