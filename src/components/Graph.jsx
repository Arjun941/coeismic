import React, { useMemo } from 'react';

export default function Graph({ data = [], color = '#00f0ff', label = 'DATA', min = 0, max = 100 }) {
    const width = 200;
    const height = 60;
    const padding = 5;

    const points = useMemo(() => {
        if (!data.length) return '';
        const step = (width - padding * 2) / (data.length - 1);
        return data.map((val, i) => {
            const x = padding + i * step;
            // Normalize value to 0-1 range, then map to height
            const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
            const y = height - padding - (normalized * (height - padding * 2));
            return `${x},${y}`;
        }).join(' ');
    }, [data, min, max]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(0, 20, 40, 0.5)',
            border: `1px solid ${color}`,
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '10px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px',
                fontSize: '10px',
                color: color,
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '1px'
            }}>
                <span>{label}</span>
                <span>{data.length > 0 ? data[data.length - 1].toFixed(2) : '0.00'}</span>
            </div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeOpacity="0.1" />
                <line x1="0" y1={height} x2={width} y2={height} stroke={color} strokeOpacity="0.1" />

                {/* Data Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Fill Area (Optional, using polygon would be needed for fill) */}
            </svg>
        </div>
    );
}
