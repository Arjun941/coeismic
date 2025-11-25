import React, { useEffect, useRef } from 'react';
import AudioEngine from '../audio/AudioEngine';

export default function AudioSpectrum() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        const render = () => {
            // Resize canvas to parent
            if (canvas.width !== canvas.parentElement.clientWidth) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }

            const data = AudioEngine.getAudioData();
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Grid
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < width; i += 20) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
            for (let i = 0; i < height; i += 20) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
            ctx.stroke();

            if (data.length === 0) {
                animationId = requestAnimationFrame(render);
                return;
            }

            // Draw Spectrum Line
            ctx.beginPath();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;

            const sliceWidth = width / data.length;
            let x = 0;

            for (let i = 0; i < data.length; i++) {
                const v = data[i] / 255.0;
                const y = height - (v * height);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += sliceWidth;
            }

            ctx.stroke();

            // Draw Fill
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
            ctx.fill();

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'rgba(0, 10, 20, 0.5)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 2,
                left: 5,
                fontSize: '10px',
                color: '#00f0ff',
                fontFamily: 'monospace'
            }}>AUDIO SPECTRAL ANALYSIS</div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
