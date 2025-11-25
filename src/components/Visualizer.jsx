import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, CameraShake } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

function ParticleSystem({ count = 1000, speed = 0.1, colorShift = 0 }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        particles.forEach((particle, i) => {
            let { t, factor, speed: particleSpeed, xFactor, yFactor, zFactor } = particle;
            // Modulate speed with global speed prop
            t = particle.t += (particleSpeed * (1 + speed * 5)) / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);

            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            dummy.scale.set(s, s, s);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshPhongMaterial color={new THREE.Color().setHSL(0.6 - (colorShift * 0.6), 1, 0.5)} />
        </instancedMesh>
    );
}

function SatelliteSystem({ count = 0 }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const [hovered, setHover] = useState(null);

    // Create random orbits
    const satellites = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            radius: 5 + Math.random() * 10,
            speed: 0.2 + Math.random() * 0.5,
            angle: Math.random() * Math.PI * 2,
            inclination: (Math.random() - 0.5) * Math.PI
        }));
    }, [count]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        satellites.forEach((sat, i) => {
            const angle = sat.angle + time * sat.speed;
            const x = Math.cos(angle) * sat.radius;
            const z = Math.sin(angle) * sat.radius;
            const y = Math.sin(angle) * Math.sin(sat.inclination) * sat.radius;

            dummy.position.set(x, y, z);
            // Highlight if hovered
            const scale = hovered === i ? 0.3 : 0.1;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={mesh}
            args={[null, null, count]}
            onPointerOver={(e) => { e.stopPropagation(); setHover(e.instanceId); }}
            onPointerOut={() => setHover(null)}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
        </instancedMesh>
    );
}



export default function Visualizer({ intensity = 0, velocity = 0, stormIntensity = 0, tleCount = 0, hasAtmosphere = false }) {
    // Fallback for TLE count to ensure visuals
    const safeTleCount = tleCount > 0 ? tleCount : 50;

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, background: '#000' }}>
            <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
                <color attach="background" args={['#050510']} />

                {hasAtmosphere && <fog attach="fog" args={['#331100', 10, 50]} />}
                <ambientLight intensity={1} />
                <pointLight position={[10, 10, 10]} intensity={2} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1 + velocity * 2} />

                {/* Spatial Reference */}
                <gridHelper args={[100, 50, 0x112244, 0x050510]} position={[0, -10, 0]} />


                <SatelliteSystem count={safeTleCount} />

                <ParticleSystem
                    count={Math.floor(intensity * 100 + 200)}
                    speed={velocity}
                    colorShift={stormIntensity}
                />

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />

                <CameraShake
                    maxYaw={0.05 * stormIntensity}
                    maxPitch={0.05 * stormIntensity}
                    maxRoll={0.05 * stormIntensity}
                    yawFrequency={0.5}
                    pitchFrequency={0.5}
                    rollFrequency={0.5}
                    intensity={1}
                    decayRate={0.65}
                />
            </Canvas>
        </div>
    );
}
