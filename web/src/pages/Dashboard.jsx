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
  const [view, setView] = useState('global');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedShed, setSelectedShed] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subView, setSubView] = useState('3d');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportLabel, setReportLabel] = useState('');

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

  const fetchReport = async (label, startDate, endDate) => {
    if (!selectedShed) return;
    setReportLabel(label);
    setReportLoading(true);
    setShowReport(true);
    try {
      const resp = await axios.get('/api/reports/movements', {
        params: { shedId: selectedShed.id, startDate, endDate }
      });
      setReport(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const openYesterdayReport = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const ds = d.toISOString().split('T')[0];
    fetchReport('Yesterday Report', ds, ds);
  };

  const openTodayReport = () => {
    const ds = new Date().toISOString().split('T')[0];
    fetchReport('Today Report', ds, ds);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {warehouses.map(wh => (
            <div 
              key={wh.id} 
              className="glass hover-card" 
              onClick={() => handleWarehouseClick(wh)}
              style={{ height: '350px', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ height: '220px', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                {wh.image ? (
                  <img src={wh.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={wh.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Warehouse size={60} opacity={0.3} />
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '12px', backdropFilter: 'blur(4px)', color: 'white' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
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
        <div className="grid-responsive-layout">
          <style>{`
            .grid-responsive-layout {
              display: grid;
              grid-template-columns: minmax(300px, 1fr) 1.5fr;
              gap: 2rem;
            }
            @media (max-width: 1200px) {
              .grid-responsive-layout {
                grid-template-columns: 1fr;
              }
            }
          `}</style>

          {/* Location Reference Card */}
          <div className="glass shadow-lg" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{selectedShed?.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Type: Global Logistics Site</p>
             </header>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <DashboardButton color="#64748b" label="Yesterday Report" onClick={openYesterdayReport} />
                <DashboardButton color="#7e22ce" label="Today Report" onClick={openTodayReport} />
                <div style={{ background: '#14b8a6', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '0.3rem', color: 'rgba(0,0,0,0.6)' }}>TODAY'S INBOUND</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{stats?.inboundToday || 0}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginTop: '0.3rem' }}>POs &bull; {stats?.inboundTodayQty || 0} units</div>
                </div>
                <div style={{ background: '#f97316', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '0.3rem', color: 'rgba(0,0,0,0.6)' }}>TODAY'S OUTBOUND</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{stats?.outboundToday || 0}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginTop: '0.3rem' }}>Lines &bull; {stats?.outboundTodayQty || 0} units</div>
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
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Top Stock by PO</h4>
                <div className="glass" style={{ padding: '0', background: 'white' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', color: '#334155', fontSize: '13px' }}>
                      <thead style={{ background: '#3b82f6', color: 'white' }}>
                         <tr>
                            <th style={{ padding: '0.8rem', textAlign: 'left' }}># PO Number</th>
                            <th style={{ padding: '0.8rem', textAlign: 'right' }}>Boxes</th>
                         </tr>
                      </thead>
                      <tbody>
                         {(stats?.topStock || []).map((s, i) => (
                           <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                             <td style={{ padding: '0.8rem' }}>
                                <div style={{ fontWeight: 700 }}>{s.po}</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>{s.desc}</div>
                             </td>
                             <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 700 }}>{s.boxes}</td>
                           </tr>
                         ))}
                         {!stats?.topStock?.length && <tr><td colSpan="2" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No stock data</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>

             <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Unresolved Exceptions</h4>
                <div className="glass" style={{ padding: '0', background: 'white' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', color: '#334155', fontSize: '13px' }}>
                      <thead style={{ background: '#ef4444', color: 'white' }}>
                         <tr>
                            <th style={{ padding: '0.8rem', textAlign: 'left' }}>Ref / Type</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left' }}>Reason</th>
                            <th style={{ padding: '0.8rem', textAlign: 'right' }}>Action</th>
                         </tr>
                      </thead>
                      <tbody>
                         {(stats?.exceptions || []).map((ex, i) => (
                           <tr key={ex.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                             <td style={{ padding: '0.8rem' }}>
                                <div style={{ fontWeight: 700 }}>{ex.receipt}</div>
                                <div style={{ fontSize: '10px', color: ex.type === 'Inbound' ? '#3b82f6' : '#f97316' }}>{ex.type}</div>
                             </td>
                             <td style={{ padding: '0.8rem' }}>{ex.reason}</td>
                             <td style={{ padding: '0.8rem', textAlign: 'right' }}><button className="btn" style={{ padding: '2px 8px', fontSize: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>Resolve</button></td>
                           </tr>
                         ))}
                         {!stats?.exceptions?.length && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>All exceptions resolved</td></tr>}
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
                      <Warehouse3D data={stats?.gridDetails || []} />
                   </div>
                </div>
             ) : (
                <div className="glass" style={{ height: '100%', padding: '2rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                     <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Slot Occupancy Map</h2>
                     <div style={{ display: 'flex', gap: '1.2rem', fontSize: '12px', color: '#94a3b8' }}>
                       <span><span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block', marginRight: 5 }}></span>Occupied ({(stats?.gridDetails || []).filter(g => g.occupied).length})</span>
                       <span><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block', marginRight: 5 }}></span>Free ({(stats?.gridDetails || []).filter(g => !g.occupied).length})</span>
                     </div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.75rem' }}>
                      {(stats?.gridDetails || []).map((grid, i) => <GridCell key={grid.id || i} grid={grid} />)}
                   </div>
                </div>
             )}
          </div>
        </div>
      )}
      <MovementReportModal
        show={showReport}
        label={reportLabel}
        report={report}
        loading={reportLoading}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
};

const GridCell = ({ grid }) => {
  const [hovered, setHovered] = React.useState(false);
  const occupied = !!grid.occupied;
  const totalBoxes = grid.totalBoxes || 0;
  const poBreakdown = grid.poBreakdown || [];
  const poCount = grid.poCount || 0;

  // Color based on how full/mixed the grid is
  const fillColor = !occupied ? null
    : poCount > 1 ? '#f59e0b'   // amber = mixed POs
    : '#ef4444';                  // red = single PO

  const bgColor = !occupied ? 'rgba(255,255,255,0.04)'
    : hovered && poCount > 1 ? 'rgba(245, 158, 11, 0.3)'
    : hovered ? 'rgba(239, 68, 68, 0.3)'
    : poCount > 1 ? 'rgba(245, 158, 11, 0.15)'
    : 'rgba(239, 68, 68, 0.15)';

  const borderColor = !occupied ? 'rgba(255,255,255,0.1)'
    : hovered ? fillColor
    : poCount > 1 ? 'rgba(245,158,11,0.5)'
    : 'rgba(239,68,68,0.4)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '90px', height: '90px', borderRadius: '10px',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '0.25rem',
        position: 'relative', cursor: occupied ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        transform: hovered && occupied ? 'scale(1.07)' : 'scale(1)',
        boxShadow: hovered && occupied ? `0 8px 24px ${fillColor}44` : 'none',
        zIndex: hovered ? 10 : 1,
      }}
    >
      <Box size={20} color={occupied ? fillColor : '#475569'} />
      <span style={{ fontSize: '9px', fontWeight: 800, color: occupied ? '#f1f5f9' : '#64748b' }}>{grid.code}</span>
      {occupied && (
        <span style={{ fontSize: '9px', fontWeight: 700, color: fillColor, lineHeight: 1 }}>
          {totalBoxes} box{totalBoxes !== 1 ? 'es' : ''}
          {poCount > 1 ? ` · ${poCount} POs` : ''}
        </span>
      )}

      {/* Hover Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 12px)',
          left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a',
          border: `1px solid ${fillColor || 'rgba(255,255,255,0.1)'}44`,
          borderRadius: '14px', padding: '1rem',
          minWidth: '220px', maxWidth: '260px',
          zIndex: 1000, boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          {/* Caret */}
          <div style={{
            position: 'absolute', bottom: -7, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12, height: 12, background: '#0f172a',
            borderRight: `1px solid ${fillColor || 'rgba(255,255,255,0.1)'}44`,
            borderBottom: `1px solid ${fillColor || 'rgba(255,255,255,0.1)'}44`,
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'white' }}>Grid {grid.code}</span>
            <span style={{
              fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '6px',
              background: occupied ? `${fillColor}22` : 'rgba(255,255,255,0.06)',
              color: occupied ? fillColor : '#64748b',
              border: `1px solid ${occupied ? fillColor + '44' : 'transparent'}`
            }}>
              {!occupied ? 'EMPTY' : poCount > 1 ? 'MIXED STOCK' : 'OCCUPIED'}
            </span>
          </div>

          {occupied ? (
            <>
              {/* Summary bar */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem 0.8rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: fillColor, lineHeight: 1 }}>{totalBoxes}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>TOTAL BOXES</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>{poCount}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>PO{poCount !== 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* PO Breakdown */}
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Stock Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {poBreakdown.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '7px', padding: '0.5rem 0.7rem', borderLeft: `3px solid ${idx === 0 ? '#3b82f6' : idx === 1 ? '#f59e0b' : '#8b5cf6'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: idx === 0 ? '#60a5fa' : idx === 1 ? '#fcd34d' : '#c4b5fd' }}>{item.po}</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: 'white' }}>{item.boxes} <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>boxes</span></span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0', color: '#475569', fontSize: '12px' }}>
              No stock in this grid
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const DashboardButton = ({ color, label, onClick }) => (
  <button onClick={onClick} style={{ 
    background: color, 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '0.8rem', 
    fontSize: '12px', 
    fontWeight: 700, 
    cursor: 'pointer',
    width: '100%'
  }}>
    {label}
  </button>
);

// Movement Report Modal
const MovementReportModal = ({ show, label, report, loading, onClose }) => {
  if (!show) return null;
  const all = [
    ...(report?.inbounds || []),
    ...(report?.outbounds || [])
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#f1f5f9', width: '100%', maxWidth: '1000px', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>Inventory Movement Report</h2>
            <p style={{ color: '#64748b', marginTop: '0.3rem', fontSize: '14px' }}>{label} &bull; {report?.summary?.period?.start}</p>
          </div>
          <button onClick={onClose} style={{ background: '#334155', color: 'white', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>✕ Close</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontSize: '18px' }}>Loading report...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Inbound POs', val: report?.summary?.inboundPOs || 0, color: '#14b8a6' },
                { label: 'Inbound Units', val: report?.summary?.inboundQty || 0, color: '#3b82f6' },
                { label: 'Outbound Lines', val: report?.summary?.outboundLines || 0, color: '#f97316' },
                { label: 'Outbound Units', val: report?.summary?.outboundQty || 0, color: '#ef4444' },
              ].map(c => (
                <div key={c.label} style={{ background: 'white', borderRadius: '12px', padding: '1.2rem', borderTop: `4px solid ${c.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{c.label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', marginTop: '0.3rem' }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Unified Movement Table */}
            <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#1e293b', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>TYPE</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>REFERENCE</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>DESCRIPTION</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '11px', fontWeight: 800 }}>QTY</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>ASSIGNED</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>STATUS</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: 800 }}>DATE/TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {all.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No movements found for this period.</td></tr>
                  )}
                  {all.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{ background: row.type === 'INBOUND' ? '#dcfce7' : '#fff7ed', color: row.type === 'INBOUND' ? '#15803d' : '#c2410c', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                          {row.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#3b82f6', fontSize: '13px' }}>{row.ref}{row.flight ? ` / ${row.flight}` : ''}</td>
                      <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '13px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.desc}</td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>{row.qty}</td>
                      <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '13px' }}>{row.user}</td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>{row.status || '—'}</span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', fontSize: '12px' }}>{new Date(row.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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
