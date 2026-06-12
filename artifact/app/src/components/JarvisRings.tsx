interface Props {
  size?: number;
  intensity?: number; // 0–1 controls brightness/opacity
  className?: string;
  style?: React.CSSProperties;
}

export function JarvisRings({ size = 200, intensity = 1, className, style }: Props) {
  const r = size / 2;
  const a = intensity; // alias

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <defs>
        {/* Soft glow */}
        <filter id={`jg-${size}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Strong glow for core */}
        <filter id={`jgs-${size}`} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="1 0.8 0 0 0.1  0.8 0.6 0 0 0.05  0 0 0 0 0  0 0 0 1.2 0" result="colored" />
          <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Core gradient */}
        <radialGradient id={`jcg-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef9c3" stopOpacity={a} />
          <stop offset="35%" stopColor="#f59e0b" stopOpacity={a * 0.95} />
          <stop offset="70%" stopColor="#d97706" stopOpacity={a * 0.5} />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
        </radialGradient>
        {/* Outer haze */}
        <radialGradient id={`jhz-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor={`rgba(234,179,8,${a * 0.06})`} />
        </radialGradient>
      </defs>

      {/* Ambient outer haze */}
      <circle cx={r} cy={r} r={r * 1.1}
        fill={`url(#jhz-${size})`}
        style={{ animation: "jCore 3s ease-in-out infinite" }}
      />

      {/* ── Outer sphere ring (upright circle) ── */}
      <circle cx={r} cy={r} r={r * 0.88}
        fill="none"
        stroke={`rgba(234,179,8,${a * 0.45})`}
        strokeWidth={0.7}
        filter={`url(#jg-${size})`}
        style={{
          animation: "jRing1 14s linear infinite",
          transformOrigin: `${r}px ${r}px`,
        }}
      />

      {/* ── Equatorial ring (flat ellipse) ── */}
      <ellipse cx={r} cy={r} rx={r * 0.87} ry={r * 0.21}
        fill="none"
        stroke={`rgba(234,179,8,${a * 0.7})`}
        strokeWidth={0.8}
        filter={`url(#jg-${size})`}
        style={{
          animation: "jRing2 9s linear infinite reverse",
          transformOrigin: `${r}px ${r}px`,
        }}
      />

      {/* ── Diagonal ring 1 ── */}
      <ellipse cx={r} cy={r} rx={r * 0.82} ry={r * 0.34}
        fill="none"
        stroke={`rgba(234,179,8,${a * 0.55})`}
        strokeWidth={0.6}
        filter={`url(#jg-${size})`}
        style={{
          transform: `rotate(38deg)`,
          transformOrigin: `${r}px ${r}px`,
          animation: "jRing3 11s linear infinite",
        }}
      />

      {/* ── Diagonal ring 2 (mirrored) ── */}
      <ellipse cx={r} cy={r} rx={r * 0.82} ry={r * 0.34}
        fill="none"
        stroke={`rgba(234,179,8,${a * 0.45})`}
        strokeWidth={0.5}
        filter={`url(#jg-${size})`}
        style={{
          transform: `rotate(-38deg)`,
          transformOrigin: `${r}px ${r}px`,
          animation: "jRing4 13s linear infinite reverse",
        }}
      />

      {/* ── Inner sphere ring (dashed) ── */}
      <circle cx={r} cy={r} r={r * 0.52}
        fill="none"
        stroke={`rgba(234,179,8,${a * 0.5})`}
        strokeWidth={0.6}
        strokeDasharray="5 3"
        filter={`url(#jg-${size})`}
        style={{
          animation: "jRing2 7s linear infinite",
          transformOrigin: `${r}px ${r}px`,
        }}
      />

      {/* ── Inner equatorial ring ── */}
      <ellipse cx={r} cy={r} rx={r * 0.51} ry={r * 0.13}
        fill="none"
        stroke={`rgba(234,179,8,${a * 0.6})`}
        strokeWidth={0.7}
        filter={`url(#jg-${size})`}
        style={{
          animation: "jRing1 6s linear infinite reverse",
          transformOrigin: `${r}px ${r}px`,
        }}
      />

      {/* ── Radial spokes & nodes ── */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const ox = r + Math.cos(rad) * r * 0.88;
        const oy = r + Math.sin(rad) * r * 0.88;
        const mx = r + Math.cos(rad) * r * 0.52;
        const my = r + Math.sin(rad) * r * 0.52;
        const delay = `${i * 0.38}s`;
        return (
          <g key={deg}>
            <line x1={r} y1={r} x2={ox} y2={oy}
              stroke={`rgba(234,179,8,${a * 0.22})`}
              strokeWidth={0.4}
              style={{ animation: `jSpoke 3.5s ease-in-out ${delay} infinite` }}
            />
            {/* Mid node */}
            <circle cx={mx} cy={my} r={1.8}
              fill={`rgba(234,179,8,${a * 0.9})`}
              filter={`url(#jg-${size})`}
              style={{ animation: `jNode 2.2s ease-in-out ${delay} infinite` }}
            />
            {/* Outer node */}
            <circle cx={ox} cy={oy} r={1.2}
              fill={`rgba(234,179,8,${a * 0.55})`}
              filter={`url(#jg-${size})`}
              style={{ animation: `jNode 2.8s ease-in-out ${`${i * 0.22}s`} infinite` }}
            />
          </g>
        );
      })}

      {/* ── Energy filaments (organic crackle) ── */}
      {[
        `M${r},${r * 0.11} Q${r * 1.25},${r * 0.38} ${r * 1.88},${r}`,
        `M${r * 0.11},${r} Q${r * 0.42},${r * 1.28} ${r},${r * 1.88}`,
        `M${r},${r * 0.11} Q${r * 0.72},${r * 0.35} ${r * 0.12},${r}`,
        `M${r * 1.88},${r} Q${r * 1.6},${r * 1.28} ${r},${r * 1.88}`,
        `M${r * 0.35},${r * 0.25} Q${r * 0.6},${r * 0.55} ${r * 0.12},${r * 0.85}`,
        `M${r * 1.65},${r * 0.25} Q${r * 1.42},${r * 0.55} ${r * 1.88},${r * 0.85}`,
      ].map((d, i) => (
        <path key={i} d={d}
          fill="none"
          stroke={`rgba(234,179,8,${a * 0.28})`}
          strokeWidth={0.45}
          strokeDasharray="3 2"
          filter={`url(#jg-${size})`}
          style={{ animation: `jFilament ${3.5 + i * 0.7}s ease-in-out ${i * 0.55}s infinite` }}
        />
      ))}

      {/* ── Energy pulse rings (expand + fade) ── */}
      {[0, 1.8, 3.6].map((delay, i) => (
        <circle key={i} cx={r} cy={r} r={r * 0.2}
          fill="none"
          stroke={`rgba(234,179,8,${a * 0.5})`}
          strokeWidth={0.8}
          style={{
            animation: `jRingExpand 5.4s ease-out ${delay}s infinite`,
            transformOrigin: `${r}px ${r}px`,
          }}
        />
      ))}

      {/* ── Central glow orb ── */}
      <circle cx={r} cy={r} r={r * 0.16}
        fill={`url(#jcg-${size})`}
        filter={`url(#jgs-${size})`}
        style={{ animation: "jCore 2s ease-in-out infinite" }}
      />

      {/* ── Core pinpoint ── */}
      <circle cx={r} cy={r} r={r * 0.055}
        fill={`rgba(255,251,235,${a})`}
        filter={`url(#jgs-${size})`}
      />
    </svg>
  );
}
