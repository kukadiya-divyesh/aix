import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, FileText, Download, RefreshCw, ChevronLeft, ChevronRight, 
  Move, Clock, AlertTriangle, Calendar, Package, Hash, User 
} from 'lucide-react';
import { useFeedback } from '../components/FeedbackProvider';

const ReportsModule = () => {
  const [activeTab, setActiveTab] = useState('movement'); // movement | expiry | exceptions
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const { showNotification } = useFeedback();

  useEffect(() => {
    fetchReportData(1);
  }, [activeTab]);

  const fetchReportData = async (page = 1) => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'movement' ? '/api/reports/movement' 
                    : activeTab === 'expiry' ? '/api/reports/expiry' 
                    : '/api/reports/exceptions';
      
      const resp = await axios.get(endpoint, {
        params: { page, limit: 50, search: searchTerm }
      });
      
      setData(resp.data.data);
      setPagination(resp.data.pagination);
    } catch (err) {
      showNotification('Error fetching report: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReportData(1);
  };

  const handleExport = () => {
    if (data.length === 0) return;
    
    // Prepare headers and data for CSV
    let headers = [];
    let rows = [];

    if (activeTab === 'movement') {
      headers = [
        'S.No', 'RFID Serial', 'PO Number', 'Stock Number', 'Flight No', 'Product Description', 
        'Boxes', 'Total QTY', 'W/H Location', 'Gate Scan', 'Gate Person', 'Gate Time', 
        'W/H Scan(Y/N)', 'W/H Person', 'W/H Time', 'Status', 'Pickup Scan', 
        'Pickup Time', 'Out Scan', 'Out Time', 'Out Vehicle', 'Dwell Time'
      ];
      rows = data.map((item, idx) => [
        idx + 1, item.rfidSerial, item.poNo, item.stockNo, item.flightNo, item.description, 
        item.boxes, item.totalQty, item.location, item.gateScan, item.gatePerson, 
        item.gateTime ? new Date(item.gateTime).toLocaleString() : 'N/A',
        item.whScan, item.whPerson, 
        item.whTime ? new Date(item.whTime).toLocaleString() : 'N/A',
        item.status, item.pickupScan, 
        item.pickupTime ? new Date(item.pickupTime).toLocaleString() : 'N/A',
        item.outScan, 
        item.outTime ? new Date(item.outTime).toLocaleString() : 'N/A',
        item.outVehicle, item.dwellTime
      ]);
    } else if (activeTab === 'expiry') {
      headers = ['S.No', 'PO Number', 'Stock Number', 'Description', 'Boxes Available', 'Total QTY', 'Bond Expiry Date', 'Warehouse Location'];
      rows = data.map((item, idx) => [
        idx + 1, item.poNo, item.stockNo, item.description, item.boxesAvailable, item.totalQty,
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
        item.location
      ]);
    } else {
      headers = ['S.No', 'PO Number', 'Stock Number', 'Flight No', 'Created On', 'Description', 'Location', 'Reported By', 'Status', 'Resolved At', 'Resolved By'];
      rows = data.map((item, idx) => [
        idx + 1, item.poNo, item.stockNo, item.flightNo, new Date(item.createdOn).toLocaleString(), item.description, item.location, item.reportedBy, item.status,
        item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : 'N/A',
        item.resolvedBy || 'N/A'
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AIX_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }} className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>Report Center</h1>
          <p style={{ color: '#64748b', marginTop: '0.2rem', fontSize: '1.1rem' }}>Generate and export warehouse logistics insights.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={handleExport} style={{ background: '#16a34a', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
            <Download size={18} /> Export Excel (CSV)
          </button>
          <button className="btn" onClick={() => fetchReportData(pagination.page)} style={{ background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {/* Report Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <TabButton active={activeTab === 'movement'} onClick={() => setActiveTab('movement')} icon={<Move size={16} />} label="Inventory Movement Tracking" />
        <TabButton active={activeTab === 'expiry'} onClick={() => setActiveTab('expiry')} icon={<Calendar size={16} />} label="Expiry Distribution Reports" />
        <TabButton active={activeTab === 'exceptions'} onClick={() => setActiveTab('exceptions')} icon={<AlertTriangle size={16} />} label="Exception Report" />
      </div>

      {/* Search Bar */}
      <form style={{ 
        marginBottom: '2rem', 
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
          placeholder={`Search by PO, Stock Number or Description in ${activeTab} report...`} 
          style={{ width: '100%', padding: '1rem', border: 'none', background: 'transparent', color: '#1e293b', fontSize: '1.1rem', outline: 'none' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Search</button>
      </form>

      {/* Data Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
            <thead style={{ background: '#f8fafc', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {activeTab === 'movement' && (
                <tr>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>RFID Serial</th>
                  <th style={thStyle}>PO Number</th>
                  <th style={thStyle}>Stock Number</th>
                  <th style={thStyle}>Flight No.</th>
                  <th style={thStyle}>Product Description</th>
                  <th style={thStyle}>Boxes</th>
                  <th style={thStyle}>Total QTY</th>
                  <th style={thStyle}>W/H Location</th>
                  <th style={thStyle}>Gate Scan</th>
                  <th style={thStyle}>Gate Person</th>
                  <th style={thStyle}>Gate Time</th>
                  <th style={thStyle}>W/H Scan(Y/N)</th>
                  <th style={thStyle}>W/H Person</th>
                  <th style={thStyle}>W/H Time</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Pickup Scan</th>
                  <th style={thStyle}>Pickup Time</th>
                  <th style={thStyle}>Out Scan</th>
                  <th style={thStyle}>Out Time</th>
                  <th style={thStyle}>Out Vehicle</th>
                  <th style={thStyle}>Dwell Time</th>
                </tr>
              )}
              {activeTab === 'expiry' && (
                <tr>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>PO Number</th>
                  <th style={thStyle}>Stock Number</th>
                  <th style={thStyle}>Product Description</th>
                  <th style={thStyle}>Boxes Available</th>
                  <th style={thStyle}>Total QTY</th>
                  <th style={thStyle}>Expiry Date</th>
                  <th style={thStyle}>Warehouse Location</th>
                </tr>
              )}
              {activeTab === 'exceptions' && (
                <tr>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>PO Number</th>
                  <th style={thStyle}>Stock Number</th>
                  <th style={thStyle}>Flight No</th>
                  <th style={thStyle}>Created On</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Reported By</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Resolved At</th>
                  <th style={thStyle}>Resolved By</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="25" style={{ padding: '4rem', textAlign: 'center' }}>
                    <RefreshCw size={40} className="animate-spin" color="#3b82f6" />
                    <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 600 }}>Fetching Data...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="25" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No records found matching your criteria.</p>
                  </td>
                </tr>
              ) : data.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row">
                  <td style={tdStyle}>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                  {activeTab === 'movement' && (
                    <>
                      <td style={tdStyle}><div style={{ fontWeight: 600, color: '#64748b' }}>{item.rfidSerial}</div></td>
                      <td style={tdStyle}><div style={{ fontWeight: 800, color: '#3b82f6' }}>{item.poNo}</div></td>
                      <td style={tdStyle}>{item.stockNo}</td>
                      <td style={tdStyle}>{item.flightNo}</td>
                      <td style={tdStyle}>{item.description}</td>
                      <td style={tdStyle}>{item.boxes}</td>
                      <td style={tdStyle}>{item.totalQty}</td>
                      <td style={tdStyle}>{item.location}</td>
                      <td style={tdStyle}>{item.gateScan}</td>
                      <td style={tdStyle}>{item.gatePerson}</td>
                      <td style={tdStyle}>{item.gateTime ? new Date(item.gateTime).toLocaleString() : 'N/A'}</td>
                      <td style={tdStyle}>{item.whScan}</td>
                      <td style={tdStyle}>{item.whPerson}</td>
                      <td style={tdStyle}>{item.whTime ? new Date(item.whTime).toLocaleString() : 'N/A'}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '9px', fontWeight: 900, background: getStatusBg(item.status), color: 'white' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{item.pickupScan}</td>
                      <td style={tdStyle}>{item.pickupTime ? new Date(item.pickupTime).toLocaleString() : 'N/A'}</td>
                      <td style={tdStyle}>{item.outScan}</td>
                      <td style={tdStyle}>{item.outTime ? new Date(item.outTime).toLocaleString() : 'N/A'}</td>
                      <td style={tdStyle}>{item.outVehicle}</td>
                      <td style={tdStyle}><div style={{ fontWeight: 700, color: '#64748b' }}>{item.dwellTime}</div></td>
                    </>
                  )}
                  {activeTab === 'expiry' && (
                    <>
                      <td style={tdStyle}><div style={{ fontWeight: 800, color: '#1e293b' }}>{item.poNo}</div></td>
                      <td style={tdStyle}>{item.stockNo}</td>
                      <td style={tdStyle}>{item.description}</td>
                      <td style={tdStyle}><div style={{ fontWeight: 900, color: '#ef4444' }}>{item.boxesAvailable}</div></td>
                      <td style={tdStyle}>{item.totalQty}</td>
                      <td style={tdStyle}>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                      <td style={tdStyle}>{item.location}</td>
                    </>
                  )}
                  {activeTab === 'exceptions' && (
                    <>
                      <td style={tdStyle}><div style={{ fontWeight: 800, color: '#ef4444' }}>{item.poNo}</div></td>
                      <td style={tdStyle}>{item.stockNo}</td>
                      <td style={tdStyle}>{item.flightNo}</td>
                      <td style={tdStyle}>{new Date(item.createdOn).toLocaleString()}</td>
                      <td style={tdStyle}>{item.description}</td>
                      <td style={tdStyle}>{item.location}</td>
                      <td style={tdStyle}>{item.reportedBy}</td>
                      <td style={tdStyle}>
                        <span style={{ color: item.status === 'RESOLVED' ? '#16a34a' : '#f59e0b', fontWeight: 800 }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : 'N/A'}</td>
                      <td style={tdStyle}>{item.resolvedBy || 'N/A'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
        <div style={{ color: '#64748b', fontSize: '14px' }}>
          Showing <b>{(pagination.page - 1) * pagination.limit + 1}</b> to <b>{Math.min(pagination.page * pagination.limit, pagination.total)}</b> of <b>{pagination.total}</b> records
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn" 
            disabled={pagination.page === 1}
            onClick={() => fetchReportData(pagination.page - 1)}
            style={{ padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0', color: pagination.page === 1 ? '#cbd5e1' : '#1e293b' }}
          >
            <ChevronLeft size={20} />
          </button>
          {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
            let pageNum;
            if (pagination.totalPages <= 5) pageNum = i + 1;
            else if (pagination.page <= 3) pageNum = i + 1;
            else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
            else pageNum = pagination.page - 2 + i;

            return (
              <button 
                key={pageNum}
                onClick={() => fetchReportData(pageNum)}
                style={{ 
                  width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                  background: pagination.page === pageNum ? '#1e293b' : 'white',
                  color: pagination.page === pageNum ? 'white' : '#1e293b',
                  fontWeight: 700
                }}
              >
                {pageNum}
              </button>
            );
          })}
          <button 
            className="btn" 
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchReportData(pagination.page + 1)}
            style={{ padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0', color: pagination.page === pagination.totalPages ? '#cbd5e1' : '#1e293b' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <style>{`
        .table-row:hover { background-color: #f8fafc !important; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-spin { animation: spin 1.5s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{ 
      padding: '1rem 0', background: 'none', border: 'none', 
      borderBottom: active ? '3px solid #16a34a' : '3px solid transparent', 
      color: active ? '#1e293b' : '#64748b', 
      fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.6rem',
      cursor: 'pointer', transition: 'all 0.2s'
    }}
  >
    {icon} {label}
  </button>
);

const getStatusBg = (status) => {
  switch (status) {
    case 'OUT_GATE': return '#10b981';
    case 'IN_GATE': return '#3b82f6';
    case 'PLACED': return '#8b5cf6';
    case 'PRINTED': return '#94a3b8';
    default: return '#64748b';
  }
};

const thStyle = { padding: '1rem 1.5rem', verticalAlign: 'middle' };
const tdStyle = { padding: '1rem 1.5rem', verticalAlign: 'middle', color: '#475569' };

export default ReportsModule;
