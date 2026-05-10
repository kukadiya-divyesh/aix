import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Warehouse, 
  Truck, 
  Package, 
  AlertTriangle, 
  Settings,
  Menu,
  Box,
  X,
  FileText
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <div style={{
        display: 'none',
        padding: '1rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'space-between'
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Box size={20} color="#d32f2f" />
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800 }}>AIX <span style={{ color: '#d32f2f' }}>SMART</span></h1>
        </div>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-main)' }}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 90
          }} 
        />
      )}

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
        zIndex: 100,
        transition: 'transform 0.3s ease',
        transform: isOpen ? 'translateX(0)' : (window.innerWidth <= 1024 ? 'translateX(-100%)' : 'translateX(0)')
      }} className="sidebar">
        
        {/* Brand Header */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#d32f2f', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>AIX <span style={{ color: '#d32f2f' }}>SMART</span></h1>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>Inventory System</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="mobile-only" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '1.5rem 0' }}>
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setIsOpen(false)} />
          
          <div style={{ padding: '0.75rem 1.5rem', fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Operations</div>
          <NavItem to="/inbound" icon={<Truck size={20} />} label="Inbound" onClick={() => setIsOpen(false)} />
          <NavItem to="/outbound" icon={<Package size={20} />} label="Outbound" onClick={() => setIsOpen(false)} />
          <NavItem to="/exceptions" icon={<AlertTriangle size={20} />} label="Exceptions" onClick={() => setIsOpen(false)} />
          <NavItem to="/reports" icon={<FileText size={20} />} label="Reports" onClick={() => setIsOpen(false)} />

          {(isAdmin || user.role === 'GLOBAL') && (
            <React.Fragment>
              <div style={{ padding: '0.75rem 1.5rem', fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginTop: '1rem' }}>Configuration</div>
              <NavItem to="/warehouses" icon={<Warehouse size={20} />} label="Master Data" onClick={() => setIsOpen(false)} />
              {isAdmin && <NavItem to="/settings" icon={<Settings size={20} />} label="System Users" onClick={() => setIsOpen(false)} />}
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

      <style>{`
        @media (max-width: 1024px) {
          .mobile-header { display: flex !important; }
          .sidebar { transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important; }
          .mobile-only { display: block !important; }
        }
        @media (min-width: 1025px) {
          .mobile-header { display: none !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  );
};

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink 
    to={to}
    onClick={onClick}
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

