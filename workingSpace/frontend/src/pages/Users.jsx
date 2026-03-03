import { useState, useEffect } from 'react';
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
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [createSelectedRoleId, setCreateSelectedRoleId] = useState('');
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
    setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '' });
    const currentRole = Array.isArray(u.roles) && u.roles.length > 0 ? String(u.roles[0].id) : '';
    setSelectedRoleId(currentRole);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await api.post('/users', createForm);
      const newId = res.data.user?.id || res.data.id;
      if (createSelectedRoleId) {
        await api.post(`/roles/${createSelectedRoleId}/assign/${newId}`);
      }
      setShowCreate(false);
      setCreateForm({ name: '', email: '', password: '', phone: '', address: '' });
      setCreateSelectedRoleId('');
      fetchAll();
    } catch(err) { alert('Hiba: ' + (err.response?.data?.error?.message || err.message)); }
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

  async function handleSetRole() {
    try {
      if (selectedRoleId) {
        await api.post(`/roles/${selectedRoleId}/assign/${selectedUser.id}`);
      } else {
        const currentRole = Array.isArray(selectedUser.roles) && selectedUser.roles.length > 0 ? selectedUser.roles[0] : null;
        if (currentRole) {
          await api.delete(`/roles/${currentRole.id}/assign/${selectedUser.id}`);
        }
      }
      const uRes = await api.get('/users');
      const updated = uRes.data.find(x => x.id === selectedUser.id);
      setUsers(uRes.data || []);
      if (updated) setSelectedUser(updated);
    } catch(err) { alert('Hiba a szerepkör beállításakor!'); }
  }

  if (!isAdmin()) return <div><Navbar /><div className="container"><p>Hozzáférés megtagadva.</p></div></div>;

  return (
    <div><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Felhasználók</h1>
          <button className="btn" onClick={() => setShowCreate(true)}>Új felhasználó</button>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card">
          <table className="data-table">
            <thead><tr>
              {['Név', 'Email', 'Telefon', 'Szerepkör', 'Műveletek'].map(h => (
                <th key={h}>{h}</th>))}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0].name : '—'}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => openUser(u)}>Szerkesztés</button>
                    <button className="btn btn-danger btn-sm" style={{marginLeft:'6px'}} onClick={() => handleDelete(u.id)}>Törlés</button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>×</button>
              <h2>{selectedUser.name}</h2>
              <form onSubmit={handleEdit}>
                <label>Név:</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                <label>Email:</label>
                <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                <label>Telefon:</label>
                <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                <label>Cím:</label>
                <input className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                <div className="btn-row">
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn btn-danger" type="button" onClick={() => handleDelete(selectedUser.id)}>Törlés</button>
                  <button className="btn" type="button" onClick={() => setSelectedUser(null)}>Mégse</button>
                </div>
              </form>
              <hr className="hr-divider" />
              <h3>Szerepkör</h3>
              <div className="role-assign-row">
                <select className="role-select" value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                  <option value="">-- Nincs szerepkör --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button className="btn" onClick={handleSetRole}>Beállítás</button>
              </div>
            </div>
          </div>)}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
              <h2>Új felhasználó</h2>
              <form onSubmit={handleCreate}>
                <label>Név:</label>
                <input className="form-input" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} required />
                <label>Email:</label>
                <input className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required />
                <label>Jelszó:</label>
                <input className="form-input" type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} required />
                <label>Telefon:</label>
                <input className="form-input" value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} />
                <label>Cím:</label>
                <input className="form-input" value={createForm.address} onChange={e => setCreateForm({...createForm, address: e.target.value})} />
                <label>Szerepkör:</label>
                <select className="role-select" value={createSelectedRoleId} onChange={e => setCreateSelectedRoleId(e.target.value)}>
                  <option value="">-- Nincs szerepkör --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
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
