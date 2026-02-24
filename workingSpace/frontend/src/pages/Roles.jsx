import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Roles() {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRoles(); }, []);

  async function fetchRoles() {
    try { const res = await api.get('/roles'); setRoles(res.data || []); }
    catch(err) { console.error(err); } finally { setLoading(false); }
  }

  function openEdit(r) {
    setSelectedRole(r);
    setEditForm({ name: r.name, description: r.description || '' });
  }

  async function handleCreate(e) {
    e.preventDefault();
    try { await api.post('/roles', createForm); alert('Szerepkör létrehozva!'); setShowCreate(false); setCreateForm({ name: '', description: '' }); fetchRoles(); }
    catch(err) { alert('Hiba!'); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    try { await api.put(`/roles/${selectedRole.id}`, editForm); alert('Szerepkör frissítve!'); setSelectedRole(null); fetchRoles(); }
    catch(err) { alert('Hiba!'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli ezt a szerepkört?')) return;
    try { await api.delete(`/roles/${id}`); alert('Szerepkör törölve!'); fetchRoles(); }
    catch(err) { alert('Hiba!'); }
  }

  const mbd = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const mbx = { background: 'white', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' };
  const inp = { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' };

  if (!isAdmin()) return <div><Navbar /><div className="container" style={{ padding: '20px' }}><p>Hozzáférés megtagadva.</p></div></div>;

  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Szerepkörök</h1>
          <button className="btn" onClick={() => setShowCreate(true)}>Új szerepkör</button>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card" style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '2px solid #ddd' }}>
              {['ID', 'Név', 'Leírás', 'Műveletek'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px' }}>{h}</th>))}
            </tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{r.id}</td>
                  <td style={{ padding: '8px' }}>{r.name}</td>
                  <td style={{ padding: '8px' }}>{r.description}</td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn" onClick={() => openEdit(r)}>Szerkesztés</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(r.id)}>Törlés</button>
                    </div>
                  </td>
                </tr>))}
            </tbody></table>
        </div>
        {selectedRole && (
          <div style={mbd} onClick={() => setSelectedRole(null)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>Szerepkör szerkesztése</h2>
              <form onSubmit={handleEdit}>
                <label>Név:</label>
                <input style={inp} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                <label>Leírás:</label>
                <textarea style={inp} rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn" type="button" onClick={() => setSelectedRole(null)}>Mégse</button>
                </div>
              </form>
            </div></div>)}
        {showCreate && (
          <div style={mbd} onClick={() => setShowCreate(false)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>Új szerepkör</h2>
              <form onSubmit={handleCreate}>
                <label>Név:</label>
                <input style={inp} value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} required />
                <label>Leírás:</label>
                <textarea style={inp} rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
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
