import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', address: '', membership_status: 'active' });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [uRes, rRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
      setUsers(uRes.data || []); setRoles(rRes.data || []);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  }

  function openUser(u) {
    setSelectedUser(u);
    setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', membership_status: u.membership_status || 'active' });
    setSelectedRoleId('');
  }

  async function handleCreate(e) {
    e.preventDefault();
    try { await api.post('/users', createForm); alert('Felhasználó létrehozva!'); setShowCreate(false); setCreateForm({ name: '', email: '', password: '', phone: '', address: '', membership_status: 'active' }); fetchAll(); }
    catch(err) { alert('Hiba!'); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    try { await api.patch(`/users/${selectedUser.id}`, editForm); alert('Adatok frissítve!'); fetchAll(); }
    catch(err) { alert('Hiba!'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli?')) return;
    try { await api.delete(`/users/${id}`); alert('Törölve!'); setSelectedUser(null); fetchAll(); }
    catch(err) { alert('Hiba!'); }
  }

  async function handleAddRole() {
    if (!selectedRoleId) return;
    try { await api.post(`/roles/${selectedRoleId}/assign/${selectedUser.id}`); fetchAll(); const u = users.find(x=>x.id===selectedUser.id); setSelectedUser(u); }
    catch(err) { alert('Hiba a szerepkör hozzáadásakor!'); }
  }

  async function handleRemoveRole(roleId) {
    try { await api.delete(`/roles/${roleId}/assign/${selectedUser.id}`); fetchAll(); }
    catch(err) { alert('Hiba a szerepkör eltávolításakor!'); }
  }

  const mbd = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const mbx = { background: 'white', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' };
  const inp = { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' };
  if (!isAdmin()) return <div><Navbar /><div className="container" style={{ padding: '20px' }}><p>Hozzáférés megtagadva.</p></div></div>;
  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Felhasználók</h1>
          <button className="btn" onClick={() => setShowCreate(true)}>Új felhasználó</button>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card" style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '2px solid #ddd' }}>
              {['Név', 'Email', 'Telefon', 'Tagságállapot', 'Szerepkörök'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px' }}>{h}</th>))}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => openUser(u)}>
                  <td style={{ padding: '8px' }}>{u.name}</td>
                  <td style={{ padding: '8px' }}>{u.email}</td>
                  <td style={{ padding: '8px' }}>{u.phone}</td>
                  <td style={{ padding: '8px' }}>{u.membership_status}</td>
                  <td style={{ padding: '8px' }}>{Array.isArray(u.roles) ? u.roles.map(r => r.name || r).join(', ') : u.roles}</td>
                </tr>))}
            </tbody></table>
        </div>
        {selectedUser && (
          <div style={mbd} onClick={() => setSelectedUser(null)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>{selectedUser.name}</h2>
              <form onSubmit={handleEdit}>
                <label>Név:</label>
                <input style={inp} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                <label>Email:</label>
                <input style={inp} type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                <label>Telefon:</label>
                <input style={inp} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                <label>Cím:</label>
                <input style={inp} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                <label>Tagságállapot:</label>
                <select style={inp} value={editForm.membership_status} onChange={e => setEditForm({...editForm, membership_status: e.target.value})}>
                  <option value="active">Aktív</option>
                  <option value="inactive">Inaktív</option>
                  <option value="pending">Függőben</option>
                </select>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn btn-danger" type="button" onClick={() => handleDelete(selectedUser.id)}>Törlés</button>
                  <button className="btn" type="button" onClick={() => setSelectedUser(null)}>Mégse</button>
                </div>
              </form>
              <hr style={{ margin: '20px 0' }} />
              <h3>Szerepkörök</h3>
              <div style={{ marginBottom: '12px' }}>
                {Array.isArray(selectedUser.roles) && selectedUser.roles.map(r => (
                  <div key={r.id || r} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span>{r.name || r}</span>
                    <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => handleRemoveRole(r.id || r)}>X</button>
                  </div>))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                  <option value="">Szerepkör választása...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button className="btn" onClick={handleAddRole}>Hozzáadás</button>
              </div>
            </div></div>)}
        {showCreate && (
          <div style={mbd} onClick={() => setShowCreate(false)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>Új felhasználó</h2>
              <form onSubmit={handleCreate}>
                <label>Név:</label>
                <input style={inp} value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} required />
                <label>Email:</label>
                <input style={inp} type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required />
                <label>Jelszó:</label>
                <input style={inp} type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} required />
                <label>Telefon:</label>
                <input style={inp} value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} />
                <label>Cím:</label>
                <input style={inp} value={createForm.address} onChange={e => setCreateForm({...createForm, address: e.target.value})} />
                <label>Tagságállapot:</label>
                <select style={inp} value={createForm.membership_status} onChange={e => setCreateForm({...createForm, membership_status: e.target.value})}>
                  <option value="active">Aktív</option>
                  <option value="inactive">Inaktív</option>
                  <option value="pending">Függőben</option>
                </select>
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
