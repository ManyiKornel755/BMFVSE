import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Groups from './pages/Groups';
import Trainings from './pages/Trainings';
import Messages from './pages/Messages';
import RaceReports from './pages/RaceReports';
import Profile from './pages/Profile';
import Emails from './pages/Emails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/members" element={
            <PrivateRoute>
              <Members />
            </PrivateRoute>
          } />
          
          <Route path="/users" element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          } />
          
          <Route path="/roles" element={
            <AdminRoute>
              <Roles />
            </AdminRoute>
          } />

          <Route path="/groups" element={
            <AdminRoute>
              <Groups />
            </AdminRoute>
          } />

          <Route path="/trainings" element={
            <PrivateRoute>
              <Trainings />
            </PrivateRoute>
          } />
          
          <Route path="/messages" element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          } />
          
          <Route path="/race-reports" element={
            <PrivateRoute>
              <RaceReports />
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/emails" element={
            <AdminRoute>
              <Emails />
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
