import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const RaceReports = () => {
  const [minutes, setMinutes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMinutes();
  }, []);

  const fetchMinutes = async () => {
    try {
      const response = await api.get('/race-minutes');
      setMinutes(response.data);
    } catch (error) {
      console.error('Failed to fetch race minutes:', error);
    }
  };

  const handlePdf = async (id, futam_szama) => {
    try {
      const response = await api.get(`/race-minutes/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `versenyjegyzokonyv_${futam_szama || '1'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Biztosan törli ezt a versenyjegyzőkönyvet?')) return;
    try {
      await api.delete(`/race-minutes/${id}`);
      setMinutes(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Versenyjegyzőkönyvek</h1>
          <button className="btn btn-primary" onClick={() => navigate('/race-minutes/new')}>
            + Új versenyjegyzőkönyv
          </button>
        </div>
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Verseny neve</th>
                <th>Futam száma</th>
                <th>Korosztály</th>
                <th>Helyszín</th>
                <th>Ideje</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {minutes.map(m => (
                <tr key={m.id}>
                  <td>{m.verseny_neve || '—'}</td>
                  <td>{m.futam_szama || '—'}</td>
                  <td>{m.korosztaly || '—'}</td>
                  <td>{m.helye || '—'}</td>
                  <td>{m.ideje || '—'}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm" onClick={() => handlePdf(m.id, m.futam_szama)}>
                        PDF
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/race-minutes/edit/${m.id}`)}>
                        Szerkesztés
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                        Törlés
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {minutes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted" style={{ padding: 20 }}>
                    Nincs versenyjegyzőkönyv.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RaceReports;
