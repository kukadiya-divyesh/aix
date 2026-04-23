import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Trash2, 
  UserPlus, 
  Shield, 
  Warehouse, 
  Mail, 
  Lock,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'LOCATION_USER',
    warehouseIds: []
  });

  useEffect(() => {
    fetchUsers();
    fetchWarehouses();
  }, []);

  const fetchUsers = async () => {
    try {
      const resp = await axios.get('/api/auth/users');
      setUsers(resp.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const resp = await axios.get('/api/warehouses');
      setWarehouses(resp.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const handleWHToggle = (whId) => {
    const current = [...formData.warehouseIds];
    const index = current.indexOf(whId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(whId);
    }
    setFormData({ ...formData, warehouseIds: current });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await axios.put(`/api/auth/users/${editingUser.id}`, formData);
      } else {
        await axios.post('/api/auth/register', formData);
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'LOCATION_USER', warehouseIds: [] });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`/api/auth/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      warehouseIds: user.warehouseAccess?.map(w => w.id) || []
    });
    setShowForm(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>System User Configuration</h1>
          <p style={{ color: '#94a3b8' }}>Manage user accounts and warehouse-level access permissions.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} /> New User
          </button>
        )}
      </header>

      {showForm && (
        <div className="glass" style={{ marginBottom: '2rem', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingUser ? <Settings size={22} /> : <UserPlus size={22} />}
            {editingUser ? `Edit User: ${editingUser.name}` : 'Create New Account'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}><UserIcon size={14} /> Full Name</label>
                <input className="glass" style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}><Mail size={14} /> Email Address</label>
                <input className="glass" style={inputStyle} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              {!editingUser && (
                <div>
                  <label style={labelStyle}><Lock size={14} /> Password</label>
                  <input className="glass" style={inputStyle} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>
              )}
              <div>
                <label style={labelStyle}><Shield size={14} /> System Role</label>
                <select className="glass" style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="LOCATION_USER">LOCATION_USER (Specific Access Only)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <label style={labelStyle}><Warehouse size={14} /> Warehouse Access Permissions</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '1rem', 
                marginTop: '1rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: '8px'
              }}>
                {warehouses.map(wh => (
                  <label key={wh.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      style={{ transform: 'scale(1.2)' }}
                      checked={formData.warehouseIds.includes(wh.id)} 
                      onChange={() => handleWHToggle(wh.id)}
                    />
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ fontWeight: 600 }}>{wh.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{wh.city}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Processing...' : (editingUser ? 'Update User' : 'Create User Account')}
              </button>
              <button type="button" className="btn" style={{ background: '#334155', color: 'white' }} onClick={() => { setShowForm(false); setEditingUser(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '13px' }}>
            <tr>
              <th style={thStyle}>USER</th>
              <th style={thStyle}>ROLE</th>
              <th style={thStyle}>ASSIGNED WAREHOUSES</th>
              <th style={thStyle}>CREATED</th>
              <th style={thStyle}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', height: '70px' }}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#d32f2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{u.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 800,
                    backgroundColor: u.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: u.role === 'ADMIN' ? '#3b82f6' : '#10b981'
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {u.role === 'ADMIN' ? (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>All Locations (Global Access)</span>
                    ) : (
                      u.warehouseAccess?.map(wh => (
                        <span key={wh.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '11px' }}>
                          {wh.name}
                        </span>
                      ))
                    )}
                    {u.role !== 'ADMIN' && u.warehouseAccess?.length === 0 && (
                      <span style={{ color: '#ef4444', fontSize: '12px' }}>No Access Assigned</span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>Active</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={actionBtnStyle} onClick={() => startEdit(u)}><Settings size={16} /></button>
                    <button style={{ ...actionBtnStyle, color: '#ef4444' }} onClick={() => deleteUser(u.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = { padding: '1.2rem 1.5rem', fontWeight: 700 };
const tdStyle = { padding: '1rem 1.5rem' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '13px', color: '#94a3b8', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '0.8rem', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', backgroundColor: 'transparent' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' };

export default UserManagement;
