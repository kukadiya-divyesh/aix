import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Printer, Search, ArrowRight, Tag } from 'lucide-react';
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
  const [issueData, setIssueData] = useState({ flightNo: '', sbNo: '', quantityIssued: '', date: new Date().toISOString().split('T')[0] });

  const [formData, setFormData] = useState({
    po_no: '', inv_no: '', be_no: '', igm_no: '', cth_no: '', 
    awb_no: '', total_value: '', duty: '', country_of_origin: '',
    stock_no: '', product_description: '', quantity: '', weight: '',
    no_of_box: '', warehouse_location: '', pkg_details: '',
    per_box_weight_kg: '', bond_date: '', bond_expiry_date: ''
  });

  useEffect(() => {
    if (view === 'tree') {
      fetchInbounds();
    }
  }, [pagination.page, view, appliedSearch]);

  const fetchInbounds = async () => {
    try {
      const resp = await axios.get(`/api/inbound?search=${appliedSearch}&page=${pagination.page}`);
      setInbounds(resp.data.data);
      setPagination(prev => ({ ...prev, totalPages: resp.data.pagination.totalPages }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }));
    setAppliedSearch(searchTerm);
  };

  const handleMoveSearch = () => {
    setAppliedMoveSearch(moveSearch);
  };

  const fetchLedger = async (id) => {
    try {
      const resp = await axios.get(`/api/outbound/ledger/${id}`);
      setLedger(resp.data);
    } catch (err) {
      console.error('Error fetching ledger:', err);
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
      // Refresh local data to show new count badge
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
        bond_expiry_date: fullData.bond_expiry_date ? new Date(fullData.bond_expiry_date).toISOString().split('T')[0] : ''
      });
      setLogs(fullData.logs || []);
      setTagCount(fullData._count?.serialNumbers || 0);
      fetchLedger(fullData.id);
      setView('form');
    } catch (err) {
      alert('Error fetching details: ' + err.message);
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
      no_of_box: '', warehouse_location: '', pkg_details: ''
    });
    setLogs([]);
    setView('form');
  };

  const handleIssueStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/api/outbound/ledger/${editingId}`, issueData);
      setShowIssueStock(false);
      setIssueData({ flightNo: '', sbNo: '', quantityIssued: '', date: new Date().toISOString().split('T')[0] });
      fetchLedger(editingId);
      showNotification('Stock issuance posted across the network', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const markLineDispatched = async (lineId) => {
    const ok = await confirm('Finalize Dispatch', 'Mark this line as fully dispatched? This finalizes the balance.');
    if (!ok) return;
    try {
      await axios.patch(`/api/outbound/ledger/finalize/${lineId}`);
      fetchLedger(editingId);
      showNotification('Shipment finalized', 'success');
    } catch (err) {
      showNotification('Error finalizing line: ' + err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/inbound/${editingId}`, formData);
        showNotification('Record updated successfully', 'success');
      } else {
        await axios.post('/api/inbound', formData);
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
    <div style={{ padding: '2rem' }} className="animate-fade-in">
      {view === 'tree' ? (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Inbound Management</h1>
              <p style={{ color: '#94a3b8' }}>Process SAP records and generate RFID tracking tags.</p>
            </div>
            <button className="btn btn-primary" onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} /> New Inbound
            </button>
          </header>

          <div className="glass" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                className="glass"
                placeholder="Search by PO No, AWB No, or Description..." 
                style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch} style={{ padding: '0.6rem 1.5rem' }}>
              Search
            </button>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
              {inbounds.length} records shown (Page {pagination.page} of {pagination.totalPages})
            </div>
          </div>

          <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                <thead style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8', fontSize: '13px' }}>
                  <tr>
                    <th style={thStyle}>PO NUMBER</th>
                    <th style={thStyle}>AWB NO</th>
                    <th style={thStyle}>PRODUCT DESCRIPTION</th>
                    <th style={thStyle}>SITE LOCATION</th>
                    <th style={thStyle}>BOXES</th>
                    <th style={thStyle}>TOTAL QTY</th>
                    <th style={thStyle}>STATUS</th>
                    <th style={thStyle}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {inbounds.map(ib => (
                    <tr 
                      key={ib.id} 
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s', cursor: 'pointer' }} 
                      className="hover-row"
                      onClick={() => handleEdit(ib)}
                    >
                      <td style={tdStyle}>{ib.po_no}</td>
                      <td style={{ ...tdStyle, color: '#3b82f6', fontWeight: 600 }}>{ib.awb_no || '-'}</td>
                      <td style={{ ...tdStyle, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ib.product_description || 'N/A'}</td>
                      <td style={tdStyle}><span style={{ color: '#14b8a6' }}>{ib.warehouse_location}</span></td>
                      <td style={tdStyle}>{ib.no_of_box}</td>
                      <td style={tdStyle}>{ib.quantity}</td>
                      <td style={tdStyle}>
                        <StatusBadge status={ib.status} />
                      </td>
                      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button style={actionBtnStyle} title="Print RFID Tags">
                            <Tag size={16} /> Print
                          </button>
                          <button 
                            style={{ ...actionBtnStyle, borderColor: '#3b82f6', color: '#3b82f6' }}
                            onClick={() => window.location.href = `/outbound?inboundId=${ib.id}`}
                            title="Create Fulfillment"
                          >
                            <ArrowRight size={16} /> Ship
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button className="btn" disabled={pagination.page === 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</button>
                <button className="btn btn-primary" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</button>
              </div>
            )}
          </div>
        </>
      ) : view === 'movements' ? (
        <div className="animate-slide-up">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <button 
                onClick={() => setView('form')} 
                style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
              >
                <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to PO Record
              </button>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>RFID Movement Tracking</h1>
              <p style={{ color: '#94a3b8' }}>Real-time location history for all tags in PO {formData.po_no}</p>
            </div>
          </header>

          <div className="glass" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                className="glass"
                placeholder="Search by RFID Serial Code..." 
                style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
                value={moveSearch}
                onChange={e => setMoveSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMoveSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleMoveSearch} style={{ padding: '0.6rem 1.5rem' }}>
              Search RFID
            </button>
          </div>

          <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <tr>
                    <th style={thStyle}>RFID Serial</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Grid Location</th>
                    <th style={thStyle}>Creation Date</th>
                    <th style={thStyle}>Gate Scan</th>
                    <th style={thStyle}>Grid In-Place</th>
                    <th style={thStyle}>Pickup Scan</th>
                    <th style={thStyle}>Outgate Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {movements
                    .filter(mv => mv.code.toLowerCase().includes(appliedMoveSearch.toLowerCase()))
                    .map((mv, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }} className="hover-row">
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#3b82f6' }}>{mv.code}</td>
                      <td style={tdStyle}><StatusBadge status={mv.status} /></td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: '#14b8a6' }}>{mv.grid || '-'}</td>
                      <td style={tdStyle}>{new Date(mv.createdAt).toLocaleString()}</td>
                      <td style={tdStyle}>{mv.gateScan ? new Date(mv.gateScan).toLocaleString() : <i style={{ color: '#64748b' }}>Awaiting Scan...</i>}</td>
                      <td style={tdStyle}>{mv.gridPlace ? new Date(mv.gridPlace).toLocaleString() : <i style={{ color: '#64748b' }}>-</i>}</td>
                      <td style={tdStyle}>{mv.pickupScan ? new Date(mv.pickupScan).toLocaleString() : <i style={{ color: '#64748b' }}>-</i>}</td>
                      <td style={tdStyle}>{mv.outgateScan ? new Date(mv.outgateScan).toLocaleString() : <i style={{ color: '#64748b' }}>-</i>}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No RFID tags generated for this PO.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <div>
                <button onClick={() => setView('tree')} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                   <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to List
                </button>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   {editingId ? formData.po_no : 'New Inbound'}
                   {editingId && (
                     <span style={{ fontSize: '14px', background: tagCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: tagCount > 0 ? '#10b981' : '#ef4444', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 800, border: '1px solid currentColor' }}>
                        RFID TAGS: {tagCount}
                     </span>
                   )}
                </h1>
                <p style={{ color: '#94a3b8' }}>{editingId ? 'Modify logistics details and review audit logs.' : 'Initialize a new SAP payload for the cargo network.'}</p>
             </div>
             <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <button 
                  className="btn" 
                  onClick={() => setShowIssueStock(true)}
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                >
                  <Plus size={18} /> Issue Stock
                </button>
                <button 
                   className="btn" 
                   onClick={fetchMovements} 
                   style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontWeight: 700 }}
                >
                   <Search size={16} /> Movement
                </button>
                <button 
                  className="btn" 
                  onClick={handleGenerateTags}
                  disabled={tagCount > 0 || loading}
                  style={{ 
                    background: '#1e293b', 
                    color: tagCount > 0 ? '#64748b' : '#f8fafc', 
                    border: '1px solid #334155', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    opacity: tagCount > 0 ? 0.6 : 1,
                    cursor: tagCount > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Tag size={18} /> {tagCount > 0 ? 'RFID Generated' : 'Generate RFID'}
                </button>
                <button 
                   className="btn" 
                   disabled 
                   style={{ background: '#1e293b', color: '#64748b', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'not-allowed' }}
                >
                  <Printer size={18} /> Print RFID
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} style={{ padding: '0.6rem 2rem' }}>{loading ? 'Saving...' : 'Save Record'}</button>
                <button className="btn" onClick={() => setView('tree')} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid rgba(0,0,0,0.1)' }}>Discard</button>
             </div>
          </header>

          <div className="glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                
                {/* Section: Reference IDs */}
                <div style={{ gridColumn: 'span 4' }}>
                   <h3 style={sectionHeaderStyle}>Reference & Identification</h3>
                </div>
                <FormInput label="PO Number" name="po_no" val={formData} set={setFormData} required />
                <FormInput label="Invoice Number" name="inv_no" val={formData} set={setFormData} />
                <FormInput label="AWB Number" name="awb_no" val={formData} set={setFormData} />
                <FormInput label="BE Number" name="be_no" val={formData} set={setFormData} />
                <FormInput label="IGM Number" name="igm_no" val={formData} set={setFormData} />
                <FormInput label="CTH Number" name="cth_no" val={formData} set={setFormData} />
                <FormInput label="Stock Number" name="stock_no" val={formData} set={setFormData} />
                <FormInput label="Country of Origin" name="country_of_origin" val={formData} set={setFormData} />

                {/* Section: Product Details */}
                <div style={{ gridColumn: 'span 4', marginTop: '1rem' }}>
                   <h3 style={sectionHeaderStyle}>Cargo & Product Content</h3>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Product Description</label>
                  <input className="glass" style={inputStyle} value={formData.product_description} onChange={e => setFormData({...formData, product_description: e.target.value})} placeholder="e.g. BACARDI CARTA BLANCA RUM" />
                </div>
                <FormInput label="Total Quantity" name="quantity" type="number" val={formData} set={setFormData} required />
                <FormInput label="No of Boxes" name="no_of_box" type="number" val={formData} set={setFormData} required />
                
                <FormInput label="Total Weight (KG)" name="weight" type="number" val={formData} set={setFormData} />
                <FormInput label="Per Box Weight" name="per_box_weight_kg" type="number" val={formData} set={setFormData} />
                <div style={{ gridColumn: 'span 2' }}>
                  <FormInput label="Packaging Details" name="pkg_details" val={formData} set={setFormData} />
                </div>

                {/* Section: Logistics & Financials */}
                <div style={{ gridColumn: 'span 4', marginTop: '1rem' }}>
                   <h3 style={sectionHeaderStyle}>Logistics & Financials</h3>
                </div>
                <FormInput label="Warehouse Location" name="warehouse_location" val={formData} set={setFormData} />
                <FormInput label="Total Value" name="total_value" type="number" val={formData} set={setFormData} />
                <FormInput label="Duty Amount" name="duty" type="number" val={formData} set={setFormData} />
                <div style={{ visibility: 'hidden' }}><FormInput label="spacer" name="spacer" val={formData} set={setFormData} /></div>
                
                <FormInput label="Bond Date" name="bond_date" type="date" val={formData} set={setFormData} />
                <FormInput label="Bond Expiry" name="bond_expiry_date" type="date" val={formData} set={setFormData} />
             </div>
          </div>

          {editingId && (
            <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.8rem' }}>
                 <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Stock Fulfillment Ledger
                 </h3>
                 <button className="btn btn-primary" onClick={() => setShowIssueStock(true)} style={{ scale: '0.9' }}>
                    <Plus size={18} /> Issue Stock
                 </button>
              </header>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <tr>
                      <th style={thStyle}>DATE</th>
                      <th style={thStyle}>FLIGHT NO</th>
                      <th style={thStyle}>S/BILL NO</th>
                      <th style={thStyle}>QTY ISSUED</th>
                      <th style={thStyle}>BALANCE (LEDGER)</th>
                      <th style={thStyle}>POSTED BY</th>
                      <th style={thStyle}>STATUS</th>
                      <th style={thStyle}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Op. Balance line */}
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                       <td style={tdStyle} colSpan={4}><span style={{ color: '#64748b' }}>OPENING BALANCE</span></td>
                       <td style={{ ...tdStyle, fontWeight: 900, color: '#14b8a6' }}>{formData.quantity}</td>
                       <td style={tdStyle} colSpan={3}></td>
                    </tr>
                    {ledger.map((line, i) => (
                      <tr key={line.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: line.status === 'PENDING' ? 'rgba(59, 130, 246, 0.02)' : 'transparent' }}>
                        <td style={tdStyle}>{new Date(line.date).toLocaleDateString()}</td>
                        <td style={tdStyle}>{line.flightNo}</td>
                        <td style={tdStyle}>{line.sbNo}</td>
                        <td style={tdStyle}>{line.quantityIssued}</td>
                        <td style={{ ...tdStyle, fontWeight: 800 }}>{line.balance}</td>
                        <td style={tdStyle}>{line.postedBy?.name}</td>
                        <td style={tdStyle}>
                           <StatusBadge status={line.status} />
                        </td>
                        <td style={tdStyle}>
                           {line.status === 'PENDING' && (
                             <button onClick={() => markLineDispatched(line.id)} className="btn" style={{ fontSize: '10px', padding: '0.3rem 0.6rem', background: '#3b82f6', color: 'white' }}>Finalize Scan</button>
                           )}
                        </td>
                      </tr>
                    ))}
                    {!ledger.length && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No stock issued from this PO yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {editingId && (
            <div className="glass" style={{ padding: '2rem' }}>
               <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Activity Audit Logs <StatusBadge status="ACTIVE" />
               </h3>
               {/* Activity Logs content... */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {logs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                       <div>
                          <div style={{ fontWeight: 800, fontSize: '14px' }}>{log.action}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '0.2rem' }}>{log.details}</div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '12px' }}>{log.user?.name}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</div>
                       </div>
                    </div>
                  ))}
                  {!logs.length && <div style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No audit history available yet.</div>}
               </div>
            </div>
          )}
        </div>
      )}

      {/* Issue Stock Modal Overlay */}
      {showIssueStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4rem 1rem', overflowY: 'auto' }}>
          <div className="glass animate-slide-up" style={{ padding: '2.5rem', maxWidth: '700px', width: '100%', marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h2 style={{ fontWeight: 900, fontSize: '1.8rem' }}>Issue Stock from PO</h2>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Master Balance</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#14b8a6' }}>
                     {formData.quantity - ledger.reduce((acc, curr) => acc + (curr.quantityIssued || 0), 0)}
                  </div>
               </div>
            </div>

            <form onSubmit={handleIssueStock} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div style={{ gridColumn: 'span 2', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Posted By</div>
                     <div style={{ fontWeight: 700 }}>{user?.name || 'Authorized Personnel'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Audit ID</div>
                     <div style={{ fontWeight: 700, color: '#3b82f6' }}>AIX-FS-{Date.now().toString().slice(-6)}</div>
                  </div>
               </div>

               <FormInput label="Flight Number / Vehicle" name="flightNo" val={issueData} set={setIssueData} required />
               <FormInput label="Shipping Bill / Invoice No" name="sbNo" val={issueData} set={setIssueData} required />
               <FormInput label="Quantity (to issue)" name="quantityIssued" type="number" val={issueData} set={setIssueData} required />
               <FormInput label="Issuance Date" name="date" type="date" val={issueData} set={setIssueData} required />
               
               <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }}>Post to Network Ledger</button>
                  <button type="button" className="btn" onClick={() => setShowIssueStock(false)} style={{ background: '#334155', color: 'white', padding: '1rem' }}>Cancel</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FormInput = ({ label, name, type = 'text', val, set, required }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input 
      type={type} className="glass" style={inputStyle} 
      value={val[name]}
      required={required}
      onChange={e => set({...val, [name]: e.target.value})}
    />
  </div>
);

const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' };
const sectionHeaderStyle = { fontSize: '1rem', fontWeight: 800, color: '#d32f2f', borderBottom: '1px solid rgba(211, 47, 47, 0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.7rem', color: 'var(--text-main)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px' };
const thStyle = { padding: '1rem', fontWeight: 700 };
const tdStyle = { padding: '1rem', fontSize: '14px' };
const actionBtnStyle = { background: 'none', border: '1px solid #d32f2f', color: '#d32f2f', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '12px' };

const StatusBadge = ({ status }) => {
  const colors = {
    PENDING: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    PLACED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    EXCEPTION: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
    ACTIVE: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
    DISPATCHED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    PICKING: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' }
  };
  const theme = colors[status] || colors.PENDING;
  return (
    <span style={{ backgroundColor: theme.bg, color: theme.text, padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
      {status}
    </span>
  );
};

export default InboundModule;
