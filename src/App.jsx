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
    // Helper function to update specific data source
    const updateDataSource = async (fetchFn, dataKey, telemetryUpdater, timestampKey) => {
      try {
        const data = await fetchFn();
        if (data) {
          setTelemetry(prev => ({
            ...prev,
            ...telemetryUpdater(data)
          }));
          setLastUpdated(prev => ({
            ...prev,
            [timestampKey]: new Date()
          }));
        }
      } catch (error) {
        console.error(`Error fetching ${dataKey}:`, error);
      }
    };

    // Initial fetch all data
    const initData = async () => {
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

      setTelemetry(prev => ({
        ...prev,
        // NEO
        neo_count: neo.neo_count || 0,
        neo_velocity: (neo.neo_velocity || 0) / 50000,
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
        // Asteroids
        asteroid_approaches_7d: asteroidApproaches.asteroid_approaches_7d || 0,
        asteroid_closest_distance: asteroidApproaches.asteroid_closest_distance || 0,
        asteroid_fastest_velocity: asteroidApproaches.asteroid_fastest_velocity || 0,
        // EONET
        event_count: eonet.length || 0
      }));

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

    initData();

    // Set up individual refresh intervals based on actual API update frequencies

    // ISS Position - Every 1 second (real-time tracking)
    const issInterval = setInterval(() => {
      updateDataSource(
        fetchISSPosition,
        'ISS',
        (data) => ({
          iss_latitude: data.iss_latitude || 0,
          iss_longitude: data.iss_longitude || 0,
          iss_altitude: data.iss_altitude || 408,
          iss_velocity: data.iss_velocity || 7.66
        }),
        'iss'
      );
    }, 1000); // 1 second

    // Solar Activity - Every 1 minute (NOAA updates every 1-5 minutes)
    const solarInterval = setInterval(() => {
      updateDataSource(
        fetchSolarActivity,
        'Solar',
        (data) => ({
          solar_xray_flux: data.solar_xray_flux || 0,
          solar_activity_level: data.solar_activity_level || 0
        }),
        'solar'
      );
    }, 60000); // 1 minute

    // Earth Weather - Every 15 minutes
    const earthInterval = setInterval(() => {
      updateDataSource(
        fetchEarthWeather,
        'Earth Weather',
        (data) => ({
          earth_temp: data.earth_temp || 0,
          earth_wind: data.earth_wind || 0,
          earth_cloud_cover: data.earth_cloud_cover || 0,
          earth_uv_index: data.earth_uv_index || 0
        }),
        'earth'
      );
    }, 900000); // 15 minutes

    // Space Weather (DONKI) - Every 10 minutes (hourly data)
    const donkiInterval = setInterval(() => {
      updateDataSource(
        fetchDONKI,
        'DONKI',
        (data) => ({
          storm_kp: data.storm_kp || 0,
          solar_wind_speed: data.solar_wind_speed || 300,
          solar_wind_density: data.solar_wind_density || 5,
          solar_wind_temp: data.solar_wind_temp || 100000
        }),
        'donki'
      );
    }, 600000); // 10 minutes

    // EONET - Every 10 minutes (hourly data)
    const eonetInterval = setInterval(() => {
      updateDataSource(
        fetchEONET,
        'EONET',
        (data) => ({
          event_count: data.length || 0
        }),
        'eonet'
      );
    }, 600000); // 10 minutes

    // NEOs - Every 2 hours (daily data)
    const neoInterval = setInterval(() => {
      updateDataSource(
        fetchNeoWs,
        'NEO',
        (data) => ({
          neo_count: data.neo_count || 0,
          neo_velocity: (data.neo_velocity || 0) / 50000,
          neo_distance: (data.neo_distance || 0) / 10000000,
          neo_max_diameter: data.neo_max_diameter || 0,
          neo_min_diameter: data.neo_min_diameter || 0,
          neo_hazardous: data.neo_hazardous || 0
        }),
        'neo'
      );
    }, 7200000); // 2 hours

    // Asteroids - Every 2 hours (daily data)
    const asteroidsInterval = setInterval(() => {
      updateDataSource(
        fetchAsteroidApproaches,
        'Asteroids',
        (data) => ({
          asteroid_approaches_7d: data.asteroid_approaches_7d || 0,
          asteroid_closest_distance: data.asteroid_closest_distance || 0,
          asteroid_fastest_velocity: data.asteroid_fastest_velocity || 0
        }),
        'asteroids'
      );
    }, 7200000); // 2 hours

    // Exoplanets - Every 2 hours (daily data)
    const exoInterval = setInterval(() => {
      updateDataSource(
        fetchExoplanets,
        'Exoplanets',
        (data) => ({
          exo_count: data.exo_count || 5000,
          exo_radius_avg: data.exo_radius_avg || 2,
          exo_mass_avg: data.exo_mass_avg || 5,
          exo_temp_avg: data.exo_temp_avg || 800,
          exo_habitable: data.exo_habitable || 50
        }),
        'exoplanets'
      );
    }, 7200000); // 2 hours

    // TLE - Every 2 hours (daily data)
    const tleInterval = setInterval(() => {
      updateDataSource(
        fetchTLE,
        'TLE',
        (data) => ({
          tle_count: data.length || 0
        }),
        'satellites'
      );
    }, 7200000); // 2 hours

    // Cleanup all intervals
    return () => {
      clearInterval(issInterval);
      clearInterval(solarInterval);
      clearInterval(earthInterval);
      clearInterval(donkiInterval);
      clearInterval(eonetInterval);
      clearInterval(neoInterval);
      clearInterval(asteroidsInterval);
      clearInterval(exoInterval);
      clearInterval(tleInterval);
    };
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
