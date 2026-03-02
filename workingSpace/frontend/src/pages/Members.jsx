import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Members() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
    const interval = setInterval(fetchMembers, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMembers() {
    try { const res = await api.get('/members'); setMembers(res.data || []); }
    catch(err) { console.error(err); } finally { setLoading(false); }
  }

  function openMember(m) {
    setSelectedMember(m);
    setEditForm({ first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone || '' });
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      await api.put(`/members/${selectedMember.id}`, editForm);
      alert('Tag sikeresen frissítve!'); setSelectedMember(null); fetchMembers();
    } catch(err) { alert('Hiba a frissítés során!'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli ezt a tagot?')) return;
    try { await api.delete(`/members/${id}`); alert('Tag törölve!'); setSelectedMember(null); fetchMembers(); }
    catch(err) { alert('Hiba a törlés során!'); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try { await api.post('/members', createForm); alert('Tag sikeresen létrehozva!'); setShowCreate(false); setCreateForm({ first_name: '', last_name: '', email: '', password: '', phone: '' }); fetchMembers(); }
    catch(err) { alert('Hiba a létrehozás során!'); }
  }

  const sorted = [...members].sort((a, b) => {
    const nA = (a.first_name + ' ' + a.last_name).toLowerCase();
    const nB = (b.first_name + ' ' + b.last_name).toLowerCase();
    return sortOrder === 'asc' ? nA.localeCompare(nB) : nB.localeCompare(nA);
  });

  const statusLabel = { active: 'Aktív', inactive: 'Inaktív', pending: 'Függőben' };

  return (
    <div><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Tagok</h1>
          <div className="btn-group">
            <button className="btn" onClick={() => setSortOrder('asc')}>Név A-Z</button>
            <button className="btn" onClick={() => setSortOrder('desc')}>Név Z-A</button>
            {isAdmin() && <button className="btn" onClick={() => setShowCreate(true)}>Új tag</button>}
          </div>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card">
          <table className="data-table">
            <thead><tr>
              {['Keresztnév', 'Vezetéknév', 'Email', 'Telefon', 'Állapot'].map(h => (
                <th key={h}>{h}</th>))}
            </tr></thead>
            <tbody>
              {sorted.map(m => (
                <tr key={m.id} className={isAdmin() ? 'clickable' : ''} onClick={() => isAdmin() && openMember(m)}>
                  <td>{m.first_name}</td>
                  <td>{m.last_name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone}</td>
                  <td>
                    <span className={`badge badge-${m.membership_status}`}>
                      {statusLabel[m.membership_status] || m.membership_status}
                    </span>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
        {selectedMember && (
          <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h2>{selectedMember.first_name} {selectedMember.last_name}</h2>
              <form onSubmit={handleEdit}>
                <label>Keresztnév:</label>
                <input className="form-input" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} required />
                <label>Vezetéknév:</label>
                <input className="form-input" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} required />
                <label>Email:</label>
                <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                <label>Telefon:</label>
                <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                <div className="btn-row">
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn btn-danger" type="button" onClick={() => handleDelete(selectedMember.id)}>Törlés</button>
                  <button className="btn" type="button" onClick={() => setSelectedMember(null)}>Mégse</button>
                </div>
              </form>
            </div>
          </div>)}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h2>Új tag létrehozása</h2>
              <form onSubmit={handleCreate}>
                <label>Keresztnév:</label>
                <input className="form-input" value={createForm.first_name} onChange={e => setCreateForm({...createForm, first_name: e.target.value})} required />
                <label>Vezetéknév:</label>
                <input className="form-input" value={createForm.last_name} onChange={e => setCreateForm({...createForm, last_name: e.target.value})} required />
                <label>Email:</label>
                <input className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required />
                <label>Jelszó:</label>
                <input className="form-input" type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} required />
                <label>Telefon:</label>
                <input className="form-input" value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} />
                <div className="btn-row">
                  <button className="btn" type="submit">Létrehozás</button>
                  <button className="btn" type="button" onClick={() => setShowCreate(false)}>Mégse</button>
                </div>
              </form>
            </div>
          </div>)}
      </div>
    </div>
  );
}
