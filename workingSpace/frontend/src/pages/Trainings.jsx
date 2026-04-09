import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Trainings() {
  const { isAdmin, isCoach, user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingDetail, setTrainingDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    target_group_id: '',
    assigned_coach_id: ''
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    target_group_id: '',
    assigned_coach_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  useEffect(() => { fetchTrainings(); fetchGroups(); fetchCoaches(); }, []);

  async function fetchTrainings() {
    try { const res = await api.get('/trainings'); setTrainings(res.data || []); }
    catch(err) { console.error(err); } finally { setLoading(false); }
  }

  async function fetchGroups() {
    try { const res = await api.get('/groups'); setGroups(res.data || []); }
    catch(err) { console.error(err); }
  }

  async function fetchCoaches() {
    try { const res = await api.get('/trainings/coaches'); setCoaches(res.data || []); }
    catch(err) { console.error(err); }
  }

  async function openDetail(t) {
    setSelectedTraining(t); setTrainingDetail(null);
    try { const res = await api.get(`/trainings/${t.id}`); setTrainingDetail(res.data); }
    catch(err) { setTrainingDetail(t); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      // Edzés kezdete
      const [startHour, startMinute] = createForm.startTime.split(':');
      const startDate = new Date(createForm.year, createForm.month - 1, createForm.day, parseInt(startHour), parseInt(startMinute));

      // Edzés vége
      const [endHour, endMinute] = createForm.endTime.split(':');
      const endDate = new Date(createForm.year, createForm.month - 1, createForm.day, parseInt(endHour), parseInt(endMinute));

      const trainingData = {
        title: createForm.title,
        description: createForm.description,
        event_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        location: createForm.location,
        target_group_id: createForm.target_group_id || null
      };

      await api.post('/trainings', trainingData);
      alert('Edzés létrehozva!');
      setShowCreate(false);
      setCreateForm({
        title: '',
        description: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        startTime: '09:00',
        endTime: '11:00',
        location: '',
        target_group_id: '',
        assigned_coach_id: ''
      });
      fetchTrainings();
    }
    catch(err) { alert('Hiba a létrehozás során!'); console.error(err); }
  }

  function openEdit(training) {
    setShowEdit(true);
    setSelectedTraining(training);

    // Parse event_date
    const eventDate = training.event_date ? new Date(training.event_date) : new Date();
    const endDate = training.end_date ? new Date(training.end_date) : new Date();

    setEditForm({
      title: training.title || '',
      description: training.description || '',
      year: eventDate.getFullYear(),
      month: eventDate.getMonth() + 1,
      day: eventDate.getDate(),
      startTime: eventDate.toTimeString().slice(0, 5), // "HH:MM"
      endTime: endDate.toTimeString().slice(0, 5),
      location: training.location || '',
      target_group_id: training.target_group_id || '',
      assigned_coach_id: training.assigned_coach_id || ''
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      // Edzés kezdete
      const [startHour, startMinute] = editForm.startTime.split(':');
      const startDate = new Date(editForm.year, editForm.month - 1, editForm.day, parseInt(startHour), parseInt(startMinute));

      // Edzés vége
      const [endHour, endMinute] = editForm.endTime.split(':');
      const endDate = new Date(editForm.year, editForm.month - 1, editForm.day, parseInt(endHour), parseInt(endMinute));

      const trainingData = {
        title: editForm.title,
        description: editForm.description,
        event_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        location: editForm.location,
        target_group_id: editForm.target_group_id || null,
        assigned_coach_id: editForm.assigned_coach_id || null
      };

      await api.put(`/trainings/${selectedTraining.id}`, trainingData);
      alert('Edzés módosítva!');
      setShowEdit(false);
      setSelectedTraining(null);
      fetchTrainings();
    } catch(err) {
      alert('Hiba a módosítás során!');
      console.error(err);
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
          <h1>Edzések</h1>
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

            // Időtartam számítása
            let durationText = '';
            if (t.end_date) {
              const start = new Date(t.event_date);
              const end = new Date(t.end_date);
              const durationMs = end - start;
              const durationMinutes = Math.floor(durationMs / 60000);
              const hours = Math.floor(durationMinutes / 60);
              const mins = durationMinutes % 60;
              durationText = hours > 0 ? `${hours} óra ${mins} perc` : `${mins} perc`;
            }

            return (
              <div key={t.id} className="message-item">
                <div className="message-item-body" onClick={() => openDetail(t)}>
                  <strong>{t.title}</strong>
                  <p><strong>Kezdés:</strong> {new Date(t.event_date).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                  {durationText && <p><strong>Időtartam:</strong> {durationText}</p>}
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
        {showCreate && (() => {
          // Év, hónap, nap opciók generálása
          const currentYear = new Date().getFullYear();
          const months = [
            {value: 1, label: 'Január'}, {value: 2, label: 'Február'}, {value: 3, label: 'Március'},
            {value: 4, label: 'Április'}, {value: 5, label: 'Május'}, {value: 6, label: 'Június'},
            {value: 7, label: 'Július'}, {value: 8, label: 'Augusztus'}, {value: 9, label: 'Szeptember'},
            {value: 10, label: 'Október'}, {value: 11, label: 'November'}, {value: 12, label: 'December'}
          ];
          const daysInMonth = new Date(createForm.year, createForm.month, 0).getDate();

          // Automatikus dátum validáció
          const updateDayMax = (newYear, newMonth) => {
            const maxDays = new Date(newYear, newMonth, 0).getDate();
            if (createForm.day > maxDays) {
              setCreateForm({...createForm, year: newYear, month: newMonth, day: maxDays});
            } else {
              setCreateForm({...createForm, year: newYear, month: newMonth});
            }
          };

          return (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
              <h2>Új edzés hozzáadása</h2>
              <form onSubmit={handleCreate}>
                <label>Edzés címe:</label>
                <input className="form-input" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} required />

                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />

                <div style={{marginBottom: '16px'}}>
                  <label style={{fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Dátum</label>
                  <div style={{display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr', gap: '12px'}}>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Év</label>
                      <input
                        type="number"
                        className="form-input"
                        value={createForm.year}
                        onChange={e => {
                          const newYear = parseInt(e.target.value) || currentYear;
                          updateDayMax(newYear, createForm.month);
                        }}
                        min={2020}
                        max={2100}
                        required
                      />
                    </div>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Hónap</label>
                      <select
                        className="form-input"
                        value={createForm.month}
                        onChange={e => {
                          const newMonth = parseInt(e.target.value);
                          updateDayMax(createForm.year, newMonth);
                        }}
                        required
                      >
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Nap</label>
                      <input
                        type="number"
                        className="form-input"
                        value={createForm.day}
                        onChange={e => {
                          const newDay = parseInt(e.target.value) || 1;
                          const maxDays = new Date(createForm.year, createForm.month, 0).getDate();
                          setCreateForm({...createForm, day: Math.min(Math.max(1, newDay), maxDays)});
                        }}
                        min={1}
                        max={daysInMonth}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <label style={{fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Időpont</label>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Kezdés</label>
                      <input
                        type="time"
                        className="form-input"
                        value={createForm.startTime}
                        onChange={e => setCreateForm({...createForm, startTime: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Befejezés</label>
                      <input
                        type="time"
                        className="form-input"
                        value={createForm.endTime}
                        onChange={e => setCreateForm({...createForm, endTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <label>Helyszín:</label>
                <input className="form-input" value={createForm.location} onChange={e => setCreateForm({...createForm, location: e.target.value})} />

                <label>Célcsoport (opcionális):</label>
                <select className="form-input" value={createForm.target_group_id} onChange={e => setCreateForm({...createForm, target_group_id: e.target.value})}>
                  <option value="">-- Nincs megadva --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                <label>Társ edző (opcionális):</label>
                <select className="form-input" value={createForm.assigned_coach_id} onChange={e => setCreateForm({...createForm, assigned_coach_id: e.target.value})}>
                  <option value="">-- Nincs megadva --</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="btn-row">
                  <button className="btn" type="submit">Létrehozás</button>
                  <button className="btn" type="button" onClick={() => setShowCreate(false)}>Mégse</button>
                </div>
              </form>
            </div>
          </div>
        );})()}
        {showEdit && (() => {
          // Év, hónap, nap opciók generálása
          const currentYear = new Date().getFullYear();
          const months = [
            {value: 1, label: 'Január'}, {value: 2, label: 'Február'}, {value: 3, label: 'Március'},
            {value: 4, label: 'Április'}, {value: 5, label: 'Május'}, {value: 6, label: 'Június'},
            {value: 7, label: 'Július'}, {value: 8, label: 'Augusztus'}, {value: 9, label: 'Szeptember'},
            {value: 10, label: 'Október'}, {value: 11, label: 'November'}, {value: 12, label: 'December'}
          ];
          const daysInMonth = new Date(editForm.year, editForm.month, 0).getDate();

          // Automatikus dátum validáció
          const updateDayMax = (newYear, newMonth) => {
            const maxDays = new Date(newYear, newMonth, 0).getDate();
            if (editForm.day > maxDays) {
              setEditForm({...editForm, year: newYear, month: newMonth, day: maxDays});
            } else {
              setEditForm({...editForm, year: newYear, month: newMonth});
            }
          };

          return (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => { setShowEdit(false); setSelectedTraining(null); }}>×</button>
              <h2>Edzés módosítása</h2>
              <form onSubmit={handleEdit}>
                <label>Edzés címe:</label>
                <input className="form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required />

                <label>Leírás:</label>
                <textarea className="form-input" rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />

                <div style={{marginBottom: '16px'}}>
                  <label style={{fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Dátum</label>
                  <div style={{display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr', gap: '12px'}}>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Év</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.year}
                        onChange={e => {
                          const newYear = parseInt(e.target.value) || currentYear;
                          updateDayMax(newYear, editForm.month);
                        }}
                        min={2020}
                        max={2100}
                        required
                      />
                    </div>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Hónap</label>
                      <select
                        className="form-input"
                        value={editForm.month}
                        onChange={e => {
                          const newMonth = parseInt(e.target.value);
                          updateDayMax(editForm.year, newMonth);
                        }}
                        required
                      >
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Nap</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.day}
                        onChange={e => {
                          const newDay = parseInt(e.target.value) || 1;
                          const maxDays = new Date(editForm.year, editForm.month, 0).getDate();
                          setEditForm({...editForm, day: Math.min(Math.max(1, newDay), maxDays)});
                        }}
                        min={1}
                        max={daysInMonth}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <label style={{fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Időpont</label>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Kezdés</label>
                      <input
                        type="time"
                        className="form-input"
                        value={editForm.startTime}
                        onChange={e => setEditForm({...editForm, startTime: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label style={{fontSize: '12px', color: '#4a5568', marginBottom: '6px', display: 'block', fontWeight: '500'}}>Befejezés</label>
                      <input
                        type="time"
                        className="form-input"
                        value={editForm.endTime}
                        onChange={e => setEditForm({...editForm, endTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <label>Helyszín:</label>
                <input className="form-input" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />

                <label>Célcsoport (opcionális):</label>
                <select className="form-input" value={editForm.target_group_id} onChange={e => setEditForm({...editForm, target_group_id: e.target.value})}>
                  <option value="">-- Nincs megadva --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                <label>Társ edző (opcionális):</label>
                <select className="form-input" value={editForm.assigned_coach_id} onChange={e => setEditForm({...editForm, assigned_coach_id: e.target.value})}>
                  <option value="">-- Nincs megadva --</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="btn-row">
                  <button className="btn" type="submit">Mentés</button>
                  <button className="btn" type="button" onClick={() => { setShowEdit(false); setSelectedTraining(null); }}>Mégse</button>
                </div>
              </form>
            </div>
          </div>
        );})()}
      </div>
    </div>
  );
}
