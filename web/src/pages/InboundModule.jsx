import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Printer, Search, ArrowRight, Tag, RefreshCw, Hash, Calendar, Box, User, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useFeedback } from '../components/FeedbackProvider';

const InboundModule = ({ user }) => {
  const { showNotification, confirm } = useFeedback();
  const [inbounds, setInbounds] = useState([]);
  const [view, setView] = useState('tree'); // 'tree' | 'form' | 'movements'
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [logs, setLogs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [movements, setMovements] = useState([]);
  const [moveSearch, setMoveSearch] = useState('');
  const [appliedMoveSearch, setAppliedMoveSearch] = useState('');
  const [showIssueStock, setShowIssueStock] = useState(false);
  const [issueData, setIssueData] = useState({ flightNo: '', sbNo: '', quantityIssued: '', noOfBoxes: '', assignedUserId: '', date: new Date().toISOString().split('T')[0] });
  const [exceptions, setExceptions] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('ledger'); // 'ledger' | 'exceptions' | 'logs'

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    po_no: '', inv_no: '', be_no: '', igm_no: '', cth_no: '',
    awb_no: '', total_value: '', duty: '', country_of_origin: '',
    stock_no: '', product_description: '', quantity: '', weight: '',
    no_of_box: '', warehouse_location: '', pkg_details: '',
    per_box_weight_kg: '', bond_date: '', bond_expiry_date: '',
    assignedUserId: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const resp = await axios.get('/api/auth/users');
      setUsers(resp.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (view === 'tree') {
      fetchInbounds();
    }
  }, [pagination.page, view, appliedSearch]);

  const fetchInbounds = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`/api/inbound?search=${appliedSearch}&page=${pagination.page}`);
      setInbounds(resp.data.data);
      setPagination(prev => ({ ...prev, totalPages: resp.data.pagination.totalPages }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    setAppliedSearch(searchTerm);
  };

  const fetchLedger = async (id) => {
    try {
      const resp = await axios.get(`/api/outbound/ledger/${id}`);
      setLedger(resp.data);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    }
  };

  const fetchExceptions = async (id) => {
    try {
      const resp = await axios.get(`/api/inbound/${id}/exceptions`);
      setExceptions(resp.data);
    } catch (err) {
      console.error('Error fetching exceptions:', err);
    }
  };

  const [tagCount, setTagCount] = useState(0);

  const handleGenerateTags = async () => {
    if (!formData.no_of_box || formData.no_of_box <= 0) {
      showNotification('Please set No of Boxes first.', 'error');
      return;
    }
    const ok = await confirm('Generate RFID Tags', `System will generate ${formData.no_of_box} unique tracking codes for this PO. Proceed?`);
    if (!ok) return;
    setLoading(true);
    try {
      await axios.post(`/api/inbound/${editingId}/generate-tags`);
      showNotification('RFID tags generated successfully', 'success');
      const updatedResp = await axios.get(`/api/inbound/${editingId}`);
      setTagCount(updatedResp.data._count?.serialNumbers || 0);
      fetchInbounds();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`/api/inbound/${editingId}/movements`);
      setMovements(resp.data);
      setAppliedMoveSearch('');
      setMoveSearch('');
      setView('movements');
    } catch (err) {
      showNotification('Error fetching tracking: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (record) => {
    setLoading(true);
    try {
      const resp = await axios.get(`/api/inbound/${record.id}`);
      const fullData = resp.data;
      setEditingId(fullData.id);

      const sanitize = (val) => val === null || val === undefined ? '' : val;

      setFormData({
        po_no: sanitize(fullData.po_no),
        inv_no: sanitize(fullData.inv_no),
        be_no: sanitize(fullData.be_no),
        igm_no: sanitize(fullData.igm_no),
        cth_no: sanitize(fullData.cth_no),
        awb_no: sanitize(fullData.awb_no),
        total_value: sanitize(fullData.total_value),
        duty: sanitize(fullData.duty),
        country_of_origin: sanitize(fullData.country_of_origin),
        stock_no: sanitize(fullData.stock_no),
        product_description: sanitize(fullData.product_description),
        quantity: sanitize(fullData.quantity),
        weight: sanitize(fullData.weight),
        no_of_box: sanitize(fullData.no_of_box),
        warehouse_location: sanitize(fullData.warehouse_location),
        pkg_details: sanitize(fullData.pkg_details),
        per_box_weight_kg: sanitize(fullData.per_box_weight_kg),
        bond_date: fullData.bond_date ? new Date(fullData.bond_date).toISOString().split('T')[0] : '',
        bond_expiry_date: fullData.bond_expiry_date ? new Date(fullData.bond_expiry_date).toISOString().split('T')[0] : '',
        assignedUserId: sanitize(fullData.assignedUserId)
      });
      setLogs(fullData.logs || []);
      setTagCount(fullData._count?.serialNumbers || 0);
      fetchLedger(fullData.id);
      fetchExceptions(fullData.id);
      setActiveSubTab('ledger');
      setView('form');
    } catch (err) {
      showNotification('Error fetching details: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({
      po_no: '', inv_no: '', be_no: '', igm_no: '', cth_no: '',
      awb_no: '', total_value: '', duty: '', country_of_origin: '',
      stock_no: '', product_description: '', quantity: '', weight: '',
      no_of_box: '', warehouse_location: '', pkg_details: '',
      per_box_weight_kg: '', bond_date: '', bond_expiry_date: '',
      assignedUserId: ''
    });
    setLogs([]);
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        assignedUserId: formData.assignedUserId ? parseInt(formData.assignedUserId) : null
      };
      if (editingId) {
        await axios.put(`/api/inbound/${editingId}`, payload);
        showNotification('Record updated successfully', 'success');
      } else {
        await axios.post('/api/inbound', payload);
        showNotification('Record created successfully', 'success');
      }
      setView('tree');
      fetchInbounds();
    } catch (err) {
      showNotification('Save Error: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }} className="animate-fade-in">
      {view === 'tree' ? (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>Inbound Management</h1>
              <p style={{ color: '#64748b', marginTop: '0.2rem', fontSize: '1.1rem' }}>Process SAP records and generate RFID tracking tags.</p>
            </div>
            {user?.role !== 'GLOBAL' && (
              <button className="btn btn-primary" onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}>
                <Plus size={20} /> New Inbound
              </button>
            )}
          </header>

          <form style={{
            marginBottom: '2.5rem',
            padding: '0.5rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderRadius: '12px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }} onSubmit={handleSearch}>
            <Search size={22} color="#94a3b8" />
            <input
              placeholder="Search by PO No, AWB No, or Description..."
              style={{ width: '100%', padding: '1rem', border: 'none', background: 'transparent', color: '#1e293b', fontSize: '1.1rem', outline: 'none' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', borderRadius: '8px', fontWeight: 700 }}>Search</button>
          </form>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
                <thead style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <tr>
                    <th style={thStyle}>PO Number</th>
                    <th style={thStyle}>AWB No</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Boxes</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Create Date</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inbounds.map(ib => (
                    <tr
                      key={ib.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }}
                      className="table-row"
                      onClick={() => handleEdit(ib)}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '15px' }}>
                          <Hash size={14} /> {ib.po_no}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: '#1e293b', fontWeight: 700 }}>{ib.awb_no || '-'}</td>
                      <td style={{ ...tdStyle, color: '#475569', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ib.product_description || 'N/A'}</td>
                      <td style={tdStyle}><span style={{ color: '#14b8a6', fontWeight: 600 }}>{ib.warehouse_location}</span></td>
                      <td style={tdStyle}>{ib.no_of_box}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{ib.quantity}</td>
                      <td style={tdStyle}>
                        <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={13} /> {new Date(ib.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <StatusBadge status={ib.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: '#f8fafc' }}>
                <button className="btn" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569' }}>Previous</button>
                <button className="btn btn-primary" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</button>
              </div>
            )}
          </div>
        </>
      ) : view === 'form' ? (
        <div className="animate-fade-in">
          <header style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setView('tree')}
              style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
            >
              <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Inbound List
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>
                  {editingId ? `PO ${formData.po_no}` : 'New Inbound'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{editingId ? 'Modify logistics details and review audit logs.' : 'Initialize a new SAP payload.'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                {editingId && (
                  <button onClick={fetchMovements} className="btn" style={{ background: 'white', border: '1px solid #e2e8f0', color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} /> View Movements
                  </button>
                )}
                {user?.role !== 'GLOBAL' && (
                  <button onClick={handleSubmit} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: 700 }}>
                    Save Record
                  </button>
                )}
              </div>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={sectionHeaderStyle}>Cargo Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                <FormInput label="PO Number" name="po_no" val={formData} set={setFormData} required />
                <FormInput label="Invoice Number" name="inv_no" val={formData} set={setFormData} />
                <FormInput label="AWB Number" name="awb_no" val={formData} set={setFormData} />
                <FormInput label="BE Number" name="be_no" val={formData} set={setFormData} />

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Product Description</label>
                  <input style={inputStyle} value={formData.product_description} onChange={e => setFormData({ ...formData, product_description: e.target.value })} />
                </div>

                <FormInput label="Total Quantity" name="quantity" type="number" val={formData} set={setFormData} required />
                <FormInput label="No of Boxes" name="no_of_box" type="number" val={formData} set={setFormData} required />
                <FormInput label="Stock Number" name="stock_no" val={formData} set={setFormData} />
                <FormInput label="Location" name="warehouse_location" val={formData} set={setFormData} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0' }}>
                <h3 style={sectionHeaderStyle}>Personnel</h3>
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={labelStyle}>Assigned To</label>
                  <select style={inputStyle} value={formData.assignedUserId} onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}>
                    <option value="">-- Unassigned --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {editingId && (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={sectionHeaderStyle}>Tracking Tags</h3>
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#3b82f6' }}>{tagCount}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Active RFID Tags</div>
                    {tagCount === 0 && user?.role !== 'GLOBAL' && (
                      <button onClick={handleGenerateTags} className="btn btn-primary" style={{ width: '100%' }}>
                        Generate RFID Tags
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {editingId && (
            <div style={{ marginTop: '3rem', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '2rem', padding: '0 2rem', background: '#f1f5f9' }}>
                <SubTab label="Exceptions" active={activeSubTab === 'exceptions'} onClick={() => setActiveSubTab('exceptions')} count={exceptions.length} />
                <SubTab label="Logs" active={activeSubTab === 'logs'} onClick={() => setActiveSubTab('logs')} count={logs.length} />
              </div>
              <div style={{ padding: '2rem' }}>
                {activeSubTab === 'exceptions' && (
                  <div className="animate-fade-in">
                    {exceptions.map(ex => (
                      <div key={ex.id} style={{ display: 'flex', gap: '1.5rem', padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        {ex.image && <img src={`http://192.168.29.57:5001${ex.image}`} style={{ width: '80px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />}
                        <div>
                          <div style={{ color: '#ef4444', fontWeight: 700 }}>{ex.note}</div>
                          <div style={{ color: '#64748b', fontSize: '12px' }}>By {ex.user?.name} on {new Date(ex.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                    {exceptions.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8' }}>No exceptions reported.</div>}
                  </div>
                )}
                {activeSubTab === 'logs' && (
                  <div className="animate-fade-in">
                    {logs.map((log, i) => (
                      <div key={i} style={{ padding: '0.8rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{log.action}</div>
                          <div style={{ color: '#64748b', fontSize: '12px' }}>{log.details}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <header style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setView('form')}
              style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
            >
              <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to PO Record
            </button>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>RFID Tracking</h1>
          </header>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                <tr>
                  <th style={thStyle}>RFID Serial</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Grid</th>
                  <th style={thStyle}>Gate Scan</th>
                  <th style={thStyle}>Out Scan</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mv, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#3b82f6' }}>{mv.code}</td>
                    <td style={tdStyle}><StatusBadge status={mv.status} /></td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{mv.grid || '-'}</td>
                    <td style={tdStyle}>{mv.gateScan ? new Date(mv.gateScan).toLocaleString() : '-'}</td>
                    <td style={tdStyle}>{mv.outgateScan ? new Date(mv.outgateScan).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .table-row:hover { background-color: #f8fafc !important; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const FormInput = ({ label, name, type = 'text', val, set, required }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} style={inputStyle}
        value={val[name]}
        required={required}
        onChange={e => set({ ...val, [name]: e.target.value })}
      />
    </div>
  )
};

const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' };
const sectionHeaderStyle = { fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', borderBottom: '2px solid #3b82f6', paddingBottom: '0.6rem', width: 'fit-content' };
const inputStyle = { width: '100%', padding: '0.8rem', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#fcfcfc' };
const thStyle = { padding: '1.2rem 1.5rem', fontWeight: 800 };
const tdStyle = { padding: '1.2rem 1.5rem', fontSize: '14px', verticalAlign: 'middle' };

const SubTab = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    style={{
      padding: '1.2rem 0',
      background: 'none',
      border: 'none',
      borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
      color: active ? '#1e293b' : '#64748b',
      fontWeight: 800,
      fontSize: '12px',
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
      <span style={{ backgroundColor: count > 0 ? '#ef4444' : '#94a3b8', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
        {count}
      </span>
    )}
  </button>
);

const StatusBadge = ({ status }) => {
  const colors = {
    DRAFT: { bg: '#f1f5f9', text: '#64748b' },
    IN_PROCESS: { bg: '#dbeafe', text: '#3b82f6' },
    DONE: { bg: '#dcfce7', text: '#16a34a' },
    EXCEPTION: { bg: '#fef2f2', text: '#ef4444' },
    PENDING: { bg: '#fef3c7', text: '#d97706' },
    DISPATCHED: { bg: '#dcfce7', text: '#16a34a' }
  };
  const theme = colors[status] || { bg: '#f1f5f9', text: '#64748b' };
  return (
    <span style={{ backgroundColor: theme.bg, color: theme.text, padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
      {status}
    </span>
  );
};

export default InboundModule;
