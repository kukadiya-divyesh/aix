import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WarehouseMaster from './pages/WarehouseMaster';
import InboundModule from './pages/InboundModule';
import OutboundModule from './pages/OutboundModule';
import ExceptionList from './pages/ExceptionList';
import UserManagement from './pages/UserManagement';

// Add JWT to all axios requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Layout = ({ user, onLogout, children }) => (
  <div style={{ display: 'flex' }}>
    <Sidebar user={user} onLogout={onLogout} />
    <main style={{ 
      flex: 1, 
      marginLeft: '260px', 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-dark)',
      color: 'var(--text-main)',
      width: 'calc(100% - 260px)'
    }}>
      {children}
    </main>
  </div>
);

import { FeedbackProvider } from './components/FeedbackProvider';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  if (!user) {
    return (
      <FeedbackProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </FeedbackProvider>
    );
  }

  return (
    <FeedbackProvider>
      <Router>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbound" element={<InboundModule user={user} />} />
            <Route path="/outbound" element={<OutboundModule />} />
            <Route path="/exceptions" element={<ExceptionList />} />
            <Route path="/warehouses" element={<WarehouseMaster />} />
            <Route path="/settings" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </FeedbackProvider>
  );
}

export default App;
