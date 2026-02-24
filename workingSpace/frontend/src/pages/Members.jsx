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
      alert('Tag sikeresen frissitve!'); setSelectedMember(null); fetchMembers();
    } catch(err) { alert('Hiba a frissites soran!'); }
  }
  async function handleDelete(id) {
    if (!window.confirm('Biztosan torli ezt a tagot?')) return;
    try { await api.delete(`/members/${id}`); alert('Tag torolve!'); setSelectedMember(null); fetchMembers(); }
    catch(err) { alert('Hiba a torles soran!'); }
  }
  async function handleCreate(e) {
    e.preventDefault();
    try { await api.post('/members', createForm); alert('Tag sikeresen letrehozva!'); setShowCreate(false); setCreateForm({ first_name: '', last_name: '', email: '', password: '', phone: '' }); fetchMembers(); }
    catch(err) { alert('Hiba a letrehozas soran!'); }
  }
  const sorted = [...members].sort((a, b) => {
    const nA = (a.first_name + ' ' + a.last_name).toLowerCase();
    const nB = (b.first_name + ' ' + b.last_name).toLowerCase();
    return sortOrder === 'asc' ? nA.localeCompare(nB) : nB.localeCompare(nA);
  });
  const statusColor = s => s === 'active' ? '#4caf50' : '#f44336';
  const statusLabel = { active: 'Aktiv', inactive: 'Inaktiv', pending: 'Fuggoben' };
  const mbd = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const mbx = { background: 'white', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' };
  const inp = { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' };
  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Tagok</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => setSortOrder('asc')}>Név A-Z</button>
            <button className="btn" onClick={() => setSortOrder('desc')}>Név Z-A</button>
            {isAdmin() && <button className="btn" onClick={() => setShowCreate(true)}>Új tag</button>}
          </div>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card" style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '2px solid #ddd' }}>
              {['Keresztnév', 'Vezetéknév', 'Email', 'Telefon', 'Állapot'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px' }}>{h}</th>))}
            </tr></thead>
            <tbody>
              {sorted.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #eee', cursor: isAdmin() ? 'pointer' : 'default' }}
                  onClick={() => isAdmin() && openMember(m)}>
                  <td style={{ padding: '8px' }}>{m.first_name}</td>
                  <td style={{ padding: '8px' }}>{m.last_name}</td>
                  <td style={{ padding: '8px' }}>{m.email}</td>
                  <td style={{ padding: '8px' }}>{m.phone}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ background: statusColor(m.membership_status), color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                      {statusLabel[m.membership_status] || m.membership_status}</span></td>
                </tr>))}
            </tbody></table>
        </div>
        {selectedMember && (
          <div style={mbd} onClick={() => setSelectedMember(null)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>{selectedMember.first_name} {selectedMember.last_name}</h2>
              <form onSubmit={handleEdit}>
                <label>Keresztnév:</label>
                <input style={inp} value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} required />
                <label>Vezetéknév:</label>
                <input style={inp} value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} required />
                <label>Email:</label>
                <input style={inp} type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                <label>Telefon:</label>
                <input style={inp} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn btn-danger" type="button" onClick={() => handleDelete(selectedMember.id)}>Törlés</button>
                  <button className="btn" type="button" onClick={() => setSelectedMember(null)}>Mégse</button>
                </div>
              </form>
            </div></div>)}
        {showCreate && (
          <div style={mbd} onClick={() => setShowCreate(false)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>Új tag létrehozása</h2>
              <form onSubmit={handleCreate}>
                <label>Keresztnév:</label>
                <input style={inp} value={createForm.first_name} onChange={e => setCreateForm({...createForm, first_name: e.target.value})} required />
                <label>Vezetéknév:</label>
                <input style={inp} value={createForm.last_name} onChange={e => setCreateForm({...createForm, last_name: e.target.value})} required />
                <label>Email:</label>
                <input style={inp} type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required />
                <label>Jelszó:</label>
                <input style={inp} type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} required />
                <label>Telefon:</label>
                <input style={inp} value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn" type="submit">Létrehozás</button>
                  <button className="btn" type="button" onClick={() => setShowCreate(false)}>Mégse</button>
                </div>
              </form>
            </div></div>)}
      </div>
    </div>
  );
}
