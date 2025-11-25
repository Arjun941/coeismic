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
}

export const fetchInsight = async () => {
  try {
    // Mars Weather (Mocked as InSight is ended)
    return {
      wind: 5 + Math.random() * 10,
      pressure: 700 + Math.random() * 50,
      temp: -60 + Math.random() * 20
    };
  } catch (error) {
    return { wind: 5, pressure: 700, temp: -60 };
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

export const fetchEPIC = async () => {
  try {
    const response = await api.get('/EPIC/api/natural');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const fetchTechTransfer = async () => {
  try {
    const response = await api.get('/techtransfer/patent/');
    return response.data;
  } catch (error) {
    return { count: 0 };
  }
};

export const fetchExoplanets = async () => {
  try {
    // Mocking detailed exoplanet stats
    return {
      exo_count: 5500,
      exo_radius_avg: 2.5, // Earth Radii
      exo_mass_avg: 5.0, // Earth Masses
      exo_temp_avg: 800, // Kelvin
      exo_habitable: 50 // Count
    };
  } catch (error) {
    return { exo_count: 5000 };
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
