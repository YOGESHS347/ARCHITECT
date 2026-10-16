import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Layers, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

interface RoomHoverInfo {
  name: string;
  dimensions: string;
  area: string;
  vastu: string;
  sunlight: string;
}

const ROOM_DATA: Record<string, RoomHoverInfo> = {
  living: {
    name: 'Living & Dining Hall',
    dimensions: "18' 0\" × 15' 0\"",
    area: '270 sq ft',
    vastu: 'North-East (Ishan) — Highly Auspicious',
    sunlight: 'Morning Sun (94% Solar Daylight)'
  },
  master: {
    name: 'Master Suite & Walk-in',
    dimensions: "14' 6\" × 12' 6\"",
    area: '181 sq ft',
    vastu: 'South-West (Nairutya) — Master Stability',
    sunlight: 'Afternoon Indirect Light'
  },
  kitchen: {
    name: 'Gourmet Kitchen',
    dimensions: "11' 0\" × 10' 6\"",
    area: '115 sq ft',
    vastu: 'South-East (Agni) — Fire Zone Optimal',
    sunlight: 'Direct Morning Ventilation'
  },
  bath: {
    name: 'Ensuite Bathroom',
    dimensions: "7' 0\" × 8' 6\"",
    area: '59 sq ft',
    vastu: 'North-West (Vayu) — Compliant',
    sunlight: 'Vent Shaft Exhaust'
  },
  stair: {
    name: 'Circulation & Staircase',
    dimensions: "8' 0\" × 11' 6\"",
    area: '92 sq ft',
    vastu: 'South Wall Clockwise Ascent',
    sunlight: 'Skylight Illumination'
  }
};

export default function SelfDrawingBlueprint() {
  const [key, setKey] = useState(0);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ x: string; y: string }>({ x: '24.5', y: '18.2' });
  const [visibleLayers, setVisibleLayers] = useState({
    walls: true,
    dimensions: true,
    doors: true,
    furniture: true,
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 40;
    const yPct = ((e.clientY - rect.top) / rect.height) * 30;
    setMouseCoords({
      x: xPct.toFixed(1),
      y: yPct.toFixed(1)
    });
  };

  return (
    <div style={{
      position: 'relative',
      borderRadius: '20px',
      border: '1px solid #262D3D',
      background: 'radial-gradient(ellipse at center, #0F131C 0%, #090B10 100%)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 1px rgba(112, 215, 255, 0.3)',
      overflow: 'hidden',
      padding: '1.25rem',
      fontFamily: 'var(--font-primary)'
    }}>
      {/* Top Technical CAD Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #262D3D',
        paddingBottom: '0.85rem',
        marginBottom: '1rem',
        fontSize: '0.78rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <span style={{ color: '#F4F6FC', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              CAD DRAWING ENGINE
            </span>
          </div>
          <span style={{ color: '#9AA5B8', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            COORDS: X={mouseCoords.x}' Y={mouseCoords.y}'
          </span>
          <span style={{
            background: 'rgba(112, 215, 255, 0.1)',
            color: '#70D7FF',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)'
          }}>
            SCALE 1:50
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setVisibleLayers(prev => ({ ...prev, dimensions: !prev.dimensions }))}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #262D3D',
              background: visibleLayers.dimensions ? 'rgba(112, 215, 255, 0.12)' : 'transparent',
              color: visibleLayers.dimensions ? '#70D7FF' : '#9AA5B8',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Toggle Dimensions"
          >
            <Layers size={13} /> Dims
          </button>

          <button
            onClick={() => setKey(k => k + 1)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(112, 215, 255, 0.3)',
              background: 'rgba(112, 215, 255, 0.08)',
              color: '#70D7FF',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Replay Self-Drawing Blueprint Animation"
          >
            <RotateCcw size={13} /> Redraw
          </button>
        </div>
      </div>

      {/* Blueprint SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', height: 'auto', aspectRatio: '4/3', maxHeight: '480px' }}>
        <svg
          key={key}
          viewBox="0 0 640 480"
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Architectural Drafting Grid */}
            <pattern id="cadGridSmall" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(112, 215, 255, 0.04)" strokeWidth="0.75" />
            </pattern>
            <pattern id="cadGridLarge" width="64" height="64" patternUnits="userSpaceOnUse">
              <rect width="64" height="64" fill="url(#cadGridSmall)" />
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(112, 215, 255, 0.09)" strokeWidth="1" />
            </pattern>

            {/* Subtle Room Highlight Gradients */}
            <linearGradient id="livingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#70D7FF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#70D7FF" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="masterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="kitchenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
            </linearGradient>

            {/* CAD Dimension Arrowheads */}
            <marker id="cadArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 3 L 5 5 L 0 7 z" fill="#70D7FF" />
            </marker>
          </defs>

          {/* Grid Background */}
          <rect width="640" height="480" fill="url(#cadGridLarge)" />

          {/* PHASE 1: Outer Plot & Setback Boundary (Dashed Cyan Lines) */}
          <g id="plot-boundary">
            {/* Plot Setback Boundary */}
            <motion.rect
              x="30"
              y="30"
              width="580"
              height="420"
              fill="none"
              stroke="#262D3D"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
            {/* Corner Crosshairs */}
            {[
              [30, 30], [610, 30], [610, 450], [30, 450],
              [80, 70], [560, 70], [560, 410], [80, 410]
            ].map(([cx, cy], i) => (
              <g key={`crosshair-${i}`} opacity={0.6}>
                <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke="#70D7FF" strokeWidth="1" />
                <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} stroke="#70D7FF" strokeWidth="1" />
              </g>
            ))}
          </g>

          {/* PHASE 6: Room Zones (Interactive Soft Fills) */}
          <g id="room-zones">
            {/* Living & Dining Area */}
            <motion.rect
              x="80"
              y="70"
              width="280"
              height="200"
              fill={activeRoom === 'living' ? "url(#livingGrad)" : "rgba(112, 215, 255, 0.03)"}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.8 }}
              onMouseEnter={() => setActiveRoom('living')}
              onMouseLeave={() => setActiveRoom(null)}
            />

            {/* Master Suite */}
            <motion.rect
              x="360"
              y="70"
              width="200"
              height="180"
              fill={activeRoom === 'master' ? "url(#masterGrad)" : "rgba(167, 139, 250, 0.03)"}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 0.8 }}
              onMouseEnter={() => setActiveRoom('master')}
              onMouseLeave={() => setActiveRoom(null)}
            />

            {/* Kitchen */}
            <motion.rect
              x="360"
              y="250"
              width="200"
              height="160"
              fill={activeRoom === 'kitchen' ? "url(#kitchenGrad)" : "rgba(245, 158, 11, 0.03)"}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.8 }}
              onMouseEnter={() => setActiveRoom('kitchen')}
              onMouseLeave={() => setActiveRoom(null)}
            />

            {/* Ensuite Bath */}
            <motion.rect
              x="80"
              y="270"
              width="130"
              height="140"
              fill={activeRoom === 'bath' ? "rgba(20, 184, 166, 0.12)" : "rgba(20, 184, 166, 0.03)"}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.8 }}
              onMouseEnter={() => setActiveRoom('bath')}
              onMouseLeave={() => setActiveRoom(null)}
            />

            {/* Staircase */}
            <motion.rect
              x="210"
              y="270"
              width="150"
              height="140"
              fill={activeRoom === 'stair' ? "rgba(99, 102, 241, 0.14)" : "rgba(99, 102, 241, 0.03)"}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7, duration: 0.8 }}
              onMouseEnter={() => setActiveRoom('stair')}
              onMouseLeave={() => setActiveRoom(null)}
            />
          </g>

          {/* PHASE 2 & 3: Structural Exterior & Interior Walls */}
          {visibleLayers.walls && (
            <g id="structural-walls">
              {/* Outer Building Envelope (Self-Drawing Thick Double Walls) */}
              <motion.path
                d="M 80 70 L 560 70 L 560 410 L 80 410 Z"
                fill="none"
                stroke="#70D7FF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
              <motion.path
                d="M 86 76 L 554 76 L 554 404 L 86 404 Z"
                fill="none"
                stroke="#262D3D"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, delay: 0.2, ease: "easeInOut" }}
              />

              {/* Interior Partitions */}
              {/* Divider between Living and Master Suite */}
              <motion.line
                x1="360" y1="70" x2="360" y2="410"
                stroke="#70D7FF"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 1.0, ease: "easeInOut" }}
              />
              {/* Divider between Living and Bath/Staircase */}
              <motion.line
                x1="80" y1="270" x2="360" y2="270"
                stroke="#70D7FF"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.0, delay: 1.3, ease: "easeInOut" }}
              />
              {/* Divider between Master and Kitchen */}
              <motion.line
                x1="360" y1="250" x2="560" y2="250"
                stroke="#70D7FF"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: 1.5, ease: "easeInOut" }}
              />
              {/* Divider between Bath and Staircase */}
              <motion.line
                x1="210" y1="270" x2="210" y2="410"
                stroke="#70D7FF"
                strokeWidth="2.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 1.6, ease: "easeInOut" }}
              />

              {/* Staircase Treads (Self-Drawing Step Array) */}
              {[...Array(9)].map((_, idx) => (
                <motion.line
                  key={`stair-tread-${idx}`}
                  x1="218"
                  y1={285 + idx * 13}
                  x2="352"
                  y2={285 + idx * 13}
                  stroke="#9AA5B8"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.85 }}
                  transition={{ delay: 2.0 + idx * 0.08, duration: 0.4 }}
                />
              ))}

              {/* Stair Direction Arrow */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8, duration: 0.5 }}
              >
                <line x1="285" y1="380" x2="285" y2="300" stroke="#70D7FF" strokeWidth="1.5" markerEnd="url(#cadArrow)" />
                <text x="292" y="340" fill="#70D7FF" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">UP (18R)</text>
              </motion.g>
            </g>
          )}

          {/* PHASE 4: Doors & Windows (Arcs & Glazing Lines) */}
          {visibleLayers.doors && (
            <g id="doors-and-windows">
              {/* Main Entrance Door (Double Swing Arc) */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0, duration: 0.6 }}
              >
                <path d="M 80 180 A 40 40 0 0 1 120 220" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="80" y1="180" x2="80" y2="220" stroke="#F59E0B" strokeWidth="2.5" />
                <text x="60" y="205" fill="#F59E0B" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">ENTRY</text>
              </motion.g>

              {/* Master Bedroom Door */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2, duration: 0.6 }}
              >
                <path d="M 360 190 A 30 30 0 0 1 390 160" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="360" y1="190" x2="390" y2="190" stroke="#F59E0B" strokeWidth="2" />
              </motion.g>

              {/* Window Glazing (Triple Lines on Exterior) */}
              {/* North Living Window */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4, duration: 0.6 }}
              >
                <rect x="160" y="66" width="80" height="8" fill="#090B10" stroke="#70D7FF" strokeWidth="1.5" />
                <line x1="160" y1="70" x2="240" y2="70" stroke="#70D7FF" strokeWidth="1" />
                <text x="188" y="60" fill="#70D7FF" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">W1 (6')</text>
              </motion.g>

              {/* East Master Suite Window */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.6 }}
              >
                <rect x="556" y="120" width="8" height="60" fill="#090B10" stroke="#70D7FF" strokeWidth="1.5" />
                <line x1="560" y1="120" x2="560" y2="180" stroke="#70D7FF" strokeWidth="1" />
                <text x="568" y="155" fill="#70D7FF" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">W2 (5')</text>
              </motion.g>

              {/* South Kitchen Window */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6, duration: 0.6 }}
              >
                <rect x="420" y="406" width="70" height="8" fill="#090B10" stroke="#70D7FF" strokeWidth="1.5" />
                <line x1="420" y1="410" x2="490" y2="410" stroke="#70D7FF" strokeWidth="1" />
                <text x="442" y="426" fill="#70D7FF" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">W3 (5')</text>
              </motion.g>
            </g>
          )}

          {/* PHASE 5: Dimension Strings & Engineering Metadata */}
          {visibleLayers.dimensions && (
            <g id="dimension-strings">
              {/* Top Exterior Dimension: 40' 0" */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8, duration: 0.8 }}
              >
                <line x1="80" y1="45" x2="560" y2="45" stroke="#9AA5B8" strokeWidth="1" markerStart="url(#cadArrow)" markerEnd="url(#cadArrow)" />
                <line x1="80" y1="40" x2="80" y2="68" stroke="#9AA5B8" strokeWidth="0.8" />
                <line x1="560" y1="40" x2="560" y2="68" stroke="#9AA5B8" strokeWidth="0.8" />
                <rect x="295" y="38" width="50" height="14" fill="#090B10" rx="2" />
                <text x="320" y="49" fill="#F4F6FC" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">
                  40' - 0"
                </text>
              </motion.g>

              {/* Left Exterior Dimension: 30' 0" */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.9, duration: 0.8 }}
              >
                <line x1="55" y1="70" x2="55" y2="410" stroke="#9AA5B8" strokeWidth="1" markerStart="url(#cadArrow)" markerEnd="url(#cadArrow)" />
                <line x1="50" y1="70" x2="78" y2="70" stroke="#9AA5B8" strokeWidth="0.8" />
                <line x1="50" y1="410" x2="78" y2="410" stroke="#9AA5B8" strokeWidth="0.8" />
                <rect x="30" y="233" width="50" height="14" fill="#090B10" rx="2" />
                <text x="55" y="244" fill="#F4F6FC" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">
                  30' - 0"
                </text>
              </motion.g>
            </g>
          )}

          {/* Room Labels & Telemetry Badges */}
          <g id="room-labels">
            {/* Living Room */}
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.0, duration: 0.5 }}
            >
              <text x="220" y="150" fill="#F4F6FC" fontSize="13" fontWeight="800" textAnchor="middle">LIVING & DINING</text>
              <text x="220" y="168" fill="#70D7FF" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">18' 0" × 15' 0" (270 SQ FT)</text>
              <rect x="180" y="178" width="80" height="16" fill="rgba(112, 215, 255, 0.12)" rx="4" />
              <text x="220" y="190" fill="#70D7FF" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">VASTU: 98%</text>
            </motion.g>

            {/* Master Suite */}
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.1, duration: 0.5 }}
            >
              <text x="460" y="145" fill="#F4F6FC" fontSize="12" fontWeight="800" textAnchor="middle">MASTER BEDROOM</text>
              <text x="460" y="163" fill="#A78BFA" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">14' 6" × 12' 6"</text>
              <rect x="420" y="173" width="80" height="16" fill="rgba(167, 139, 250, 0.15)" rx="4" />
              <text x="460" y="185" fill="#A78BFA" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">SW MASTER</text>
            </motion.g>

            {/* Kitchen */}
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.2, duration: 0.5 }}
            >
              <text x="460" y="325" fill="#F4F6FC" fontSize="12" fontWeight="800" textAnchor="middle">KITCHEN</text>
              <text x="460" y="343" fill="#F59E0B" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">11' 0" × 10' 6"</text>
              <rect x="420" y="353" width="80" height="16" fill="rgba(245, 158, 11, 0.12)" rx="4" />
              <text x="460" y="365" fill="#F59E0B" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">AGNI ZONE</text>
            </motion.g>

            {/* Bath */}
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.3, duration: 0.5 }}
            >
              <text x="145" y="335" fill="#F4F6FC" fontSize="11" fontWeight="800" textAnchor="middle">BATH</text>
              <text x="145" y="350" fill="#9AA5B8" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">7' 0" × 8' 6"</text>
            </motion.g>

            {/* Staircase */}
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.3, duration: 0.5 }}
            >
              <text x="285" y="282" fill="#F4F6FC" fontSize="11" fontWeight="800" textAnchor="middle">STAIRCASE</text>
            </motion.g>
          </g>

          {/* Technical CAD Title Block & Stamp */}
          <g id="title-block">
            <motion.g
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 3.4, duration: 0.6 }}
            >
              <rect x="430" y="420" width="190" height="50" fill="#090B10" stroke="#262D3D" strokeWidth="1" rx="4" />
              <text x="440" y="434" fill="#70D7FF" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">AI ARCHITECT AUTONOMOUS SYNTHESIS</text>
              <text x="440" y="446" fill="#9AA5B8" fontSize="7.5" fontFamily="var(--font-mono)">DWG: RESIDENTIAL_30X40_V4</text>
              <text x="440" y="457" fill="#10B981" fontSize="7.5" fontFamily="var(--font-mono)">STATUS: 100% NBC / VASTU PASS</text>
            </motion.g>
          </g>
        </svg>

        {/* Live Hover Room Telemetry Card Overlay */}
        <AnimatePresence>
          {activeRoom && ROOM_DATA[activeRoom] && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                bottom: '15px',
                left: '15px',
                background: 'rgba(21, 26, 38, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid #70D7FF',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 15px rgba(112, 215, 255, 0.25)',
                borderRadius: '12px',
                padding: '12px 16px',
                minWidth: '240px',
                zIndex: 20,
                pointerEvents: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F4F6FC' }}>
                  {ROOM_DATA[activeRoom].name}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#70D7FF',
                  background: 'rgba(112, 215, 255, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {ROOM_DATA[activeRoom].area}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9AA5B8', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                Dims: {ROOM_DATA[activeRoom].dimensions}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Sparkles size={11} /> {ROOM_DATA[activeRoom].vastu}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Compass size={11} /> {ROOM_DATA[activeRoom].sunlight}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Specs Telemetry Readout */}
      <div style={{
        marginTop: '0.85rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #262D3D',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#9AA5B8',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <span>SETBACKS: 3.0' REAR / 4.0' FRONT</span>
          <span>AZIMUTH: 045° NE</span>
          <span>WALL THICKNESS: 9" EXT / 4.5" INT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10B981' }}>
          <CheckCircle2 size={13} />
          <span>AUTOCAD R2010 COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}
