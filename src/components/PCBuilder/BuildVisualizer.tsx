import React, { Suspense, useRef } from 'react';
import { Product } from '../../types';
import { coreCategories, peripheralCategories } from './constants';
import { RefreshCw } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Text, Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface BuildVisualizerProps {
  selectedComponents: Record<string, Product>;
}

// 3D Component Models (Abstracted as primitives for now)
const ComponentModel = ({ category, selected }: { category: string, selected: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    // Slight floating animation if selected
    if (selected) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + category.length) * 0.1 + (meshRef.current.userData.baseY || 0);
    }
  });

  // Base materials
  const materialProps = {
    color: selected ? '#3b82f6' : '#334155', // Blue if selected, slate if placeholder
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: selected ? 1 : 0.3
  };

  switch (category) {
    case 'motherboard':
      return (
        <Box args={[12, 0.2, 12]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color={selected ? "#0f172a" : "#1e293b"} metalness={0.5} roughness={0.8} />
        </Box>
      );
    case 'cpu':
      return (
        <group position={[0, 0, -2]}>
          <Box ref={meshRef} args={[2, 0.2, 2]} userData={{ baseY: 0 }}>
            <meshStandardMaterial {...materialProps} color={selected ? "#10b981" : "#334155"} />
          </Box>
          {selected && <Text position={[0, 0.2, 0]} fontSize={0.5} rotation={[-Math.PI / 2, 0, 0]} color="white">CPU</Text>}
        </group>
      );
    case 'ram':
      return (
        <group position={[3, 0.5, -2]}>
          <Box ref={meshRef} args={[0.3, 1.5, 3]} userData={{ baseY: 0.5 }}>
            <meshStandardMaterial {...materialProps} color={selected ? "#f59e0b" : "#334155"} />
          </Box>
          <Box args={[0.3, 1.5, 3]} position={[0.5, 0, 0]}>
            <meshStandardMaterial {...materialProps} color={selected ? "#f59e0b" : "#334155"} />
          </Box>
          {selected && <Text position={[0.25, 1, 0]} fontSize={0.4} rotation={[0, -Math.PI / 2, 0]} color="white">RAM</Text>}
        </group>
      );
    case 'graphics-card':
      return (
        <group position={[0, 1, 3]}>
          <Box ref={meshRef} args={[8, 1, 2]} userData={{ baseY: 1 }}>
            <meshStandardMaterial {...materialProps} color={selected ? "#ef4444" : "#334155"} />
          </Box>
          {selected && <Text position={[0, 0.6, 0]} fontSize={0.5} rotation={[-Math.PI / 2, 0, 0]} color="white">GPU</Text>}
        </group>
      );
    case 'power-supply':
      return (
        <group position={[-3, 1, 3]}>
          <Box ref={meshRef} args={[3, 2, 3]} userData={{ baseY: 1 }}>
            <meshStandardMaterial {...materialProps} color={selected ? "#8b5cf6" : "#334155"} />
          </Box>
          {selected && <Text position={[0, 1.2, 0]} fontSize={0.5} rotation={[-Math.PI / 2, 0, 0]} color="white">PSU</Text>}
        </group>
      );
    case 'storage':
      return (
        <group position={[-4, 0.2, -3]}>
          <Box ref={meshRef} args={[1, 0.3, 2]} userData={{ baseY: 0.2 }}>
            <meshStandardMaterial {...materialProps} color={selected ? "#06b6d4" : "#334155"} />
          </Box>
          {selected && <Text position={[0, 0.3, 0]} fontSize={0.4} rotation={[-Math.PI / 2, 0, 0]} color="white">SSD</Text>}
        </group>
      );
    case 'cpu-cooler':
      return selected ? (
        <group position={[0, 1.5, -2]}>
          <Cylinder ref={meshRef} args={[1.5, 1.5, 1, 32]} rotation={[Math.PI / 2, 0, 0]} userData={{ baseY: 1.5 }}>
            <meshStandardMaterial {...materialProps} color="#3b82f6" metalness={0.9} />
          </Cylinder>
          <Text position={[0, 0, 1]} fontSize={0.4} color="white">COOLER</Text>
        </group>
      ) : null;
    default:
      return null;
  }
};

export const BuildVisualizer: React.FC<BuildVisualizerProps> = ({ selectedComponents }) => {
  const componentsToRender = ['motherboard', 'cpu', 'ram', 'graphics-card', 'power-supply', 'storage', 'cpu-cooler'];

  return (
    <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden relative border border-slate-800 shadow-inner flex flex-col h-[400px]">
      
      <div className="flex justify-between items-center mb-2 z-20 absolute top-4 left-4 right-4 pointer-events-none">
        <h4 className="text-white font-bold text-sm">Real-time 3D Preview</h4>
        <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-auto">
          <RefreshCw size={12} className="animate-spin-slow" />
          Drag to rotate scene
        </div>
      </div>

      {Object.keys(selectedComponents).length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <RefreshCw size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-300 font-medium text-lg">Select a part to start building your PC</p>
        </div>
      )}

      <div className="flex-grow w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [15, 10, 15], fov: 45 }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <Environment preset="city" />
            <group position={[0, -1, 0]}>
              {componentsToRender.map(cat => (
                <ComponentModel 
                  key={cat} 
                  category={cat} 
                  selected={!!selectedComponents[cat]} 
                />
              ))}
              <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={20} blur={2} far={4} />
            </group>
          </Suspense>
          
          <OrbitControls 
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={10}
            maxDistance={30}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>
    </div>
  );
};
