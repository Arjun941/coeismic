import axios from 'axios';

const API_KEY = import.meta.env.VITE_NASA_API_KEY;
const BASE_URL = 'https://api.nasa.gov';

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

export const fetchAPOD = async () => {
  try {
    const response = await api.get('/planetary/apod');
    return response.data;
  } catch (error) {
    console.error('Error fetching APOD:', error);
    return null;
  }
};

export const fetchNeoWs = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get('/neo/rest/v1/feed', {
      params: {
        start_date: today,
        end_date: today,
      },
    });

    const neos = response.data.near_earth_objects[today] || [];
    const count = response.data.element_count;

    // Detailed Analysis
    let totalVelocity = 0;
    let totalDistance = 0;
    let maxDiameter = 0;
    let minDiameter = 9999;
    let hazardousCount = 0;

    neos.forEach(neo => {
      const v = parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour);
      const d = parseFloat(neo.close_approach_data[0].miss_distance.kilometers);
      const dia = neo.estimated_diameter.kilometers.estimated_diameter_max;

      totalVelocity += v;
      totalDistance += d;
      if (dia > maxDiameter) maxDiameter = dia;
      if (dia < minDiameter) minDiameter = dia;
      if (neo.is_potentially_hazardous_asteroid) hazardousCount++;
    });

    const avgVelocity = count > 0 ? totalVelocity / count : 0;
    const avgDistance = count > 0 ? totalDistance / count : 0;

    return {
      neo_count: count,
      neo_velocity: avgVelocity,
      neo_distance: avgDistance,
      neo_max_diameter: maxDiameter,
      neo_min_diameter: minDiameter === 9999 ? 0 : minDiameter,
      neo_hazardous: hazardousCount,
      raw: neos
    };
  } catch (error) {
    console.error('Error fetching NeoWs:', error);
    return null;
  }
};

export const fetchDONKI = async () => {
  try {
    // Space Weather (Geomagnetic Storms)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const dateStr = startDate.toISOString().split('T')[0];

    const response = await api.get('/DONKI/GST', {
      params: {
        startDate: dateStr
      }
    });

    // Get max Kp index from recent storms
    let maxKp = 0;
    if (response.data && response.data.length > 0) {
      response.data.forEach(storm => {
        storm.allKpIndex.forEach(kp => {
          if (kp.kpIndex > maxKp) maxKp = kp.kpIndex;
        });
      });
    }

    // Mock Solar Wind Data (since DONKI/WSA is complex)
    const solar_wind_speed = 300 + (maxKp * 50); // km/s
    const solar_wind_density = 5 + (maxKp * 2); // p/cm3
    const solar_wind_temp = 100000 + (maxKp * 10000); // K

    return {
      storm_kp: maxKp,
      solar_wind_speed,
      solar_wind_density,
      solar_wind_temp,
      events: response.data
    };
  } catch (error) {
    console.error('Error fetching DONKI:', error);
    return null;
  }
};

export const fetchEarthWeather = async () => {
  try {
    // Get weather at NASA HQ (Washington DC) as a reference point
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: 38.8833,
        longitude: -77.0167,
        current: 'temperature_2m,wind_speed_10m,cloud_cover,uv_index',
        temperature_unit: 'celsius',
        wind_speed_unit: 'ms'
      }
    });

    const current = response.data.current;
    return {
      earth_temp: current.temperature_2m || 20,
      earth_wind: current.wind_speed_10m || 5,
      earth_cloud_cover: current.cloud_cover || 50,
      earth_uv_index: current.uv_index || 3
    };
  } catch (error) {
    console.error('Error fetching Earth weather:', error);
    return {
      earth_temp: 20,
      earth_wind: 5,
      earth_cloud_cover: 50,
      earth_uv_index: 3
    };
  }
};

// NEW: Asteroid Close Approaches (next 7 days)
export const fetchAsteroidApproaches = async () => {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const startDate = today.toISOString().split('T')[0];
    const endDate = nextWeek.toISOString().split('T')[0];

    const response = await api.get('/neo/rest/v1/feed', {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });

    let closestDistance = Infinity;
    let fastestVelocity = 0;
    let totalApproaches = 0;

    Object.values(response.data.near_earth_objects).forEach(dayNeos => {
      dayNeos.forEach(neo => {
        totalApproaches++;
        const distance = parseFloat(neo.close_approach_data[0].miss_distance.kilometers);
        const velocity = parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour);

        if (distance < closestDistance) closestDistance = distance;
        if (velocity > fastestVelocity) fastestVelocity = velocity;
      });
    });

    return {
      asteroid_approaches_7d: totalApproaches,
      asteroid_closest_distance: closestDistance === Infinity ? 0 : closestDistance / 384400, // In lunar distances
      asteroid_fastest_velocity: fastestVelocity / 1000 // km/s
    };
  } catch (error) {
    console.error('Error fetching asteroid approaches:', error);
    return {
      asteroid_approaches_7d: 0,
      asteroid_closest_distance: 0,
      asteroid_fastest_velocity: 0
    };
  }
};

export const fetchEONET = async () => {
  try {
    const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
      params: { limit: 5, days: 20 }
    });
    return response.data.events;
  } catch (error) {
    return [];
  }
};

// ISS Real-Time Position
export const fetchISSPosition = async () => {
  try {
    const response = await axios.get('http://api.open-notify.org/iss-now.json');
    const { latitude, longitude } = response.data.iss_position;

    return {
      iss_latitude: parseFloat(latitude),
      iss_longitude: parseFloat(longitude),
      iss_altitude: 408, // ISS orbits at ~408km
      iss_velocity: 7.66 // km/s orbital velocity
    };
  } catch (error) {
    console.error('Error fetching ISS position:', error);
    return {
      iss_latitude: 0,
      iss_longitude: 0,
      iss_altitude: 408,
      iss_velocity: 7.66
    };
  }
};

// Real Solar Activity from NOAA
export const fetchSolarActivity = async () => {
  try {
    // NOAA Space Weather Prediction Center - Real-time solar data
    const response = await axios.get('https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json');

    // Get latest X-ray flux reading
    const latest = response.data[response.data.length - 1];
    const xrayFlux = parseFloat(latest.flux);

    // Convert flux to a usable metric (log scale)
    const solarActivity = Math.log10(xrayFlux * 1e8); // Normalized

    return {
      solar_xray_flux: xrayFlux,
      solar_activity_level: Math.max(0, Math.min(10, solarActivity)),
      solar_flare_intensity: xrayFlux > 1e-5 ? 'High' : xrayFlux > 1e-6 ? 'Medium' : 'Low'
    };
  } catch (error) {
    console.error('Error fetching solar activity:', error);
    return {
      solar_xray_flux: 1e-7,
      solar_activity_level: 3,
      solar_flare_intensity: 'Low'
    };
  }
};

export const fetchExoplanets = async () => {
  try {
    // NASA Exoplanet Archive - Real confirmed count
    const response = await axios.get('https://exoplanetarchive.ipac.caltech.edu/TAP/sync', {
      params: {
        query: 'select count(*) as count from ps where default_flag=1',
        format: 'json'
      }
    });

    const count = response.data[0]?.count || 5500;

    // Get sample statistics
    const statsResponse = await axios.get('https://exoplanetarchive.ipac.caltech.edu/TAP/sync', {
      params: {
        query: 'select avg(pl_rade) as avg_radius, avg(pl_bmasse) as avg_mass, avg(pl_eqt) as avg_temp from ps where default_flag=1 and pl_rade is not null and pl_bmasse is not null',
        format: 'json'
      }
    });

    const stats = statsResponse.data[0] || {};

    return {
      exo_count: count,
      exo_radius_avg: stats.avg_radius || 2.5,
      exo_mass_avg: stats.avg_mass || 5.0,
      exo_temp_avg: stats.avg_temp || 800,
      exo_habitable: Math.floor(count * 0.01) // Estimate ~1% potentially habitable
    };
  } catch (error) {
    console.error('Error fetching exoplanet data:', error);
    // Fallback to known count
    return {
      exo_count: 5500,
      exo_radius_avg: 2.5,
      exo_mass_avg: 5.0,
      exo_temp_avg: 800,
      exo_habitable: 55
    };
  }
};

export const fetchTLE = async () => {
  try {
    const response = await axios.get('https://data.nasa.gov/resource/y77d-th95.json', {
      params: { '$limit': 50 }
    });
    return response.data;
  } catch (error) {
    return [];
  }
};
