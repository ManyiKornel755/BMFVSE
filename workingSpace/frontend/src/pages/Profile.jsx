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

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
      setEditForm({ name: res.data.name || '', email: res.data.email || '', phone: res.data.phone || '', address: res.data.address || '' });
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    try {
      await api.patch('/users/me', editForm);
      setProfileMsg({ type: 'success', text: 'Adatok sikeresen frissítve!' });
      fetchProfile();
    } catch(err) { setProfileMsg({ type: 'error', text: 'Hiba a mentés során!' }); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ type: 'error', text: 'Az új jelszók nem egyeznek!' }); return; }
    try {
      await api.patch('/users/me/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: 'success', text: 'Jelszó sikeresen megváltoztatva!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch(err) { setPwMsg({ type: 'error', text: 'Hiba a jelszóváltás során!' }); }
  }

  const inp = { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' };
  const msgStyle = (t) => ({ padding: '10px', borderRadius: '4px', marginBottom: '12px', background: t === 'success' ? '#e8f5e9' : '#ffebee', color: t === 'success' ? '#2e7d32' : '#c62828' });
  const statusLabel = { active: 'Aktív', inactive: 'Inaktív', pending: 'Függőben' };

  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <h1>Profil</h1>
        {loading && <p>Betöltés...</p>}
        {profile && (
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h2>Adataim</h2>
            <p><strong>Név:</strong> {profile.name || profile.first_name + ' ' + profile.last_name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Telefon:</strong> {profile.phone || '-'}</p>
            <p><strong>Cím:</strong> {profile.address || '-'}</p>
            <p><strong>Tagságállapot:</strong> {statusLabel[profile.membership_status] || profile.membership_status || '-'}</p>
          </div>)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h2>Adatok szerkesztése</h2>
            {profileMsg && <div style={msgStyle(profileMsg.type)}>{profileMsg.text}</div>}
            <form onSubmit={handleProfileSave}>
              <label>Név:</label>
              <input style={inp} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              <label>Email:</label>
              <input style={inp} type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              <label>Telefon:</label>
              <input style={inp} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
              <label>Cím:</label>
              <input style={inp} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
              <button className="btn" type="submit">Mentés</button>
            </form>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <h2>Jelszó változtatás</h2>
            {pwMsg && <div style={msgStyle(pwMsg.type)}>{pwMsg.text}</div>}
            <form onSubmit={handlePasswordChange}>
              <label>Jelenlegi jelszó:</label>
              <input style={inp} type="password" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} required />
              <label>Új jelszó:</label>
              <input style={inp} type="password" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} required />
              <label>Új jelszó megerősítése:</label>
              <input style={inp} type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} required />
              <button className="btn" type="submit">Jelszó módosítása</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
