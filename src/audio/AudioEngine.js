class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.isPlaying = false;

        // Nodes
        this.analyser = null;

        // Oscillator Bank
        this.oscs = {
            bass: null,   // NEO Count
            tenor: null,  // NEO Velocity
            alto: null,   // Solar Wind
            soprano: null,// Exo Count
            atmo: null,   // Storm KP
            pulse: null   // Hazardous
        };

        this.gains = {
            bass: null,
            tenor: null,
            alto: null,
            soprano: null,
            atmo: null,
            pulse: null
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            console.error("Web Audio API not supported");
            return;
        }

        this.ctx = new Ctx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4; // Master Volume

        // Analyser Setup
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048; // Higher res for telemetric view
        this.analyser.smoothingTimeConstant = 0.8;
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // Initialize Gains
        Object.keys(this.gains).forEach(key => {
            this.gains[key] = this.ctx.createGain();
            this.gains[key].gain.value = 0; // Start silent
            this.gains[key].connect(this.masterGain);
        });

        this.isInitialized = true;
        console.log("Audio Engine: Direct Data Sonification Mode");
    }

    async resume() {
        if (!this.ctx) await this.initialize();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        return this.ctx.state;
    }

    get state() {
        return this.ctx ? this.ctx.state : 'suspended';
    }

    start() {
        if (!this.isInitialized) return;
        this.isPlaying = true;

        // Create and Start Oscillators
        this.createOsc('bass', 'triangle', 65.41);
        this.createOsc('tenor', 'sawtooth', 130.81);
        this.createOsc('alto', 'sine', 196.00);
        this.createOsc('soprano', 'sine', 261.63);
        this.createOsc('atmo', 'triangle', 50); // Low rumble
        this.createOsc('pulse', 'square', 440);
    }

    createOsc(name, type, freq) {
        if (this.oscs[name]) this.oscs[name].stop();

        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(this.gains[name]);
        osc.start();
        this.oscs[name] = osc;
    }

    stop() {
        this.isPlaying = false;
        Object.values(this.oscs).forEach(osc => {
            if (osc) {
                try { osc.stop(); } catch (e) { }
            }
        });

        // Silence gains
        Object.values(this.gains).forEach(gain => {
            if (gain) gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        });
    }

    // --- DIRECT DATA MAPPING ---
    updateTelemetry(data) {
        if (!this.isInitialized || !this.isPlaying) return;
        const t = this.ctx.currentTime;
        const ramp = 0.1; // Smooth transitions

        // Helper: Quantize frequency to C Minor Pentatonic Scale
        // C, Eb, F, G, Bb
        const quantize = (val, minFreq, maxFreq) => {
            const scale = [0, 3, 5, 7, 10]; // Semitones
            // Map 0-1 input to a note range
            const noteIndex = Math.floor(val * 24); // 2 octaves range
            const octave = Math.floor(noteIndex / 5);
            const semitone = scale[noteIndex % 5];
            const midiNote = 36 + (octave * 12) + semitone; // Base C2 (36)
            return 440 * Math.pow(2, (midiNote - 69) / 12);
        };

        // 1. BASS (NEO Count) -> Fundamental
        // More asteroids = Deeper, louder bass
        const bassFreq = quantize(Math.min(1, data.neo_count / 20), 40, 100);
        this.oscs.bass.frequency.setTargetAtTime(bassFreq, t, ramp);
        this.gains.bass.gain.setTargetAtTime(0.3, t, ramp);

        // 2. TENOR (Velocity) -> Rhythmic Pulse
        // Higher velocity = Higher pitch
        const tenorFreq = quantize(data.neo_velocity, 100, 300);
        this.oscs.tenor.frequency.setTargetAtTime(tenorFreq, t, ramp);
        this.gains.tenor.gain.setTargetAtTime(0.15, t, ramp);

        // 3. ALTO (Solar Wind) -> Ethereal Pad
        // Wind speed modulates frequency slowly
        const altoFreq = quantize(data.solar_wind_speed / 800, 200, 500);
        this.oscs.alto.frequency.setTargetAtTime(altoFreq, t, 0.5); // Slower ramp
        this.gains.alto.gain.setTargetAtTime(0.1, t, ramp);

        // 4. SOPRANO (Exo Count) -> High Melody
        const sopranoFreq = quantize((data.exo_count % 100) / 100, 400, 800);
        this.oscs.soprano.frequency.setTargetAtTime(sopranoFreq, t, ramp);
        this.gains.soprano.gain.setTargetAtTime(0.08, t, ramp);

        // 5. ATMO (Storm KP) -> Rumble / Noise
        // High KP = Louder rumble + Frequency modulation
        const atmoFreq = 50 + (data.storm_kp * 10);
        this.oscs.atmo.frequency.setTargetAtTime(atmoFreq, t, ramp);
        const atmoVol = data.storm_kp > 4 ? 0.2 : 0.05;
        this.gains.atmo.gain.setTargetAtTime(atmoVol, t, ramp);

        // 6. PULSE (Hazardous) -> Warning Beep
        if (data.neo_hazardous > 0) {
            // Intermittent beeping logic could go here, but for now continuous tone
            this.oscs.pulse.frequency.setTargetAtTime(880, t, 0.01);
            // Modulate volume with LFO-like behavior using time
            const pulseVol = (Math.sin(t * 10) + 1) * 0.05;
            this.gains.pulse.gain.setTargetAtTime(pulseVol, t, 0.05);
        } else {
            this.gains.pulse.gain.setTargetAtTime(0, t, ramp);
        }
    }

    triggerMelodyNote() { } // Deprecated
    emergencyBeep() { } // Deprecated

    getAudioData() {
        if (!this.analyser) return new Uint8Array(0);
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }
}

export default new AudioEngine();
