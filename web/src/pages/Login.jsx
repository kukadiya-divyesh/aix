import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, Box, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await axios.post('/api/auth/login', { email, password });
      const { token, user } = resp.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-dark)',
      color: 'var(--text-main)'
    }}>
      <div className="glass animate-fade-in" style={{ width: '400px', padding: '3rem', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          backgroundColor: 'var(--primary)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Box size={28} color="white" />
        </div>
        
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>AIX SMART</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '14px' }}>Log in to access inventory operations</p>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle} />
              <input 
                type="email" 
                className="glass" 
                style={inputStyle} 
                placeholder="admin@aix.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={iconStyle} />
              <input 
                type="password" 
                className="glass" 
                style={inputStyle} 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '16px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={20} />
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '12px', color: 'var(--text-muted)' }}>
          Inventory Management Terminal v1.0.0
        </p>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.8rem', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' };
const iconStyle = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' };

export default Login;
