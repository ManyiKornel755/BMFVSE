import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Trainings() {
  const { isAdmin } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingDetail, setTrainingDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', event_date: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  useEffect(() => { fetchTrainings(); }, []);

  async function fetchTrainings() {
    try { const res = await api.get('/trainings'); setTrainings(res.data || []); }
    catch(err) { console.error(err); } finally { setLoading(false); }
  }

  async function openDetail(t) {
    setSelectedTraining(t); setTrainingDetail(null);
    try { const res = await api.get(`/trainings/${t.id}`); setTrainingDetail(res.data); }
    catch(err) { setTrainingDetail(t); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try { await api.post('/trainings', createForm); alert('Edzés létrehozva!'); setShowCreate(false); setCreateForm({ title: '', description: '', event_date: '', location: '' }); fetchTrainings(); }
    catch(err) { alert('Hiba a létrehozás során!'); }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm('Biztosan törli ezt az edzést?')) return;
    try { await api.delete(`/trainings/${id}`); alert('Edzés törölve!'); fetchTrainings(); }
    catch(err) { alert('Hiba a törlés során!'); }
  }

  async function handleRegister(id) {
    try { await api.post(`/events/${id}/register`); setRegisteredEvents(p=>[...p,id]); alert('Sikeresen feliratkozott!'); }
    catch(err) { alert('Hiba!'); }
  }

  async function handleUnregister(id) {
    try { await api.delete(`/events/${id}/register`); setRegisteredEvents(p=>p.filter(x=>x!==id)); alert('Sikeresen leiratkozott!'); }
    catch(err) { alert('Hiba!'); }
  }

  const mbd = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const mbx = { background: 'white', borderRadius: '8px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' };
  const inp = { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' };
  return (
    <div><Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Edzések</h1>
          {isAdmin() && <button className="btn" onClick={() => setShowCreate(true)}>Új edzés</button>}
        </div>
        {loading && <p>Betöltés...</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {trainings.map(t => {
            const isUpcoming = new Date(t.event_date) >= new Date();
            return (
              <div key={t.id} className="card" style={{ padding: '20px', cursor: 'pointer', position: 'relative' }}
                onClick={() => openDetail(t)}>
                <h3 style={{ margin: '0 0 8px' }}>{t.title}</h3>
                <p style={{ margin: '4px 0', color: '#555', fontSize: '0.9rem' }}>{new Date(t.event_date).toLocaleString('hu-HU')}</p>
                <p style={{ margin: '4px 0', color: '#777', fontSize: '0.85rem' }}>{t.location}</p>
                <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', background: isUpcoming ? '#2196f3' : '#9e9e9e', color: 'white' }}>
                  {isUpcoming ? 'Várható' : 'Lezárult'}
                </span>
                {isAdmin() && (
                  <button className="btn btn-danger" style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={(e) => handleDelete(t.id, e)}>Törlés</button>)}
              </div>);
          })}
        </div>
        {selectedTraining && (
          <div style={mbd} onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>{selectedTraining.title}</h2>
              <p><strong>Időpont:</strong> {new Date(selectedTraining.event_date).toLocaleString('hu-HU')}</p>
              <p><strong>Helyszín:</strong> {selectedTraining.location}</p>
              {trainingDetail ? (
                <><p><strong>Leírás:</strong> {trainingDetail.description}</p>
                <p><strong>Részt vevők:</strong> {trainingDetail.participants_count ?? (trainingDetail.participants ? trainingDetail.participants.length : 0)}</p></>
              ) : <p>Betöltés...</p>}
              {!isAdmin() && (
                <div style={{ marginTop: '16px' }}>
                  {registeredEvents.includes(selectedTraining.id) ? (
                    <button className="btn btn-danger" onClick={() => handleUnregister(selectedTraining.id)}>Leiratkozás</button>
                  ) : (<button className="btn" onClick={() => handleRegister(selectedTraining.id)}>Jelentkezés</button>)}
                </div>)}
              <button className="btn" style={{ marginTop: '16px', marginLeft: '8px' }}
                onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>Bezárás</button>
            </div></div>)}
        {showCreate && (
          <div style={mbd} onClick={() => setShowCreate(false)}>
            <div style={mbx} onClick={e => e.stopPropagation()}>
              <h2>Új edzés létrehozása</h2>
              <form onSubmit={handleCreate}>
                <label>Cím:</label>
                <input style={inp} value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} required />
                <label>Leírás:</label>
                <textarea style={inp} rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
                <label>Dátum és idő:</label>
                <input style={inp} type="datetime-local" value={createForm.event_date} onChange={e => setCreateForm({...createForm, event_date: e.target.value})} required />
                <label>Helyszín:</label>
                <input style={inp} value={createForm.location} onChange={e => setCreateForm({...createForm, location: e.target.value})} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn" type="submit">Létrehozás</button>
                  <button className="btn" type="button" onClick={() => setShowCreate(false)}>Mégse</button>
                </div>
              </form>
            </div></div>)}
      </div>
    </div>
  );
}
