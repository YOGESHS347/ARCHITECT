import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ArchitecturalGenerationOverlayProps {
  isVisible: boolean;
  plotWidth: number;
  plotHeight: number;
  bedrooms: number;
  floors: number;
  entryDir: string;
  error?: string | null;
  onRetry?: () => void;
}

const STAGES = [
  { id: 1, title: '01 // SURVEY & SITE PARCEL', desc: 'Establishing boundary datum, survey perimeter, and road orientation.' },
  { id: 2, title: '02 // FOUNDATION & STRUCTURAL GRID', desc: 'Synthesizing load-bearing column lines and structural centerlines.' },
  { id: 3, title: '03 // SPATIAL TOPOLOGY & ZONING', desc: 'Allocating room masses: Living, Master Suite, Kitchen, and Wet Cores.' },
  { id: 4, title: '04 // ARCHITECTURAL LINEWORK & FENESTRATION', desc: 'Drafting 9" exterior masonry walls, door swings, and glazed windows.' },
  { id: 5, title: '05 // VASTU & NBC-2016 COMPLIANCE CHECK', desc: 'Evaluating solar daylight factor, egress corridors, and setback bylaws.' },
  { id: 6, title: '06 // COMPILING 1:50 TECHNICAL BLUEPRINT', desc: 'Generating dimension strings, room schedule, and vector CAD export.' },
];

export const ArchitecturalGenerationOverlay: React.FC<ArchitecturalGenerationOverlayProps> = ({
  isVisible,
  plotWidth,
  plotHeight,
  bedrooms,
  floors,
  entryDir,
  error,
  onRetry,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setActiveStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStageIndex(prev => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible && !error) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(37, 38, 34, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '780px',
        background: '#FAF8F2',
        borderRadius: '12px',
        border: '1px solid #E7E1D5',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top Header */}
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #E7E1D5',
          background: '#F3F0E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem', color: '#D85740' }}>✦</span>
            <span style={{
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#252622',
              letterSpacing: '0.04em',
            }}>
              ATELIER GENERATIVE SYNTHESIS
            </span>
          </div>

          <div style={{
            fontSize: '0.72rem',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#777970',
          }}>
            PROGRAM: <strong style={{ color: '#252622' }}>{bedrooms}BHK · {floors}F · {plotWidth}×{plotHeight} FT ({entryDir.toUpperCase()})</strong>
          </div>
        </div>

        {/* Center Animated Drawing Canvas */}
        <div style={{
          padding: '2rem',
          background: '#FAF8F2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {error ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <AlertCircle size={44} color="#D85740" />
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.4rem', color: '#252622', margin: 0 }}>
                Architectural Synthesis Interrupted
              </h3>
              <p style={{ color: '#777970', fontSize: '0.88rem', maxWidth: '440px', margin: 0 }}>
                {error}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '5px',
                    border: 'none',
                    background: '#D85740',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                  }}
                >
                  RETRY GENERATION
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Dynamic Animated Architectural Canvas */}
              <div style={{
                width: '100%',
                height: '240px',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E7E1D5',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg
                  viewBox="0 0 400 240"
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Subtle Drafting Grid */}
                  <defs>
                    <pattern id="genGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(37,38,34,0.04)" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="400" height="240" fill="url(#genGrid)" />

                  {/* ACT 1: Site survey boundary lines */}
                  <motion.rect
                    x="80" y="30" width="240" height="180"
                    fill="none"
                    stroke="#252622"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                  />

                  {/* Corner datum crosses */}
                  {[
                    [80, 30], [320, 30], [80, 210], [320, 210]
                  ].map(([cx, cy], i) => (
                    <g key={i}>
                      <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke="#D85740" strokeWidth="1.2" />
                      <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} stroke="#D85740" strokeWidth="1.2" />
                    </g>
                  ))}

                  {/* ACT 2: Structural Column Grid (Stage >= 1) */}
                  {activeStageIndex >= 1 && (
                    <g>
                      <motion.line x1="160" y1="20" x2="160" y2="220" stroke="#365FA8" strokeWidth="0.8" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} />
                      <motion.line x1="240" y1="20" x2="240" y2="220" stroke="#365FA8" strokeWidth="0.8" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} />
                      <motion.line x1="70" y1="90" x2="330" y2="90" stroke="#365FA8" strokeWidth="0.8" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} />
                      <motion.line x1="70" y1="150" x2="330" y2="150" stroke="#365FA8" strokeWidth="0.8" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} />
                    </g>
                  )}

                  {/* ACT 3: Room Blocks (Stage >= 2) */}
                  {activeStageIndex >= 2 && (
                    <g>
                      {/* Living Zone */}
                      <motion.rect
                        x="90" y="40" width="140" height="100"
                        fill="rgba(231, 225, 213, 0.4)" stroke="#252622" strokeWidth="1.8"
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      />
                      <text x="160" y="95" textAnchor="middle" fill="#252622" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="600">LIVING // FOYER</text>

                      {/* Master Suite */}
                      <motion.rect
                        x="240" y="40" width="70" height="100"
                        fill="rgba(216, 87, 64, 0.08)" stroke="#252622" strokeWidth="1.8"
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                      <text x="275" y="95" textAnchor="middle" fill="#252622" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="600">MASTER BED</text>

                      {/* Kitchen / Dining */}
                      <motion.rect
                        x="90" y="150" width="100" height="50"
                        fill="rgba(184, 154, 100, 0.12)" stroke="#252622" strokeWidth="1.8"
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      />
                      <text x="140" y="180" textAnchor="middle" fill="#252622" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="600">KITCHEN</text>

                      {/* Guest Bed / Bath */}
                      <motion.rect
                        x="200" y="150" width="110" height="50"
                        fill="rgba(54, 95, 168, 0.08)" stroke="#252622" strokeWidth="1.8"
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      />
                      <text x="255" y="180" textAnchor="middle" fill="#252622" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="600">SUITE 02 / BATH</text>
                    </g>
                  )}

                  {/* ACT 4: Door swings & Window marks (Stage >= 3) */}
                  {activeStageIndex >= 3 && (
                    <g>
                      {/* Front Entrance Door Arc */}
                      <path d="M 120 40 L 120 25 A 15 15 0 0 1 135 40" fill="none" stroke="#252622" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="120" y1="40" x2="120" y2="25" stroke="#252622" strokeWidth="1.5" />
                      {/* Windows */}
                      <line x1="160" y1="39" x2="200" y2="39" stroke="#365FA8" strokeWidth="3" />
                      <line x1="319" y1="70" x2="319" y2="110" stroke="#365FA8" strokeWidth="3" />
                    </g>
                  )}

                  {/* ACT 5: Dimension strings (Stage >= 4) */}
                  {activeStageIndex >= 4 && (
                    <g>
                      <line x1="90" y1="25" x2="310" y2="25" stroke="#365FA8" strokeWidth="1" />
                      <line x1="88" y1="22" x2="92" y2="28" stroke="#365FA8" strokeWidth="1.2" />
                      <line x1="308" y1="22" x2="312" y2="28" stroke="#365FA8" strokeWidth="1.2" />
                      <text x="200" y="21" textAnchor="middle" fill="#365FA8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                        {plotWidth}'-0" [WIDTH]
                      </text>
                    </g>
                  )}

                  {/* Dimension marker callout (Act 6) */}
                  {activeStageIndex >= 5 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <rect x="145" y="105" width="110" height="24" rx="4" fill="#252622" />
                      <text x="200" y="121" textAnchor="middle" fill="#FAF8F2" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                        CAD SPEC READY
                      </text>
                    </motion.g>
                  )}
                </svg>

                {/* Progress bar inside preview */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: '#E7E1D5',
                }}>
                  <motion.div
                    style={{ height: '100%', background: '#D85740' }}
                    initial={{ width: '5%' }}
                    animate={{ width: `${((activeStageIndex + 1) / STAGES.length) * 100}%` }}
                    transition={{ ease: 'easeInOut' }}
                  />
                </div>
              </div>

              {/* Status and Description */}
              <div style={{ width: '100%', marginTop: '1.25rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#252622',
                  }}>
                    {STAGES[activeStageIndex].title}
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#D85740',
                    fontWeight: 700,
                  }}>
                    {Math.round(((activeStageIndex + 1) / STAGES.length) * 100)}%
                  </span>
                </div>
                <p style={{
                  fontSize: '0.78rem',
                  color: '#777970',
                  marginTop: '4px',
                  marginBottom: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {STAGES[activeStageIndex].desc}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
