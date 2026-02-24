import React, { useState, useEffect } from 'react';
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
      const res = await api.post('/messages', { ...createForm, status: 'draft' });
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
    } catch(err) { alert('Hiba a kldés során!'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli?')) return;
    try { await api.delete(`/messages/${id}`); fetchAll(); }
    catch(err) { alert('Hiba!'); }
  }

  function toggleRecipient(email) {
    setSelectedRecipients(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  }

  const mbd = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const mbx = { background: 'white', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' };
  const inp = { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' };
  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Hírlevelek</h1>
          {isAdmin() && <button className="btn" onClick={() => setShowCreate(true)}>Új hírlevél</button>}
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="card" style={{ padding: '20px' }}>
          {messages.length === 0 && <p>Nincsenek hírlevelek.</p>}
          {messages.map(msg => (
            <div key={msg.id} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelectedMessage(msg)}>
                <strong>{msg.title}</strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: '0.9rem' }}>{msg.content ? msg.content.substring(0, 100) + '...' : ''}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', background: msg.status === 'sent' ? '#4caf50' : '#ff9800', color: 'white' }}>
                    {msg.status === 'sent' ? 'Elküldve' : 'Vázlat'}</span>
                  <small style={{ color: '#999' }}>{new Date(msg.created_at).toLocaleDateString('hu-HU')}</small>
                </div>
              </div>
              {isAdmin() && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  {msg.status === 'draft' && <button className="btn" onClick={() => handleSend(msg)}>Kldés</button>}
                  <button className="btn btn-danger" onClick={() => handleDelete(msg.id)}>Törlés</button>
                </div>)}
            </div>))}
        </div>
        {selectedMessage && (
          <div style={mbd} onClick={() => setSelectedMessage(null)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>{selectedMessage.title}</h2>
              <p style={{ color: '#555', lineHeight: 1.6 }}>{selectedMessage.content}</p>
              <p><small>Létrehozva: {new Date(selectedMessage.created_at).toLocaleString('hu-HU')}</small></p>
              {selectedMessage.sent_at && <p><small>Elküldve: {new Date(selectedMessage.sent_at).toLocaleString('hu-HU')}</small></p>}
              <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', background: selectedMessage.status === 'sent' ? '#4caf50' : '#ff9800', color: 'white' }}>
                {selectedMessage.status === 'sent' ? 'Elküldve' : 'Vázlat'}</span>
              <br /><button className="btn" style={{ marginTop: '16px' }} onClick={() => setSelectedMessage(null)}>Bezárás</button>
            </div></div>)}
        {showCreate && (
          <div style={mbd} onClick={() => setShowCreate(false)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>Új hírlevél</h2>
              <form onSubmit={handleCreate}>
                <label>Tárgy:</label>
                <input style={inp} value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} required />
                <label>Tartalom:</label>
                <textarea style={inp} rows={5} value={createForm.content} onChange={e => setCreateForm({...createForm, content: e.target.value})} required />
                <label>Címzettek:</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', marginBottom: '12px' }}>
                  {members.map(m => (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedRecipients.includes(m.email)} onChange={() => toggleRecipient(m.email)} />
                      {m.first_name} {m.last_name} ({m.email})
                    </label>))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn" type="submit">Létrehozás (vázlat)</button>
                  <button className="btn" type="button" onClick={() => setShowCreate(false)}>Mégse</button>
                </div>
              </form>
            </div></div>)}
      </div>
    </div>
  );
}
