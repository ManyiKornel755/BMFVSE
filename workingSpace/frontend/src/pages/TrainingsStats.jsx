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

        <div className="grid-2">
          {/* Felhasználók listája */}
          <div className="card">
            <h2 style={{color: '#1976D2', marginBottom: '16px'}}>Felhasználók</h2>
            <div style={{maxHeight: '600px', overflow: 'auto'}}>
              {users.map(user => (
                <div
                  key={user.id}
                  className={`message-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                  onClick={() => selectUser(user)}
                  style={{
                    cursor: 'pointer',
                    background: selectedUser?.id === user.id ? '#e3f2fd' : 'white',
                    border: selectedUser?.id === user.id ? '2px solid #1976D2' : '1px solid #ddd',
                    marginBottom: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <strong>{user.name}</strong>
                  <p style={{fontSize: '14px', color: '#666', margin: '4px 0 0 0'}}>
                    {user.email}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Statisztikák */}
          <div className="card">
            <h2 style={{color: '#1976D2', marginBottom: '16px'}}>Statisztika</h2>

            {!selectedUser && (
              <p style={{textAlign: 'center', color: '#666', padding: '40px 0'}}>
                Válassz ki egy felhasználót a statisztikák megtekintéséhez
              </p>
            )}

            {selectedUser && statsLoading && (
              <p style={{textAlign: 'center', color: '#666', padding: '40px 0'}}>
                Statisztikák betöltése...
              </p>
            )}

            {selectedUser && !statsLoading && userStats && (
              <div>
                <div style={{
                  background: '#e3f2fd',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{color: '#0D47A1', marginBottom: '8px'}}>
                    {selectedUser.name}
                  </h3>
                  <p style={{color: '#1976D2', fontSize: '14px'}}>
                    {selectedUser.email}
                  </p>
                </div>

                {/* Statisztika kártyák */}
                <div className="grid-2" style={{gap: '16px'}}>
                  <div style={{
                    background: 'linear-gradient(135deg, #42A5F5, #1976D2)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '8px'}}>
                      {userStats.total_trainings || 0}
                    </div>
                    <div style={{fontSize: '14px', opacity: 0.9}}>
                      Összes edzés
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #66BB6A, #43A047)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '8px'}}>
                      {userStats.attended_trainings || 0}
                    </div>
                    <div style={{fontSize: '14px', opacity: 0.9}}>
                      Részvétel
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #FFA726, #FB8C00)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '8px'}}>
                      {calculateAttendanceRate()}%
                    </div>
                    <div style={{fontSize: '14px', opacity: 0.9}}>
                      Részvételi ráta
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #AB47BC, #8E24AA)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '8px'}}>
                      {userStats.upcoming_trainings || 0}
                    </div>
                    <div style={{fontSize: '14px', opacity: 0.9}}>
                      Jövőbeli edzések
                    </div>
                  </div>
                </div>

                {/* Részletes lista */}
                {userStats.trainings && userStats.trainings.length > 0 && (
                  <div style={{marginTop: '24px'}}>
                    <h3 style={{color: '#1976D2', marginBottom: '12px'}}>
                      Edzések részletesen
                    </h3>
                    <div style={{maxHeight: '300px', overflow: 'auto'}}>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
