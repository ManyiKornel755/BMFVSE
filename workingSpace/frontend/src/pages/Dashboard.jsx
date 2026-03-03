import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { isAdmin } = useAuth();
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
      const [msgRes, tRes] = await Promise.all([api.get('/messages'), api.get('/trainings')]);
      setMessages(msgRes.data||[]); setTrainings(tRes.data||[]);
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

  const upcomingTrainings = trainings.filter(t => new Date(t.event_date) >= new Date());

  return (
    <div><Navbar />
      <div className="container">
        <h1>Hirdető tábla</h1>
        {loading && <p>Betöltés...</p>}
        <div className="grid-2">
          <div className="card">
            <h2>Üzenetek</h2>
            {messages.length === 0 && <p>Nincs üzenet.</p>}
            {messages.map(msg => (
              <div key={msg.id} className="list-item" onClick={() => setSelectedMessage(msg)}>
                <strong>{msg.title}</strong>
                <p>{msg.content ? msg.content.substring(0, 80) + '...' : ''}</p>
                <small className="text-faint">{new Date(msg.created_at).toLocaleDateString('hu-HU')}</small>
              </div>))}
          </div>
          <div className="card">
            <h2>Közelgő edzések</h2>
            {upcomingTrainings.length === 0 && <p>Nincs közelgő edzés.</p>}
            {upcomingTrainings.map(tr => (
              <div key={tr.id} className="list-item" onClick={() => openTraining(tr)}>
                <strong>{tr.title}</strong>
                <p>{new Date(tr.event_date).toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <small className="text-secondary">{tr.location}</small>
              </div>))}
          </div>
        </div>
        {selectedMessage && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setSelectedMessage(null)}>×</button>
              <h2>{selectedMessage.title}</h2>
              <p className="message-detail-content">{selectedMessage.content}</p>
              <small className="text-faint">{new Date(selectedMessage.created_at).toLocaleString('hu-HU')}</small><br />
              <button className="btn mt-16" onClick={() => setSelectedMessage(null)}>Bezárás</button>
            </div>
          </div>)}
        {selectedTraining && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>×</button>
              <h2>{selectedTraining.title}</h2>
              <p><strong>Időpont:</strong> {new Date(selectedTraining.event_date).toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p><strong>Helyszín:</strong> {selectedTraining.location}</p>
              {trainingDetail && (<><p><strong>Leírás:</strong> {trainingDetail.description}</p>
                <p><strong>Résztvevők:</strong> {trainingDetail.participants_count ?? (trainingDetail.participants ? trainingDetail.participants.length : 0)}</p></>)}
              {!isAdmin() && (
                <div className="mt-16">
                  {registeredEvents.includes(selectedTraining.id) ? (
                    <button className="btn btn-danger" onClick={() => handleUnregister(selectedTraining.id)}>Leiratkozás</button>
                  ) : (<button className="btn" onClick={() => handleRegister(selectedTraining.id)}>Jelentkezés</button>)}
                </div>)}
              <button className="btn mt-16 ml-8" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>Bezárás</button>
            </div>
          </div>)}
      </div>
    </div>
  );
}
