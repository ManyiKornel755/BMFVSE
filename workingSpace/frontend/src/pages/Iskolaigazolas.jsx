import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Iskolaigazolas() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [logoPreview] = useState('/egyesulet_logo.png');
  const [mode, setMode] = useState('personal');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [createForm, setCreateForm] = useState({
    personName: '',
    birthDate: '',
    birthPlace: '',
    motherName: '',
    idNumber: '',
    address: '',
    certificateType: '',
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    purpose: '',
    additionalNotes: '',
    issuerName: '',
    issuerPosition: 'Elnök'
  });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await api.get('/users');
      // Csak azok a felhasználók, akik NEM adminok vagy edzők
      const regularMembers = (res.data || []).filter(user => {
        const roles = user.roles || [];
        const roleNames = roles.map(r => r.name?.toLowerCase());
        return !roleNames.includes('admin') && !roleNames.includes('coach');
      });
      setMembers(regularMembers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMemberClick(member) {
    setSelectedMember(member);
    try {
      // Fetch detailed user information and their certificates
      const [userRes, certsRes] = await Promise.all([
        api.get(`/users/${member.id}`),
        api.get('/certificates')
      ]);
      setMemberDetails(userRes.data);
      // Filter certificates for this user
      setCertificates((certsRes.data || []).filter(cert => cert.user_id === member.id));
    } catch (err) {
      console.error(err);
    }
  }

  async function openCreateModal() {
    setShowCreateModal(true);
    // Fetch groups for group mode
    try {
      const res = await api.get('/groups');
      setGroups(res.data || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
    // Pre-fill member data if available
    if (memberDetails || selectedMember) {
      const member = memberDetails || selectedMember;
      const birthDateFormatted = member.birth_date ? new Date(member.birth_date).toISOString().split('T')[0] : '';

      // Név összeállítása
      let fullName = '';
      if (member.name) {
        fullName = member.name;
      } else if (member.first_name || member.last_name) {
        fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
      }

      setCreateForm({
        personName: fullName,
        birthDate: birthDateFormatted,
        birthPlace: member.birth_place || '',
        motherName: member.mother_name || (member.parent_name || ''),
        idNumber: member.id_number || '',
        address: member.address || '',
        certificateType: 'membership',
        issueDate: new Date().toISOString().split('T')[0],
        validUntil: '',
        purpose: '',
        additionalNotes: '',
        issuerName: '',
        issuerPosition: 'Elnök'
      });
    }
  }

  function handleModeChange(newMode) {
    setMode(newMode);
    if (newMode === 'personal') {
      setSelectedGroup(null);
    }
  }

  function handleReset() {
    const member = memberDetails || selectedMember;
    const birthDateFormatted = member?.birth_date ? new Date(member.birth_date).toISOString().split('T')[0] : '';

    // Név összeállítása
    let fullName = '';
    if (member) {
      if (member.name) {
        fullName = member.name;
      } else if (member.first_name || member.last_name) {
        fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
      }
    }

    setCreateForm({
      personName: fullName,
      birthDate: birthDateFormatted,
      birthPlace: member?.birth_place || '',
      motherName: member?.mother_name || (member?.parent_name || ''),
      idNumber: member?.id_number || '',
      address: member?.address || '',
      certificateType: '',
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: '',
      purpose: '',
      additionalNotes: '',
      issuerName: '',
      issuerPosition: 'Elnök'
    });
    setMode('personal');
    setSelectedGroup(null);
  }

  function handlePreview() {
    const content = generateCertificateContent();
    setPreviewContent(content);
    setShowPreviewModal(true);
  }

  function generateCertificateContent() {
    return `
ISKOLAIGAZOLÁS

Balatonmáriai Vizisport Egyesület

Alulírott igazolom, hogy ${createForm.personName}
Születési dátum: ${createForm.birthDate}
Születési hely: ${createForm.birthPlace}
Anyja neve: ${createForm.motherName}
${createForm.idNumber ? `Személyi ig. szám: ${createForm.idNumber}` : ''}
Lakcím: ${createForm.address}

${getCertificateTypeText(createForm.certificateType)}

Kiállítás célja: ${createForm.purpose}

${createForm.additionalNotes ? `Megjegyzés: ${createForm.additionalNotes}` : ''}

Kiállítva: ${createForm.issueDate}
${createForm.validUntil ? `Érvényes: ${createForm.validUntil}-ig` : ''}

${createForm.issuerName}
${createForm.issuerPosition}
    `.trim();
  }


  async function handleCreate(e) {
    e.preventDefault();

    const certificateContent = generateCertificateContent();

    try {
      if (mode === 'personal') {
        await api.post('/certificates', {
          user_id: selectedMember.id,
          title: `${getCertificateTypeText(createForm.certificateType)} - ${createForm.personName}`,
          content: certificateContent,
          issue_date: createForm.issueDate,
          valid_until: createForm.validUntil || null
        });
        setFeedback({ type: 'success', message: 'Igazolás sikeresen létrehozva!' });
      } else {
        // Group mode - create certificates for all group members
        if (!selectedGroup) {
          setFeedback({ type: 'error', message: 'Válasszon ki egy csoportot!' });
          return;
        }
        // Fetch group members
        const membersRes = await api.get(`/groups/${selectedGroup}/members`);
        const groupMembers = membersRes.data || [];

        for (const member of groupMembers) {
          const memberContent = `
ISKOLAIGAZOLÁS

Balatonmáriai Vizisport Egyesület

Alulírott igazolom, hogy ${member.name}
${getCertificateTypeText(createForm.certificateType)}

Kiállítás célja: ${createForm.purpose}

${createForm.additionalNotes ? `Megjegyzés: ${createForm.additionalNotes}` : ''}

Kiállítva: ${createForm.issueDate}
${createForm.validUntil ? `Érvényes: ${createForm.validUntil}-ig` : ''}

${createForm.issuerName}
${createForm.issuerPosition}
          `.trim();

          await api.post('/certificates', {
            user_id: member.id,
            title: `${getCertificateTypeText(createForm.certificateType)} - ${member.name}`,
            content: memberContent,
            issue_date: createForm.issueDate,
            valid_until: createForm.validUntil || null
          });
        }
        setFeedback({ type: 'success', message: `${groupMembers.length} igazolás sikeresen létrehozva!` });
      }

      setShowCreateModal(false);
      handleReset();
      // Refresh certificates if viewing a member
      if (selectedMember) {
        handleMemberClick(selectedMember);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Hiba az igazolás létrehozása során!' });
    }
  }

  function getCertificateTypeText(type) {
    const types = {
      'membership': 'az egyesületünk aktív tagja',
      'training': 'rendszeresen részt vesz az edzéseinken',
      'competition': 'részt vett egyesületünk versenyén',
      'exam': 'sikeresen elvégezte a vizsgát',
      'participation': 'részt vett az egyesületünk programjain'
    };
    return types[type] || '';
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli ezt az igazolást?')) return;
    try {
      await api.delete(`/certificates/${id}`);
      setFeedback({ type: 'success', message: 'Igazolás törölve!' });
      // Refresh certificates
      handleMemberClick(selectedMember);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Hiba a törlés során!' });
    }
  }

  function goBack() {
    setSelectedMember(null);
    setMemberDetails(null);
    setCertificates([]);
  }

  if (!isAdmin()) {
    return (
      <div className="main-content">
        <Navbar />
        <div className="container">
          <div className="card">
            <p>Hozzáférés megtagadva. Csak adminisztrátorok állíthatnak ki igazolást.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Navbar />
      <div className="container">
        <h1>Iskolaigazolás</h1>
        {feedback && (
          <div className={`feedback feedback-${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {!selectedMember ? (
          /* Tagok listája */
          <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ color: '#1976D2', marginBottom: '16px' }}>Tagok</h2>
            {loading ? <p>Betöltés...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map(member => {
                  const displayName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Név nélkül';
                  return (
                    <div
                      key={member.id}
                      className="list-item"
                      onClick={() => handleMemberClick(member)}
                      style={{ cursor: 'pointer', padding: '16px', borderRadius: '8px', background: 'rgba(30, 136, 229, 0.05)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(30, 136, 229, 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(30, 136, 229, 0.05)'}
                    >
                      <strong style={{ fontSize: '1.25rem', color: '#0D47A1', fontWeight: '700' }}>{displayName}</strong>
                      <p className="text-secondary" style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>{member.email}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Tag részletes adatai */
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <button
              className="btn"
              onClick={goBack}
              style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Vissza a tagokhoz
            </button>

            <div className="profile-layout">
              <div className="info-panel" style={{ gridColumn: '1 / -1' }}>
                <div className="info-card">
                  <h3>Személyes Adatok</h3>
                  <p><strong>Név:</strong> {memberDetails?.name || `${selectedMember.first_name} ${selectedMember.last_name}`}</p>
                  <p><strong>Email:</strong> {memberDetails?.email || selectedMember.email}</p>
                  <p><strong>Telefon:</strong> {memberDetails?.phone || '-'}</p>
                  <p><strong>Cím:</strong> {memberDetails?.address || '-'}</p>
                  <p><strong>Regisztráció:</strong> {memberDetails?.created_at ? new Date(memberDetails.created_at).toLocaleDateString('hu-HU') : '-'}</p>
                </div>

                <div className="info-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Igazolások ({certificates.length})</h3>
                    <button className="btn-add" onClick={openCreateModal}>
                      Új igazolás létrehozása
                    </button>
                  </div>
                  {certificates.length === 0 ? (
                    <p style={{ color: '#666' }}>Még nincsenek igazolások ehhez a taghoz.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {certificates.map(cert => (
                        <div key={cert.id} className="message-item">
                          <div className="message-item-body">
                            <strong>{cert.title}</strong>
                            <p className="text-muted">
                              Kiállítva: {new Date(cert.issue_date).toLocaleDateString('hu-HU')}
                              {cert.valid_until && ` | Érvényes: ${new Date(cert.valid_until).toLocaleDateString('hu-HU')}-ig`}
                            </p>
                            {cert.content && (
                              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(30, 136, 229, 0.05)', borderRadius: '4px', fontSize: '0.9rem' }}>
                                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{cert.content}</p>
                              </div>
                            )}
                          </div>
                          <div className="message-item-actions">
                            <button className="btn-danger" onClick={() => handleDelete(cert.id)}>
                              Törlés
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Létrehozás Modal */}
        {showCreateModal && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-box" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>

              {/* Organization Header */}
              <div className="blue-header" style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)', borderRadius: '12px', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                    <img src={logoPreview} alt="Egyesület Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>Balatonmáriai Vizisport Egyesület</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>Igazolás Generátor</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate}>
                {/* Mode Selector */}
                <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(30, 136, 229, 0.05)', borderRadius: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#1565C0' }}>Típus:</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px 20px', background: mode === 'personal' ? '#1E88E5' : 'white', color: mode === 'personal' ? 'white' : '#333', borderRadius: '8px', border: '2px solid #1E88E5', transition: 'all 0.3s' }}>
                      <input
                        type="radio"
                        name="mode"
                        value="personal"
                        checked={mode === 'personal'}
                        onChange={() => handleModeChange('personal')}
                        style={{ marginRight: '8px' }}
                      />
                      Személyes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px 20px', background: mode === 'group' ? '#1E88E5' : 'white', color: mode === 'group' ? 'white' : '#333', borderRadius: '8px', border: '2px solid #1E88E5', transition: 'all 0.3s' }}>
                      <input
                        type="radio"
                        name="mode"
                        value="group"
                        checked={mode === 'group'}
                        onChange={() => handleModeChange('group')}
                        style={{ marginRight: '8px' }}
                      />
                      Csoport
                    </label>
                  </div>
                </div>

                {/* Personal Data Section */}
                <div style={{ marginBottom: '24px', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #E0E0E0', opacity: mode === 'group' ? 0.5 : 1 }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1565C0' }}>Személyes Adatok</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Név *</label>
                      <input
                        className="form-input"
                        value={createForm.personName}
                        onChange={e => setCreateForm({ ...createForm, personName: e.target.value })}
                        disabled={mode === 'group'}
                        required={mode === 'personal'}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Születési dátum *</label>
                      <input
                        className="form-input"
                        type="date"
                        value={createForm.birthDate}
                        onChange={e => setCreateForm({ ...createForm, birthDate: e.target.value })}
                        disabled={mode === 'group'}
                        required={mode === 'personal'}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Születési hely *</label>
                      <input
                        className="form-input"
                        value={createForm.birthPlace}
                        onChange={e => setCreateForm({ ...createForm, birthPlace: e.target.value })}
                        disabled={mode === 'group'}
                        required={mode === 'personal'}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Anyja neve *</label>
                      <input
                        className="form-input"
                        value={createForm.motherName}
                        onChange={e => setCreateForm({ ...createForm, motherName: e.target.value })}
                        disabled={mode === 'group'}
                        required={mode === 'personal'}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Személyi ig. szám</label>
                      <input
                        className="form-input"
                        value={createForm.idNumber}
                        onChange={e => setCreateForm({ ...createForm, idNumber: e.target.value })}
                        disabled={mode === 'group'}
                        placeholder="Opcionális"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Lakcím *</label>
                      <input
                        className="form-input"
                        value={createForm.address}
                        onChange={e => setCreateForm({ ...createForm, address: e.target.value })}
                        disabled={mode === 'group'}
                        required={mode === 'personal'}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Group Selection Section */}
                <div style={{ marginBottom: '24px', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #E0E0E0', opacity: mode === 'personal' ? 0.5 : 1 }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1565C0' }}>Csoport Kiválasztása</h3>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Válasszon csoportot *</label>
                    <select
                      className="form-input"
                      value={selectedGroup || ''}
                      onChange={e => setSelectedGroup(e.target.value)}
                      disabled={mode === 'personal'}
                      required={mode === 'group'}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Válasszon --</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Certificate Data Section */}
                <div style={{ marginBottom: '24px', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #E0E0E0' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1565C0' }}>Igazolás Adatok</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Igazolás típusa *</label>
                      <select
                        className="form-input"
                        value={createForm.certificateType}
                        onChange={e => setCreateForm({ ...createForm, certificateType: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      >
                        <option value="">-- Válasszon --</option>
                        <option value="membership">Tagság</option>
                        <option value="training">Edzés</option>
                        <option value="competition">Verseny</option>
                        <option value="exam">Vizsga</option>
                        <option value="participation">Részvétel</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Kiállítás dátuma *</label>
                      <input
                        className="form-input"
                        type="date"
                        value={createForm.issueDate}
                        onChange={e => setCreateForm({ ...createForm, issueDate: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Érvényes eddig</label>
                      <input
                        className="form-input"
                        type="date"
                        value={createForm.validUntil}
                        onChange={e => setCreateForm({ ...createForm, validUntil: e.target.value })}
                        placeholder="Opcionális"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Kiállítás célja *</label>
                      <input
                        className="form-input"
                        value={createForm.purpose}
                        onChange={e => setCreateForm({ ...createForm, purpose: e.target.value })}
                        required
                        placeholder="pl. munkáltatónak, iskolának, stb."
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>További megjegyzések</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={createForm.additionalNotes}
                        onChange={e => setCreateForm({ ...createForm, additionalNotes: e.target.value })}
                        placeholder="Opcionális"
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Issuer Data Section */}
                <div style={{ marginBottom: '24px', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #E0E0E0' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1565C0' }}>Kiállító Adatai</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Kiállító neve *</label>
                      <input
                        className="form-input"
                        value={createForm.issuerName}
                        onChange={e => setCreateForm({ ...createForm, issuerName: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Beosztás *</label>
                      <input
                        className="form-input"
                        value={createForm.issuerPosition}
                        onChange={e => setCreateForm({ ...createForm, issuerPosition: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Button Group */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{ padding: '12px 24px', background: '#757575', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    Visszaállítás
                  </button>
                  <button
                    type="button"
                    onClick={handlePreview}
                    style={{ padding: '12px 24px', background: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    Előnézet
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    Generálás
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && (
          <div className="modal-overlay" style={{ zIndex: 1001 }}>
            <div className="modal-box" style={{ maxWidth: '600px' }}>
              <button className="modal-close-btn" onClick={() => setShowPreviewModal(false)}>×</button>
              <h2 style={{ marginBottom: '16px', color: '#1565C0' }}>Előnézet</h2>
              <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '2px solid #1E88E5', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {previewContent}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{ padding: '10px 20px', background: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
