import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Truck, Hash, Calendar, Box, RefreshCw, Clock, ArrowLeft, CheckCircle, AlertTriangle, User, MessageSquare } from 'lucide-react';
import { useFeedback } from '../components/FeedbackProvider';

const OutboundModule = () => {
  const [view, setView] = useState('tree'); // 'tree' | 'form'
  const [outboundLines, setOutboundLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [activeSubTab, setActiveSubTab] = useState('details'); // 'details' | 'exceptions'
  const [lineExceptions, setLineExceptions] = useState([]);
  const { showNotification } = useFeedback();

  useEffect(() => {
    if (view === 'tree') fetchOutboundLines();
  }, [pagination.page, view]);

  const fetchOutboundLines = async () => {
    setLoading(true);
    try {
      const resp = await axios.get('/api/outbound/lines', {
        params: { search: searchTerm, page: pagination.page }
      });
      setOutboundLines(resp.data.data);
      setPagination(prev => ({ 
        ...prev, 
        total: resp.data.pagination.total, 
        totalPages: resp.data.pagination.totalPages 
      }));
    } catch (err) {
      console.error('Error fetching outbound lines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOutboundLines();
  };

  const handleRowClick = (line) => {
    setSelectedLine(line);
    fetchLineExceptions(line.id);
    setView('form');
  };

  const fetchLineExceptions = async (lineId) => {
    try {
      const resp = await axios.get(`/api/outbound/exceptions/${lineId}`);
      setLineExceptions(resp.data);
    } catch (err) {
      console.error('Error fetching line exceptions:', err);
    }
  };

  if (view === 'form' && selectedLine) {
    return (
      <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }} className="animate-fade-in">
        <header style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => setView('tree')} 
            style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
          >
            <ArrowLeft size={18} /> Back to Fulfillment List
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>
                Shipment {selectedLine.sbNo}
              </h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Linked to PO {selectedLine.outbound?.inbound?.po_no}</p>
            </div>
            <StatusBadge status={selectedLine.status} />
          </div>
        </header>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
           <SubTab label="Details" active={activeSubTab === 'details'} onClick={() => setActiveSubTab('details')} />
           <SubTab label="Exceptions" active={activeSubTab === 'exceptions'} onClick={() => setActiveSubTab('exceptions')} count={lineExceptions.length} />
        </div>

        {activeSubTab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }} className="animate-fade-in">
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#475569', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Shipment Information</h3>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <InfoItem label="Flight / Vehicle" value={selectedLine.flightNo} icon={<Truck size={16} />} />
                  <InfoItem label="Shipping Bill" value={selectedLine.sbNo} icon={<Hash size={16} />} />
                  <InfoItem label="Quantity Issued" value={`${selectedLine.quantityIssued} Units`} icon={<Box size={16} />} />
                  <InfoItem label="Number of Boxes" value={`${selectedLine.noOfBoxes} Boxes`} icon={<Box size={16} />} />
                  <InfoItem label="Created At" value={new Date(selectedLine.createdAt).toLocaleString()} icon={<Calendar size={16} />} />
                  <InfoItem label="Assigned Personnel" value={selectedLine.outbound?.assignedUser?.name || 'Unassigned'} icon={<User size={16} />} />
               </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#475569', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Inbound Context</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Linked PO</div>
                    <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: '18px' }}>{selectedLine.outbound?.inbound?.po_no}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Product Description</div>
                    <div style={{ color: '#1e293b', fontSize: '14px', lineHeight: '1.5' }}>{selectedLine.outbound?.inbound?.product_description || 'N/A'}</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'exceptions' && (
          <div className="animate-fade-in" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Shipment Discrepancies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lineExceptions.map((ex, i) => (
                <div key={i} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                  <div style={{ width: '120px', height: '80px', flexShrink: 0 }}>
                    {ex.image ? (
                      <img src={`http://192.168.29.57:5001${ex.image}`} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#fee2e2', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle color="#ef4444" size={24} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '15px' }}>{ex.note}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>Reported by: {ex.user?.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '10px' }}>{new Date(ex.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    {ex.isResolved ? (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '6px', borderLeft: '4px solid #16a34a' }}>
                        <div style={{ color: '#16a34a', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle size={14} /> RESOLVED BY {ex.resolvedBy?.name}
                        </div>
                        <div style={{ color: '#475569', fontSize: '13px', marginTop: '0.4rem', fontStyle: 'italic' }}>"{ex.resolvedNote}"</div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '1rem', color: '#ef4444', fontWeight: 800, fontSize: '11px' }}>AWAITING RESOLUTION</div>
                    )}
                  </div>
                </div>
              ))}
              {lineExceptions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                   <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                   <div>No exceptions reported for this shipment line.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }} className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>
            Outbound Fulfillment
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.2rem', fontSize: '1.1rem' }}>Monitor and finalize shipping movements across the cargo network.</p>
        </div>
        <button className="btn" onClick={fetchOutboundLines} style={{ background: 'white', color: '#3b82f6', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </header>

      <form style={{ 
        marginBottom: '2.5rem', 
        padding: '0.5rem 1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        borderRadius: '12px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0'
      }} onSubmit={handleSearch}>
        <Search size={22} color="#94a3b8" />
        <input 
          placeholder="Search by PO No, Flight, or Shipping Bill..." 
          style={{ width: '100%', padding: '1rem', border: 'none', background: 'transparent', color: '#1e293b', fontSize: '1.1rem', outline: 'none' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem' }}>Search</button>
      </form>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
            <thead style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <tr>
                <th style={thStyle}>Linked PO</th>
                <th style={thStyle}>Flight / Vehicle</th>
                <th style={thStyle}>Shipping Bill</th>
                <th style={thStyle}>Qty Issued</th>
                <th style={thStyle}>Boxes</th>
                <th style={thStyle}>Assigned To</th>
                <th style={thStyle}>Create Date-Time</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {outboundLines.map((line) => (
                <tr key={line.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} className="table-row" onClick={() => handleRowClick(line)}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '15px' }}>
                      <Hash size={14} /> {line.outbound?.inbound?.po_no}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: 700 }}>
                      <Truck size={16} color="#94a3b8" /> {line.flightNo}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#334155', fontWeight: 600 }}>{line.sbNo}</td>
                  <td style={{ ...tdStyle, fontWeight: 900, color: '#14b8a6', fontSize: '16px' }}>{line.quantityIssued}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#475569' }}>
                      <Box size={14} color="#94a3b8" /> {line.noOfBoxes}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 900 }}>
                        {line.outbound?.assignedUser?.name?.charAt(0) || 'U'}
                      </div>
                      <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>{line.outbound?.assignedUser?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                      <Calendar size={13} /> {new Date(line.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={line.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {pagination.totalPages > 1 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: '#f8fafc' }}>
            <button className="btn" disabled={pagination.page === 1} onClick={(e) => { e.stopPropagation(); setPagination({...pagination, page: pagination.page - 1}) }}>Previous</button>
            <button className="btn btn-primary" disabled={pagination.page === pagination.totalPages} onClick={(e) => { e.stopPropagation(); setPagination({...pagination, page: pagination.page + 1}) }}>Next</button>
          </div>
        )}
      </div>

      <style>{`
        .table-row:hover { background-color: #f8fafc !important; }
        .animate-spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const InfoItem = ({ label, value, icon }) => (
  <div>
    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {icon} {label}
    </div>
    <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '15px' }}>{value || '-'}</div>
  </div>
);

const SubTab = ({ label, active, onClick, count }) => (
  <button 
    onClick={onClick}
    style={{
      padding: '0.8rem 1.5rem',
      background: 'none',
      border: 'none',
      borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
      color: active ? '#1e293b' : '#64748b',
      fontWeight: 800,
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{ backgroundColor: count > 0 ? '#ef4444' : '#64748b', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
        {count}
      </span>
    )}
  </button>
);

const thStyle = { padding: '1.2rem 1.5rem', fontWeight: 800 };
const tdStyle = { padding: '1.2rem 1.5rem', verticalAlign: 'middle' };

const StatusBadge = ({ status }) => {
  const colors = {
    PENDING: { bg: '#fef3c7', text: '#d97706' },
    DISPATCHED: { bg: '#dcfce7', text: '#16a34a' }
  };
  const theme = colors[status] || { bg: '#f1f5f9', text: '#64748b' };
  return (
    <span style={{ backgroundColor: theme.bg, color: theme.text, padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {status}
    </span>
  );
};

export default OutboundModule;
