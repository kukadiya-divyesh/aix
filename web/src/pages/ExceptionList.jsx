import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, AlertTriangle, Hash, Calendar, User, CheckCircle, X, RefreshCw, Maximize2, Clock } from 'lucide-react';
import { useFeedback } from '../components/FeedbackProvider';

const ExceptionList = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTab, setActiveTab] = useState('inbound'); // 'inbound' | 'outbound'
  const { showNotification } = useFeedback();

  const API_URL = 'http://192.168.29.57:5001';

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const resp = await axios.get('/api/inbound/all/exceptions');
      setExceptions(resp.data);
    } catch (err) {
      showNotification('Error fetching exceptions: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolveNote) return;
    try {
      await axios.put(`/api/inbound/exceptions/${resolvingId}/resolve`, { note: resolveNote });
      showNotification('Exception marked as resolved', 'success');
      setResolvingId(null);
      setResolveNote('');
      fetchExceptions();
    } catch (err) {
      showNotification('Error resolving: ' + err.message, 'error');
    }
  };

  const inboundExceptions = exceptions.filter(ex => ex.inboundId !== null);
  const outboundExceptions = exceptions.filter(ex => ex.outboundLineId !== null);

  const displayList = activeTab === 'inbound' ? inboundExceptions : outboundExceptions;

  const filteredExceptions = displayList.filter(ex => {
    const poNo = ex.inbound?.po_no || ex.outboundLine?.outbound?.inbound?.po_no || '';
    return poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (ex.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (ex.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }} className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>Exception Center</h1>
          <p style={{ color: '#64748b', marginTop: '0.2rem', fontSize: '1.1rem' }}>Monitor cargo discrepancies and settlement notes.</p>
        </div>
        <button className="btn" onClick={fetchExceptions} style={{ background: 'white', color: '#ef4444', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Feed
        </button>
      </header>

      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
         <button 
           onClick={() => setActiveTab('inbound')}
           style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'inbound' ? '3px solid #ef4444' : '3px solid transparent', color: activeTab === 'inbound' ? '#1e293b' : '#64748b', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}
         >
           Inbound Exceptions ({inboundExceptions.length})
         </button>
         <button 
           onClick={() => setActiveTab('outbound')}
           style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'outbound' ? '3px solid #ef4444' : '3px solid transparent', color: activeTab === 'outbound' ? '#1e293b' : '#64748b', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}
         >
           Outbound Exceptions ({outboundExceptions.length})
         </button>
      </div>

      <form style={{ 
        marginBottom: '2rem', 
        padding: '0.5rem 1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        borderRadius: '12px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0'
      }} onSubmit={(e) => e.preventDefault()}>
        <Search size={22} color="#94a3b8" />
        <input 
          placeholder={`Search ${activeTab} exceptions...`} 
          style={{ width: '100%', padding: '1rem', border: 'none', background: 'transparent', color: '#1e293b', fontSize: '1.1rem', outline: 'none' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </form>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
            <thead style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <tr>
                <th style={thStyle}>Evidence</th>
                <th style={thStyle}>PO Number</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Reported By</th>
                <th style={thStyle}>Exception Time</th>
                <th style={thStyle}>Resolution Info</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExceptions.map((ex) => (
                <tr key={ex.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row">
                  <td style={tdStyle}>
                    {ex.image ? (
                      <div style={{ position: 'relative', width: '60px', height: '40px', cursor: 'pointer' }} onClick={() => setPreviewImage(ex.image)}>
                        <img src={`${API_URL}${ex.image}`} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, borderRadius: '6px' }} className="img-overlay">
                           <Maximize2 size={14} color="white" />
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '60px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <AlertTriangle size={18} color="#94a3b8" />
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '15px' }}>
                      <Hash size={14} /> {ex.inbound?.po_no || ex.outboundLine?.outbound?.inbound?.po_no || 'N/A'}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '300px' }}>
                    <div style={{ color: '#1e293b', fontSize: '14px', lineHeight: '1.4' }}>{ex.note}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '11px', fontWeight: 900 }}>
                        {ex.user?.name?.charAt(0) || 'U'}
                      </div>
                      <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>{ex.user?.name}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={13} /> {new Date(ex.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '250px' }}>
                    {ex.isResolved ? (
                      <div style={{ fontSize: '12px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a', fontWeight: 800, marginBottom: '2px' }}>
                           <CheckCircle size={12} /> RESOLVED
                         </div>
                         <div style={{ color: '#475569', fontStyle: 'italic', marginBottom: '4px' }}>"{ex.resolvedNote}"</div>
                         <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                           <User size={10} style={{ display: 'inline', marginRight: '2px' }} /> {ex.resolvedBy?.name}
                         </div>
                         <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>
                           <Clock size={10} style={{ display: 'inline', marginRight: '2px' }} /> {new Date(ex.resolvedAt).toLocaleString()}
                         </div>
                      </div>
                    ) : (
                      <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Pending Review</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {!ex.isResolved && (
                      <button onClick={() => setResolvingId(ex.id)} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700 }}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals remain the same */}
      {resolvingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', maxWidth: '450px', width: '100%', padding: '2rem', borderRadius: '16px' }} className="animate-slide-up">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#1e293b' }}>Resolve Discrepancy</h2>
            <form onSubmit={handleResolve}>
              <textarea 
                style={{ width: '100%', height: '120px', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}
                placeholder="Describe the resolution..."
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontWeight: 700 }}>Save Resolution</button>
                <button type="button" className="btn" onClick={() => setResolvingId(null)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }} onClick={() => setPreviewImage(null)}>
          <button style={{ position: 'absolute', top: '30px', right: '30px', background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={24} color="#1e293b" />
          </button>
          <img src={`${API_URL}${previewImage}`} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style>{`
        .table-row:hover { background-color: #f8fafc !important; }
        .table-row:hover .img-overlay { opacity: 1 !important; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        .animate-spin { animation: spin 1.5s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const thStyle = { padding: '1.2rem 1.5rem', fontWeight: 800 };
const tdStyle = { padding: '1.2rem 1.5rem', verticalAlign: 'middle' };

export default ExceptionList;
