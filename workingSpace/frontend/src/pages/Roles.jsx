import { useState, useEffect } from 'react';
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

  if (!isAdmin()) return <div><Navbar /><div className="container"><p>Hozzáférés megtagadva.</p></div></div>;

  return (
    <div><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Szerepkörök</h1>
          <button className="btn" onClick={() => setShowCreate(true)}>Új szerepkör</button>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card">
          <table className="data-table">
            <thead><tr>
              {['ID', 'Név', 'Leírás', 'Műveletek'].map(h => (
                <th key={h}>{h}</th>))}
            </tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.description}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn" onClick={() => openEdit(r)}>Szerkesztés</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(r.id)}>Törlés</button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
        {selectedRole && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setSelectedRole(null)}>×</button>
              <h2>Szerepkör szerkesztése</h2>
              <form onSubmit={handleEdit}>
                <label>Név:</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                <div className="btn-row">
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn" type="button" onClick={() => setSelectedRole(null)}>Mégse</button>
                </div>
              </form>
            </div>
          </div>)}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
              <h2>Új szerepkör</h2>
              <form onSubmit={handleCreate}>
                <label>Név:</label>
                <input className="form-input" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} required />
                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
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
