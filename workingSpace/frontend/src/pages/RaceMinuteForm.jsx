import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const emptyEvent = () => ({ idopont: '', esemeny: '', szelero: '' });

// Defined OUTSIDE the component — prevents remount on every keystroke
const F = ({ label, field, placeholder, value, onChange }) => (
  <div className="form-group">
    <label>{label}</label>
    <input
      type="text"
      placeholder={placeholder || ''}
      value={value}
      onChange={e => onChange(field, e.target.value)}
    />
  </div>
);

const T = ({ label, field, rows = 3, value, onChange }) => (
  <div className="form-group">
    <label>{label}</label>
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(field, e.target.value)}
    />
  </div>
);

const emptyForm = () => ({
  verseny_neve: '',
  helye: '',
  ideje: '',
  rendezoje: '',
  versenyvezeto: '',
  jegyzokonyvvezeto: '',
  korosztaly: '',
  palya_jellege: '',
  futam_szama: '',
  rajthajo: '',
  celhajo: '',
  motorosok: '',
  birosag_elnok: '',
  birosag_birok: '',
  szel_rajtnal: '',
  szel_futam_kozben: '',
  elrajtoltak_szama: '',
  nem_rajtoltak: '',
  nem_futottak: '',
  korai_rajtolok: '',
  z_lobogos: '',
  fekete_lobogos: '',
  ovast_bejelento: '',
  elsonek_ideje: '',
  utolsonak_ideje: '',
  esemenyek: [emptyEvent(), emptyEvent(), emptyEvent(), emptyEvent(), emptyEvent()],
});

const RaceMinuteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!id) return;
    api.get(`/race-minutes/${id}`)
      .then(res => {
        const d = res.data;
        setFormData({
          verseny_neve: d.verseny_neve || '',
          helye: d.helye || '',
          ideje: d.ideje || '',
          rendezoje: d.rendezoje || '',
          versenyvezeto: d.versenyvezeto || '',
          jegyzokonyvvezeto: d.jegyzokonyvvezeto || '',
          korosztaly: d.korosztaly || '',
          palya_jellege: d.palya_jellege || '',
          futam_szama: d.futam_szama || '',
          rajthajo: d.rajthajo || '',
          celhajo: d.celhajo || '',
          motorosok: d.motorosok || '',
          birosag_elnok: d.birosag_elnok || '',
          birosag_birok: d.birosag_birok || '',
          szel_rajtnal: d.szel_rajtnal || '',
          szel_futam_kozben: d.szel_futam_kozben || '',
          elrajtoltak_szama: d.elrajtoltak_szama || '',
          nem_rajtoltak: d.nem_rajtoltak || '',
          nem_futottak: d.nem_futottak || '',
          korai_rajtolok: d.korai_rajtolok || '',
          z_lobogos: d.z_lobogos || '',
          fekete_lobogos: d.fekete_lobogos || '',
          ovast_bejelento: d.ovast_bejelento || '',
          elsonek_ideje: d.elsonek_ideje || '',
          utolsonak_ideje: d.utolsonak_ideje || '',
          esemenyek: Array.isArray(d.esemenyek) && d.esemenyek.length > 0
            ? d.esemenyek
            : [emptyEvent(), emptyEvent(), emptyEvent(), emptyEvent(), emptyEvent()],
        });
      })
      .catch(() => setError('Nem sikerült betölteni az adatokat.'));
  }, [id]);

  const set = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const setEvent = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.esemenyek];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, esemenyek: updated };
    });
  };

  const addRow = () =>
    setFormData(prev => ({ ...prev, esemenyek: [...prev.esemenyek, emptyEvent()] }));

  const removeRow = index =>
    setFormData(prev => ({
      ...prev,
      esemenyek: prev.esemenyek.filter((_, i) => i !== index),
    }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let savedId;
      if (isEdit) {
        const res = await api.put(`/race-minutes/${id}`, formData);
        savedId = res.data.id;
      } else {
        const res = await api.post('/race-minutes', formData);
        savedId = res.data.id;
      }

      // Download PDF
      const pdfResponse = await api.get(`/race-minutes/${savedId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `versenyjegyzokonyv_${formData.futam_szama || '1'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      navigate('/race-reports');
    } catch (err) {
      setError('Hiba a mentésnél. Kérjük próbálja újra.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>{isEdit ? 'Versenyjegyzőkönyv szerkesztése' : 'Új versenyjegyzőkönyv'}</h1>
          <button className="btn" onClick={() => navigate('/race-reports')}>← Vissza</button>
        </div>

        {error && <div className="feedback feedback-error">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* 1. Verseny adatai */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Verseny adatai</h3>
            <div className="grid-2">
              <F label="A verseny neve"    field="verseny_neve"       value={formData.verseny_neve}       onChange={set} />
              <F label="Rendezője"         field="rendezoje"           value={formData.rendezoje}           onChange={set} />
              <F label="Helye"             field="helye"               value={formData.helye}               onChange={set} />
              <F label="Ideje"             field="ideje"               value={formData.ideje}               onChange={set} placeholder="pl. 2025. szeptember 11-14." />
              <F label="Versenyvezető"     field="versenyvezeto"       value={formData.versenyvezeto}       onChange={set} />
              <F label="Jegyzőkönyvvezető" field="jegyzokonyvvezeto"   value={formData.jegyzokonyvvezeto}   onChange={set} />
            </div>
          </div>

          {/* 2. Futam adatai */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Futam adatai</h3>
            <div className="grid-3">
              <F label="Korosztály"   field="korosztaly"    value={formData.korosztaly}    onChange={set} />
              <F label="Pálya jellege" field="palya_jellege" value={formData.palya_jellege} onChange={set} placeholder="pl. Up & down" />
              <F label="Futam száma"  field="futam_szama"   value={formData.futam_szama}   onChange={set} />
            </div>
          </div>

          {/* 3. Hajók */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Hajók</h3>
            <div className="grid-3">
              <F label="Rajthajó"  field="rajthajo"  value={formData.rajthajo}  onChange={set} />
              <F label="Célhajó"   field="celhajo"   value={formData.celhajo}   onChange={set} />
              <F label="Motorosok" field="motorosok" value={formData.motorosok} onChange={set} />
            </div>
          </div>

          {/* 4. Versenybíróság */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Versenybíróság tagjai</h3>
            <div className="grid-2">
              <F label="Elnök" field="birosag_elnok" value={formData.birosag_elnok} onChange={set} />
              <F label="Bírók" field="birosag_birok" value={formData.birosag_birok} onChange={set} />
            </div>
          </div>

          {/* 5. Szél */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>A szél iránya és ereje</h3>
            <div className="grid-2">
              <F label="Rajtnál"      field="szel_rajtnal"      value={formData.szel_rajtnal}      onChange={set} />
              <F label="Futam közben" field="szel_futam_kozben" value={formData.szel_futam_kozben} onChange={set} />
            </div>
          </div>

          {/* 6. Rajtolók */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Rajtolók</h3>
            <div className="grid-3">
              <T label="Elrajtoltak száma (hajóosztályonként)" field="elrajtoltak_szama" value={formData.elrajtoltak_szama} onChange={set} />
              <T label="Nem rajtoltak (DNC/DNS)"               field="nem_rajtoltak"     value={formData.nem_rajtoltak}     onChange={set} />
              <T label="Nem futottak be (DNF)"                 field="nem_futottak"      value={formData.nem_futottak}      onChange={set} />
            </div>
          </div>

          {/* 7. Lobogók */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Lobogók</h3>
            <div className="grid-3">
              <T label='Korai rajtolók, (OCS) — 29.1 vagy 30.1 szabály' field="korai_rajtolok"  value={formData.korai_rajtolok}  onChange={set} />
              <T label='"Z" lobogós, (ZFP) — 30.2 szabály'               field="z_lobogos"       value={formData.z_lobogos}       onChange={set} />
              <T label='"Fekete" lobogós, (BFD) — 30.3 szabály'          field="fekete_lobogos"  value={formData.fekete_lobogos}  onChange={set} />
            </div>
          </div>

          {/* 8. Egyéb */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Egyéb adatok</h3>
            <T label="Óvást bejelentő hajók" field="ovast_bejelento" value={formData.ovast_bejelento} onChange={set} rows={2} />
            <div className="grid-2">
              <F label="Elsőnek befutott hajó ideje"   field="elsonek_ideje"   value={formData.elsonek_ideje}   onChange={set} />
              <F label="Utolsónak befutott hajó ideje" field="utolsonak_ideje" value={formData.utolsonak_ideje} onChange={set} />
            </div>
          </div>

          {/* 9. Események (2. oldal) */}
          <div className="card">
            <div className="page-header" style={{ marginBottom: 12 }}>
              <h3>Események — 2. oldal</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={addRow}>
                + Sor hozzáadása
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Időpont</th>
                  <th style={{ width: '62%' }}>Esemény és indoka</th>
                  <th style={{ width: '15%' }}>Szélerő, széliirány</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.esemenyek.map((ev, i) => (
                  <tr key={i}>
                    <td><input className="form-input" type="text" value={ev.idopont} onChange={e => setEvent(i, 'idopont', e.target.value)} /></td>
                    <td><input className="form-input" type="text" value={ev.esemeny} onChange={e => setEvent(i, 'esemeny', e.target.value)} /></td>
                    <td><input className="form-input" type="text" value={ev.szelero} onChange={e => setEvent(i, 'szelero', e.target.value)} /></td>
                    <td><button type="button" className="btn btn-danger btn-xs" onClick={() => removeRow(i)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 40, display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Mentés...' : isEdit ? 'Mentés és PDF letöltése' : 'Létrehozás és PDF letöltése'}
            </button>
            <button type="button" className="btn" onClick={() => navigate('/race-reports')}>
              Mégsem
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RaceMinuteForm;
