import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Warehouse, 
  MapPin, 
  Layers, 
  Grid as GridIcon,
  ChevronRight,
  MoreVertical,
  Settings,
  Pencil
} from 'lucide-react';

const WarehouseMaster = () => {
  const [activeTab, setActiveTab] = useState('warehouses');
  const [warehouses, setWarehouses] = useState([]);
  const [sheds, setSheds] = useState([]);
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'warehouses') {
        const resp = await axios.get('/api/warehouses');
        setWarehouses(resp.data);
      } else if (activeTab === 'locations') {
        const resp = await axios.get('/api/warehouses/all/sheds');
        setSheds(resp.data);
        const whResp = await axios.get('/api/warehouses');
        setWarehouses(whResp.data);
      } else if (activeTab === 'grids') {
        const resp = await axios.get('/api/warehouses/all/grids');
        setGrids(resp.data);
        const whResp = await axios.get('/api/warehouses');
        setWarehouses(whResp.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const endpoint = type === 'warehouse' ? `/api/warehouses/${id}` : 
                       type === 'location' ? `/api/warehouses/sheds/${id}` : 
                       `/api/warehouses/grids/${id}`;
      await axios.delete(endpoint);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to delete ${type}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Configuration Panel</h1>
        <p style={{ color: '#94a3b8' }}>Admin control for Warehouse, Location, and Grid structure.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <TabButton active={activeTab === 'warehouses'} onClick={() => setActiveTab('warehouses')} icon={<Warehouse size={18}/>} label="Warehouses" />
        <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} icon={<Layers size={18}/>} label="Sheds / Locations" />
        <TabButton active={activeTab === 'grids'} onClick={() => setActiveTab('grids')} icon={<GridIcon size={18}/>} label="Grids" />
      </div>

      <div className="animate-fade-in">
        {activeTab === 'warehouses' && (
          <WarehouseTab warehouses={warehouses} isAdmin={isAdmin} onRefresh={fetchData} onDelete={id => deleteItem('warehouse', id)} />
        )}
        {activeTab === 'locations' && (
          <LocationTab sheds={sheds} warehouses={warehouses} isAdmin={isAdmin} onRefresh={fetchData} onDelete={id => deleteItem('location', id)} />
        )}
        {activeTab === 'grids' && (
          <GridTab grids={grids} warehouses={warehouses} isAdmin={isAdmin} onRefresh={fetchData} onDelete={id => deleteItem('grid', id)} />
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.8rem 1.5rem',
      backgroundColor: active ? 'var(--primary)' : 'rgba(0,0,0,0.03)',
      color: active ? 'white' : 'var(--text-muted)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.2s'
    }}
  >
    {icon} {label}
  </button>
);

/* --- WAREHOUSE TAB --- */
const WarehouseTab = ({ warehouses, isAdmin, onRefresh, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState({ name: '', city: '', image: '' });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const resp = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setData({ ...data, image: resp.data.url });
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`/api/warehouses/${editingId}`, data);
    } else {
      await axios.post('/api/warehouses', data);
    }
    closeForm();
    onRefresh();
  };

  const startEdit = (wh) => {
    setEditingId(wh.id);
    setData({ name: wh.name, city: wh.city, image: wh.image || '' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setData({ name: '', city: '', image: '' });
  };

  return (
    <div>
      {isAdmin && !showForm && <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: '1.5rem' }}>+ Create Warehouse</button>}
      {showForm && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3>{editingId ? 'Edit Warehouse' : 'New Warehouse'}</h3>
          <form style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '1rem', marginTop: '1rem' }} onSubmit={submit}>
            <input className="glass" placeholder="Warehouse City" style={inputStyle} value={data.city} onChange={e => setData({...data, city: e.target.value})} required />
            <input className="glass" placeholder="Warehouse Name" style={inputStyle} value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
            <div style={{ position: 'relative' }}>
              <input type="file" id="wh-image-upload" style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*" />
              <button 
                type="button" 
                className="glass" 
                onClick={() => document.getElementById('wh-image-upload').click()} 
                style={{ ...inputStyle, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : (data.image ? '✓ Image Ready' : 'Upload Image')}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="submit">{editingId ? 'Update' : 'Create'}</button>
              <button className="btn" type="button" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid rgba(0,0,0,0.1)' }} onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {warehouses.map(wh => (
          <div key={wh.id} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {wh.image ? (
                <img src={wh.image} alt={wh.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', background: 'rgba(0,0,0,0.05)' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Warehouse size={20} color="var(--text-muted)" />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{wh.name}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}><MapPin size={12}/> {wh.city}</div>
                <div style={{ fontSize: '11px', marginTop: '0.5rem', opacity: 0.7 }}>{wh.sheds?.length || 0} Locations</div>
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Pencil size={16} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => startEdit(wh)} />
                <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => onDelete(wh.id)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* --- LOCATION TAB --- */
const LocationTab = ({ sheds, warehouses, isAdmin, onRefresh, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState({ warehouseId: '', name: '', locationCode: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`/api/warehouses/sheds/${editingId}`, data);
    } else {
      await axios.post(`/api/warehouses/${data.warehouseId}/sheds`, data);
    }
    closeForm();
    onRefresh();
  };

  const startEdit = (shed) => {
    setEditingId(shed.id);
    setData({ warehouseId: shed.warehouseId.toString(), name: shed.name, locationCode: shed.locationCode || '' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setData({ warehouseId: '', name: '', locationCode: '' });
  };

  return (
    <div>
      {isAdmin && !showForm && <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: '1.5rem' }}>+ Create Location (Shed)</button>}
      {showForm && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3>{editingId ? 'Edit Location' : 'New Location'}</h3>
          <form style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '1rem', marginTop: '1rem' }} onSubmit={submit}>
            {!editingId && (
              <select className="glass" style={inputStyle} value={data.warehouseId} onChange={e => setData({...data, warehouseId: e.target.value})} required>
                <option value="">-- Select Warehouse --</option>
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name} ({wh.city})</option>)}
              </select>
            )}
            <input className="glass" placeholder="Location Name" style={inputStyle} value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
            <input className="glass" placeholder="Ref Code" style={inputStyle} value={data.locationCode} onChange={e => setData({...data, locationCode: e.target.value})} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="submit">{editingId ? 'Update' : 'Save'}</button>
              <button className="btn" type="button" style={{ background: '#334155', color: 'white' }} onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)', fontSize: '13px' }}>
            <tr>
              <th style={thStyle}>LOCATION NAME</th>
              <th style={thStyle}>PARENT WAREHOUSE</th>
              <th style={thStyle}>CODE</th>
              <th style={thStyle}>GRIDS</th>
              <th style={thStyle}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sheds.map(shed => (
              <tr key={shed.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={tdStyle}>{shed.name}</td>
                <td style={tdStyle}>{shed.warehouse?.name}</td>
                <td style={tdStyle}>{shed.locationCode || '-'}</td>
                <td style={tdStyle}>{shed._count?.grids}</td>
                <td style={tdStyle}>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <Pencil size={15} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => startEdit(shed)} />
                      <Trash2 size={15} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => onDelete(shed.id)} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* --- GRID TAB --- */
const GridTab = ({ grids, warehouses, isAdmin, onRefresh, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState({ warehouseId: '', shedId: '', code: '', x: 0, y: 0, z: 0 });
  const [availableSheds, setAvailableSheds] = useState([]);

  useEffect(() => {
    if (data.warehouseId) {
      const wh = warehouses.find(w => w.id === parseInt(data.warehouseId));
      setAvailableSheds(wh?.sheds || []);
    }
  }, [data.warehouseId, warehouses]);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
        await axios.put(`/api/warehouses/grids/${editingId}`, { ...data, barcode: `G-${data.code}` });
    } else {
        await axios.post(`/api/warehouses/sheds/${data.shedId}/grids`, { ...data, barcode: `G-${data.code}` });
    }
    closeForm();
    onRefresh();
  };

  const startEdit = (grid) => {
    setEditingId(grid.id);
    setData({
        warehouseId: grid.shed?.warehouseId?.toString() || '',
        shedId: grid.shedId.toString(),
        code: grid.code,
        x: grid.x,
        y: grid.y,
        z: grid.z
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setData({ warehouseId: '', shedId: '', code: '', x: 0, y: 0, z: 0 });
  };

  const bulkGenerate = async () => {
    if (!data.shedId) return alert('Select a location first');
    if (!window.confirm('Generate 50 grids (0001-0050)?')) return;
    
    for (let i = 1; i <= 50; i++) {
        const code = i.toString().padStart(4, '0');
        await axios.post(`/api/warehouses/sheds/${data.shedId}/grids`, { 
            code, 
            barcode: `G-${code}`,
            x: (i % 10) * 1.5,
            z: Math.floor(i / 10) * 1.5
        });
    }
    onRefresh();
  };

  return (
    <div>
      {isAdmin && !showForm && <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: '1.5rem' }}>+ Create Grid</button>}
      {showForm && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3>{editingId ? 'Edit Grid' : 'New Grid'}</h3>
          <form style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '1rem', marginTop: '1rem' }} onSubmit={submit}>
            {!editingId && (
              <>
                <select className="glass" style={inputStyle} value={data.warehouseId} onChange={e => setData({...data, warehouseId: e.target.value})} required>
                  <option value="">-- Warehouse --</option>
                  {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
                <select className="glass" style={inputStyle} value={data.shedId} onChange={e => setData({...data, shedId: e.target.value})} required>
                  <option value="">-- Location --</option>
                  {availableSheds.map(sh => <option key={sh.id} value={sh.id}>{sh.name}</option>)}
                </select>
              </>
            )}
            <input className="glass" placeholder="Grid Code" style={inputStyle} value={data.code} onChange={e => setData({...data, code: e.target.value})} required />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <input className="glass" type="number" step="0.1" placeholder="X" style={inputStyle} value={data.x} onChange={e => setData({...data, x: parseFloat(e.target.value)})} />
              <input className="glass" type="number" step="0.1" placeholder="Y" style={inputStyle} value={data.y} onChange={e => setData({...data, y: parseFloat(e.target.value)})} />
              <input className="glass" type="number" step="0.1" placeholder="Z" style={inputStyle} value={data.z} onChange={e => setData({...data, z: parseFloat(e.target.value)})} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="submit">{editingId ? 'Update' : 'Save'}</button>
              {!editingId && <button className="btn" type="button" onClick={bulkGenerate} style={{ background: '#d32f2f', color: 'white' }}>Bulk (50)</button>}
              <button className="btn" type="button" style={{ background: '#334155', color: 'white' }} onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8', fontSize: '13px' }}>
            <tr>
              <th style={thStyle}>GRID CODE</th>
              <th style={thStyle}>PARENT LOCATION</th>
              <th style={thStyle}>WAREHOUSE</th>
              <th style={thStyle}>COORDS (X, Z)</th>
              <th style={thStyle}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {grids.map(grid => (
              <tr key={grid.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={tdStyle}>{grid.code}</td>
                <td style={tdStyle}>{grid.shed?.name}</td>
                <td style={tdStyle}>{grid.shed?.warehouse?.name}</td>
                <td style={tdStyle}>{grid.x.toFixed(1)}, {grid.z.toFixed(1)}</td>
                <td style={tdStyle}>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <Pencil size={15} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => startEdit(grid)} />
                      <Trash2 size={15} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => onDelete(grid.id)} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputStyle = { padding: '0.6rem', color: 'var(--text-main)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '14px', background: 'transparent' };
const thStyle = { padding: '1rem', fontWeight: 700 };
const tdStyle = { padding: '1rem', fontSize: '13px' };

export default WarehouseMaster;
