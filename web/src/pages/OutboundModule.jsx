import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Minus, Send, Package, ArrowUpCircle } from 'lucide-react';

const OutboundModule = () => {
  const [inbounds, setInbounds] = useState([]); // To select which inbound we are shipping out from
  const [outbounds, setOutbounds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  
  const [headerData, setHeaderData] = useState({
    inboundId: '',
    customerName: '',
    demandQty: 0
  });

  const [lines, setLines] = useState([
    { flight_no: '', sb_no: '', quantity_issued: 0, balance: 0, status: 'pending' }
  ]);

  useEffect(() => {
    fetchInbounds();
  }, []);

  useEffect(() => {
    fetchOutbounds();
  }, [appliedSearch, pagination.page]);

  const fetchInbounds = async () => {
    try {
      const resp = await axios.get('/api/inbound');
      setInbounds(resp.data.data || resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOutbounds = async () => {
    try {
      const resp = await axios.get(`/api/outbound?search=${appliedSearch}&page=${pagination.page}`);
      setOutbounds(resp.data.data);
      setPagination(prev => ({ ...prev, totalPages: resp.data.pagination.totalPages }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }));
    setAppliedSearch(searchTerm);
  };

  const addLine = () => {
    const lastLine = lines[lines.length - 1];
    setLines([...lines, { 
      flight_no: '', 
      sb_no: '', 
      quantity_issued: 0, 
      balance: lastLine ? lastLine.balance : headerData.demandQty, 
      status: 'pending' 
    }]);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;

    // Auto-calculate balance
    if (field === 'quantity_issued') {
      let currentTotal = 0;
      for (let i = 0; i <= index; i++) {
        currentTotal += parseInt(newLines[i].quantity_issued || 0);
      }
      newLines[index].balance = headerData.demandQty - currentTotal;
    }

    setLines(newLines);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, we'd have a POST /api/outbound endpoint
      // Simulation of success for now
      setTimeout(() => {
        alert('Outbound request created. Mobile users can now scan picked items.');
        setShowForm(false);
        setLoading(false);
      }, 1000);
    } catch (err) {
      alert('Error creating outbound');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Outbound Tracking</h1>
          <p style={{ color: '#94a3b8' }}>Monitor real-time fulfillment progress and shipment status.</p>
        </div>
      </header>


      <div className="glass" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Package size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            className="glass"
            placeholder="Search by Customer name or PO Number..." 
            style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSearch} style={{ padding: '0.6rem 1.5rem' }}>
          Search Shipments
        </button>
        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          {outbounds.length} records shown (Page {pagination.page} of {pagination.totalPages})
        </div>
      </div>

      <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8', fontSize: '13px' }}>
            <tr>
              <th style={thStyle}>CUSTOMER NAME</th>
              <th style={thStyle}>LINKED PO</th>
              <th style={thStyle}>DEMAND QTY</th>
              <th style={thStyle}>LINES</th>
              <th style={thStyle}>STATUS</th>
              <th style={thStyle}>CREATED AT</th>
            </tr>
          </thead>
          <tbody>
            {outbounds.map(ob => (
              <tr key={ob.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{ob.customerName}</td>
                <td style={{ ...tdStyle, color: '#3b82f6' }}>{ob.inbound?.po_no}</td>
                <td style={tdStyle}>{ob.demandQty}</td>
                <td style={tdStyle}>{ob._count?.lines || 0}</td>
                <td style={tdStyle}>
                   <StatusBadge status={ob.status} />
                </td>
                <td style={tdStyle}>{new Date(ob.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button 
              className="btn" 
              disabled={pagination.page === 1}
              onClick={() => setPagination({...pagination, page: pagination.page - 1})}
              style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}
            >
              Previous
            </button>
            <button 
              className="btn btn-primary" 
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination({...pagination, page: pagination.page + 1})}
              style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}
            >
              Next
            </button>
          </div>
        )}

        {outbounds.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            {searchTerm ? `No shipments matching "${searchTerm}"` : 'No active outbound shipments found.'}
          </div>
        )}
      </div>
    </div>
  );
};

const thStyle = { padding: '1rem', fontWeight: 700 };
const tdStyle = { padding: '1rem', fontSize: '14px' };

const StatusBadge = ({ status }) => {
  const colors = {
    OPEN: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
    PARTIAL: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    CLOSED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' }
  };
  const theme = colors[status] || colors.OPEN;
  return (
    <span style={{ backgroundColor: theme.bg, color: theme.text, padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
      {status}
    </span>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '13px', color: '#94a3b8', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '0.7rem', color: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px' };
const smallLabelStyle = { display: 'block', marginBottom: '0.3rem', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' };
const smallInputStyle = { width: '100%', padding: '0.6rem', color: 'white', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '13px' };

export default OutboundModule;
