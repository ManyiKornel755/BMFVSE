import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Emails() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [manualEmails, setManualEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    api.get('/members').then(res => setMembers(res.data || [])).catch(console.error);
    api.get('/groups').then(res => setGroups(res.data || [])).catch(console.error);
  }, []);

  function toggleEmail(email) {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  }

  function selectAll() {
    setSelectedEmails(members.map(m => m.email));
  }

  async function toggleGroup(groupId) {
    if (selectedGroups.includes(groupId)) {
      // Remove group and its members' emails
      setSelectedGroups(prev => prev.filter(g => g !== groupId));
      try {
        const res = await api.get(`/groups/${groupId}/members`);
        const groupEmails = res.data.map(m => m.email);
        setSelectedEmails(prev => prev.filter(email => !groupEmails.includes(email)));
      } catch(err) {
        console.error('Error removing group emails:', err);
      }
    } else {
      // Add group and its members' emails
      setSelectedGroups(prev => [...prev, groupId]);
      try {
        const res = await api.get(`/groups/${groupId}/members`);
        const groupEmails = res.data.map(m => m.email);
        setSelectedEmails(prev => [...new Set([...prev, ...groupEmails])]);
      } catch(err) {
        console.error('Error adding group emails:', err);
      }
    }
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
      setSubject(''); setContent(''); setSelectedEmails([]); setSelectedGroups([]); setManualEmails('');
    } catch(err) {
      setFeedback({ type: 'error', message: 'Hiba az email küldésekor: ' + (err.response?.data?.message || err.message) });
    } finally { setLoading(false); }
  }

  if (!isAdmin()) return <div className="main-content"><Navbar /><div className="container"><p>Hozzáférés megtagadva.</p></div></div>;

  return (
    <div className="main-content"><Navbar />
      <div className="container">
        <h1 style={{textAlign: 'center', marginBottom: '32px'}}>Email Küldése</h1>
        {feedback && (
          <div className={`feedback feedback-${feedback.type}`}>
            {feedback.message}
          </div>)}
        <div className="grid-2">
          <div>
            <div className="card" style={{marginBottom: '20px'}}>
              <h2 style={{color: '#1976D2', marginBottom: '12px'}}>Csoportok</h2>
              <div className="scroll-list">
                {groups.map(g => (
                  <label key={g.id} className="email-member-item">
                    <input type="checkbox" checked={selectedGroups.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                    <span>{g.name}</span>
                    <span className="email-address">{g.member_count || 0} tag</span>
                  </label>))}
              </div>
            </div>
            <div className="card">
              <h2 style={{color: '#1976D2', marginBottom: '12px'}}>Tagok</h2>
              <button className="btn-select-all" onClick={selectAll}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '6px'}}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Összes tag kijelölése
              </button>
              <div className="scroll-list">
                {members.map(m => (
                  <label key={m.id} className="email-member-item">
                    <input type="checkbox" checked={selectedEmails.includes(m.email)} onChange={() => toggleEmail(m.email)} />
                    <span>{m.first_name} {m.last_name}</span>
                    <span className="email-address">{m.email}</span>
                  </label>))}
              </div>
            </div>
          </div>
          <div>
            <div className="card">
              <h2 style={{color: '#1976D2'}}>Kijelölt címzettek ({selectedEmails.length})</h2>
              <div className="scroll-list-sm">
                {selectedEmails.map(e => <div key={e} className="email-small">{e}</div>)}
              </div>
              <label style={{color: '#1976D2', fontWeight: '600'}}>Egyedi email címek (vesszővel elválasztva):</label>
              <input className="form-input" value={manualEmails} onChange={e => setManualEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" />
            </div>
            <div className="card">
              <h2 style={{color: '#1976D2'}}>Email</h2>
              <form onSubmit={handleSend}>
                <label>Tárgy:</label>
                <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)} required />
                <label>Tartalom:</label>
                <textarea className="form-input" rows={6} value={content} onChange={e => setContent(e.target.value)} required />
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Küldés...' : 'Email küldése'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
