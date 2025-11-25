import React, { useEffect, useState, useRef } from 'react';
import { Activity, Radio, Wind, Zap, Globe, Satellite, AlertTriangle, Play, Square, HelpCircle } from 'lucide-react';
import Graph from './Graph';
import AudioSpectrum from './AudioSpectrum';

export default function HUD({ telemetry, history, isPlaying, onTogglePlay, audioState }) {
    const [logs, setLogs] = useState([]);
    const [hoveredKey, setHoveredKey] = useState(null);
    const [selectedInfoKey, setSelectedInfoKey] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const logEndRef = useRef(null);

    const telemetryDescriptions = {
        neo_count: "Total count of Near-Earth Objects currently being tracked.",
        neo_velocity: "Average relative velocity of tracked NEOs (km/s).",
        neo_distance: "Average lunar distance (LD) of tracked objects.",
        neo_max_diameter: "Max diameter of the largest tracked object (m).",
        neo_min_diameter: "Min diameter of the smallest tracked object (m).",
        neo_hazardous: "Objects classified as Potentially Hazardous (PHAs).",
        storm_kp: "Planetary K-index (Geomagnetic Storm Intensity).",
        solar_wind_speed: "Speed of solar wind particles (km/s).",
        solar_wind_density: "Density of solar wind plasma (protons/cm³).",
        solar_wind_temp: "Temperature of solar wind plasma (Kelvin).",
        exo_count: "Total confirmed exoplanets in the Archive.",
        exo_radius_avg: "Average radius of exoplanets (Earth radii).",
        exo_mass_avg: "Average mass of exoplanets (Earth masses).",
        exo_temp_avg: "Average equilibrium temperature (Kelvin).",
        exo_gravity_avg: "Average surface gravity (Earth Gs).",
        tle_count: "Active satellites tracked via Two-Line Elements.",
        mars_temp: "Average surface temperature on Mars (Sol data).",
        mars_pressure: "Atmospheric pressure on Mars (Pascals).",
        mars_wind: "Average wind speed on Mars (m/s).",

        event_count: "Active natural events tracked by EONET.",
        exo_habitable: "Estimated number of potentially habitable exoplanets."
    };

    // Handle Resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // System Logging
    useEffect(() => {
        const addLog = (msg) => {
            const time = new Date().toLocaleTimeString();
            setLogs(prev => [...prev.slice(-15), `[${time}] ${msg}`]);
        };

        if (telemetry.neo_hazardous > 0) addLog(`WARNING: ${Math.round(telemetry.neo_hazardous)} HAZARDOUS OBJECTS`);
        if (telemetry.storm_kp > 5) addLog(`ALERT: GEOMAGNETIC STORM KP ${telemetry.storm_kp.toFixed(1)}`);

    }, [telemetry.neo_hazardous, telemetry.storm_kp]);

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Format label
    const formatLabel = (key) => key.replace(/_/g, ' ').toUpperCase();

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: isMobile ? 'flex' : 'grid',
            flexDirection: 'column',
            gridTemplateColumns: '300px 1fr 400px', // Wider right panel
            gridTemplateRows: '60px 1fr 100px',
            padding: isMobile ? '10px' : '20px',
            boxSizing: 'border-box',
            fontFamily: '"Rajdhani", sans-serif',
            color: '#00f0ff',
            zIndex: 10,
            overflow: isMobile ? 'auto' : 'hidden'
        }}>
            {/* --- TOP BAR --- */}
            <div style={{
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
                background: 'rgba(0, 10, 20, 0.8)',
                pointerEvents: 'auto',
                padding: isMobile ? '10px' : '0 20px',
                gap: isMobile ? '10px' : '0',
                minHeight: isMobile ? 'auto' : '60px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontFamily: '"Orbitron", sans-serif', fontSize: isMobile ? '20px' : '24px', letterSpacing: '2px' }}>COEISMIC</h1>
                    <span style={{ background: '#ff003c', color: 'white', padding: '2px 6px', fontSize: '10px', borderRadius: '2px' }}>UPLINK ACTIVE</span>
                    <span style={{ background: audioState === 'running' ? '#00ff00' : '#ffaa00', color: 'black', padding: '2px 6px', fontSize: '10px', borderRadius: '2px' }}>AUDIO: {audioState?.toUpperCase()}</span>
                </div>

                {/* CENTER: CREDITS */}
                <a
                    href="https://bento.me/arjunoff"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        position: isMobile ? 'relative' : 'absolute',
                        left: isMobile ? '0' : '50%',
                        transform: isMobile ? 'none' : 'translateX(-50%)',
                        color: 'rgba(0, 240, 255, 0.6)',
                        fontSize: '12px',
                        textDecoration: 'none',
                        fontFamily: '"Orbitron", sans-serif',
                        letterSpacing: '2px',
                        transition: 'color 0.3s ease',
                        pointerEvents: 'auto',
                        marginTop: isMobile ? '5px' : '0'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#00f0ff'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(0, 240, 255, 0.6)'}
                >
                    CREATED BY: OFFSPACE
                </a>

                <div style={{ display: 'flex', gap: '20px', fontSize: '12px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Globe size={14} />
                            <span>EXO: {telemetry.exo_count}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Satellite size={14} />
                            <span>TLE: {telemetry.tle_count}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowHelp(true)}
                        style={{ background: 'transparent', border: 'none', color: '#00f0ff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <HelpCircle size={18} />
                    </button>
                </div>
            </div>

            {/* --- LEFT PANEL: SYSTEM LOGS --- */}
            {!isMobile && (
                <div style={{ gridColumn: '1', gridRow: '2', marginTop: '20px', background: 'rgba(0, 10, 20, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '10px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '5px' }}>SYSTEM LOG</h3>
                    <div style={{ flex: 1, overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace', color: '#00f0ff', opacity: 0.8 }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            )}

            {/* --- CENTER: AUDIO VISUALIZER --- */}
            <div style={{
                gridColumn: '2',
                gridRow: '2',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none',
                padding: '20px',
                minHeight: isMobile ? '200px' : 'auto'
            }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AudioSpectrum />
                    <div style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(0, 240, 255, 0.5)' }}>REAL-TIME FREQUENCY DOMAIN</div>
                </div>
            </div>

            {/* --- RIGHT PANEL: TELEMETRY GRID --- */}
            <div style={{
                gridColumn: '3',
                gridRow: '2',
                marginTop: '20px',
                background: 'rgba(0, 10, 20, 0.8)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                padding: '10px',
                pointerEvents: 'auto',
                overflowY: 'auto',
                maxHeight: isMobile ? '400px' : 'auto'
            }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '5px' }}>TELEMETRY ({Object.keys(telemetry).length})</h3>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', paddingBottom: '10px' }}>
                    {Object.keys(telemetry).map(key => (
                        <div
                            key={key}
                            onMouseEnter={() => setHoveredKey(key)}
                            onMouseLeave={() => setHoveredKey(null)}
                            style={{ position: 'relative', cursor: 'crosshair' }}
                        >
                            <Graph
                                data={history[key] || []}
                                label={formatLabel(key)}
                                color={key.includes('hazardous') || key.includes('storm') ? '#ff003c' : '#00f0ff'}
                                min={0}
                                max={Math.max(...(history[key] || [100])) * 1.2}
                            />
                            {(hoveredKey === key || isMobile) && ( // Always show button on mobile if needed, or rely on tap
                                <button
                                    onClick={() => setSelectedInfoKey(key)}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(0, 10, 20, 0.9)',
                                        border: '1px solid #00f0ff',
                                        color: '#00f0ff',
                                        padding: '5px 10px',
                                        fontSize: '10px',
                                        fontFamily: '"Orbitron", sans-serif',
                                        cursor: 'pointer',
                                        zIndex: 10,
                                        opacity: isMobile ? 0.8 : 1 // Less intrusive on mobile
                                    }}
                                >
                                    KNOW MORE
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- INFO MODAL --- */}
            {selectedInfoKey && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100,
                    backdropFilter: 'blur(5px)',
                    pointerEvents: 'auto'
                }}>
                    <div style={{
                        width: isMobile ? '90%' : '400px',
                        background: 'rgba(0, 10, 20, 0.95)',
                        border: '1px solid #00f0ff',
                        padding: '20px',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setSelectedInfoKey(null)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'transparent',
                                border: 'none',
                                color: '#ff003c',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '16px'
                            }}
                        >
                            [X]
                        </button>

                        <h2 style={{ margin: '0 0 10px 0', fontFamily: '"Orbitron", sans-serif', color: '#00f0ff', fontSize: isMobile ? '18px' : '24px' }}>
                            {formatLabel(selectedInfoKey)}
                        </h2>

                        <div style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.3)', marginBottom: '15px' }}></div>

                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#ffffff', marginBottom: '20px' }}>
                            {telemetryDescriptions[selectedInfoKey]}
                        </p>

                        <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '10px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(0, 240, 255, 0.7)' }}>CURRENT VALUE</div>
                            <div style={{ fontSize: '24px', fontFamily: 'monospace', color: '#ffffff' }}>
                                {telemetry[selectedInfoKey]?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HELP MODAL --- */}
            {showHelp && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 200,
                    backdropFilter: 'blur(10px)',
                    pointerEvents: 'auto'
                }}>
                    <div style={{
                        width: isMobile ? '90%' : '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: 'rgba(0, 10, 20, 0.95)',
                        border: '1px solid #00f0ff',
                        padding: '40px',
                        boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)',
                        position: 'relative',
                        fontFamily: '"Rajdhani", sans-serif'
                    }}>
                        <button
                            onClick={() => setShowHelp(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'transparent',
                                border: 'none',
                                color: '#ff003c',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '20px'
                            }}
                        >
                            [CLOSE]
                        </button>

                        <h1 style={{ margin: '0 0 20px 0', fontFamily: '"Orbitron", sans-serif', color: '#00f0ff', fontSize: '24px', letterSpacing: '4px', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '10px' }}>
                            MISSION BRIEFING
                        </h1>

                        <div style={{ color: '#ffffff', fontSize: '16px', lineHeight: '1.6' }}>
                            <p><strong>SYSTEM STATUS:</strong> You are listening to the sound of space.</p>

                            <p>This terminal connects to live NASA APIs to generate a real-time audio-visual soundscape. Every sound you hear is driven by actual data:</p>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0' }}>
                                <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#00f0ff' }}>■</span>
                                    <span><strong>Asteroids (NEOs)</strong> control the bass frequencies and rhythm.</span>
                                </li>
                                <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#00f0ff' }}>■</span>
                                    <span><strong>Solar Wind</strong> modulates the ethereal pads and harmonies.</span>
                                </li>
                                <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#00f0ff' }}>■</span>
                                    <span><strong>Exoplanet Discoveries</strong> trigger melodic chimes.</span>
                                </li>
                                <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#ff003c' }}>■</span>
                                    <span><strong>Hazardous Objects</strong> create warning pulses.</span>
                                </li>
                            </ul>

                            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', borderTop: '1px solid rgba(0, 240, 255, 0.2)', paddingTop: '20px' }}>
                                <em>"Space is not silent. It is just waiting to be heard."</em>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BOTTOM BAR: CONTROLS --- */}
            <div style={{
                gridColumn: '1 / -1',
                gridRow: '3',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'auto',
                gap: '20px',
                position: 'relative',
                marginTop: isMobile ? '20px' : '0',
                paddingBottom: isMobile ? '20px' : '0'
            }}>
                <button
                    onClick={onTogglePlay}
                    style={{
                        background: isPlaying ? 'rgba(255, 0, 60, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                        border: `1px solid ${isPlaying ? '#ff003c' : '#00f0ff'}`,
                        color: isPlaying ? '#ff003c' : '#00f0ff',
                        padding: isMobile ? '15px 30px' : '10px 40px',
                        fontSize: isMobile ? '16px' : '18px',
                        fontFamily: '"Orbitron", sans-serif',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.3s ease',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: 'center'
                    }}
                >
                    {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    {isPlaying ? 'TERMINATE UPLINK' : 'INITIATE UPLINK'}
                </button>
            </div>
        </div>
    );
}
