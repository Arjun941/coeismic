import React, { useState, useEffect } from 'react';
import {
  fetchAPOD, fetchNeoWs, fetchDONKI, fetchEarthWeather, fetchAsteroidApproaches, fetchEONET, fetchTLE, fetchExoplanets, fetchISSPosition, fetchSolarActivity
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
    solar_xray_flux: 0,
    solar_activity_level: 0,
    // Exoplanets
    exo_count: 0,
    exo_radius_avg: 0,
    exo_mass_avg: 0,
    exo_temp_avg: 0,
    exo_habitable: 0,
    // Satellites
    tle_count: 0,
    // ISS
    iss_latitude: 0,
    iss_longitude: 0,
    iss_altitude: 408,
    iss_velocity: 7.66,
    // Earth Weather
    earth_temp: 0,
    earth_wind: 0,
    earth_cloud_cover: 0,
    earth_uv_index: 0,
    // Asteroids (7-day)
    asteroid_approaches_7d: 0,
    asteroid_closest_distance: 0,
    asteroid_fastest_velocity: 0,
    // EONET
    event_count: 0
  });

  // History for Graphs (Object of Arrays)
  const [history, setHistory] = useState({});

  // Last Updated Timestamps
  const [lastUpdated, setLastUpdated] = useState({
    neo: null,
    asteroids: null,
    solar: null,
    donki: null,
    iss: null,
    earth: null,
    exoplanets: null,
    eonet: null,
    satellites: null
  });

  // Initialize History
  useEffect(() => {
    const initHist = {};
    Object.keys(telemetry).forEach(key => {
      initHist[key] = new Array(MAX_HISTORY).fill(0);
    });
    setHistory(initHist);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const results = await Promise.allSettled([
        fetchAPOD(),
        fetchNeoWs(),
        fetchDONKI(),
        fetchEarthWeather(),
        fetchAsteroidApproaches(),
        fetchEONET(),
        fetchTLE(),
        fetchExoplanets(),
        fetchISSPosition(),
        fetchSolarActivity()
      ]);

      const apod = results[0].value;
      const neo = results[1].value || {};
      const donki = results[2].value || {};
      const earthWeather = results[3].value || {};
      const asteroidApproaches = results[4].value || {};
      const eonet = results[5].value || [];
      const tle = results[6].value || [];
      const exo = results[7].value || {};
      const iss = results[8].value || {};
      const solar = results[9].value || {};

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
        solar_xray_flux: solar.solar_xray_flux || 0,
        solar_activity_level: solar.solar_activity_level || 0,
        // Exo
        exo_count: exo.exo_count || 5000,
        exo_radius_avg: exo.exo_radius_avg || 2,
        exo_mass_avg: exo.exo_mass_avg || 5,
        exo_temp_avg: exo.exo_temp_avg || 800,
        exo_habitable: exo.exo_habitable || 50,
        // TLE
        tle_count: tle.length || 0,
        // ISS
        iss_latitude: iss.iss_latitude || 0,
        iss_longitude: iss.iss_longitude || 0,
        iss_altitude: iss.iss_altitude || 408,
        iss_velocity: iss.iss_velocity || 7.66,
        // Earth Weather
        earth_temp: earthWeather.earth_temp || 0,
        earth_wind: earthWeather.earth_wind || 0,
        earth_cloud_cover: earthWeather.earth_cloud_cover || 0,
        earth_uv_index: earthWeather.earth_uv_index || 0,
        // Asteroids (7-day)
        asteroid_approaches_7d: asteroidApproaches.asteroid_approaches_7d || 0,
        asteroid_closest_distance: asteroidApproaches.asteroid_closest_distance || 0,
        asteroid_fastest_velocity: asteroidApproaches.asteroid_fastest_velocity || 0,
        // EONET
        event_count: eonet.length || 0
      }));

      // Update timestamps
      const now = new Date();
      setLastUpdated({
        neo: results[1].status === 'fulfilled' ? now : null,
        asteroids: results[4].status === 'fulfilled' ? now : null,
        solar: results[9].status === 'fulfilled' ? now : null,
        donki: results[2].status === 'fulfilled' ? now : null,
        iss: results[8].status === 'fulfilled' ? now : null,
        earth: results[3].status === 'fulfilled' ? now : null,
        exoplanets: results[7].status === 'fulfilled' ? now : null,
        eonet: results[5].status === 'fulfilled' ? now : null,
        satellites: results[6].status === 'fulfilled' ? now : null
      });

      setLoading(false);
    };

    // Initial fetch
    fetchData();

    // Refresh data every 10 seconds
    const refreshInterval = setInterval(() => {
      console.log('Refreshing NASA data...');
      fetchData();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, []);

  // --- REAL-TIME AUDIO UPDATE ---
  // Update audio engine with current telemetry data (no oscillations)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // Update history for graphs
      setHistory(prev => {
        const nextHist = { ...prev };
        Object.keys(telemetry).forEach(key => {
          if (nextHist[key]) {
            nextHist[key] = [...nextHist[key].slice(1), telemetry[key]];
          }
        });
        return nextHist;
      });

      // Send current telemetry to Audio Engine
      AudioEngine.updateTelemetry(telemetry);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, telemetry]);

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
        lastUpdated={lastUpdated}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        audioState={audioState}
      />

      <div className="scanlines"></div>
    </div>
  );
}

export default App;
