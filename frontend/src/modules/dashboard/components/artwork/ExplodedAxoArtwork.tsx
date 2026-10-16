import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ExplodedAxoArtwork({ isAnimated = true }: { isAnimated?: boolean }) {
  const [activeFloor, setActiveFloor] = useState<number | null>(null);

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/12',
      background: 'var(--paper-sheet)',
      borderRadius: '8px',
      border: '1px solid var(--paper-border)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      position: 'relative',
      padding: '1.25rem',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderBottom: '1px solid var(--paper-border)',
        paddingBottom: '0.65rem',
        marginBottom: '0.75rem',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--ink-primary)' }}>
            Plate 03 — Multi-Floor Exploded Axonometric
          </span>
          <span style={{ background: 'rgba(54,95,168,0.08)', color: 'var(--accent-cobalt)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600 }}>
            3-TIER MASSING STACK
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-annotation)' }}>
          VERTICAL STAIRCASE ALIGNMENT AUDIT
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 35px)' }}>
        <svg
          viewBox="0 0 640 480"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Fine isometric grid */}
            <pattern id="axoGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(37,38,34,0.025)" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect width="640" height="480" fill="url(#axoGrid)" />

          {/* Vertical Circulation Alignment Core (Dashed Guide Rods Through All Levels) */}
          <g id="staircase-vertical-alignment" stroke="#D85740" strokeWidth="1" strokeDasharray="4 3" opacity="0.75">
            <line x1="380" y1="90" x2="380" y2="400" />
            <line x1="460" y1="135" x2="460" y2="445" />
            <line x1="380" y1="130" x2="380" y2="440" />
          </g>

          {/* =========================================================================
              TIER 3: ROOF TERRACE & SOLAR PERGOLA (Top Level, Y offset ~ 50px)
              ========================================================================= */}
          <g
            id="tier-3-roof"
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={() => setActiveFloor(2)}
            onMouseLeave={() => setActiveFloor(null)}
          >
            {/* Floor Slab Plate (Isometric Rhombus) */}
            <motion.path
              d="M 320 50 L 520 150 L 320 230 L 120 130 Z"
              fill={activeFloor === 2 ? "rgba(184, 154, 100, 0.12)" : "rgba(250, 248, 242, 0.95)"}
              stroke="#252622"
              strokeWidth="2"
              initial={isAnimated ? { opacity: 0, y: -20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            />
            {/* Slab Thickness */}
            <path d="M 120 130 L 120 138 L 320 238 L 520 158 L 520 150 L 320 230 Z" fill="#E7E1D5" stroke="#252622" strokeWidth="1" />

            {/* Parapet Walls & Pergola Trellis */}
            <g stroke="#474943" strokeWidth="1.2">
              {/* Solar Pergola Louvers */}
              {[...Array(6)].map((_, i) => (
                <line key={i} x1={200 + i * 20} y1={110 + i * 10} x2={260 + i * 20} y2={80 + i * 10} />
              ))}
              {/* Planter Cutout */}
              <polygon points="260,165 310,190 280,202 230,177" fill="rgba(161, 174, 151, 0.25)" stroke="#437A5D" strokeWidth="1.2" />
            </g>

            {/* Staircase Headroom Doghouse */}
            <polygon points="380,95 440,125 440,160 380,130" fill="rgba(37,38,34,0.08)" stroke="#252622" strokeWidth="1.5" />
            <polygon points="380,95 440,125 410,140 350,110" fill="rgba(37,38,34,0.04)" stroke="#252622" strokeWidth="1.2" />

            {/* Tier 3 Annotation */}
            <text x="535" y="145" fill="#252622" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">L02 — ROOF TERRACE</text>
            <text x="535" y="160" fill="#777970" fontSize="9" fontFamily="var(--font-mono)">EL. +20'-0" // PERGOLA & SOLAR</text>
          </g>

          {/* =========================================================================
              TIER 2: FIRST FLOOR / SLEEPING ZONE (Middle Level, Y offset ~ 160px)
              ========================================================================= */}
          <g
            id="tier-2-first-floor"
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={() => setActiveFloor(1)}
            onMouseLeave={() => setActiveFloor(null)}
          >
            {/* Floor Slab Plate */}
            <motion.path
              d="M 320 160 L 520 260 L 320 340 L 120 240 Z"
              fill={activeFloor === 1 ? "rgba(216, 87, 64, 0.08)" : "rgba(250, 248, 242, 0.95)"}
              stroke="#252622"
              strokeWidth="2"
              initial={isAnimated ? { opacity: 0, y: -20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            {/* Slab Thickness */}
            <path d="M 120 240 L 120 248 L 320 348 L 520 268 L 520 260 L 320 340 Z" fill="#E7E1D5" stroke="#252622" strokeWidth="1" />

            {/* Axonometric Extruded Walls */}
            {/* Master Suite Enclosure */}
            <polygon points="350,210 490,280 490,245 350,175" fill="rgba(37,38,34,0.06)" stroke="#252622" strokeWidth="1.5" />
            {/* Bedroom Partition */}
            <line x1="350" y1="210" x2="350" y2="285" stroke="#252622" strokeWidth="1.5" />

            {/* Duplex Void Cutout (Cross-hatched) */}
            <g>
              <polygon points="170,250 270,300 240,312 140,262" fill="rgba(54,95,168,0.06)" stroke="#365FA8" strokeWidth="1" strokeDasharray="3 2" />
              <line x1="170" y1="250" x2="240" y2="312" stroke="#365FA8" strokeWidth="0.75" />
              <line x1="270" y1="300" x2="140" y2="262" stroke="#365FA8" strokeWidth="0.75" />
              <text x="180" y="278" fill="#365FA8" fontSize="8" fontFamily="var(--font-mono)">DUPLEX VOID</text>
            </g>

            {/* Staircase Landing Cutout */}
            <polygon points="380,240 440,270 420,280 360,250" fill="rgba(216,87,64,0.1)" stroke="#D85740" strokeWidth="1.2" />

            {/* Tier 2 Annotation */}
            <text x="535" y="265" fill="#252622" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">L01 — FIRST FLOOR</text>
            <text x="535" y="280" fill="#777970" fontSize="9" fontFamily="var(--font-mono)">EL. +10'-0" // 3 SUITES + VOID</text>
          </g>

          {/* =========================================================================
              TIER 1: GROUND FLOOR / ACTIVE LIVING PLATE (Bottom Level, Y offset ~ 270px)
              ========================================================================= */}
          <g
            id="tier-1-ground-floor"
            style={{ cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={() => setActiveFloor(0)}
            onMouseLeave={() => setActiveFloor(null)}
          >
            {/* Foundation Ground Slab Plate */}
            <motion.path
              d="M 320 270 L 520 370 L 320 450 L 120 350 Z"
              fill={activeFloor === 0 ? "rgba(54, 95, 168, 0.08)" : "rgba(250, 248, 242, 0.95)"}
              stroke="#252622"
              strokeWidth="2.2"
              initial={isAnimated ? { opacity: 0, y: -20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            {/* Foundation Plinth Depth */}
            <path d="M 120 350 L 120 365 L 320 465 L 520 385 L 520 370 L 320 450 Z" fill="#D8D3C5" stroke="#252622" strokeWidth="1.2" />

            {/* Ground Floor Partitions & Living Room */}
            <line x1="260" y1="340" x2="260" y2="420" stroke="#252622" strokeWidth="1.8" />
            <line x1="260" y1="340" x2="420" y2="420" stroke="#252622" strokeWidth="1.8" />
            <polygon points="380,350 440,380 440,415 380,385" fill="rgba(216,87,64,0.12)" stroke="#D85740" strokeWidth="1.5" />
            <text x="395" y="385" fill="#D85740" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">STAIR UP</text>

            {/* Entrance Veranda Step */}
            <polygon points="120,350 160,370 140,380 100,360" fill="none" stroke="#252622" strokeWidth="1.2" />

            {/* Tier 1 Annotation */}
            <text x="535" y="380" fill="#252622" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">L00 — GROUND PLATE</text>
            <text x="535" y="395" fill="#777970" fontSize="9" fontFamily="var(--font-mono)">EL. ±0'-0" // LIVING, DINING, KITCHEN</text>
          </g>

          {/* Technical Axis Stamp */}
          <g transform="translate(60, 430)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#252622" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="0" y2="-30" stroke="#252622" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="-18" y2="12" stroke="#252622" strokeWidth="1.5" />
            <text x="35" y="4" fill="#252622" fontSize="9" fontFamily="var(--font-mono)">X</text>
            <text x="-4" y="-35" fill="#252622" fontSize="9" fontFamily="var(--font-mono)">Z (+HEIGHT)</text>
            <text x="-28" y="20" fill="#252622" fontSize="9" fontFamily="var(--font-mono)">Y</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
