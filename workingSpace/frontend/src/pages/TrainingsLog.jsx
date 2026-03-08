import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function TrainingsLog() {
  const { isAdmin } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingDetail, setTrainingDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [coachFilter, setCoachFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrainings();
    fetchCoaches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trainings, coachFilter, dateFromFilter, dateToFilter, searchQuery]);

  async function fetchTrainings() {
    try {
      const res = await api.get('/trainings/log');
      setTrainings(res.data || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCoaches() {
    try {
      const res = await api.get('/users?role=coach');
      setCoaches(res.data || []);
    } catch(err) {
      console.error(err);
    }
  }

  function applyFilters() {
    let filtered = [...trainings];

    // Coach filter
    if (coachFilter) {
      filtered = filtered.filter(t => t.creator_id === parseInt(coachFilter));
    }

    // Date from filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      filtered = filtered.filter(t => new Date(t.event_date) >= fromDate);
    }

    // Date to filter
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(t => new Date(t.event_date) <= toDate);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.location && t.location.toLowerCase().includes(query))
      );
    }

    setFilteredTrainings(filtered);
  }

  function clearFilters() {
    setCoachFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setSearchQuery('');
  }

  async function openDetail(t) {
    setSelectedTraining(t);
    setTrainingDetail(null);
    try {
      const res = await api.get(`/trainings/${t.id}`);
      setTrainingDetail(res.data);
    } catch(err) {
      setTrainingDetail(t);
    }
  }

  if (!isAdmin()) {
    return (
      <div className="main-content"><Navbar />
        <div className="container">
          <div className="card">
            <p>Hozzáférés megtagadva. Csak adminisztrátorok láthatják az edzésnaplót.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content"><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Edzésnapló</h1>
          <span style={{color: 'white', fontSize: '14px'}}>
            {filteredTrainings.length} lezárt edzés
          </span>
        </div>

        {/* Szűrők */}
        <div className="card" style={{marginBottom: '20px'}}>
          <h2 style={{color: '#1976D2', marginBottom: '16px'}}>Szűrés</h2>

          <div className="grid-2" style={{gap: '16px', marginBottom: '16px'}}>
            {/* Keresés */}
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0D47A1'}}>
                Keresés (cím, leírás, helyszín)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Keresés..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Edző */}
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0D47A1'}}>
                Edző
              </label>
              <select
                className="form-input"
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
              >
                <option value="">Összes edző</option>
                {coaches.map(coach => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dátum - tól */}
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0D47A1'}}>
                Dátum - tól
              </label>
              <input
                type="date"
                className="form-input"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            {/* Dátum - ig */}
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0D47A1'}}>
                Dátum - ig
              </label>
              <input
                type="date"
                className="form-input"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn"
            onClick={clearFilters}
            style={{background: '#FB8C00'}}
          >
            Szűrők törlése
          </button>
        </div>

        {/* Edzések listája */}
        {loading && <p style={{color: 'white'}}>Betöltés...</p>}

        <div className="card">
          {filteredTrainings.length === 0 && (
            <p style={{textAlign: 'center', color: '#666', padding: '20px 0'}}>
              {trainings.length === 0
                ? 'Nincsenek lezárt edzések.'
                : 'Nincs találat a megadott szűrőkkel.'
              }
            </p>
          )}

          {filteredTrainings.map(t => {
            const eventDate = new Date(t.event_date);

            return (
              <div key={t.id} className="message-item" onClick={() => openDetail(t)} style={{cursor: 'pointer'}}>
                <div className="message-item-body">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                    <div>
                      <strong>{t.title}</strong>
                      <p style={{fontSize: '14px', color: '#666', marginTop: '4px'}}>
                        {eventDate.toLocaleString('hu-HU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {t.location && (
                        <p style={{fontSize: '13px', color: '#999', marginTop: '4px'}}>
                          📍 {t.location}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-sm badge-past">
                      Lezárt
                    </span>
                  </div>
                  <div className="message-item-meta" style={{marginTop: '12px'}}>
                    {t.creator_name && (
                      <small className="text-secondary">
                        Edző: {t.creator_name}
                      </small>
                    )}
                    {t.participants_count !== undefined && (
                      <small className="text-secondary">
                        Résztvevők: {t.participants_count}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal - Edzés részletei */}
        {selectedTraining && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>×</button>

              <h2>{selectedTraining.title}</h2>

              <div style={{marginTop: '16px'}}>
                <p><strong>Időpont:</strong> {new Date(selectedTraining.event_date).toLocaleString('hu-HU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>

                {selectedTraining.location && (
                  <p><strong>Helyszín:</strong> {selectedTraining.location}</p>
                )}

                {trainingDetail ? (
                  <>
                    {trainingDetail.description && (
                      <p><strong>Leírás:</strong> {trainingDetail.description}</p>
                    )}

                    <p><strong>Részt vevők száma:</strong> {trainingDetail.participants_count ?? 0}</p>

                    {trainingDetail.creator_name && (
                      <p><strong>Edző:</strong> {trainingDetail.creator_name}</p>
                    )}

                    {trainingDetail.target_group_name && (
                      <p><strong>Célcsoport:</strong> {trainingDetail.target_group_name}</p>
                    )}

                    {/* Résztvevők listája */}
                    {trainingDetail.participants && trainingDetail.participants.length > 0 && (
                      <div style={{marginTop: '16px'}}>
                        <strong>Résztvevők:</strong>
                        <ul style={{marginTop: '8px', paddingLeft: '20px'}}>
                          {trainingDetail.participants.map(participant => (
                            <li key={participant.id}>{participant.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p>Betöltés...</p>
                )}
              </div>

              <button className="btn mt-16" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>
                Bezárás
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
