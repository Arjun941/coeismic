import React, { useState, useEffect } from 'react';
import {
  fetchAPOD, fetchNeoWs, fetchDONKI, fetchInsight, fetchEONET, fetchTLE, fetchExoplanets, fetchEPIC
} from './services/nasaApi';
import AudioEngine from './audio/AudioEngine';
import Visualizer from './components/Visualizer';
import HUD from './components/HUD';
import './index.css';

const MAX_HISTORY = 50;

function App() {
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioState, setAudioState] = useState('suspended');

  // Data States21 DATA VARIABLES STATE ---
  const [telemetry, setTelemetry] = useState({
    // NEOs
    neo_count: 0,
    neo_velocity: 0,
    neo_distance: 0,
    neo_max_diameter: 0,
    neo_min_diameter: 0,
    neo_hazardous: 0,
    // Solar
    storm_kp: 0,
    solar_wind_speed: 0,
    solar_wind_density: 0,
    solar_wind_temp: 0,
    // Exoplanets
    exo_count: 0,
    exo_radius_avg: 0,
    exo_mass_avg: 0,
    exo_temp_avg: 0,
    exo_habitable: 0,
    // Satellites
    tle_count: 0,
    // Mars
    mars_wind: 0,
    mars_pressure: 0,
    mars_temp: 0,

    // EONET
    event_count: 0
  });

  // History for Graphs (Object of Arrays)
  const [history, setHistory] = useState({});

  // Initialize History
  useEffect(() => {
    const initHist = {};
    Object.keys(telemetry).forEach(key => {
      initHist[key] = new Array(MAX_HISTORY).fill(0);
    });
    setHistory(initHist);
  }, []);

  useEffect(() => {
    const initData = async () => {
      const results = await Promise.allSettled([
        fetchAPOD(),
        fetchNeoWs(),
        fetchDONKI(),
        fetchInsight(),
        fetchEONET(),
        fetchTLE(),
        fetchExoplanets(),
        fetchExoplanets()
      ]);

      const apod = results[0].value;
      const neo = results[1].value || {};
      const donki = results[2].value || {};
      const insight = results[3].value || {};
      const eonet = results[4].value || [];
      const tle = results[5].value || [];
      const exo = results[6].value || {};

      // Map API results to Telemetry State
      setTelemetry(prev => ({
        ...prev,
        // NEO
        neo_count: neo.neo_count || 0,
        neo_velocity: (neo.neo_velocity || 0) / 50000, // Normalize
        neo_distance: (neo.neo_distance || 0) / 10000000,
        neo_max_diameter: neo.neo_max_diameter || 0,
        neo_min_diameter: neo.neo_min_diameter || 0,
        neo_hazardous: neo.neo_hazardous || 0,
        // Solar
        storm_kp: donki.storm_kp || 0,
        solar_wind_speed: donki.solar_wind_speed || 300,
        solar_wind_density: donki.solar_wind_density || 5,
        solar_wind_temp: donki.solar_wind_temp || 100000,
        // Exo
        exo_count: exo.exo_count || 5000,
        exo_radius_avg: exo.exo_radius_avg || 2,
        exo_mass_avg: exo.exo_mass_avg || 5,
        exo_temp_avg: exo.exo_temp_avg || 800,
        exo_habitable: exo.exo_habitable || 50,
        // TLE
        tle_count: tle.length || 0,
        // Mars (Mock if missing)
        mars_wind: insight.wind || 5,
        mars_pressure: insight.pressure || 700,
        mars_temp: insight.temp || -60,

        // EONET
        event_count: eonet.length || 0
      }));

      setLoading(false);
    };

    initData();
  }, []);

  // --- SIMULATION LOOP (10Hz) ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) return;

      setTelemetry(prev => {
        const next = { ...prev };
        const nextHist = { ...history };

        // Fluctuate all values slightly
        Object.keys(next).forEach(key => {
          const variance = next[key] * 0.05; // 5% variance
          next[key] = next[key] + (Math.random() - 0.5) * variance;

          // Update History
          if (nextHist[key]) {
            nextHist[key] = [...nextHist[key].slice(1), next[key]];
          }
        });

        setHistory(nextHist);

        // Send to Audio Engine
        AudioEngine.updateTelemetry(next);

        return next;
      });

    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, history]);

  // --- MELODY LOOP ---
  useEffect(() => {
    const loop = setInterval(() => {
      if (isPlaying) {
        if (Math.random() < 0.3) {
          AudioEngine.triggerMelodyNote(telemetry.exo_count);
        }
      }
    }, 1000);
    return () => clearInterval(loop);
  }, [isPlaying, telemetry.exo_count]);

  const togglePlay = async () => {
    if (!isPlaying) {
      // 1. Resume Context IMMEDIATELY on user gesture
      const state = await AudioEngine.resume();
      setAudioState(state);

      // 2. Emergency Beep (Native) - REMOVED to test Tone.js
      // AudioEngine.emergencyBeep();

      // 3. Initialize Engine
      await AudioEngine.initialize();

      // 4. Start Audio
      AudioEngine.start();
      setIsPlaying(true);
    } else {
      AudioEngine.stop();
      setIsPlaying(false);
      setAudioState('suspended');
    }
  };

  return (
    <div className="app-container">
      <Visualizer
        intensity={telemetry.neo_count / 20}
        velocity={telemetry.neo_velocity}
        stormIntensity={telemetry.storm_kp / 9}
        tleCount={telemetry.tle_count}
        hasAtmosphere={true}
      />

      <HUD
        telemetry={telemetry}
        history={history}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        audioState={audioState}
      />

      <div className="scanlines"></div>
    </div>
  );
}

export default App;
