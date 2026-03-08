import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Messages() {
  const { isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '', expires_at: '' });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [filterStatus, setFilterStatus] = useState('draft');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [mRes, membRes, grpRes] = await Promise.all([
        api.get('/messages'),
        api.get('/members'),
        api.get('/groups')
      ]);
      setMessages(mRes.data || []);
      setMembers(membRes.data || []);
      setGroups(grpRes.data || []);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (selectedRecipients.length === 0) {
      alert('Válassz ki legalább egy címzettet!');
      return;
    }
    try {
      await api.post('/messages', {
        ...createForm,
        status: 'draft',
        recipients: selectedRecipients
      });
      alert('Közlemény vázlat létrehozva!');
      setShowCreate(false);
      setCreateForm({ title: '', content: '', expires_at: '' });
      setSelectedRecipients([]);
      setSelectedGroups([]);
      fetchAll();
    } catch(err) { alert('Hiba a létrehozás során!'); }
  }

  async function handleSend(msg) {
    try {
      await api.post(`/messages/${msg.id}/send`);
      alert('Közlemény elküldve!');
      fetchAll();
    } catch(err) { alert('Hiba a küldés során!'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli?')) return;
    try { await api.delete(`/messages/${id}`); fetchAll(); }
    catch(err) { alert('Hiba!'); }
  }

  function toggleRecipient(userId) {
    setSelectedRecipients(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  }

  async function toggleGroup(groupId) {
    if (selectedGroups.includes(groupId)) {
      // Remove group and its members' IDs
      setSelectedGroups(prev => prev.filter(g => g !== groupId));
      try {
        const res = await api.get(`/groups/${groupId}/members`);
        const groupUserIds = res.data.map(m => m.id);
        setSelectedRecipients(prev => prev.filter(id => !groupUserIds.includes(id)));
      } catch(err) {
        console.error('Error removing group members:', err);
      }
    } else {
      // Add group and its members' IDs
      setSelectedGroups(prev => [...prev, groupId]);
      try {
        const res = await api.get(`/groups/${groupId}/members`);
        const groupUserIds = res.data.map(m => m.id);
        setSelectedRecipients(prev => [...new Set([...prev, ...groupUserIds])]);
      } catch(err) {
        console.error('Error adding group members:', err);
      }
    }
  }

  function selectAllMembers() {
    setSelectedRecipients(members.map(m => m.id));
  }

  function creatorLabel(msg) {
    if (!msg.creator_name) return '—';
    if (msg.creator_role === 'admin') return 'Admin';
    return msg.creator_name;
  }

  const draftMessages = messages.filter(m => m.status === 'draft' && !m.deleted_at);

  // Lejárt üzenetek: törölt vagy lejárt üzenetek
  const expiredMessages = messages.filter(m => {
    // Ha törölve van, akkor lejárt
    if (m.deleted_at) return true;

    // Ha van expires_at és már lejárt
    if (m.expires_at) {
      const expiryDate = new Date(m.expires_at);
      const now = new Date();
      return expiryDate <= now;
    }

    return false;
  });

  // Aktív üzenetek: nem törölt és nem lejárt elküldött üzenetek
  const activeMessages = messages.filter(m => {
    if (m.status !== 'sent') return false;
    if (m.deleted_at) return false;

    if (m.expires_at) {
      const expiryDate = new Date(m.expires_at);
      const now = new Date();
      return expiryDate > now;
    }

    return true;
  });

  let displayedMessages = [];
  if (filterStatus === 'draft') displayedMessages = draftMessages;
  else if (filterStatus === 'active') displayedMessages = activeMessages;
  else if (filterStatus === 'expired') displayedMessages = expiredMessages;

  return (
    <div className="main-content"><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Közlemények</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdmin() && (
              <select
                className="message-filter-dropdown"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="draft">Vázlatok</option>
                <option value="active">Aktív üzenetek</option>
                <option value="expired">Lejárt üzenetek</option>
              </select>
            )}
            {isAdmin() && <button className="btn-add" onClick={() => setShowCreate(true)}>Hozzáadás</button>}
          </div>
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card">
          {displayedMessages.length === 0 && (
            <p>
              {filterStatus === 'draft' && 'Nincsenek vázlatok.'}
              {filterStatus === 'active' && 'Nincsenek aktív üzenetek.'}
              {filterStatus === 'expired' && 'Nincsenek lejárt üzenetek.'}
            </p>
          )}
          {displayedMessages.map(msg => (
            <div key={msg.id} className="message-item">
              <div className="message-item-body" onClick={() => setSelectedMessage(msg)}>
                <strong>{msg.title}</strong>
                <p>{msg.content ? msg.content.substring(0, 100) + '...' : ''}</p>
                <div className="message-item-meta">
                  {msg.deleted_at ? (
                    <span className="badge badge-sm badge-danger">Törölve</span>
                  ) : msg.expires_at && new Date(msg.expires_at) <= new Date() ? (
                    <span className="badge badge-sm badge-danger">Lejárt</span>
                  ) : (
                    <span className={`badge badge-sm badge-${msg.status}`}>
                      {msg.status === 'sent' ? 'Elküldve' : 'Vázlat'}
                    </span>
                  )}
                  {msg.expires_at && new Date(msg.expires_at) > new Date() && !msg.deleted_at && (
                    <span className="badge badge-sm badge-warning" style={{background: '#ffa726'}}>
                      Lejár: {new Date(msg.expires_at).toLocaleDateString('hu-HU')}
                    </span>
                  )}
                  <small className="text-faint">
                    Létrehozta: {creatorLabel(msg)} · {new Date(msg.created_at).toLocaleDateString('hu-HU')}
                  </small>
                </div>
              </div>
              {isAdmin() && (
                <div className="message-item-actions">
                  {msg.status === 'draft' && <button className="btn" onClick={() => handleSend(msg)}>Küldés</button>}
                  <button className="btn-danger" onClick={() => handleDelete(msg.id)}>Törlés</button>
                </div>)}
            </div>))}
        </div>
        {selectedMessage && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setSelectedMessage(null)}>×</button>
              <h2>{selectedMessage.title}</h2>
              <p className="message-detail-content">{selectedMessage.content}</p>
              <p><small>Létrehozta: <strong>{creatorLabel(selectedMessage)}</strong></small></p>
              <p><small>Létrehozva: {new Date(selectedMessage.created_at).toLocaleString('hu-HU')}</small></p>
              {selectedMessage.sent_at && <p><small>Elküldve: {new Date(selectedMessage.sent_at).toLocaleString('hu-HU')}</small></p>}
              {selectedMessage.expires_at && (
                <p><small>Lejár: {new Date(selectedMessage.expires_at).toLocaleString('hu-HU')}</small></p>
              )}
              {selectedMessage.deleted_at && (
                <p><small style={{color: '#dc3545'}}>Törölve: {new Date(selectedMessage.deleted_at).toLocaleString('hu-HU')}</small></p>
              )}
              {selectedMessage.deleted_at ? (
                <span className="badge badge-sm badge-danger">Törölve</span>
              ) : selectedMessage.expires_at && new Date(selectedMessage.expires_at) <= new Date() ? (
                <span className="badge badge-sm badge-danger">Lejárt</span>
              ) : (
                <span className={`badge badge-sm badge-${selectedMessage.status}`}>
                  {selectedMessage.status === 'sent' ? 'Elküldve' : 'Vázlat'}
                </span>
              )}
              <br />
              <button className="btn mt-16" onClick={() => setSelectedMessage(null)}>Bezárás</button>
            </div>
          </div>)}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-box" style={{maxWidth: '900px', width: '90%'}}>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
              <h2>Új közlemény</h2>
              <form onSubmit={handleCreate}>
                <label>Tárgy:</label>
                <input className="form-input" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} required />
                <label>Tartalom:</label>
                <textarea className="form-input" rows={5} value={createForm.content} onChange={e => setCreateForm({...createForm, content: e.target.value})} required />
                <label>Lejárati dátum (opcionális):</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={createForm.expires_at}
                  onChange={e => setCreateForm({...createForm, expires_at: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <small style={{display: 'block', marginBottom: '12px', color: '#666'}}>
                  Ha megadsz lejárati dátumot, az üzenet automatikusan átkerül a lejárt üzenetek közé.
                </small>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px'}}>
                  <div>
                    <label style={{fontWeight: '600', color: '#1976D2', marginBottom: '8px', display: 'block'}}>
                      Csoportok
                    </label>
                    <div className="recipients-scroll" style={{maxHeight: '200px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px'}}>
                      {groups.map(g => (
                        <label key={g.id} className="recipient-label" style={{display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer'}}>
                          <input type="checkbox" checked={selectedGroups.includes(g.id)} onChange={() => toggleGroup(g.id)} style={{marginRight: '8px'}} />
                          <span>{g.name} ({g.member_count || 0} tag)</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                      <label style={{fontWeight: '600', color: '#1976D2'}}>
                        Tagok
                      </label>
                      <button type="button" onClick={selectAllMembers} className="btn" style={{padding: '4px 8px', fontSize: '12px'}}>
                        Összes kijelölése
                      </button>
                    </div>
                    <div className="recipients-scroll" style={{maxHeight: '200px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px'}}>
                      {members.map(m => (
                        <label key={m.id} className="recipient-label" style={{display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer'}}>
                          <input type="checkbox" checked={selectedRecipients.includes(m.id)} onChange={() => toggleRecipient(m.id)} style={{marginRight: '8px'}} />
                          <span>{m.first_name} {m.last_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{marginTop: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px'}}>
                  <strong>Kijelölt címzettek: {selectedRecipients.length}</strong>
                </div>

                <div className="btn-row" style={{marginTop: '16px'}}>
                  <button className="btn" type="submit">Létrehozás (vázlat)</button>
                  <button className="btn" type="button" onClick={() => setShowCreate(false)}>Mégse</button>
                </div>
              </form>
            </div>
          </div>)}
      </div>
    </div>
  );
}
