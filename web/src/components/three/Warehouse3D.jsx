import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

const GridBox = ({ position, grid, onHover }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const boxRef = useRef();

  const occupied = !!grid?.occupied;
  const mixed = (grid?.poCount || 0) > 1;

  const baseColor = !occupied ? '#334155' : mixed ? '#d97706' : '#dc2626';
  const hoverColor = !occupied ? '#475569' : mixed ? '#f59e0b' : '#ef4444';

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        hovered ? 1.4 : 1,
        0.12
      );
    }
    if (boxRef.current && occupied) {
      boxRef.current.position.y = THREE.MathUtils.lerp(
        boxRef.current.position.y,
        hovered ? 0.55 : 0.35,
        0.1
      );
    }
  });

  return (
    <group position={position}>
      {/* Base slab */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(grid); }}
        onPointerOut={() => { setHovered(false); onHover(null); }}
      >
        <boxGeometry args={[0.88, 0.18, 0.88]} />
        <meshStandardMaterial
          color={hovered ? hoverColor : baseColor}
          metalness={0.4}
          roughness={0.3}
          emissive={hovered ? hoverColor : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>

      {/* Grid code label */}
      <Text
        position={[0, 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.09}
        color={hovered ? '#ffffff' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
      >
        {grid.code}
      </Text>

      {/* Stacked boxes visual if occupied */}
      {occupied && (() => {
        const totalBoxes = grid.totalBoxes || 1;
        const stackHeight = Math.min(Math.ceil(totalBoxes / 5), 5);
        return Array.from({ length: stackHeight }).map((_, i) => (
          <mesh key={i} position={[0, 0.28 + i * 0.18, 0]}>
            <boxGeometry args={[0.55, 0.15, 0.55]} />
            <meshStandardMaterial
              color={mixed
                ? (i % 2 === 0 ? '#b45309' : '#92400e')
                : (i % 2 === 0 ? '#991b1b' : '#7f1d1d')
              }
              metalness={0.2}
              roughness={0.6}
            />
          </mesh>
        ));
      })()}

      {/* Amber glow ring for mixed-PO grids */}
      {occupied && mixed && hovered && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.52, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

// ── Info panel rendered in HTML overlay ─────────────────────────────────────
const HoverInfoPanel = ({ grid }) => {
  if (!grid) return null;

  const occupied = !!grid.occupied;
  const mixed = (grid.poCount || 0) > 1;
  const accentColor = !occupied ? '#64748b' : mixed ? '#f59e0b' : '#ef4444';
  const poBreakdown = grid.poBreakdown || [];
  const poColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

  return (
    <div style={{
      position: 'absolute', top: 16, left: 16,
      background: 'rgba(10, 15, 30, 0.92)',
      backdropFilter: 'blur(12px)',
      border: `1.5px solid ${accentColor}44`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '14px',
      padding: '1.1rem 1.2rem',
      minWidth: '220px', maxWidth: '260px',
      color: 'white',
      pointerEvents: 'none',
      boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}22`,
      transition: 'all 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.3px' }}>Grid {grid.code}</span>
        <span style={{
          fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px',
          background: `${accentColor}20`, color: accentColor,
          border: `1px solid ${accentColor}40`,
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {!occupied ? 'EMPTY' : mixed ? 'MIXED' : 'OCCUPIED'}
        </span>
      </div>

      {occupied ? (
        <>
          {/* Summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem', marginBottom: '0.9rem'
          }}>
            {[
              { label: 'Total Boxes', val: grid.totalBoxes, color: accentColor },
              { label: 'PO Lines', val: grid.poCount, color: '#60a5fa' },
            ].map(c => (
              <div key={c.label} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                padding: '0.5rem 0.6rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* PO Breakdown */}
          <div style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Stock Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {poBreakdown.map((item, idx) => {
              const c = poColors[idx % poColors.length];
              const pct = Math.round((item.boxes / grid.totalBoxes) * 100);
              return (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                  padding: '0.5rem 0.7rem',
                  borderLeft: `3px solid ${c}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: c }}>{item.po}</span>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'white' }}>
                      {item.boxes} <span style={{ fontSize: '9px', color: '#64748b' }}>boxes</span>
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: '2px' }} />
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ color: '#475569', fontSize: '12px', padding: '0.5rem 0' }}>
          No stock assigned to this grid.
        </div>
      )}

      {/* Coordinates footer */}
      <div style={{ marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.8rem', fontSize: '9px', color: '#334155' }}>
        <span>X: {grid.x?.toFixed(1)}</span>
        <span>Y: {grid.y?.toFixed(1)}</span>
        <span>Z: {grid.z?.toFixed(1)}</span>
      </div>
    </div>
  );
};

// ── Main Warehouse3D ─────────────────────────────────────────────────────────
const Warehouse3D = ({ data }) => {
  const [hoveredGrid, setHoveredGrid] = useState(null);

  const bounds = (data || []).reduce((acc, g) => ({
    minX: Math.min(acc.minX, g.x ?? 0),
    maxX: Math.max(acc.maxX, g.x ?? 0),
    minZ: Math.min(acc.minZ, g.z ?? 0),
    maxZ: Math.max(acc.maxZ, g.z ?? 0),
  }), { minX: 0, maxX: 0, minZ: 0, maxZ: 0 });

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const width  = (bounds.maxX - bounds.minX) + 10;
  const depth  = (bounds.maxZ - bounds.minZ) + 10;

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0f1e' }}>
      <Canvas shadows camera={{ position: [centerX + 10, 10, centerZ + 10], fov: 45 }}>
        <color attach="background" args={['#0a0f1e']} />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <pointLight position={[centerX + 10, 10, centerZ + 10]} intensity={1.2} castShadow />
        <pointLight position={[centerX - 10, 8, centerZ - 10]} intensity={0.5} color="#4488ff" />

        <OrbitControls
          makeDefault
          target={[centerX, 0, centerZ]}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.2}
        />

        <group position={[0, -0.5, 0]}>
          {(data || []).map((grid) => (
            <GridBox
              key={grid.code}
              position={[grid.x ?? 0, grid.y ?? 0, grid.z ?? 0]}
              grid={grid}
              onHover={setHoveredGrid}
            />
          ))}

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.11, centerZ]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial color="#0f172a" metalness={0.1} roughness={0.9} />
          </mesh>

          {/* Grid lines */}
          <gridHelper
            args={[Math.max(width, depth), 24, '#1e293b', '#0f172a']}
            position={[centerX, -0.06, centerZ]}
          />
        </group>

        <ContactShadows
          position={[centerX, -0.6, centerZ]}
          opacity={0.5}
          scale={Math.max(width, depth) * 1.5}
          blur={2.5}
          far={5}
        />
      </Canvas>

      {/* Rich info panel */}
      <HoverInfoPanel grid={hoveredGrid} />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '0.6rem 0.9rem',
        display: 'flex', gap: '1rem', fontSize: '11px', color: '#94a3b8'
      }}>
        {[
          { color: '#dc2626', label: 'Single PO' },
          { color: '#d97706', label: 'Mixed POs' },
          { color: '#334155', label: 'Empty' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Warehouse3D;
