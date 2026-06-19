# Coeismic 🛰️🎧

**Turns real NASA data into music. Literally.**

Coeismic grabs live numbers from NASA and a few other space/earth-science APIs — how many asteroids are buzzing past Earth right now, solar storm activity, where the ISS actually is this second, exoplanet counts, satellite counts — and turns all of that into an ambient soundtrack with a 3D visualizer pulsing along to it. Basically the universe's vibes, sonified.

## How it works

There's a telemetry layer quietly polling a bunch of live data sources in the background (each on its own refresh schedule, since they don't all update at the same rate), and that data drives two things at once:

- 🎵 **Audio Engine** — A Web Audio oscillator bank (think bass/tenor/alto/soprano/atmo/pulse "voices") that shifts in real time based on what's actually happening up there.
- 🌌 **3D Visualizer** — A `react-three-fiber` scene with particles, satellites, and some bloom/noise post-processing that reacts to the same data — more asteroids, more particles; bigger solar storm, more chaos.
- 📊 **HUD & Graphs** — A heads-up display showing the live numbers plus little history graphs so you can see trends over time.

### Data sources

| Source | What it feeds |
|---|---|
| NASA NeoWS | Near-Earth object count, velocity, distance, hazard count |
| NASA DONKI | Geomagnetic storm (Kp index), solar wind speed/density/temp |
| NASA EONET | Active natural events on Earth |
| NASA Exoplanet Archive | Confirmed exoplanet count and stats |
| NASA APOD | Astronomy Picture of the Day |
| Open Notify | Real-time ISS position |
| NOAA SWPC | Solar X-ray flux / flare intensity |
| Open-Meteo | Reference Earth weather (Washington, D.C.) |
| data.nasa.gov | Satellite TLE (orbital element) data |

## Tech stack

- **React 19** + **Vite**
- **Three.js** via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
- **Web Audio API** (custom oscillator-based sonification engine) + `tone`
- **Framer Motion** for UI animation
- **Axios** for API calls
- **Capacitor** (Android) — included as a dependency for packaging the app natively
- PWA-ready: includes a web app manifest and service worker

## Getting started

### Prerequisites

- Node.js 18+
- A free [NASA API key](https://api.nasa.gov/) (takes 30 seconds to grab)

### Installation

```bash
git clone https://github.com/Arjun941/coeismic.git
cd coeismic
npm install
```

### Environment variables

Make a `.env` file in the project root:

```bash
VITE_NASA_API_KEY=your_nasa_api_key_here
```

> ⚠️ **Quick heads up:** there's currently a `.env` file committed to the repo with a real NASA API key in it, and `.env` isn't in `.gitignore`. Now that the repo's public, that key's out in the open. Worth regenerating it on [api.nasa.gov](https://api.nasa.gov/) and tossing `.env` into `.gitignore` so it doesn't happen again.

### Run it

```bash
npm run dev
```

### Other scripts

```bash
npm run build      # Production build
npm run preview     # Preview the production build locally
npm run lint          # Lint the codebase
```

## Project structure

```
src/
├── audio/
│   └── AudioEngine.js       # Web Audio oscillator bank / sonification logic
├── components/
│   ├── Visualizer.jsx        # Three.js scene (particles, satellites, post-processing)
│   ├── HUD.jsx                # Telemetry heads-up display
│   ├── Graph.jsx               # Historical sparkline graphs
│   └── AudioSpectrum.jsx        # Audio spectrum visualization
├── services/
│   └── nasaApi.js              # All external API calls (NASA + NOAA + Open-Meteo, etc.)
├── App.jsx                      # Telemetry polling, state, and orchestration
└── main.jsx                      # Entry point

public/
├── manifest.json                 # PWA manifest
└── sw.js                          # Service worker
```

## License

No license specified yet — so technically all rights reserved by default. Add one (MIT is the easy default) if you want others to freely use/fork this.
