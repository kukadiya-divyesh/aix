import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Warehouse, 
  Layers, 
  Truck, 
  MapPin, 
  ChevronRight, 
  ArrowLeft,
  Circle,
  Clock,
  User as UserIcon,
  Box,
  LayoutGrid
} from 'lucide-react';
import Warehouse3D from '../components/three/Warehouse3D';

const Dashboard = () => {
  const [view, setView] = useState('global'); // 'global' | 'warehouse' | 'location'
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedShed, setSelectedShed] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subView, setSubView] = useState('3d');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const resp = await axios.get('/api/warehouses');
      setWarehouses(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async (shedId) => {
    setLoading(true);
    try {
      const resp = await axios.get(`/api/dashboard/stats/${shedId}`);
      setStats(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseClick = (wh) => {
    setSelectedWarehouse(wh);
    setView('warehouse');
  };

  const handleShedClick = (shed) => {
    setSelectedShed(shed);
    fetchStats(shed.id);
    setView('location');
  };

  const goBack = () => {
    if (view === 'location') setView('warehouse');
    else if (view === 'warehouse') setView('global');
  };

  return (
    <div style={{ padding: '2rem' }} className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {view !== 'global' && <button className="glass" onClick={goBack} style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}><ArrowLeft size={18}/></button>}
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {view === 'global' ? 'Network Operations' : 
             view === 'warehouse' ? selectedWarehouse?.name : 
             selectedShed?.name}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {view === 'global' ? 'Cargo network real-time overview.' : 
             view === 'warehouse' ? `Managing ${selectedWarehouse?.city} site locations.` : 
             `Location Intelligence for ${selectedWarehouse?.name}`}
          </p>
        </div>
      </header>

      {view === 'global' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
          {warehouses.map(wh => (
            <div 
              key={wh.id} 
              className="glass hover-card" 
              onClick={() => handleWarehouseClick(wh)}
              style={{ height: '350px', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ height: '220px', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                {wh.image ? (
                  <img src={wh.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Warehouse size={60} opacity={0.3} />
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '12px', backdropFilter: 'blur(4px)' }}>
                  <MapPin size={12} style={{ marginRight: '4px' }} /> {wh.city}
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{wh.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>{wh.sheds?.length || 0} Location Hubs</p>
                </div>
                <ChevronRight color="var(--primary)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'warehouse' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {selectedWarehouse?.sheds?.map(shed => (
            <div 
              key={shed.id} 
              className="glass hover-card" 
              onClick={() => handleShedClick(shed)}
              style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{shed.name}</h3>
                   <p style={{ color: '#94a3b8', fontSize: '12px' }}>Type: Logistics Hub</p>
                 </div>
                 <div style={{ padding: '0.8rem', background: 'rgba(211, 47, 47, 0.1)', borderRadius: '12px' }}>
                    <Layers size={24} color="#d32f2f" />
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div style={{ padding: '1rem', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#14b8a6', fontWeight: 800, marginBottom: '0.3rem' }}>TODAY'S INBOUND</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#14b8a6' }}>{Math.floor(Math.random() * 50) + 10}</div>
                 </div>
                 <div style={{ padding: '1rem', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#f97316', fontWeight: 800, marginBottom: '0.3rem' }}>TODAY'S OUTBOUND</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f97316' }}>{Math.floor(Math.random() * 20) + 5}</div>
                 </div>
               </div>

               <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                    <svg width="120" height="120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary)" strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 * 0.2} strokeLinecap="round" transform="rotate(-90 60 60)" />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.2rem', fontWeight: 900 }}>
                      82%
                    </div>
                  </div>
                  <div style={{ marginTop: '0.8rem', fontSize: '12px', color: '#94a3b8' }}>
                    Available vs Capacity
                    <div style={{ fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>{shed._count?.grids || 0} Total Grids</div>
                  </div>
               </div>

               <button className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>View Operations →</button>
            </div>
          ))}
        </div>
      )}

      {view === 'location' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1.5fr', gap: '2rem' }}>
          {/* Location Reference Card */}
          <div className="glass shadow-lg" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{selectedShed?.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Type: Global Logistics Site</p>
             </header>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <DashboardButton color="#64748b" label="Yesterday Report" />
                <DashboardButton color="#7e22ce" label="Today Report" />
                <div style={{ background: '#14b8a6', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '0.5rem', color: 'rgba(0,0,0,0.6)' }}>TODAY'S INBOUND</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>{stats?.inboundToday || 0}</div>
                </div>
                <div style={{ background: '#f97316', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '0.5rem', color: 'rgba(0,0,0,0.6)' }}>TODAY'S OUTBOUND</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>{stats?.outboundToday || 0}</div>
                </div>
             </div>

             <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                   <svg width="140" height="140">
                      <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                      <circle cx="70" cy="70" r="60" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="377" strokeDashoffset={377 * (1 - (stats?.capacityPercent / 100))} strokeLinecap="round" transform="rotate(-90 70 70)" />
                   </svg>
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.6rem', fontWeight: 900 }}>
                      {stats?.capacityPercent || 0}%
                   </div>
                </div>
                <div style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '14px' }}>
                   Available vs Capacity
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.3rem', color: 'white', fontWeight: 700 }}>
                      <LayoutGrid size={16} color="#f97316" /> {stats?.totalGrids || 0} Grids
                   </div>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <SidebarActionBtn onClick={() => setSubView('3d')} icon={<Box size={18}/>} label="3D View" active={subView === '3d'} />
                <SidebarActionBtn onClick={() => setSubView('stock')} icon={<LayoutGrid size={18}/>} label="Current Stock" active={subView === 'stock'} />
             </div>

             <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Top Customers by Volume</h4>
                <div className="glass" style={{ padding: '0', background: 'white' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', color: '#334155', fontSize: '13px' }}>
                      <thead style={{ background: '#3b82f6', color: 'white' }}>
                         <tr>
                            <th style={{ padding: '0.8rem' }}># Customer</th>
                            <th style={{ padding: '0.8rem', textAlign: 'right' }}>Volume</th>
                         </tr>
                      </thead>
                      <tbody>
                         {(stats?.topCustomers || []).map((c, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                             <td style={{ padding: '0.8rem' }}>{i+1}. {c.name}</td>
                             <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 700 }}>{c.volume.toFixed(2)}</td>
                           </tr>
                         ))}
                         {!stats?.topCustomers?.length && <tr><td colSpan="2" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No data available</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>

             <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Inbound Exception</h4>
                <div className="glass" style={{ padding: '0', background: 'white' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', color: '#334155', fontSize: '13px' }}>
                      <thead style={{ background: '#ef4444', color: 'white' }}>
                         <tr>
                            <th style={{ padding: '0.8rem' }}># Receipt</th>
                            <th style={{ padding: '0.8rem' }}>Reason</th>
                            <th style={{ padding: '0.8rem', textAlign: 'right' }}>Action</th>
                         </tr>
                      </thead>
                      <tbody>
                         {(stats?.exceptions || []).map((ex, i) => (
                           <tr key={ex.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                             <td style={{ padding: '0.8rem' }}>{ex.receipt}</td>
                             <td style={{ padding: '0.8rem' }}>{ex.reason}</td>
                             <td style={{ padding: '0.8rem', textAlign: 'right' }}><button className="btn" style={{ padding: '2px 8px', fontSize: '10px' }}>{ex.action}</button></td>
                           </tr>
                         ))}
                         {!stats?.exceptions?.length && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No inbound exceptions</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          <div className="animate-slide-up" style={{ minHeight: '600px' }}>
             {subView === '3d' ? (
                <div className="glass" style={{ height: '100%', padding: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Digital Twin Visualization</h2>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '12px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Circle size={10} fill="#d32f2f" stroke="none" /> Occupied</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Circle size={10} fill="#334155" stroke="none" /> Available</div>
                      </div>
                   </div>
                   <div style={{ height: '700px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                      <Warehouse3D shedId={selectedShed?.id} />
                   </div>
                </div>
             ) : (
                <div className="glass" style={{ height: '100%', padding: '2rem' }}>
                   <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem' }}>Slot Occupancy Map</h2>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                      {Array.from({ length: stats?.totalGrids || 20 }).map((_, i) => {
                        const occupied = i < stats?.occupiedGrids;
                        return (
                          <div key={i} style={{ 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '8px', 
                            background: occupied ? 'rgba(211, 47, 47, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: `2px solid ${occupied ? '#d32f2f' : 'rgba(255,255,255,0.1)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem'
                          }}>
                             <Box size={24} color={occupied ? '#ef4444' : '#64748b'} />
                             <span style={{ fontSize: '10px', fontWeight: 800 }}>G-{(i+1).toString().padStart(3, '0')}</span>
                          </div>
                      )})}
                   </div>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardButton = ({ color, label }) => (
  <button style={{ 
    background: color, 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '0.8rem', 
    fontSize: '12px', 
    fontWeight: 700, 
    cursor: 'pointer' 
  }}>
    {label}
  </button>
);

const SidebarActionBtn = ({ icon, label, onClick, active }) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '0.5rem', 
      padding: '1rem', 
      background: active ? '#3b82f6' : 'rgba(255,255,255,0.05)', 
      color: active ? 'white' : '#94a3b8', 
      border: 'none', 
      borderRadius: '8px', 
      fontSize: '13px', 
      fontWeight: 'bold', 
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
  >
    {icon} {label}
  </button>
);

export default Dashboard;
