import { motion } from 'framer-motion';

export default function BuildingSectionArtwork({ isAnimated = true }: { isAnimated?: boolean }) {
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
            Plate 04 — Longitudinal Building Section
          </span>
          <span style={{ background: 'rgba(37,38,34,0.06)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-secondary)' }}>
            SECTION A–A // 1:50
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-annotation)' }}>
          VERTICAL ENVELOPE & DAYLIGHT PENETRATION
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 35px)' }}>
        <svg
          viewBox="0 0 620 380"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Architectural Earth Hatch Pattern */}
            <pattern id="earthHatch" width="12" height="12" patternUnits="userSpaceOnUse">
              <line x1="0" y1="12" x2="12" y2="0" stroke="rgba(37,38,34,0.15)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* 1. Natural Earth & Foundation (Hatched Ground) */}
          <rect x="20" y="310" width="580" height="60" fill="url(#earthHatch)" />
          <line x1="20" y1="310" x2="580" y2="310" stroke="#252622" strokeWidth="2.5" />

          {/* 2. Projected Elements in Background (Fine Lines 0.8pt) */}
          <g id="projected-background" stroke="#A1A399" strokeWidth="0.8">
            {/* Background Wall of Living Room */}
            <rect x="80" y="210" width="180" height="100" fill="rgba(37,38,34,0.015)" />
            {/* Background Clerestory Window North */}
            <rect x="100" y="225" width="140" height="35" fill="none" strokeDasharray="3 2" />
            <line x1="170" y1="225" x2="170" y2="260" />

            {/* Background Upper Bedroom Door */}
            <rect x="360" y="130" width="40" height="75" fill="none" />
            
            {/* Stair Treads in Elevation (Ascending Section) */}
            {[...Array(14)].map((_, i) => (
              <line key={i} x1="270 + i * 5" y1={310 - i * 7.5} x2="330" y2={310 - i * 7.5} stroke="#777970" strokeWidth="0.6" />
            ))}
          </g>

          {/* 3. Solar Ray & Natural Ventilation Paths (Dashed Brass & Sage) */}
          <g id="environmental-vectors" strokeDasharray="4 3">
            {/* Winter Sunlight Angle (32° Solstice) */}
            <line x1="40" y1="120" x2="220" y2="300" stroke="#B89A64" strokeWidth="1.2" />
            <text x="50" y="135" fill="#B89A64" fontSize="8" fontFamily="var(--font-mono)">32° WINTER SUN</text>

            {/* Summer Shade Line (65° Equinox) */}
            <line x1="60" y1="60" x2="120" y2="210" stroke="#D85740" strokeWidth="1" />
            <text x="65" y="80" fill="#D85740" fontSize="8" fontFamily="var(--font-mono)">65° ROOF OVERHANG SHADE</text>

            {/* Stack Effect Thermal Flow */}
            <path d="M 170 290 Q 200 210 205 110" fill="none" stroke="#437A5D" strokeWidth="1.2" />
            <text x="215" y="160" fill="#437A5D" fontSize="8" fontFamily="var(--font-mono)">NATURAL CONVECTION ↑</text>
          </g>

          {/* 4. Heavy Sectional Cut Slabs & Structural Walls (Thick Ink 3.5pt) */}
          <g id="cut-geometry" stroke="#252622" fill="#E7E1D5">
            {/* Ground Foundation Slab (12" Concrete Plinth) */}
            <rect x="80" y="300" width="450" height="12" strokeWidth="2.5" />

            {/* Ground Cut Left Wall */}
            <rect x="80" y="200" width="14" height="100" strokeWidth="2.5" />

            {/* First Floor Cut Slab (10" Cast Concrete) */}
            <motion.rect
              x="80" y="200" width="450" height="10"
              strokeWidth="2.5"
              initial={isAnimated ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />

            {/* First Floor Cut Left Wall */}
            <rect x="80" y="105" width="14" height="95" strokeWidth="2.5" />

            {/* Center Load-Bearing Cut Wall */}
            <rect x="330" y="105" width="12" height="195" strokeWidth="2.5" />

            {/* Right Cut Wall */}
            <rect x="516" y="105" width="14" height="195" strokeWidth="2.5" />

            {/* Roof Slab & Parapet (Cantilever Overhang) */}
            <polygon points="60,95 535,95 535,105 80,105 60,105" strokeWidth="2.5" />
            {/* Roof Parapet */}
            <rect x="516" y="65" width="14" height="30" strokeWidth="2.5" />
            <rect x="70" y="75" width="10" height="20" strokeWidth="2" />
          </g>

          {/* 5. Room Labels & Vertical Clearance Annotations */}
          <g id="section-labels">
            {/* Ground Floor Living */}
            <text x="200" y="275" fill="#252622" fontSize="12" fontWeight="700" textAnchor="middle">
              LIVING ROOM
            </text>
            <text x="200" y="290" fill="#777970" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">
              FINISHED FLOOR ±0.00
            </text>

            {/* Ground Floor Kitchen / Dining */}
            <text x="420" y="275" fill="#252622" fontSize="11" fontWeight="700" textAnchor="middle">
              KITCHEN & DINING
            </text>

            {/* Upper Floor Master Bedroom */}
            <text x="200" y="165" fill="#252622" fontSize="11" fontWeight="700" textAnchor="middle">
              UPPER STUDY / VOID
            </text>

            {/* Upper Floor Suite */}
            <text x="420" y="165" fill="#252622" fontSize="11" fontWeight="700" textAnchor="middle">
              MASTER SUITE
            </text>
            <text x="420" y="180" fill="#777970" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">
              LEVEL 01 (+10'-0")
            </text>

            {/* Roof Terrace */}
            <text x="300" y="55" fill="#252622" fontSize="10" fontWeight="700">
              ROOF GARDEN & SOLAR PERGOLA (+20'-0")
            </text>
          </g>

          {/* 6. Vertical Dimension Chain Strings */}
          <g id="vertical-dimensions" stroke="#777970" strokeWidth="0.8">
            {/* Left Dimension: Ground to Ceiling 10'-0" */}
            <line x1="50" y1="210" x2="50" y2="300" />
            <line x1="46" y1="214" x2="54" y2="206" stroke="#252622" strokeWidth="1.5" />
            <line x1="46" y1="304" x2="54" y2="296" stroke="#252622" strokeWidth="1.5" />
            <text x="42" y="260" textAnchor="end" fill="#252622" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">
              10' - 0" CLR
            </text>

            {/* Left Dimension: First Floor to Ceiling 9'-6" */}
            <line x1="50" y1="105" x2="50" y2="200" />
            <line x1="46" y1="109" x2="54" y2="101" stroke="#252622" strokeWidth="1.5" />
            <text x="42" y="155" textAnchor="end" fill="#252622" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">
              9' - 6" CLR
            </text>

            {/* Right Dimension: Total Building Height 23'-6" */}
            <line x1="560" y1="65" x2="560" y2="300" />
            <line x1="556" y1="69" x2="564" y2="61" stroke="#252622" strokeWidth="1.5" />
            <line x1="556" y1="304" x2="564" y2="296" stroke="#252622" strokeWidth="1.5" />
            <text x="568" y="185" fill="#D85740" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">
              23' - 6" OVERALL
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
