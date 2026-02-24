import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingDetail, setTrainingDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    try {
      const [mRes, msgRes, tRes] = await Promise.all([api.get('/members'), api.get('/messages'), api.get('/trainings')]);
      setMembers(mRes.data||[]); setMessages(msgRes.data||[]); setTrainings(tRes.data||[]);
    } catch(err){console.error(err);} finally{setLoading(false);}
  }
  async function openTraining(training) {
    setSelectedTraining(training); setTrainingDetail(null);
    try { const res = await api.get(`/trainings/${training.id}`); setTrainingDetail(res.data); }
    catch(err) { setTrainingDetail(training); }
  }
  async function handleRegister(id) {
    try { await api.post(`/events/${id}/register`); setRegisteredEvents(p=>[...p,id]); alert('Sikeresen feliratkozott!'); }
    catch(err) { alert('Hiba!'); }
  }
  async function handleUnregister(id) {
    try { await api.delete(`/events/${id}/register`); setRegisteredEvents(p=>p.filter(x=>x!==id)); alert('Sikeresen leiratkozott!'); }
    catch(err) { alert('Hiba!'); }
  }
  const activeMembers = members.filter(m => m.membership_status === 'active');
  const draftMessages = messages.filter(m => m.status === 'draft');
  const sentMessages = messages.filter(m => m.status === 'sent');
  const recentMembers = members.slice(0, 5);
  const upcomingTrainings = trainings.filter(t => new Date(t.event_date) >= new Date());
  const statusColor = s => s === 'active' ? '#4caf50' : '#f44336';
  const statusLabel = { active: 'Aktiv', inactive: 'Inaktiv', pending: 'Fuggoben' };
  const mbd = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const mbx = { background: 'white', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' };
  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <h1>Vezerlopult</h1>
        {loading && <p>Betoltes...</p>}
        {isAdmin() && (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
              {[
                { label: 'Osszes tag', value: members.length },
                { label: 'Aktiv tagok', value: activeMembers.length },
                { label: 'Hirlevelek szama', value: sentMessages.length },
                { label: 'Tervezett hirlevelek', value: draftMessages.length },
              ].map(card => (
                <div key={card.label} className="card" style={{ flex: 1, minWidth: '180px', padding: '20px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>{card.value}</h2>
                  <p style={{ margin: '8px 0 0' }}>{card.label}</p>
                </div>))}
            </div>
            <div className="card" style={{ padding: '20px', marginBottom: '30px' }}>
              <h2>Legutobbi tagok</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid #ddd' }}>
                  {['Keresztnev', 'Vezeteknev', 'Email', 'Telefon', 'Allapot'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px' }}>{h}</th>))}
                </tr></thead><tbody>
                  {recentMembers.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{m.first_name}</td>
                      <td style={{ padding: '8px' }}>{m.last_name}</td>
                      <td style={{ padding: '8px' }}>{m.email}</td>
                      <td style={{ padding: '8px' }}>{m.phone}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ background: statusColor(m.membership_status), color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                          {statusLabel[m.membership_status] || m.membership_status}</span></td>
                    </tr>))}
                </tbody></table>
            </div>
          </>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h2>Uzenetek</h2>
            {messages.length === 0 && <p>Nincs uzenet.</p>}
            {messages.map(msg => (
              <div key={msg.id} onClick={() => setSelectedMessage(msg)}
                style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', borderRadius: '4px', marginBottom: '4px' }}>
                <strong>{msg.title}</strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: '0.9rem' }}>{msg.content ? msg.content.substring(0, 80) + '...' : ''}</p>
                <small style={{ color: '#999' }}>{new Date(msg.created_at).toLocaleDateString('hu-HU')}</small>
              </div>))}
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <h2>Kozelgo edzesek</h2>
            {upcomingTrainings.length === 0 && <p>Nincs kozelgo edzes.</p>}
            {upcomingTrainings.map(tr => (
              <div key={tr.id} onClick={() => openTraining(tr)}
                style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', borderRadius: '4px', marginBottom: '4px' }}>
                <strong>{tr.title}</strong>
                <p style={{ margin: '4px 0', color: '#555', fontSize: '0.9rem' }}>{new Date(tr.event_date).toLocaleString('hu-HU')}</p>
                <small style={{ color: '#777' }}>{tr.location}</small>
              </div>))}
          </div>
        </div>
        {selectedMessage && (
          <div style={mbd} onClick={() => setSelectedMessage(null)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>{selectedMessage.title}</h2>
              <p style={{ color: '#555', lineHeight: 1.6 }}>{selectedMessage.content}</p>
              <small style={{ color: '#999' }}>{new Date(selectedMessage.created_at).toLocaleString('hu-HU')}</small><br />
              <button className="btn" style={{ marginTop: '16px' }} onClick={() => setSelectedMessage(null)}>Bezaras</button>
            </div></div>)}
        {selectedTraining && (
          <div style={mbd} onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>{selectedTraining.title}</h2>
              <p><strong>Idopont:</strong> {new Date(selectedTraining.event_date).toLocaleString('hu-HU')}</p>
              <p><strong>Helyszin:</strong> {selectedTraining.location}</p>
              {trainingDetail && (<><p><strong>Leiras:</strong> {trainingDetail.description}</p>
                <p><strong>Resztvevok:</strong> {trainingDetail.participants_count ?? (trainingDetail.participants ? trainingDetail.participants.length : 0)}</p></> )}
              {!isAdmin() && (<div style={{ marginTop: '16px' }}>
                {registeredEvents.includes(selectedTraining.id) ? (
                  <button className="btn btn-danger" onClick={() => handleUnregister(selectedTraining.id)}>Leiratkozas</button>
                ) : (<button className="btn" onClick={() => handleRegister(selectedTraining.id)}>Jelentkezes</button>)}
              </div>)}
              <button className="btn" style={{ marginTop: '16px', marginLeft: '8px' }}
                onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>Bezaras</button>
            </div></div>)}
      </div>
    </div>
  );
}
