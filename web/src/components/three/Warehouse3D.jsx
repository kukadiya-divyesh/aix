import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

const GridCell = ({ position, code, product, onHover }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, hovered ? 1.2 : 1, 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(code, product);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null, null);
        }}
      >
        <boxGeometry args={[0.9, 0.2, 0.9]} />
        <meshStandardMaterial 
          color={hovered ? "#ffb300" : (product ? "#d32f2f" : "#334155")} 
          metalness={0.5} 
          roughness={0.2}
        />
      </mesh>
      
      {/* Grid Label */}
      <Text
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.1}
        color="white"
      >
        {code}
      </Text>

      {/* Box visual if product exists */}
      {product && (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color="#b71c1c" />
        </mesh>
      )}
    </group>
  );
};

const Warehouse3D = ({ data }) => {
  const [hoveredInfo, setHoveredInfo] = useState({ code: null, product: null });

  // Generate 50 grids (5x10)
  const grids = [];
  for (let i = 0; i < 50; i++) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const code = (i + 1).toString().padStart(4, '0');
    // Mock product data for viz
    const product = i % 7 === 0 ? "Inventory Item" : null;
    grids.push(
      <GridCell 
        key={code} 
        position={[col * 1.2 - 5.4, 0, row * 1.2 - 2.4]} 
        code={code}
        product={product}
        onHover={(code, product) => setHoveredInfo({ code, product })}
      />
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0f172a' }}>
      <Canvas shadows camera={{ position: [8, 8, 8], fov: 45 }}>
        <color attach="background" args={['#0f172a']} />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />

        <group position={[0, -0.5, 0]}>
          {grids}
          
          {/* Warehouse Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[15, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>

        <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
      </Canvas>

      {/* Floating Tooltip */}
      {hoveredInfo.code && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '12px',
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(8px)',
          borderLeft: '4px solid #d32f2f',
          color: 'white',
          borderRadius: '4px',
          pointerEvents: 'none'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px' }}>Grid: {hoveredInfo.code}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            {hoveredInfo.product ? hoveredInfo.product : "Empty"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Warehouse3D;
