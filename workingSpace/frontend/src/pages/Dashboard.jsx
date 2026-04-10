import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

const WEATHER_CONFIG = {
  apiKey: '342caffd05a8425c79fa2f0abfe165f1',
  city: 'Siofok,HU',
  units: 'metric',
  lang: 'hu'
};

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingDetail, setTrainingDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  // Időjárás adatok
  const [weather, setWeather] = useState({
    temperature: '22°C',
    description: 'Derült, gyenge szél',
    windSpeed: '12 km/h',
    windDirection: 'Északnyugati',
    waveHeight: '0.3'
  });

  useEffect(() => {
    fetchAll();
    fetchWeatherData();

    // Automatikus időjárás frissítés 30 percenként
    const weatherInterval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, []);

  async function fetchAll() {
    try {
      const [msgRes, tRes] = await Promise.all([api.get('/messages'), api.get('/trainings')]);
      setMessages(msgRes.data||[]);
      setTrainings(tRes.data||[]);
    } catch(err){
      console.error(err);
    } finally{
      setLoading(false);
    }
  }

  async function fetchWeatherData() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CONFIG.city}&appid=${WEATHER_CONFIG.apiKey}&units=${WEATHER_CONFIG.units}&lang=${WEATHER_CONFIG.lang}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('API hiba: ' + response.status);
      const data = await response.json();

      const temp = Math.round(data.main.temp);
      const desc = data.weather[0].description;
      const windSpeedMS = data.wind.speed;
      const windSpeedKmh = Math.round(windSpeedMS * 3.6);
      const windDir = getWindDirection(data.wind.deg);
      const wave = (windSpeedMS * 0.05).toFixed(1);

      setWeather({
        temperature: temp + '°C',
        description: capitalizeFirst(desc) + ', ' + windSpeedKmh + ' km/h szél',
        windSpeed: windSpeedKmh + ' km/h',
        windDirection: windDir,
        waveHeight: wave
      });

      console.log('Időjárás frissítve:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Időjárás adatok lekérése sikertelen:', error);
    }
  }

  function getWindDirection(degrees) {
    const directions = [
      'Északi', 'Északkeleti', 'Keleti', 'Délkeleti',
      'Déli', 'Délnyugati', 'Nyugati', 'Északnyugati'
    ];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async function openTraining(training) {
    setSelectedTraining(training);
    setTrainingDetail(null);
    try {
      const res = await api.get(`/trainings/${training.id}`);
      setTrainingDetail(res.data);
    } catch(err) {
      setTrainingDetail(training);
    }
  }

  async function handleRegister(id) {
    try {
      await api.post(`/events/${id}/register`);
      setRegisteredEvents(p=>[...p,id]);
      alert('Sikeresen feliratkozott!');
    } catch(err) {
      alert('Hiba!');
    }
  }

  async function handleUnregister(id) {
    try {
      await api.delete(`/events/${id}/register`);
      setRegisteredEvents(p=>p.filter(x=>x!==id));
      alert('Sikeresen leiratkozott!');
    } catch(err) {
      alert('Hiba!');
    }
  }

  const upcomingTrainings = trainings.filter(t => new Date(t.event_date) >= new Date()).slice(0, 1);
  const sentMessages = messages.filter(m => m.status === 'sent').slice(0, 1);

  return (
    <div className="main-content">
      <Navbar />
      <div className="homepage-container">
        {/* Üdvözlő Banner */}
        <div className="welcome-banner">
          <h1>Üdvözöl a WaveAlert!</h1>
        </div>

        {/* Eredeti Kártyák - Üzenetek és Edzések */}
        <h2 style={{color: 'white', fontSize: '1.8rem', marginBottom: '20px'}}>Hirdető tábla</h2>
        {loading && <p style={{color: 'white'}}>Betöltés...</p>}

        <div className="dashboard-grid-2">
          <div className="dashboard-card">
            <div className="card-header">
              <div className="icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1E88E5">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </div>
              <h3 style={{color: '#1976D2'}}>Üzenetek</h3>
            </div>
            {sentMessages.length === 0 && <p style={{color: '#1976D2'}}>Nincs üzenet.</p>}
            {sentMessages.map(msg => (
              <div key={msg.id} className="list-item-dashboard" onClick={() => setSelectedMessage(msg)}>
                <strong>{msg.title}</strong>
                <p>{msg.content ? msg.content.substring(0, 80) + '...' : ''}</p>
                <small className="text-faint">{new Date(msg.created_at).toLocaleDateString('hu-HU')}</small>
              </div>
            ))}
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div className="icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1E88E5">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <h3 style={{color: '#1976D2'}}>Közelgő edzések</h3>
            </div>
            {upcomingTrainings.length === 0 && <p style={{color: '#1976D2'}}>Nincs közelgő edzés.</p>}
            {upcomingTrainings.map(tr => (
              <div key={tr.id} className="list-item-dashboard" onClick={() => openTraining(tr)}>
                <strong>{tr.title}</strong>
                <p>{new Date(tr.event_date).toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <small className="text-secondary">{tr.location}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Időjárás Dashboard Kártyák */}
        <h2 style={{color: 'white', fontSize: '1.8rem', marginTop: '40px', marginBottom: '20px'}}>Időjárás és Vízállapot</h2>

        <div className="dashboard-grid-3">
          {/* Időjárás Kártya */}
          <div className="dashboard-card weather-card">
            <div className="card-header">
              <div className="icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1E88E5">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6v.5l7.35 3.54z"/>
                </svg>
              </div>
              <h3 style={{color: '#0D47A1', fontWeight: '700'}}>Időjárás</h3>
            </div>
            <div className="card-value">{weather.temperature}</div>
            <div className="card-label">{weather.description}</div>
            <span className="status-badge good">Jó körülmények</span>
          </div>

          {/* Hullámmagasság Kártya */}
          <div className="dashboard-card weather-card">
            <div className="card-header">
              <div className="icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1E88E5">
                  <path d="M3.5 18.5l9-9 4 4 6-6" stroke="#1E88E5" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 style={{color: '#0D47A1', fontWeight: '700'}}>Hullámmagasság</h3>
            </div>
            <div className="card-value">{weather.waveHeight} m</div>
            <div className="card-label">Nyugodt víz</div>
            <span className="status-badge good">Biztonságos</span>
          </div>

          {/* Szél Kártya */}
          <div className="dashboard-card weather-card">
            <div className="card-header">
              <div className="icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1E88E5">
                  <path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zm-.5 4.5H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5v2c1.93 0 3.5-1.57 3.5-3.5S20.43 11 18.5 11z"/>
                </svg>
              </div>
              <h3 style={{color: '#0D47A1', fontWeight: '700'}}>Szél</h3>
            </div>
            <div className="card-value">{weather.windSpeed}</div>
            <div className="card-label">{weather.windDirection} szél</div>
            <span className="status-badge info">Közepes</span>
          </div>
        </div>

        {/* Frissítés gomb */}
        <div style={{textAlign: 'center', marginTop: '32px'}}>
          <button
            className="btn-refresh"
            onClick={fetchWeatherData}
          >
            🔄 Időjárás Frissítése
          </button>
        </div>
      </div>

      {/* Modals */}
      {selectedMessage && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="modal-close-btn" onClick={() => setSelectedMessage(null)}>×</button>
            <h2>{selectedMessage.title}</h2>
            <p className="message-detail-content">{selectedMessage.content}</p>
            <small className="text-faint">{new Date(selectedMessage.created_at).toLocaleString('hu-HU')}</small><br />
            <button className="btn mt-16" onClick={() => setSelectedMessage(null)}>Bezárás</button>
          </div>
        </div>
      )}

      {selectedTraining && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="modal-close-btn" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>×</button>
            <h2>{selectedTraining.title}</h2>
            <p><strong>Időpont:</strong> {new Date(selectedTraining.event_date).toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' })}</p>
            <p><strong>Helyszín:</strong> {selectedTraining.location}</p>
            {trainingDetail && (
              <>
                <p><strong>Leírás:</strong> {trainingDetail.description}</p>
                <p><strong>Résztvevők:</strong> {trainingDetail.participants_count ?? (trainingDetail.participants ? trainingDetail.participants.length : 0)}</p>
              </>
            )}
            {!isAdmin() && (
              <div className="mt-16">
                {registeredEvents.includes(selectedTraining.id) ? (
                  <button className="btn-danger" onClick={() => handleUnregister(selectedTraining.id)}>Leiratkozás</button>
                ) : (
                  <button className="btn" onClick={() => handleRegister(selectedTraining.id)}>Jelentkezés</button>
                )}
              </div>
            )}
            <button className="btn mt-16 ml-8" onClick={() => { setSelectedTraining(null); setTrainingDetail(null); }}>Bezárás</button>
          </div>
        </div>
      )}
    </div>
  );
}
