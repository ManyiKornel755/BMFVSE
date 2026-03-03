import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Messages() {
  const { isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '' });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [mRes, membRes] = await Promise.all([api.get('/messages'), api.get('/members')]);
      setMessages(mRes.data || []); setMembers(membRes.data || []);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/messages', { ...createForm, status: 'draft' });
      alert('Hírlevél vázlat létrehozva!');
      setShowCreate(false);
      setCreateForm({ title: '', content: '' });
      setSelectedRecipients([]);
      fetchAll();
    } catch(err) { alert('Hiba a létrehozás során!'); }
  }

  async function handleSend(msg) {
    try {
      await api.post(`/messages/${msg.id}/send`);
      alert('Hírlevél elküldve!');
      fetchAll();
    } catch(err) { alert('Hiba a küldés során!'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli?')) return;
    try { await api.delete(`/messages/${id}`); fetchAll(); }
    catch(err) { alert('Hiba!'); }
  }

  function toggleRecipient(email) {
    setSelectedRecipients(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  }

  return (
    <div><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Hírlevelek</h1>
          {isAdmin() && <button className="btn" onClick={() => setShowCreate(true)}>Új hírlevél</button>}
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card">
          {messages.length === 0 && <p>Nincsenek hírlevelek.</p>}
          {messages.map(msg => (
            <div key={msg.id} className="message-item">
              <div className="message-item-body" onClick={() => setSelectedMessage(msg)}>
                <strong>{msg.title}</strong>
                <p>{msg.content ? msg.content.substring(0, 100) + '...' : ''}</p>
                <div className="message-item-meta">
                  <span className={`badge badge-sm badge-${msg.status}`}>
                    {msg.status === 'sent' ? 'Elküldve' : 'Vázlat'}
                  </span>
                  <small className="text-faint">{new Date(msg.created_at).toLocaleDateString('hu-HU')}</small>
                </div>
              </div>
              {isAdmin() && (
                <div className="message-item-actions">
                  {msg.status === 'draft' && <button className="btn" onClick={() => handleSend(msg)}>Küldés</button>}
                  <button className="btn btn-danger" onClick={() => handleDelete(msg.id)}>Törlés</button>
                </div>)}
            </div>))}
        </div>
        {selectedMessage && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setSelectedMessage(null)}>×</button>
              <h2>{selectedMessage.title}</h2>
              <p className="message-detail-content">{selectedMessage.content}</p>
              <p><small>Létrehozva: {new Date(selectedMessage.created_at).toLocaleString('hu-HU')}</small></p>
              {selectedMessage.sent_at && <p><small>Elküldve: {new Date(selectedMessage.sent_at).toLocaleString('hu-HU')}</small></p>}
              <span className={`badge badge-sm badge-${selectedMessage.status}`}>
                {selectedMessage.status === 'sent' ? 'Elküldve' : 'Vázlat'}
              </span>
              <br />
              <button className="btn mt-16" onClick={() => setSelectedMessage(null)}>Bezárás</button>
            </div>
          </div>)}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
              <h2>Új hírlevél</h2>
              <form onSubmit={handleCreate}>
                <label>Tárgy:</label>
                <input className="form-input" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} required />
                <label>Tartalom:</label>
                <textarea className="form-input" rows={5} value={createForm.content} onChange={e => setCreateForm({...createForm, content: e.target.value})} required />
                <label>Címzettek:</label>
                <div className="recipients-scroll">
                  {members.map(m => (
                    <label key={m.id} className="recipient-label">
                      <input type="checkbox" checked={selectedRecipients.includes(m.email)} onChange={() => toggleRecipient(m.email)} />
                      {m.first_name} {m.last_name} ({m.email})
                    </label>))}
                </div>
                <div className="btn-row">
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
