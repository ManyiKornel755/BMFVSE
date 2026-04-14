import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      // Friss adatok betöltése (pl. profilkép)
      api.get('/users/me').then(res => {
        const fresh = { ...JSON.parse(userData), profile_image: res.data.profile_image || null };
        localStorage.setItem('user', JSON.stringify(fresh));
        setUser(fresh);
      }).catch(() => {});
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const updateUser = (updatedFields) => {
    const newUser = { ...user, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.roles?.includes('admin') || false;
  };

  const isCoach = () => {
    return user?.roles?.includes('coach') || user?.roles?.includes('trainer') || false;
  };

  const isAdminOrCoach = () => {
    return isAdmin() || isCoach();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isAdmin, isCoach, isAdminOrCoach }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
