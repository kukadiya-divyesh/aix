import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Warehouse, 
  Truck, 
  Package, 
  AlertTriangle, 
  Settings,
  Menu,
  Box
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#ffffff',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Header ... (same as before) */}
      <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: '#d32f2f', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>AIX <span style={{ color: '#d32f2f' }}>SMART</span></h1>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>Inventory System</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '1.5rem 0' }}>
        <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        
        <div style={{ padding: '0.75rem 1.5rem', fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Operations</div>
        <NavItem to="/inbound" icon={<Truck size={20} />} label="Inbound" />
        <NavItem to="/outbound" icon={<Package size={20} />} label="Outbound" />
        <NavItem to="/exceptions" icon={<AlertTriangle size={20} />} label="Exceptions" />

        {isAdmin && (
          <React.Fragment>
            <div style={{ padding: '0.75rem 1.5rem', fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginTop: '1rem' }}>Configuration</div>
            <NavItem to="/warehouses" icon={<Warehouse size={20} />} label="Master Data" />
            <NavItem to="/settings" icon={<Settings size={20} />} label="System Users" />
          </React.Fragment>
        )}
      </nav>

      {/* Profile Footer */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={onLogout}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#d32f2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white' }}>
          {user.name?.[0]}
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{user.name}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{user.role} (Logout)</p>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => (
  <NavLink 
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1.5rem',
      color: isActive ? '#d32f2f' : 'var(--text-muted)',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 600,
      backgroundColor: isActive ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
      borderLeft: isActive ? '3px solid #d32f2f' : '3px solid transparent',
      transition: 'all 0.2s'
    })}
  >
    {icon}
    {label}
  </NavLink>
);

export default Sidebar;
