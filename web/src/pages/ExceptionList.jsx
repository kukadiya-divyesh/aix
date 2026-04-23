import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Eye, Calendar, User, FileText } from 'lucide-react';

const ExceptionList = () => {
  const [exceptions, setExceptions] = useState([
    {
      id: 1,
      po_no: 'PO-13007865',
      note: 'Box was found open during placement. 2 units missing from internal packaging.',
      image: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=300&auto=format&fit=crop',
      user: 'Sanjay Sharma',
      date: '2026-04-17 10:30 AM'
    }
  ]);

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#ef4444' }}>Exception Center</h1>
        <p style={{ color: '#94a3b8' }}>Monitor operational exceptions, missing items, and broken boxes.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {exceptions.map(ex => (
          <div key={ex.id} className="glass" style={{ borderLeft: '4px solid #ef4444', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '2rem', padding: '1.5rem' }}>
              <div style={{ width: '200px', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={ex.image} alt="Exception" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{ex.po_no}</span>
                    <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>HIGH PRIORITY</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14}/> {ex.date}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={14}/> {ex.user}</div>
                  </div>
                </div>
                
                <p style={{ color: 'white', lineHeight: 1.6, marginBottom: '1.5rem' }}>{ex.note}</p>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn" style={{ background: '#334155', color: 'white', fontSize: '13px' }}>
                    <Eye size={16} /> View Details
                  </button>
                  <button className="btn" style={{ background: '#334155', color: 'white', fontSize: '13px' }}>
                    <FileText size={16} /> Open Chatter
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExceptionList;
