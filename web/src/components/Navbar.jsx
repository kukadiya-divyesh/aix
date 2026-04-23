import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Database, Map, Box, Bell } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="glass" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box color="white" size={20} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
            AIX <span style={{ color: 'var(--primary)' }}>SMART</span> INVENTORY
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginLeft: '2rem' }}>
          <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
            <Database size={18} /> Admin Master
          </Link>
          <Link to="/inventory" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
            <Map size={18} /> Locations
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <Bell size={20} />
        </button>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--primary)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>AD</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
