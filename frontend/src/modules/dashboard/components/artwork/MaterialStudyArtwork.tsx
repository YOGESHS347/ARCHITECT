import { useState } from 'react';

interface MaterialSwatch {
  name: string;
  category: string;
  finish: string;
  thermal: string;
  embodiedCarbon: string;
  color: string;
  texturePattern: string;
}

const MATERIALS: MaterialSwatch[] = [
  {
    name: 'Board-Formed Architectural Concrete',
    category: 'PRIMARY STRUCTURAL ENVELOPE',
    finish: 'Smooth satin with rough pine formwork grain & tie-rod indentations',
    thermal: 'High Thermal Mass (U = 0.28 W/m²K with aerogel cavity insulation)',
    embodiedCarbon: 'Low-clinker pozzolanic binder (-42% CO₂ eq)',
    color: '#D8D4CA',
    texturePattern: 'concrete'
  },
  {
    name: 'European Rift White Oak Millwork',
    category: 'INTERIOR CEILING & ARCHITECTURAL JOINERY',
    finish: 'Ultra-matte natural beeswax oil, vertical rift-sawn grain',
    thermal: 'Acoustic absorption NRC 0.75 across circulation galleries',
    embodiedCarbon: 'FSC-certified regenerative forestry (+Net Carbon Sink)',
    color: '#D2BA96',
    texturePattern: 'wood'
  },
  {
    name: 'Fluted Low-Iron Cast Glass',
    category: 'LIGHT WELLS & TRANSLUCENT PARTITIONS',
    finish: '12mm fluted reeded glass, high light transmission (VLT 86%)',
    thermal: 'Double-glazed argon sealed cavity with low-E pyrolytic coating',
    embodiedCarbon: '100% recyclable cullet batch',
    color: '#E0E7E2',
    texturePattern: 'fluted'
  },
  {
    name: 'Oxidized Architectural Bronze',
    category: 'FENESTRATION HARDWARE & FACADE TRIMS',
    finish: 'Hand-patinated oil-rubbed bronze, natural living patina',
    thermal: 'Thermal break polyamide polyamide insulator bars',
    embodiedCarbon: 'Recycled marine grade alloy, 85-year design life',
    color: '#5C4A3A',
    texturePattern: 'bronze'
  }
];

export default function MaterialStudyArtwork() {
  const [selectedMat, setSelectedMat] = useState<number>(0);

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
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderBottom: '1px solid var(--paper-border)',
        paddingBottom: '0.65rem',
        marginBottom: '1rem',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--ink-primary)' }}>
            Plate 05 — Material Palette & Tactile Assemblage
          </span>
          <span style={{ background: 'rgba(161,174,151,0.18)', color: 'var(--success)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600 }}>
            SUSTAINABILITY & FINISH SCHEDULE
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-annotation)' }}>
          SPECIFICATION CODE: FIN-2026-RES
        </div>
      </div>

      {/* Material Swatches Grid Tray */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', height: 'calc(100% - 45px)' }}>
        {/* 4 Swatch Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {MATERIALS.map((mat, i) => (
            <div
              key={i}
              onClick={() => setSelectedMat(i)}
              style={{
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedMat === i ? 'var(--accent-vermilion)' : 'var(--paper-border)',
                background: 'var(--paper-crisp)',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedMat === i ? 'var(--shadow-elevated)' : 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Material Texture Sample Block */}
              <div style={{
                height: '70px',
                borderRadius: '6px',
                background: mat.color,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(37,38,34,0.1)',
                marginBottom: '8px'
              }}>
                {/* SVG procedural texture lines */}
                {mat.texturePattern === 'concrete' && (
                  <svg width="100%" height="100%" style={{ opacity: 0.25 }}>
                    <line x1="0" y1="20" x2="100%" y2="20" stroke="#000" strokeWidth="0.75" />
                    <line x1="0" y1="45" x2="100%" y2="45" stroke="#000" strokeWidth="0.75" />
                    <circle cx="25" cy="20" r="2" fill="#000" />
                    <circle cx="75" cy="45" r="2" fill="#000" />
                  </svg>
                )}
                {mat.texturePattern === 'wood' && (
                  <svg width="100%" height="100%" style={{ opacity: 0.35 }}>
                    {[...Array(12)].map((_, idx) => (
                      <line key={idx} x1={idx * 16} y1="0" x2={idx * 16 + 8} y2="100%" stroke="#8B6534" strokeWidth="0.75" />
                    ))}
                  </svg>
                )}
                {mat.texturePattern === 'fluted' && (
                  <svg width="100%" height="100%" style={{ opacity: 0.4 }}>
                    {[...Array(16)].map((_, idx) => (
                      <rect key={idx} x={idx * 10} y="0" width="5" height="100%" fill="rgba(255,255,255,0.7)" />
                    ))}
                  </svg>
                )}
                {mat.texturePattern === 'bronze' && (
                  <svg width="100%" height="100%" style={{ opacity: 0.3 }}>
                    <rect width="100%" height="100%" fill="radial-gradient(circle, #8C7355 10%, #3B2E24 90%)" />
                  </svg>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-annotation)', textTransform: 'uppercase' }}>
                  MAT. 0{i + 1}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-primary)', lineHeight: 1.2 }}>
                  {mat.name.split(' ')[0]} {mat.name.split(' ')[1]}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Material Specification Dossier Sheet */}
        <div style={{
          background: 'var(--paper-crisp)',
          border: '1px solid var(--paper-border)',
          borderRadius: '8px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-vermilion)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '4px' }}>
              {MATERIALS[selectedMat].category}
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 10px 0' }}>
              {MATERIALS[selectedMat].name}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-annotation)', display: 'block' }}>TACTILE SPECIFICATION:</span>
                {MATERIALS[selectedMat].finish}
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-annotation)', display: 'block' }}>THERMAL PERFORMANCE:</span>
                {MATERIALS[selectedMat].thermal}
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-annotation)', display: 'block' }}>EMBODIED CARBON AUDIT:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{MATERIALS[selectedMat].embodiedCarbon}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--paper-border-soft)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--ink-annotation)' }}>
              Architectural Atelier Samples
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-secondary)' }}>
              100% SPECIFIED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
