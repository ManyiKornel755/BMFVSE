import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Roles() {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', permissions: [] });
  const [createForm, setCreateForm] = useState({ name: '', description: '', permissions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRoles(); fetchPermissions(); }, []);

  async function fetchRoles() {
    try { const res = await api.get('/roles'); setRoles(res.data || []); }
    catch(err) { console.error(err); } finally { setLoading(false); }
  }

  async function fetchPermissions() {
    try { const res = await api.get('/roles/permissions/all'); setPermissions(res.data || []); }
    catch(err) { console.error(err); }
  }

  function openEdit(r) {
    setSelectedRole(r);
    setEditForm({
      name: r.name,
      description: r.description || '',
      permissions: r.permissions ? r.permissions.map(p => p.id) : []
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/roles', createForm);
      alert('Szerepkör létrehozva!');
      setShowCreate(false);
      setCreateForm({ name: '', description: '', permissions: [] });
      fetchRoles();
    } catch(err) {
      alert('Hiba!');
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      await api.put(`/roles/${selectedRole.id}`, editForm);
      alert('Szerepkör frissítve!');
      setSelectedRole(null);
      fetchRoles();
    } catch(err) {
      alert('Hiba!');
    }
  }

  function togglePermission(permId, isCreate = false) {
    const form = isCreate ? createForm : editForm;
    const setForm = isCreate ? setCreateForm : setEditForm;
    const currentPerms = form.permissions || [];

    if (currentPerms.includes(permId)) {
      setForm({ ...form, permissions: currentPerms.filter(id => id !== permId) });
    } else {
      setForm({ ...form, permissions: [...currentPerms, permId] });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli ezt a szerepkört?')) return;
    try { await api.delete(`/roles/${id}`); alert('Szerepkör törölve!'); fetchRoles(); }
    catch(err) { alert('Hiba!'); }
  }

  if (!isAdmin()) return <div className="main-content"><Navbar /><div className="container"><p>Hozzáférés megtagadva.</p></div></div>;

  return (
    <div className="main-content"><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Szerepkörök</h1>
          <button className="btn-add" onClick={() => setShowCreate(true)}>Hozzáadás</button>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card">
          <table className="data-table">
            <thead><tr>
              {['ID', 'Név', 'Leírás', 'Jogosultságok', 'Műveletek'].map(h => (
                <th key={h}>{h}</th>))}
            </tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.description}</td>
                  <td>
                    {r.permissions && r.permissions.length > 0 ? (
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                        {r.permissions.map(p => (
                          <span key={p.id} style={{
                            background: '#e3f2fd',
                            color: '#1976D2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {p.description}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{color: '#999'}}>Nincs jogosultság</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="btn" onClick={() => openEdit(r)}>Szerkesztés</button>
                      <button className="btn-danger" onClick={() => handleDelete(r.id)}>Törlés</button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
        {selectedRole && (
          <div className="modal-overlay">
            <div className="modal-box" style={{maxWidth: '600px', maxHeight: '80vh', overflow: 'auto'}}>
              <button className="modal-close-btn" onClick={() => setSelectedRole(null)}>×</button>
              <h2>Szerepkör szerkesztése</h2>
              <form onSubmit={handleEdit}>
                <label>Név:</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />

                <label style={{marginTop: '16px', display: 'block', marginBottom: '12px'}}>Jogosultságok:</label>
                <div style={{
                  border: '1px solid #42A5F5',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  background: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {permissions.map(perm => (
                    <label key={perm.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      background: editForm.permissions.includes(perm.id) ? 'rgba(30, 136, 229, 0.1)' : 'transparent'
                    }}>
                      <input
                        type="checkbox"
                        checked={editForm.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id, false)}
                        style={{marginRight: '8px'}}
                      />
                      <div>
                        <div style={{fontWeight: 500, color: '#0D47A1'}}>{perm.description}</div>
                        <div style={{fontSize: '12px', color: '#1976D2'}}>{perm.name}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="btn-row" style={{marginTop: '16px'}}>
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn" type="button" onClick={() => setSelectedRole(null)}>Mégse</button>
                </div>
              </form>
            </div>
          </div>)}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-box" style={{maxWidth: '600px', maxHeight: '80vh', overflow: 'auto'}}>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
              <h2>Új szerepkör</h2>
              <form onSubmit={handleCreate}>
                <label>Név:</label>
                <input className="form-input" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} required />
                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />

                <label style={{marginTop: '16px', display: 'block', marginBottom: '12px'}}>Jogosultságok:</label>
                <div style={{
                  border: '1px solid #42A5F5',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  background: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {permissions.map(perm => (
                    <label key={perm.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      background: createForm.permissions.includes(perm.id) ? 'rgba(30, 136, 229, 0.1)' : 'transparent'
                    }}>
                      <input
                        type="checkbox"
                        checked={createForm.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id, true)}
                        style={{marginRight: '8px'}}
                      />
                      <div>
                        <div style={{fontWeight: 500, color: '#0D47A1'}}>{perm.description}</div>
                        <div style={{fontSize: '12px', color: '#1976D2'}}>{perm.name}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="btn-row" style={{marginTop: '16px'}}>
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
