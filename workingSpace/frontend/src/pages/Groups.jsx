import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

const Groups = () => {
  const { isAdminOrCoach: canManage } = useAuth();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setError('A csoportok betöltése sikertelen');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/members');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');

    if (!newGroupName.trim()) {
      setError('A csoport neve kötelező');
      return;
    }

    try {
      await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      setShowCreateModal(false);
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
      setError(error.response?.data?.error || 'A csoport létrehozása sikertelen');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Biztosan törli ezt a csoportot?')) return;

    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
      setError('A csoport törlése sikertelen');
    }
  };

  const openEditModal = async (group) => {
    setSelectedGroup(group);
    setEditGroupName(group.name);
    setError('');

    try {
      const response = await api.get(`/groups/${group.id}/members`);
      setGroupMembers(response.data);
      setSelectedUsers([]);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      setError('A csoport tagjainak betöltése sikertelen');
    }
  };

  const handleUpdateGroupName = async (e) => {
    e.preventDefault();
    setError('');

    if (!editGroupName.trim()) {
      setError('A csoport neve kötelező');
      return;
    }

    try {
      await api.put(`/groups/${selectedGroup.id}`, { name: editGroupName });
      fetchGroups();
      setSelectedGroup({ ...selectedGroup, name: editGroupName });
    } catch (error) {
      console.error('Failed to update group name:', error);
      setError(error.response?.data?.error || 'A csoport nevének frissítése sikertelen');
    }
  };

  const handleAddMembers = async () => {
    setError('');

    if (selectedUsers.length === 0) {
      setError('Válasszon ki legalább egy felhasználót');
      return;
    }

    if (selectedUsers.length > 50) {
      setError('Egyszerre maximum 50 tagot adhat hozzá');
      return;
    }

    try {
      await api.post(`/groups/${selectedGroup.id}/members`, {
        userIds: selectedUsers
      });

      const response = await api.get(`/groups/${selectedGroup.id}/members`);
      setGroupMembers(response.data);
      setSelectedUsers([]);
      fetchGroups();
    } catch (error) {
      console.error('Failed to add members:', error);
      setError(error.response?.data?.error || 'A tagok hozzáadása sikertelen');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Biztosan eltávolítja ezt a tagot a csoportból?')) return;

    try {
      await api.delete(`/groups/${selectedGroup.id}/members/${userId}`);

      const response = await api.get(`/groups/${selectedGroup.id}/members`);
      setGroupMembers(response.data);
      fetchGroups();
    } catch (error) {
      console.error('Failed to remove member:', error);
      setError('A tag eltávolítása sikertelen');
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const availableUsers = users.filter(
    user => !groupMembers.some(member => member.id === user.id)
  );

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Csoportok</h1>
          {canManage() && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Csoport létrehozása
            </button>
          )}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Csoport neve</th>
                <th>Tagok</th>
                {canManage() && <th>Műveletek</th>}
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">Nincs csoport</td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.member_count || 0}</td>
                    {canManage() && (
                      <td>
                        <button onClick={() => openEditModal(group)} className="btn btn-secondary btn-mr">
                          Szerkesztés
                        </button>
                        <button onClick={() => handleDeleteGroup(group.id)} className="btn btn-danger">
                          Törlés
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2>Új csoport létrehozása</h2>
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label>Csoport neve:</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Adja meg a csoport nevét"
                    required
                  />
                </div>
                <div className="modal-buttons">
                  <button type="submit" className="btn btn-primary">Létrehozás</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    Mégse
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedGroup && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
              <h2>Csoport szerkesztése: {selectedGroup.name}</h2>

              <form onSubmit={handleUpdateGroupName} className="mb-12">
                <div className="form-group">
                  <label>Csoport neve:</label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Név frissítése</button>
              </form>

              <h3>Jelenlegi tagok ({groupMembers.length})</h3>
              {groupMembers.length === 0 ? (
                <p>Még nincsenek tagok ebben a csoportban</p>
              ) : (
                <div className="mb-12">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Név</th>
                        <th>Email</th>
                        <th>Művelet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupMembers.map((member) => (
                        <tr key={member.id}>
                          <td>{member.first_name} {member.last_name}</td>
                          <td>{member.email}</td>
                          <td>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="btn btn-danger btn-xs"
                            >
                              Eltávolítás
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3>Tagok hozzáadása</h3>
              <p className="hint-text">
                Válassza ki a hozzáadandó felhasználókat (max 50 egyszerre). Kiválasztva: {selectedUsers.length}
              </p>

              {availableUsers.length === 0 ? (
                <p>Minden felhasználó már tagja ennek a csoportnak</p>
              ) : (
                <>
                  <div className="groups-user-list">
                    {availableUsers.map((user) => (
                      <div key={user.id} className="user-check-item">
                        <label className="user-check-label">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                            className="checkbox-mr"
                          />
                          <span>{user.first_name} {user.last_name} ({user.email})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddMembers}
                    className="btn btn-primary"
                    disabled={selectedUsers.length === 0}
                  >
                    Kiválasztott tagok hozzáadása ({selectedUsers.length})
                  </button>
                </>
              )}

              <div className="modal-buttons">
                <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
