import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function TrainingsStats() {
  const { isAdmin, isCoach } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function selectUser(user) {
    setSelectedUser(user);
    setStatsLoading(true);
    setUserStats(null);

    try {
      const res = await api.get(`/trainings/stats/${user.id}`);
      setUserStats(res.data);
    } catch(err) {
      console.error(err);
      setUserStats({
        total_trainings: 0,
        attended_trainings: 0,
        attendance_rate: 0,
        upcoming_trainings: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }

  const calculateAttendanceRate = () => {
    if (!userStats || userStats.total_trainings === 0) return 0;
    return Math.round((userStats.attended_trainings / userStats.total_trainings) * 100);
  };

  return (
    <div className="main-content"><Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Edzés Statisztikák</h1>
        </div>

        {loading && <p style={{color: 'white'}}>Betöltés...</p>}

        {/* Felhasználók listája */}
        <div className="card" style={{maxWidth: '900px', margin: '0 auto'}}>
          <h2 style={{color: '#1976D2', marginBottom: '16px'}}>Felhasználók</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {users.map(user => (
              <div
                key={user.id}
                className="list-item"
                onClick={() => selectUser(user)}
                style={{
                  cursor: 'pointer',
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(30, 136, 229, 0.05)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(30, 136, 229, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(30, 136, 229, 0.05)'}
              >
                <strong style={{fontSize: '1.1rem', color: '#0D47A1'}}>{user.name}</strong>
                <p className="text-secondary" style={{margin: '4px 0 0 0'}}>{user.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Statisztikák Modal */}
        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal-box" style={{maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
              <button className="modal-close-btn" onClick={() => { setSelectedUser(null); setUserStats(null); }}>×</button>

              {statsLoading && (
                <p style={{textAlign: 'center', color: '#666', padding: '40px 0'}}>
                  Statisztikák betöltése...
                </p>
              )}

              {!statsLoading && userStats && (
                <div>
                  {/* Felhasználó fejléc */}
                  <div className="blue-header" style={{
                    background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <h2 style={{margin: 0, fontSize: '1.8rem', fontWeight: 'bold'}}>
                      {selectedUser.name}
                    </h2>
                    <p style={{margin: '8px 0 0 0', fontSize: '0.95rem', opacity: 0.9}}>
                      {selectedUser.email}
                    </p>
                  </div>

                  {/* Statisztika kártyák */}
                  <div className="grid-2" style={{gap: '16px', marginBottom: '24px'}}>
                    <div style={{
                      background: 'linear-gradient(135deg, #42A5F5, #1976D2)',
                      padding: '24px',
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '42px', fontWeight: 'bold', marginBottom: '8px'}}>
                        {userStats.total_trainings || 0}
                      </div>
                      <div style={{fontSize: '16px', opacity: 0.9}}>
                        Összes edzés
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #66BB6A, #43A047)',
                      padding: '24px',
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '42px', fontWeight: 'bold', marginBottom: '8px'}}>
                        {userStats.attended_trainings || 0}
                      </div>
                      <div style={{fontSize: '16px', opacity: 0.9}}>
                        Részvétel
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #FFA726, #FB8C00)',
                      padding: '24px',
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '42px', fontWeight: 'bold', marginBottom: '8px'}}>
                        {calculateAttendanceRate()}%
                      </div>
                      <div style={{fontSize: '16px', opacity: 0.9}}>
                        Részvételi ráta
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #AB47BC, #8E24AA)',
                      padding: '24px',
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '42px', fontWeight: 'bold', marginBottom: '8px'}}>
                        {userStats.upcoming_trainings || 0}
                      </div>
                      <div style={{fontSize: '16px', opacity: 0.9}}>
                        Jövőbeli edzések
                      </div>
                    </div>
                  </div>

                  {/* Részletes lista */}
                  {userStats.trainings && userStats.trainings.length > 0 && (
                    <div>
                      <h3 style={{color: '#1976D2', marginBottom: '12px'}}>
                        Edzések részletesen
                      </h3>
                      <div style={{maxHeight: '400px', overflow: 'auto'}}>
                        {userStats.trainings.map(training => (
                          <div key={training.id} style={{
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            background: training.attended ? '#e8f5e9' : '#fff3e0'
                          }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <div>
                                <strong>{training.title}</strong>
                                <p style={{fontSize: '12px', color: '#666', margin: '4px 0 0 0'}}>
                                  {new Date(training.event_date).toLocaleString('hu-HU')}
                                </p>
                              </div>
                              <span className={`badge ${training.attended ? 'badge-success' : 'badge-warning'}`}>
                                {training.attended ? 'Részt vett' : 'Nem vett részt'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bezárás gomb */}
                  <div style={{marginTop: '24px', textAlign: 'right'}}>
                    <button
                      className="btn"
                      onClick={() => { setSelectedUser(null); setUserStats(null); }}
                      style={{background: '#1976D2'}}
                    >
                      Bezárás
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
