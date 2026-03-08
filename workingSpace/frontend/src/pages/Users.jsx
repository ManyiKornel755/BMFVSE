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
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    address: '',
    birth_date: ''
  });
  const [parentForm, setParentForm] = useState({
    parent_name: '',
    parent_email: '',
    parent_phone: ''
  });
  const [activeTab, setActiveTab] = useState('user');
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
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      address: u.address || '',
      birth_date: u.birth_date ? new Date(u.birth_date).toISOString().split('T')[0] : '',
      parent_name: u.parent_name || '',
      parent_email: u.parent_email || '',
      parent_phone: u.parent_phone || ''
    });
    const currentRole = Array.isArray(u.roles) && u.roles.length > 0 ? String(u.roles[0].id) : '';
    setSelectedRoleId(currentRole);
  }

  function calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  async function handleCreate(e) {
    e.preventDefault();

    // Validáció
    if (createForm.password !== createForm.passwordConfirm) {
      alert('A jelszavak nem egyeznek!');
      return;
    }

    const age = calculateAge(createForm.birth_date);
    if (age !== null && age < 14) {
      if (!parentForm.parent_name || !parentForm.parent_email || !parentForm.parent_phone) {
        alert('14 év alatti felhasználóhoz kötelező kitölteni a szülői fiók adatait!');
        return;
      }
    }

    try {
      const userData = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        phone: createForm.phone,
        address: createForm.address,
        birth_date: createForm.birth_date
      };

      // Szülői adatok hozzáadása, ha szükséges
      if (age !== null && age < 14) {
        userData.parent_name = parentForm.parent_name;
        userData.parent_email = parentForm.parent_email;
        userData.parent_phone = parentForm.parent_phone;
      }

      const res = await api.post('/users', userData);
      const newId = res.data.user?.id || res.data.id;
      if (createSelectedRoleId) {
        await api.post(`/roles/${createSelectedRoleId}/assign/${newId}`);
      }
      alert('Felhasználó sikeresen létrehozva!');
      setShowCreate(false);
      setCreateForm({ name: '', email: '', password: '', passwordConfirm: '', phone: '', address: '', birth_date: '' });
      setParentForm({ parent_name: '', parent_email: '', parent_phone: '' });
      setCreateSelectedRoleId('');
      setActiveTab('user');
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

  if (!isAdmin()) return <div className="main-content"><Navbar /><div className="container"><p>Hozzáférés megtagadva.</p></div></div>;

  return (
    <div className="main-content"><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Felhasználók</h1>
          <button className="btn-add" onClick={() => setShowCreate(true)}>Hozzáadás</button>
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
                    <button className="btn-danger btn-sm" style={{marginLeft:'6px'}} onClick={() => handleDelete(u.id)}>Törlés</button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal-box" style={{maxHeight: '90vh', overflowY: 'auto'}}>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>×</button>
              <h2>{selectedUser.name}</h2>
              <form onSubmit={handleEdit}>
                <label>Név:</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                <label>Email:</label>
                <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                <label>Telefon:</label>
                <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                <label>Születési dátum:</label>
                <input
                  className="form-input"
                  type="date"
                  value={editForm.birth_date}
                  onChange={e => setEditForm({...editForm, birth_date: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                />
                {editForm.birth_date && (
                  <p style={{fontSize: '14px', color: '#1976D2', marginTop: '4px', marginBottom: '12px'}}>
                    Életkor: <strong>{calculateAge(editForm.birth_date)} év</strong>
                  </p>
                )}
                <label>Cím:</label>
                <input className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />

                <hr className="hr-divider" />
                <h3>Szülői adatok {editForm.birth_date && calculateAge(editForm.birth_date) < 14 && <span style={{color: '#ff5252', fontSize: '12px', marginLeft: '8px'}}>(Kötelező 14 év alatt)</span>}</h3>
                <label>Szülő neve:</label>
                <input className="form-input" value={editForm.parent_name} onChange={e => setEditForm({...editForm, parent_name: e.target.value})} placeholder="Szülő teljes neve" />
                <label>Szülő email:</label>
                <input className="form-input" type="email" value={editForm.parent_email} onChange={e => setEditForm({...editForm, parent_email: e.target.value})} placeholder="szulo@email.hu" />
                <label>Szülő telefon:</label>
                <input className="form-input" type="tel" value={editForm.parent_phone} onChange={e => setEditForm({...editForm, parent_phone: e.target.value})} placeholder="+36 30 123 4567" />

                <div className="btn-row">
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn-danger" type="button" onClick={() => handleDelete(selectedUser.id)}>Törlés</button>
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
            <div className="user-create-modal">
              {/* Gradient Header */}
              <div className="user-create-header">
                <h2>Új Felhasználó Létrehozása</h2>
                <button className="modal-close-btn-new" onClick={() => {
                  setShowCreate(false);
                  setActiveTab('user');
                  setCreateForm({ name: '', email: '', password: '', passwordConfirm: '', phone: '', address: '', birth_date: '' });
                  setParentForm({ parent_name: '', parent_email: '', parent_phone: '' });
                }}>×</button>
              </div>

              {/* Tab Navigation */}
              <div className="user-create-tabs">
                <button
                  className={`user-tab ${activeTab === 'user' ? 'active' : ''}`}
                  onClick={() => setActiveTab('user')}
                >
                  Felhasználói Adatok
                </button>
                <button
                  className={`user-tab ${activeTab === 'parent' ? 'active' : ''} ${calculateAge(createForm.birth_date) >= 14 || !createForm.birth_date ? 'disabled' : ''}`}
                  onClick={() => {
                    const age = calculateAge(createForm.birth_date);
                    if (age !== null && age < 14) {
                      setActiveTab('parent');
                    }
                  }}
                  disabled={calculateAge(createForm.birth_date) >= 14 || !createForm.birth_date}
                >
                  Szülői Fiók
                  {calculateAge(createForm.birth_date) !== null && calculateAge(createForm.birth_date) < 14 && (
                    <span className="required-badge">Kötelező</span>
                  )}
                </button>
              </div>

              <form onSubmit={handleCreate} className="user-create-form">
                {/* Felhasználói Adatok Tab */}
                {activeTab === 'user' && (
                  <div className="tab-content">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label-new">Teljes Név <span className="required-star">*</span></label>
                        <input
                          className="form-input-new"
                          value={createForm.name}
                          onChange={e => setCreateForm({...createForm, name: e.target.value})}
                          placeholder="Kovács János"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label-new">Email <span className="required-star">*</span></label>
                        <input
                          className="form-input-new"
                          type="email"
                          value={createForm.email}
                          onChange={e => setCreateForm({...createForm, email: e.target.value})}
                          placeholder="pelda@bmfvse.hu"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row-split">
                      <div className="form-group">
                        <label className="form-label-new">Jelszó <span className="required-star">*</span></label>
                        <input
                          className="form-input-new"
                          type="password"
                          value={createForm.password}
                          onChange={e => setCreateForm({...createForm, password: e.target.value})}
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label-new">Jelszó megerősítése <span className="required-star">*</span></label>
                        <input
                          className="form-input-new"
                          type="password"
                          value={createForm.passwordConfirm}
                          onChange={e => setCreateForm({...createForm, passwordConfirm: e.target.value})}
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label-new">Telefonszám</label>
                        <input
                          className="form-input-new"
                          type="tel"
                          value={createForm.phone}
                          onChange={e => setCreateForm({...createForm, phone: e.target.value})}
                          placeholder="+36 20 123 4567"
                        />
                      </div>
                    </div>

                    <div className="form-row-split">
                      <div className="form-group">
                        <label className="form-label-new">Születési Dátum <span className="required-star">*</span></label>
                        <input
                          className="form-input-new"
                          type="date"
                          value={createForm.birth_date}
                          onChange={e => setCreateForm({...createForm, birth_date: e.target.value})}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label-new">Életkor</label>
                        <div className="age-display">
                          {createForm.birth_date ? (
                            <span className="age-value">{calculateAge(createForm.birth_date)} év</span>
                          ) : (
                            <span className="age-placeholder">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {calculateAge(createForm.birth_date) !== null && calculateAge(createForm.birth_date) < 14 && (
                      <div className="warning-box">
                        <div className="warning-icon">⚠</div>
                        <div className="warning-text">
                          <strong>Figyelem!</strong> A felhasználó 14 év alatti, szülői fiók megadása kötelező.
                          Kérjük, töltse ki a "Szülői Fiók" fület is!
                        </div>
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label-new">Cím</label>
                        <input
                          className="form-input-new"
                          value={createForm.address}
                          onChange={e => setCreateForm({...createForm, address: e.target.value})}
                          placeholder="1234 Budapest, Példa utca 12."
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label-new">Szerepkör</label>
                        <select
                          className="form-select-new"
                          value={createSelectedRoleId}
                          onChange={e => setCreateSelectedRoleId(e.target.value)}
                        >
                          <option value="">-- Nincs szerepkör --</option>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Szülői Fiók Tab */}
                {activeTab === 'parent' && (
                  <div className="tab-content">
                    <div className="parent-form-section">
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label-new">Szülő Neve <span className="required-star">*</span></label>
                          <input
                            className="form-input-new"
                            value={parentForm.parent_name}
                            onChange={e => setParentForm({...parentForm, parent_name: e.target.value})}
                            placeholder="Kovács Mária"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label-new">Szülő Email <span className="required-star">*</span></label>
                          <input
                            className="form-input-new"
                            type="email"
                            value={parentForm.parent_email}
                            onChange={e => setParentForm({...parentForm, parent_email: e.target.value})}
                            placeholder="szulo@pelda.hu"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label-new">Szülő Telefon <span className="required-star">*</span></label>
                          <input
                            className="form-input-new"
                            type="tel"
                            value={parentForm.parent_phone}
                            onChange={e => setParentForm({...parentForm, parent_phone: e.target.value})}
                            placeholder="+36 30 123 4567"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="user-create-footer">
                  <button className="btn-cancel-new" type="button" onClick={() => {
                    setShowCreate(false);
                    setActiveTab('user');
                    setCreateForm({ name: '', email: '', password: '', passwordConfirm: '', phone: '', address: '', birth_date: '' });
                    setParentForm({ parent_name: '', parent_email: '', parent_phone: '' });
                  }}>
                    Mégse
                  </button>
                  <button className="btn-save-new" type="submit">
                    Mentés
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
