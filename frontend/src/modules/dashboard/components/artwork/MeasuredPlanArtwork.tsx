import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoomDetail {
  id: string;
  name: string;
  dim: string;
  sqft: string;
  notes: string;
}

const ROOMS: Record<string, RoomDetail> = {
  living: {
    id: 'living',
    name: 'Living & Dining Room',
    dim: "18' 0\" × 15' 0\"",
    sqft: '270 sq ft',
    notes: 'East morning light, 10\' ceiling height, direct garden connection'
  },
  master: {
    id: 'master',
    name: 'Master Bedroom Suite',
    dim: "14' 6\" × 12' 6\"",
    sqft: '181 sq ft',
    notes: 'South-west quadrant, acoustic partition wall, ensuite access'
  },
  kitchen: {
    id: 'kitchen',
    name: 'Kitchen & Pantry',
    dim: "11' 0\" × 10' 6\"",
    sqft: '115 sq ft',
    notes: 'South-east Agni zone, natural cross ventilation shaft'
  },
  bath: {
    id: 'bath',
    name: 'Ensuite Bathroom',
    dim: "7' 0\" × 8' 6\"",
    sqft: '59 sq ft',
    notes: 'Waterproof membrane, vertical plumbing duct alignment'
  },
  stair: {
    id: 'stair',
    name: 'Vertical Circulation Core',
    dim: "8' 0\" × 11' 6\"",
    sqft: '92 sq ft',
    notes: '18 risers @ 6.5", continuous vertical structural stacking'
  }
};

export default function MeasuredPlanArtwork({ isAnimated = true }: { isAnimated?: boolean }) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/11',
      background: 'var(--paper-sheet)',
      borderRadius: '8px',
      border: '1px solid var(--paper-border)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      position: 'relative',
      padding: '1.25rem',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* CAD Sheet Title Block Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--paper-border)',
        paddingBottom: '0.65rem',
        marginBottom: '0.75rem',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--ink-primary)' }}>
            Plate 02 — Measured Architectural Plan
          </span>
          <span style={{ background: 'rgba(37,38,34,0.06)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-secondary)' }}>
            1:50 METRIC / IMPERIAL
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-annotation)' }}>
          DWG NO. AR-101 // LEVEL 00 (GROUND)
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 35px)' }}>
        <svg
          viewBox="0 0 640 440"
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        >
          <defs>
            {/* Fine architectural millimeter drafting grid */}
            <pattern id="measuredGrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(37, 38, 34, 0.04)" strokeWidth="0.5" />
            </pattern>
            {/* Architectural dimension slash tick */}
            <marker id="archTick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
              <line x1="2" y1="8" x2="8" y2="2" stroke="#252622" strokeWidth="1.5" />
            </marker>
          </defs>

          {/* Drafting Paper Background */}
          <rect width="640" height="440" fill="url(#measuredGrid)" />

          {/* 1. Property Setback Boundary (Dashed hairline) */}
          <rect x="35" y="35" width="570" height="370" fill="none" stroke="#A1A399" strokeWidth="0.8" strokeDasharray="6 3" />
          <text x="45" y="50" fill="#A1A399" fontSize="9" fontFamily="var(--font-mono)">PROPERTY BOUNDARY // 30'-0" × 40'-0"</text>

          {/* 2. Interactive Room Wash Fills */}
          <g id="room-washes">
            {/* Living Room */}
            <rect
              x="75" y="65" width="280" height="195"
              fill={hoveredRoom === 'living' ? "rgba(54, 95, 168, 0.08)" : "rgba(37, 38, 34, 0.015)"}
              style={{ transition: 'fill 0.25s' }}
              onMouseEnter={() => setHoveredRoom('living')}
              onMouseLeave={() => setHoveredRoom(null)}
            />
            {/* Master Suite */}
            <rect
              x="355" y="65" width="210" height="175"
              fill={hoveredRoom === 'master' ? "rgba(216, 87, 64, 0.08)" : "rgba(37, 38, 34, 0.015)"}
              style={{ transition: 'fill 0.25s' }}
              onMouseEnter={() => setHoveredRoom('master')}
              onMouseLeave={() => setHoveredRoom(null)}
            />
            {/* Kitchen */}
            <rect
              x="355" y="240" width="210" height="160"
              fill={hoveredRoom === 'kitchen' ? "rgba(184, 154, 100, 0.12)" : "rgba(37, 38, 34, 0.015)"}
              style={{ transition: 'fill 0.25s' }}
              onMouseEnter={() => setHoveredRoom('kitchen')}
              onMouseLeave={() => setHoveredRoom(null)}
            />
            {/* Bathroom */}
            <rect
              x="75" y="260" width="130" height="140"
              fill={hoveredRoom === 'bath' ? "rgba(161, 174, 151, 0.15)" : "rgba(37, 38, 34, 0.015)"}
              style={{ transition: 'fill 0.25s' }}
              onMouseEnter={() => setHoveredRoom('bath')}
              onMouseLeave={() => setHoveredRoom(null)}
            />
            {/* Staircase */}
            <rect
              x="205" y="260" width="150" height="140"
              fill={hoveredRoom === 'stair' ? "rgba(37, 38, 34, 0.06)" : "rgba(37, 38, 34, 0.02)"}
              style={{ transition: 'fill 0.25s' }}
              onMouseEnter={() => setHoveredRoom('stair')}
              onMouseLeave={() => setHoveredRoom(null)}
            />
          </g>

          {/* 3. Structural Exterior Walls (9" Double Wall, Solid Dark Ink) */}
          <g id="structural-exterior-walls" stroke="#252622" strokeLinecap="square">
            <motion.path
              d="M 75 65 L 565 65 L 565 400 L 75 400 Z"
              fill="none"
              strokeWidth="4"
              initial={isAnimated ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <path d="M 81 71 L 559 71 L 559 394 L 81 394 Z" fill="none" stroke="#252622" strokeWidth="1" />
          </g>

          {/* 4. Interior Partition Walls (4.5" Single Line, Medium Weight) */}
          <g id="interior-partitions" stroke="#252622" strokeWidth="2.5" strokeLinecap="square">
            <line x1="355" y1="65" x2="355" y2="400" />
            <line x1="75" y1="260" x2="355" y2="260" />
            <line x1="355" y1="240" x2="565" y2="240" />
            <line x1="205" y1="260" x2="205" y2="400" />
          </g>

          {/* 5. Staircase Treads & Arrow */}
          <g id="staircase-core">
            {[...Array(9)].map((_, i) => (
              <line
                key={i}
                x1="213" y1={274 + i * 13}
                x2="347" y2={274 + i * 13}
                stroke="#777970"
                strokeWidth="1"
                strokeDasharray={i > 5 ? "3 2" : "none"}
              />
            ))}
            <line x1="280" y1="375" x2="280" y2="290" stroke="#D85740" strokeWidth="1.2" />
            <path d="M 276 295 L 280 286 L 284 295" fill="none" stroke="#D85740" strokeWidth="1.2" />
            <text x="288" y="335" fill="#D85740" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">UP</text>
          </g>

          {/* 6. Door Swings (90° Arc, Fine Line) */}
          <g id="door-swings" stroke="#777970" strokeWidth="1.2">
            {/* Main Entrance Door */}
            <path d="M 75 170 A 35 35 0 0 1 110 205" fill="none" strokeDasharray="3 2" />
            <line x1="75" y1="170" x2="75" y2="205" stroke="#252622" strokeWidth="2.5" />
            <text x="56" y="190" fill="#252622" fontSize="8" fontFamily="var(--font-mono)">ENTRY</text>

            {/* Master Suite Door */}
            <path d="M 355 175 A 30 30 0 0 1 385 145" fill="none" strokeDasharray="3 2" />
            <line x1="355" y1="175" x2="385" y2="175" stroke="#252622" strokeWidth="2.2" />

            {/* Kitchen Door */}
            <path d="M 355 285 A 30 30 0 0 1 385 315" fill="none" strokeDasharray="3 2" />
            <line x1="355" y1="285" x2="385" y2="285" stroke="#252622" strokeWidth="2.2" />
          </g>

          {/* 7. Window Symbols (Triple Lines) */}
          <g id="window-glazing" stroke="#252622" strokeWidth="1.2" fill="var(--paper-sheet)">
            {/* Living Window North */}
            <rect x="150" y="61" width="80" height="8" />
            <line x1="150" y1="65" x2="230" y2="65" stroke="#777970" strokeWidth="1" />

            {/* Master Window East */}
            <rect x="561" y="110" width="8" height="60" />
            <line x1="565" y1="110" x2="565" y2="170" stroke="#777970" strokeWidth="1" />

            {/* Kitchen Window South */}
            <rect x="420" y="396" width="70" height="8" />
            <line x1="420" y1="400" x2="490" y2="400" stroke="#777970" strokeWidth="1" />
          </g>

          {/* 8. Room Labels & Dimensions */}
          <g id="room-labels" textAnchor="middle">
            {/* Living */}
            <text x="215" y="145" fill="#252622" fontSize="12" fontWeight="700">LIVING & DINING</text>
            <text x="215" y="162" fill="#777970" fontSize="10" fontFamily="var(--font-mono)">18' 0" × 15' 0"</text>
            <text x="215" y="177" fill="#437A5D" fontSize="9" fontFamily="var(--font-mono)">270 SQ FT</text>

            {/* Master Suite */}
            <text x="460" y="140" fill="#252622" fontSize="11" fontWeight="700">MASTER SUITE</text>
            <text x="460" y="157" fill="#777970" fontSize="10" fontFamily="var(--font-mono)">14' 6" × 12' 6"</text>
            <text x="460" y="172" fill="#D85740" fontSize="9" fontFamily="var(--font-mono)">181 SQ FT</text>

            {/* Kitchen */}
            <text x="460" y="315" fill="#252622" fontSize="11" fontWeight="700">KITCHEN</text>
            <text x="460" y="332" fill="#777970" fontSize="10" fontFamily="var(--font-mono)">11' 0" × 10' 6"</text>

            {/* Bath */}
            <text x="140" y="325" fill="#252622" fontSize="10" fontWeight="700">BATH</text>
            <text x="140" y="340" fill="#777970" fontSize="9" fontFamily="var(--font-mono)">7' 0" × 8' 6"</text>
          </g>

          {/* 9. Architectural Dimension Strings (With Ticks & Distance Text) */}
          <g id="dimension-strings" stroke="#777970" strokeWidth="0.8">
            {/* Overall Top Width: 40' - 0" */}
            <line x1="75" y1="46" x2="565" y2="46" />
            <line x1="71" y1="50" x2="79" y2="42" stroke="#252622" strokeWidth="1.5" />
            <line x1="561" y1="50" x2="569" y2="42" stroke="#252622" strokeWidth="1.5" />
            <rect x="290" y="38" width="60" height="15" fill="var(--paper-sheet)" rx="2" stroke="none" />
            <text x="320" y="49" textAnchor="middle" fill="#252622" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">40' - 0"</text>

            {/* Overall Left Length: 30' - 0" */}
            <line x1="50" y1="65" x2="50" y2="400" />
            <line x1="46" y1="69" x2="54" y2="61" stroke="#252622" strokeWidth="1.5" />
            <line x1="46" y1="404" x2="54" y2="396" stroke="#252622" strokeWidth="1.5" />
            <rect x="28" y="225" width="44" height="15" fill="var(--paper-sheet)" rx="2" stroke="none" />
            <text x="50" y="236" textAnchor="middle" fill="#252622" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">30' - 0"</text>
          </g>

          {/* 10. North Arrow & Graphic Scale Bar */}
          <g id="north-arrow" transform="translate(585, 95)">
            <circle cx="0" cy="0" r="14" fill="none" stroke="#252622" strokeWidth="1" />
            <path d="M 0 -13 L 4 2 L 0 -2 L -4 2 Z" fill="#252622" />
            <text x="0" y="24" textAnchor="middle" fill="#252622" fontSize="10" fontFamily="var(--font-serif)" fontWeight="700">N</text>
          </g>

          {/* Scale Bar */}
          <g id="scale-bar" transform="translate(75, 422)">
            <rect x="0" y="0" width="40" height="3" fill="#252622" />
            <rect x="40" y="0" width="40" height="3" fill="#A1A399" />
            <rect x="80" y="0" width="80" height="3" fill="#252622" />
            <text x="0" y="12" fill="#777970" fontSize="8" fontFamily="var(--font-mono)">0</text>
            <text x="40" y="12" fill="#777970" fontSize="8" fontFamily="var(--font-mono)">5'</text>
            <text x="80" y="12" fill="#777970" fontSize="8" fontFamily="var(--font-mono)">10'</text>
            <text x="160" y="12" fill="#777970" fontSize="8" fontFamily="var(--font-mono)">20 FT</text>
          </g>
        </svg>

        {/* Live Hover Room Inspector Card */}
        <AnimatePresence>
          {hoveredRoom && ROOMS[hoveredRoom] && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'var(--paper-crisp)',
                border: '1px solid var(--paper-border)',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-elevated)',
                minWidth: '220px',
                zIndex: 20,
                pointerEvents: 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                  {ROOMS[hoveredRoom].name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-vermilion)', fontWeight: 600 }}>
                  {ROOMS[hoveredRoom].sqft}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-annotation)', marginBottom: '4px' }}>
                Dimensions: {ROOMS[hoveredRoom].dim}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', borderTop: '1px solid var(--paper-border-soft)', paddingTop: '4px' }}>
                {ROOMS[hoveredRoom].notes}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
