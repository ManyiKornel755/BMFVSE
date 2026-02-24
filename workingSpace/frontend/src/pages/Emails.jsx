import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Emails() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [manualEmails, setManualEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    api.get('/members').then(res => setMembers(res.data || [])).catch(console.error);
  }, []);

  function toggleEmail(email) {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  }

  function selectAll() {
    setSelectedEmails(members.map(m => m.email));
  }

  async function handleSend(e) {
    e.preventDefault();
    const manualList = manualEmails.split(',').map(s => s.trim()).filter(Boolean);
    const recipients = [...new Set([...selectedEmails, ...manualList])];
    if (recipients.length === 0) { alert('Nincs címzett!'); return; }
    if (!subject.trim()) { alert('A tárgy mező kötelező!'); return; }
    if (!content.trim()) { alert('A tartalom mező kötelező!'); return; }
    setLoading(true); setFeedback(null);
    try {
      await api.post('/emails/send', { recipients, subject, content });
      setFeedback({ type: 'success', message: 'Email sikeresen elküldve ' + recipients.length + ' címzettnek!' });
      setSubject(''); setContent(''); setSelectedEmails([]); setManualEmails('');
    } catch(err) {
      setFeedback({ type: 'error', message: 'Hiba az email kldésekor: ' + (err.response?.data?.message || err.message) });
    } finally { setLoading(false); }
  }

  if (!isAdmin()) return <div><Navbar /><div className="container" style={{ padding: '20px' }}><p>Hozzáférés megtagadva.</p></div></div>;

  const inp = { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' };

  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <h1>Email Kldés</h1>
        {feedback && (
          <div style={{ padding: '12px', borderRadius: '4px', marginBottom: '16px', background: feedback.type === 'success' ? '#e8f5e9' : '#ffebee', color: feedback.type === 'success' ? '#2e7d32' : '#c62828', border: '1px solid ' + (feedback.type === 'success' ? '#a5d6a7' : '#ef9a9a') }}>
            {feedback.message}
          </div>)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>Tagok</h2>
              <button className="btn" onClick={selectAll}>Összes kijelölése</button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {members.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                  <input type="checkbox" checked={selectedEmails.includes(m.email)} onChange={() => toggleEmail(m.email)} />
                  <span>{m.first_name} {m.last_name}</span>
                  <span style={{ color: '#777', fontSize: '0.85rem' }}>{m.email}</span>
                </label>))}
            </div>
          </div>
          <div>
            <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h2>Kijelölt címzettek ({selectedEmails.length})</h2>
              <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '8px' }}>
                {selectedEmails.map(e => <div key={e} style={{ fontSize: '0.85rem', padding: '2px 0' }}>{e}</div>)}
              </div>
              <label>Egyedi emailek (vesszvel elválasztva):</label>
              <input style={inp} value={manualEmails} onChange={e => setManualEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" />
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <h2>Uzenet</h2>
              <form onSubmit={handleSend}>
                <label>Tárgy:</label>
                <input style={inp} value={subject} onChange={e => setSubject(e.target.value)} required />
                <label>Tartalom:</label>
                <textarea style={inp} rows={6} value={content} onChange={e => setContent(e.target.value)} required />
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Kldés...' : 'Email kldése'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
