import { motion } from 'framer-motion';

export default function ConceptSketchArtwork({ isAnimated = true }: { isAnimated?: boolean }) {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/10',
      background: 'var(--paper-sheet)',
      borderRadius: '8px',
      border: '1px solid var(--paper-border)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      position: 'relative',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Hand-written architectural note header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderBottom: '1px dashed rgba(37,38,34,0.15)',
        paddingBottom: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--ink-secondary)' }}>
          Fig. 01 — Preliminary Concept & Volumetric Massing
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-annotation)', letterSpacing: '0.05em' }}>
          SITE: 30' × 40' // NORTH-FACING RESIDENCE
        </span>
      </div>

      <svg
        viewBox="0 0 600 380"
        style={{ width: '100%', height: 'calc(100% - 30px)', display: 'block' }}
      >
        <defs>
          {/* Paper texture noise filter */}
          <pattern id="sketchGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(37, 38, 34, 0.025)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="600" height="380" fill="url(#sketchGrid)" />

        {/* 1. Construction & Datum Guidelines (Dashed Graphite) */}
        <g id="construction-guidelines" stroke="#A1A399" strokeWidth="0.75" strokeDasharray="3 3">
          <line x1="40" y1="290" x2="560" y2="290" /> {/* Ground Datum */}
          <line x1="120" y1="40" x2="120" y2="340" /> {/* Left Setback Boundary */}
          <line x1="480" y1="40" x2="480" y2="340" /> {/* Right Setback Boundary */}
          <line x1="70" y1="180" x2="530" y2="180" /> {/* Floor Slab Datum */}
          
          {/* Perspective sight lines to vanishing point */}
          <line x1="120" y1="290" x2="50" y2="340" strokeDasharray="2 4" opacity="0.6" />
          <line x1="480" y1="290" x2="550" y2="340" strokeDasharray="2 4" opacity="0.6" />
          <line x1="300" y1="40" x2="300" y2="340" strokeDasharray="4 4" stroke="#D85740" opacity="0.4" /> {/* Central Axis */}
        </g>

        {/* 2. Loose Exploratory Massing Volumes (Hand-drawn look) */}
        <g id="massing-boxes">
          {/* Ground Floor Main Block */}
          <motion.path
            d="M 140 290 L 140 180 L 360 180 L 360 290 Z"
            fill="rgba(37,38,34,0.03)"
            stroke="#252622"
            strokeWidth="1.8"
            strokeLinejoin="round"
            initial={isAnimated ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />

          {/* Upper Floor Cantilevered Studio */}
          <motion.path
            d="M 120 180 L 120 85 L 320 85 L 320 180 Z"
            fill="rgba(216, 87, 64, 0.04)"
            stroke="#252622"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={isAnimated ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
          />

          {/* Secondary Bedroom / Stair Tower Volume */}
          <motion.path
            d="M 360 290 L 360 120 L 460 120 L 460 290 Z"
            fill="rgba(54, 95, 168, 0.04)"
            stroke="#252622"
            strokeWidth="1.8"
            strokeLinejoin="round"
            initial={isAnimated ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: "easeInOut" }}
          />

          {/* Terrace Cutout / Pergola lines */}
          <g stroke="#777970" strokeWidth="1" strokeLinecap="round">
            <line x1="320" y1="85" x2="360" y2="85" />
            <line x1="320" y1="100" x2="360" y2="100" strokeDasharray="4 2" />
            <line x1="320" y1="120" x2="360" y2="120" strokeDasharray="4 2" />
          </g>
        </g>

        {/* 3. Fenestration & Opening Gestures */}
        <g id="openings" stroke="#474943" strokeWidth="1.2">
          {/* Ground floor ribbon glass */}
          <line x1="160" y1="210" x2="280" y2="210" />
          <line x1="160" y1="260" x2="280" y2="260" />
          <line x1="160" y1="210" x2="160" y2="260" />
          <line x1="280" y1="210" x2="280" y2="260" />

          {/* Upper floor vertical light slit */}
          <rect x="150" y="105" width="22" height="55" fill="none" stroke="#474943" strokeWidth="1.2" />
          <rect x="190" y="105" width="22" height="55" fill="none" stroke="#474943" strokeWidth="1.2" />

          {/* Stair tower clerestory */}
          <line x1="380" y1="135" x2="440" y2="135" strokeDasharray="2 2" />
          <line x1="380" y1="150" x2="440" y2="150" />
        </g>

        {/* 4. Architectural Annotations & Human Dimension Notes */}
        <g id="sketch-notes" fontFamily="var(--font-serif)" fontStyle="italic" fill="#777970" fontSize="12">
          {/* Cantilever note */}
          <text x="70" y="75">cantilevered upper study →</text>
          <path d="M 115 80 Q 120 70 120 85" fill="none" stroke="#777970" strokeWidth="0.8" />

          {/* Double-height living void */}
          <text x="180" y="240" fill="#252622" fontSize="11" fontFamily="var(--font-sans)" fontWeight="600">
            LIVING VOID (+14' CLR)
          </text>

          {/* Stair core note */}
          <text x="390" y="80">stair & service core</text>
          <line x1="430" y1="88" x2="410" y2="120" stroke="#777970" strokeWidth="0.75" />

          {/* Natural ground line ticks */}
          <g stroke="#474943" strokeWidth="1.2">
            {[...Array(24)].map((_, i) => (
              <line key={i} x1={100 + i * 16} y1="290" x2={95 + i * 16} y2="298" />
            ))}
          </g>

          <text x="490" y="305" fontSize="10" fontFamily="var(--font-mono)" fontStyle="normal" fill="#A1A399">
            ±0.00 DATUM
          </text>
        </g>

        {/* 5. Dimension Strings with Architectural Ticks */}
        <g id="dimension-lines" stroke="#777970" strokeWidth="0.8">
          {/* Width Dimension: 30'-0" */}
          <line x1="140" y1="330" x2="460" y2="330" />
          <line x1="136" y1="334" x2="144" y2="326" stroke="#252622" strokeWidth="1.5" />
          <line x1="456" y1="334" x2="464" y2="326" stroke="#252622" strokeWidth="1.5" />
          <text x="300" y="348" textAnchor="middle" fill="#252622" fontSize="11" fontFamily="var(--font-mono)" fontStyle="normal" fontWeight="600">
            30' - 0" WIDTH
          </text>
        </g>
      </svg>
    </div>
  );
}
