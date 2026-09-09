'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

interface Blob3DProps {
  state: 'idle' | 'thinking' | 'speaking';
}

// Full-screen space scene with black hole center
function SpaceScene({ state }: { state: Blob3DProps['state'] }) {
  const groupRef = useRef<THREE.Group>(null);
  const particleUserDataRef = useRef<any[]>([]);
  const particleGeometryRef = useRef<THREE.BufferGeometry>(null);
  const blackHoleRef = useRef<THREE.Mesh>(null);
  const eventHorizonRef = useRef<THREE.Mesh>(null);

  const colors = useMemo(() => {
    switch(state) {
      case 'thinking': return { vortex: '#1e3a8a', orbit: '#a855f7', particles: ['#f472b6', '#a855f7', '#8b5cf6', '#06b6d4'] };
      case 'speaking': return { vortex: '#1e293b', orbit: '#ec4899', particles: ['#fbbf24', '#ec4899', '#f472b6', '#f97316'] };
      default: return { vortex: '#050517', orbit: '#8b5cf6', particles: ['#8b5cf6', '#a855f7', '#06b6d4', '#3b82f6'] };
    }
  }, [state]);

  // Create the entire scene once
  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    // Clear existing
    while(group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // ============ BLACK HOLE CENTER ============
    const vortexGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const vortexMaterial = new THREE.MeshBasicMaterial({
      color: colors.vortex,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const blackHole = new THREE.Mesh(vortexGeometry, vortexMaterial);
    blackHoleRef.current = blackHole;
    group.add(blackHole);

    // Event horizon ring
    const eventHorizonGeometry = new THREE.TorusGeometry(1.7, 0.15, 32, 64);
    const eventHorizonMaterial = new THREE.MeshBasicMaterial({
      color: colors.orbit,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const eventHorizon = new THREE.Mesh(eventHorizonGeometry, eventHorizonMaterial);
    eventHorizon.rotation.x = Math.PI / 2;
    eventHorizonRef.current = eventHorizon;
    group.add(eventHorizon);

    // ============ FULL SCREEN PARTICLES (Minimalistic) ============
    // Different layers of particles for depth
    const particleLayers = [
      { count: 150, size: 0.15, distance: 40, speed: 0.0002, colorIdx: 0 },   // Far background - large, slow
      { count: 250, size: 0.1, distance: 25, speed: 0.0003, colorIdx: 1 },    // Mid background
      { count: 300, size: 0.08, distance: 15, speed: 0.0004, colorIdx: 2 },   // Mid foreground
      { count: 150, size: 0.06, distance: 8, speed: 0.0005, colorIdx: 3 },    // Near - small, slightly faster
    ];

    particleLayers.forEach((layer, layerIdx) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(layer.count * 3);
      const sizes = new Float32Array(layer.count);
      const colorsArr = new Float32Array(layer.count * 3);
      const userData: any[] = [];

      const particleColors = colors.particles;
      const baseColor = new THREE.Color(particleColors[layer.colorIdx % particleColors.length]);

      for (let i = 0; i < layer.count; i++) {
        // Sphere distribution
        const radius = layer.distance * (0.5 + Math.random() * 0.5);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        sizes[i] = layer.size * (0.5 + Math.random() * 0.8);
        userData.push({
          radius,
          theta,
          phi,
          layerSpeed: layer.speed * (0.5 + Math.random() * 0.5),
          layerIdx,
          offset: Math.random() * Math.PI * 2,
        });

        // Color with slight variation
        const color = baseColor.clone();
        color.offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
        colorsArr[i * 3] = color.r;
        colorsArr[i * 3 + 1] = color.g;
        colorsArr[i * 3 + 2] = color.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('color', new THREE.BufferAttribute(colorsArr, 3));

      const material = new THREE.PointsMaterial({
        size: layer.size,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particles = new THREE.Points(geometry, material);
      particles.userData = { isParticleLayer: true, layerIdx, userData, layerSpeed: layer.speed };
      group.add(particles);

      // Store reference for animation
      if (layerIdx === 0) {
        particleGeometryRef.current = geometry;
        particleUserDataRef.current = userData;
      }
    });

    // ============ SUBTLE NEBULA CLOUDS ============
    const nebulaColors = ['#8b5cf6', '#a855f7', '#06b6d4', '#3b82f6'];
    for (let i = 0; i < 4; i++) {
      const nebulaGeometry = new THREE.SphereGeometry(8 + i * 3, 16, 16);
      const nebulaMaterial = new THREE.MeshBasicMaterial({
        color: nebulaColors[i],
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
        depthWrite: false,
      });
      const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      nebula.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      );
      nebula.userData = { isNebula: true, rotateSpeed: 0.0001 + i * 0.00005 };
      group.add(nebula);
    }

    // ============ DISTANT STARS ============
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(500 * 3);
    const starSizes = new Float32Array(500);

    for (let i = 0; i < 500; i++) {
      const radius = 60 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);
      starSizes[i] = 0.1 + Math.random() * 0.25;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.userData = { isStars: true };
    group.add(stars);
  }, [state]);

  // Animation loop - very slow, ethereal
  useFrame((ctx) => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    // Slowly rotate black hole
    if (blackHoleRef.current) {
      blackHoleRef.current.rotation.y += 0.0003;
      blackHoleRef.current.rotation.x += 0.00015;
    }

    // Pulse event horizon
    if (eventHorizonRef.current) {
      eventHorizonRef.current.rotation.y += 0.0008;
      const pulse = 1 + Math.sin(ctx.clock.elapsedTime * 0.5) * 0.05;
      eventHorizonRef.current.scale.set(pulse, pulse, pulse);
    }

    // Animate all children
    group.children.forEach((child) => {
      if (child.userData?.isParticleLayer && child instanceof THREE.Points) {
        // Slow orbital motion for particle layers
        const positions = child.geometry.attributes.position.array;
        const userData = child.userData.userData;
        const layerSpeed = child.userData.layerSpeed;

        for (let i = 0; i < userData.length; i++) {
          const data = userData[i];
          const time = ctx.clock.elapsedTime;

          // Very slow orbital motion
          data.theta += data.layerSpeed * 0.1;
          data.phi += data.layerSpeed * 0.05;

          positions[i * 3] = data.radius * Math.sin(data.phi) * Math.cos(data.theta);
          positions[i * 3 + 1] = data.radius * Math.sin(data.phi) * Math.sin(data.theta);
          positions[i * 3 + 2] = data.radius * Math.cos(data.phi);
        }
        child.geometry.attributes.position.needsUpdate = true;
      }

      if (child.userData?.isNebula) {
        child.rotation.y += child.userData.rotateSpeed;
        child.rotation.x += child.userData.rotateSpeed * 0.5;
      }

      if (child.userData?.isStars) {
        child.rotation.y += 0.00005;
        child.rotation.x += 0.00002;
      }
    });
  });

  return <group ref={groupRef} />;
}

export default function Blob3D({ state }: Blob3DProps) {
  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.3} color="#050517" />
        <directionalLight position={[0, 0, 30]} intensity={0.8} color="#8b5cf6" />
        <directionalLight position={[0, 0, -30]} intensity={0.8} color="#ec4899" />
        <directionalLight position={[30, 0, 0]} intensity={0.6} color="#06b6d4" />
        <directionalLight position={[-30, 0, 0]} intensity={0.6} color="#a855f7" />
        <directionalLight position={[0, 30, 0]} intensity={0.5} color="#f472b6" />
        <directionalLight position={[0, -30, 0]} intensity={0.5} color="#fbbf24" />
        <SpaceScene state={state} />
      </Canvas>
    </div>
  );
}