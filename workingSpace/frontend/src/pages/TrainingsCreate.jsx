import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function TrainingsCreate() {
  const { isAdmin, isCoach, user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingDetail, setTrainingDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', event_date: '', location: '', target_group_id: '' });
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

  function openEdit(training) {
    setShowEdit(true);
    setSelectedTraining(training);
    setEditForm({
      title: training.title || '',
      description: training.description || '',
      event_date: training.event_date ? new Date(training.event_date).toISOString().slice(0, 16) : '',
      location: training.location || '',
      target_group_id: training.target_group_id || ''
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      await api.put(`/trainings/${selectedTraining.id}`, editForm);
      alert('Edzés módosítva!');
      setShowEdit(false);
      setSelectedTraining(null);
      fetchTrainings();
    } catch(err) {
      alert('Hiba a módosítás során!');
    }
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
    <div className="main-content"><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Edzések létrehozása</h1>
          {(isAdmin() || isCoach()) && <button className="btn-add" onClick={() => setShowCreate(true)}>Hozzáadás</button>}
        </div>
        {loading && <p style={{color: 'white'}}>Betöltés...</p>}
        <div className="card">
          {trainings.length === 0 && <p>Nincsenek edzések.</p>}
          {trainings.map(t => {
            const eventDate = new Date(t.event_date);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

            let status, statusLabel;
            if (eventDay > today) {
              status = 'upcoming';
              statusLabel = 'Várható';
            } else if (eventDay.getTime() === today.getTime()) {
              status = 'active-event';
              statusLabel = 'Aktív';
            } else {
              status = 'past';
              statusLabel = 'Lezárult';
            }

            const canEdit = isAdmin() || isCoach() || (user?.id && t.creator_id === user.id);

            return (
              <div key={t.id} className="message-item">
                <div className="message-item-body" onClick={() => openDetail(t)}>
                  <strong>{t.title}</strong>
                  <p>{new Date(t.event_date).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                  <div className="message-item-meta">
                    <span className={`badge badge-sm badge-${status}`}>
                      {statusLabel}
                    </span>
                    <small className="text-secondary">{t.location}</small>
                  </div>
                </div>
                {canEdit && (
                  <div className="message-item-actions">
                    <button className="btn" onClick={() => openEdit(t)}>Módosítás</button>
                    <button className="btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(t.id, e); }}>Törlés</button>
                  </div>
                )}
              </div>
            );
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
        {showEdit && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => { setShowEdit(false); setSelectedTraining(null); }}>×</button>
              <h2>Edzés módosítása</h2>
              <form onSubmit={handleEdit}>
                <label>Cím:</label>
                <input className="form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required />
                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                <label>Dátum és idő:</label>
                <input className="form-input" type="datetime-local" value={editForm.event_date} onChange={e => setEditForm({...editForm, event_date: e.target.value})} required />
                <label>Helyszín:</label>
                <input className="form-input" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                <label>Célcsoport (opcionális):</label>
                <select className="form-input" value={editForm.target_group_id} onChange={e => setEditForm({...editForm, target_group_id: e.target.value})}>
                  <option value="">-- Nincs megadva --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <div className="btn-row">
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn" type="button" onClick={() => { setShowEdit(false); setSelectedTraining(null); }}>Mégse</button>
                </div>
              </form>
            </div>
          </div>)}
      </div>
    </div>
  );
}
