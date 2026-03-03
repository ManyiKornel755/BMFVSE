import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Trainings() {
  const { isAdmin, isCoach } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingDetail, setTrainingDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', event_date: '', location: '', target_group_id: '' });
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  useEffect(() => { fetchTrainings(); fetchGroups(); }, []);

  async function fetchTrainings() {
    try { const res = await api.get('/trainings'); setTrainings(res.data || []); }
    catch(err) { console.error(err); } finally { setLoading(false); }
  }

  async function fetchGroups() {
    try { const res = await api.get('/groups'); setGroups(res.data || []); }
    catch(err) { console.error(err); }
  }

  async function openDetail(t) {
    setSelectedTraining(t); setTrainingDetail(null);
    try { const res = await api.get(`/trainings/${t.id}`); setTrainingDetail(res.data); }
    catch(err) { setTrainingDetail(t); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try { await api.post('/trainings', createForm); alert('Edzés létrehozva!'); setShowCreate(false); setCreateForm({ title: '', description: '', event_date: '', location: '', target_group_id: '' }); fetchTrainings(); }
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

  return (
    <div><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Edzések</h1>
          {(isAdmin() || isCoach()) && <button className="btn" onClick={() => setShowCreate(true)}>Új edzés</button>}
        </div>
        {loading && <p>Betöltés...</p>}
        <div className="grid-3">
          {trainings.map(t => {
            const isUpcoming = new Date(t.event_date) >= new Date();
            return (
              <div key={t.id} className="card training-card" onClick={() => openDetail(t)}>
                <h3>{t.title}</h3>
                <p className="text-muted">{new Date(t.event_date).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-secondary">{t.location}</p>
                <span className={`badge badge-sm badge-${isUpcoming ? 'upcoming' : 'past'}`}>
                  {isUpcoming ? 'Várható' : 'Lezárult'}
                </span>
                {(isAdmin() || isCoach()) && (
                  <button className="btn btn-danger training-delete-btn" onClick={(e) => handleDelete(t.id, e)}>Törlés</button>)}
              </div>);
          })}
        </div>
        {selectedTraining && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>×</button>
              <h2>{selectedTraining.title}</h2>
              <p><strong>Időpont:</strong> {new Date(selectedTraining.event_date).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Helyszín:</strong> {selectedTraining.location}</p>
              {trainingDetail ? (
                <><p><strong>Leírás:</strong> {trainingDetail.description}</p>
                <p><strong>Részt vevők:</strong> {trainingDetail.participants_count ?? (trainingDetail.participants ? trainingDetail.participants.length : 0)}</p></>
              ) : <p>Betöltés...</p>}
              {!isAdmin() && !isCoach() && (
                <div className="mt-16">
                  {registeredEvents.includes(selectedTraining.id) ? (
                    <button className="btn btn-danger" onClick={() => handleUnregister(selectedTraining.id)}>Leiratkozás</button>
                  ) : (<button className="btn" onClick={() => handleRegister(selectedTraining.id)}>Jelentkezés</button>)}
                </div>)}
              <button className="btn mt-16 ml-8" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>Bezárás</button>
            </div>
          </div>)}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
              <h2>Új edzés létrehozása</h2>
              <form onSubmit={handleCreate}>
                <label>Cím:</label>
                <input className="form-input" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} required />
                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
                <label>Dátum és idő:</label>
                <input className="form-input" type="datetime-local" value={createForm.event_date} onChange={e => setCreateForm({...createForm, event_date: e.target.value})} required />
                <label>Helyszín:</label>
                <input className="form-input" value={createForm.location} onChange={e => setCreateForm({...createForm, location: e.target.value})} />
                <label>Célcsoport (opcionális):</label>
                <select className="form-input" value={createForm.target_group_id} onChange={e => setCreateForm({...createForm, target_group_id: e.target.value})}>
                  <option value="">-- Nincs megadva --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <div className="btn-row">
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
