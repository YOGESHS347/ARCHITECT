import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Building2, 
  Sun, 
  Car, 
  ArrowUpDown, 
  Wind
} from 'lucide-react';
import type { EditorFormData } from './EditorInputPanel';

interface ArchitecturalBriefWizardProps {
  formData: EditorFormData;
  onChange: (updated: Partial<EditorFormData>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onOpenMultiFloorModal: () => void;
}

export const ArchitecturalBriefWizard: React.FC<ArchitecturalBriefWizardProps> = ({
  formData,
  onChange,
  onGenerate,
  isGenerating,
  onOpenMultiFloorModal,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const plotArea = formData.length * formData.width;

  const quickPlotPresets = [
    { label: '30 × 40 FT', width: 30, length: 40, desc: 'Compact Urban (1,200 sqft)' },
    { label: '30 × 50 FT', width: 30, length: 50, desc: 'Standard Residence (1,500 sqft)' },
    { label: '40 × 60 FT', width: 40, length: 60, desc: 'Spacious Villa (2,400 sqft)' },
    { label: '50 × 80 FT', width: 50, length: 80, desc: 'Estate Parcel (4,000 sqft)' },
  ];

  const directions = [
    { id: 'East', label: 'East (Purva)', desc: 'Optimal morning sunlight & Vastu harmony' },
    { id: 'North', label: 'North (Uttara)', desc: 'Constant ambient daylight & prosperity' },
    { id: 'West', label: 'West (Pashchima)', desc: 'Warm afternoon light & wind breeze' },
    { id: 'South', label: 'South (Dakshina)', desc: 'Requires thermal zoning & shade buffers' },
  ];

  const steps = [
    { num: 1, title: 'Site & Plot' },
    { num: 2, title: 'Spatial Program' },
    { num: 3, title: 'Architectural Features' },
    { num: 4, title: 'Environmental Intelligence' },
    { num: 5, title: 'Review & Synthesize' },
  ];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#FAF8F2',
      overflow: 'hidden',
    }}>
      {/* ── Wizard Progress Stepper ── */}
      <div style={{
        padding: '1.25rem 2.5rem',
        borderBottom: '1px solid #E7E1D5',
        background: '#FAF8F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <span style={{
            fontSize: '0.68rem',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#D85740',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}>
            STAGE 0{currentStep} // 05
          </span>
          <h2 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '1.45rem',
            fontWeight: 600,
            color: '#252622',
            margin: '2px 0 0 0',
            letterSpacing: '-0.01em',
          }}>
            {steps[currentStep - 1].title}
          </h2>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {steps.map(s => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <div
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isCurrent ? '#252622' : isCompleted ? '#E7E1D5' : '#F3F0E7',
                  color: isCurrent ? '#FAF8F2' : isCompleted ? '#252622' : '#777970',
                  fontSize: '0.72rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{isCompleted ? '✓' : `0${s.num}`}</span>
                <span style={{ display: 'inline' }}>{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step Content Body ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2rem 2.5rem',
        display: 'flex',
        gap: '2.5rem',
      }}>
        {/* Left: Input Form Controls */}
        <div style={{ flex: 1, maxWidth: '680px' }}>
          {/* STEP 1: SITE & PLOT */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#474943', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Plot Presets
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {quickPlotPresets.map(preset => (
                    <div
                      key={preset.label}
                      onClick={() => onChange({ width: preset.width, length: preset.length })}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '6px',
                        border: formData.width === preset.width && formData.length === preset.length ? '1.5px solid #252622' : '1px solid #E7E1D5',
                        background: formData.width === preset.width && formData.length === preset.length ? '#FFFFFF' : '#FAF8F2',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: formData.width === preset.width && formData.length === preset.length ? '0 2px 8px rgba(37,38,34,0.06)' : 'none',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88rem', color: '#252622' }}>
                        {preset.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#777970', marginTop: '2px' }}>
                        {preset.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Dimensions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#474943', fontFamily: "'JetBrains Mono', monospace" }}>
                    PLOT LENGTH (DEPTH IN FT)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    value={formData.length}
                    onChange={e => onChange({ length: Math.max(15, Number(e.target.value)) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '5px',
                      border: '1px solid #E7E1D5',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      color: '#252622',
                      marginTop: '4px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', color: '#777970', marginTop: '2px', display: 'block' }}>North-South dimension axis</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#474943', fontFamily: "'JetBrains Mono', monospace" }}>
                    PLOT WIDTH (FRONTAGE IN FT)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    value={formData.width}
                    onChange={e => onChange({ width: Math.max(15, Number(e.target.value)) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '5px',
                      border: '1px solid #E7E1D5',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      color: '#252622',
                      marginTop: '4px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', color: '#777970', marginTop: '2px', display: 'block' }}>East-West road-facing axis</span>
                </div>
              </div>

              {/* Entry Direction */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#474943', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
                  Road Access & Entry Orientation
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {directions.map(dir => (
                    <div
                      key={dir.id}
                      onClick={() => onChange({ entryDir: dir.id })}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '6px',
                        border: formData.entryDir.toLowerCase() === dir.id.toLowerCase() ? '1.5px solid #365FA8' : '1px solid #E7E1D5',
                        background: formData.entryDir.toLowerCase() === dir.id.toLowerCase() ? '#FFFFFF' : '#FAF8F2',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Compass size={14} color={formData.entryDir.toLowerCase() === dir.id.toLowerCase() ? '#365FA8' : '#777970'} />
                        <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                          {dir.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#777970', marginTop: '3px' }}>
                        {dir.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SPATIAL PROGRAM */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '6px',
                background: '#F3F0E7',
                border: '1px solid #E7E1D5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                    BUILDING LEVELS: {formData.floors} {formData.floors > 1 ? 'FLOORS' : 'FLOOR'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#777970' }}>
                    Vertical stacking for multi-story residential zoning
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[1, 2, 3, 4].map(f => (
                    <button
                      key={f}
                      onClick={() => onChange({ floors: f })}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '4px',
                        border: formData.floors === f ? '1.5px solid #252622' : '1px solid #E7E1D5',
                        background: formData.floors === f ? '#252622' : '#FFFFFF',
                        color: formData.floors === f ? '#FAF8F2' : '#474943',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: 'pointer',
                      }}
                    >
                      {f}F
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms & Bathrooms Steppers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '6px', border: '1px solid #E7E1D5', background: '#FFFFFF' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#474943' }}>
                    BEDROOMS (BHK)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                    <button
                      onClick={() => onChange({ bedrooms: Math.max(1, formData.bedrooms - 1) })}
                      style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #E7E1D5', background: '#FAF8F2', cursor: 'pointer', fontWeight: 700 }}
                    >-</button>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Newsreader', Georgia, serif", color: '#252622' }}>
                      {formData.bedrooms} BHK
                    </span>
                    <button
                      onClick={() => onChange({ bedrooms: Math.min(8, formData.bedrooms + 1) })}
                      style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #E7E1D5', background: '#FAF8F2', cursor: 'pointer', fontWeight: 700 }}
                    >+</button>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#777970', display: 'block', marginTop: '4px', textAlign: 'center' }}>
                    Includes Master Suite & Guest Rooms
                  </span>
                </div>

                <div style={{ padding: '1rem', borderRadius: '6px', border: '1px solid #E7E1D5', background: '#FFFFFF' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#474943' }}>
                    BATHROOMS & TOILETS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                    <button
                      onClick={() => onChange({ bathrooms: Math.max(1, formData.bathrooms - 1) })}
                      style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #E7E1D5', background: '#FAF8F2', cursor: 'pointer', fontWeight: 700 }}
                    >-</button>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Newsreader', Georgia, serif", color: '#252622' }}>
                      {formData.bathrooms} BATH
                    </span>
                    <button
                      onClick={() => onChange({ bathrooms: Math.min(8, formData.bathrooms + 1) })}
                      style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #E7E1D5', background: '#FAF8F2', cursor: 'pointer', fontWeight: 700 }}
                    >+</button>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#777970', display: 'block', marginTop: '4px', textAlign: 'center' }}>
                    Ensuite & Powder Room allocation
                  </span>
                </div>
              </div>

              {/* Balconies */}
              <div style={{ padding: '1rem', borderRadius: '6px', border: '1px solid #E7E1D5', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#252622' }}>
                      EXTERIOR BALCONIES & SIT-OUTS
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#777970' }}>Cantilevered daylight terraces attached to suites</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[0, 1, 2, 3].map(b => (
                      <button
                        key={b}
                        onClick={() => onChange({ balcony: b })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          border: formData.balcony === b ? '1.5px solid #365FA8' : '1px solid #E7E1D5',
                          background: formData.balcony === b ? 'rgba(54, 95, 168, 0.1)' : '#FAF8F2',
                          color: formData.balcony === b ? '#365FA8' : '#474943',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ARCHITECTURAL FEATURES */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { key: 'duplex', label: 'Duplex Architectural Volume', desc: 'Double-height living space with internal open staircase cutaway', icon: <Building2 size={16} /> },
                { key: 'terrace', label: 'Rooftop Garden Terrace', desc: 'Accessible landscaped roof terrace with pergola shading', icon: <Sun size={16} /> },
                { key: 'lift', label: 'Vertical Elevator Core', desc: 'Dedicated shaft for pneumatic or hydraulic passenger lift', icon: <ArrowUpDown size={16} /> },
                { key: 'parking', label: 'Dedicated Covered Garage', desc: 'Paved porch parking bay aligned with road entrance', icon: <Car size={16} /> },
                { key: 'vastuToggle', label: 'Vastu Purusha Mandala Geometry', desc: 'Orientation compliance: Kitchen SE, Master Bed SW, Water NE', icon: <Compass size={16} /> },
              ].map(feat => {
                const isChecked = !!(formData as any)[feat.key];
                return (
                  <div
                    key={feat.key}
                    onClick={() => onChange({ [feat.key]: !isChecked })}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '6px',
                      border: isChecked ? '1.5px solid #252622' : '1px solid #E7E1D5',
                      background: isChecked ? '#FFFFFF' : '#FAF8F2',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '5px',
                        background: isChecked ? '#252622' : '#F3F0E7',
                        color: isChecked ? '#FAF8F2' : '#777970',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {feat.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                          {feat.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#777970', marginTop: '2px' }}>
                          {feat.desc}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: isChecked ? '1px solid #252622' : '1px solid #C5C7BC',
                      background: isChecked ? '#252622' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isChecked && <Check size={13} color="#FFFFFF" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: ENVIRONMENTAL INTELLIGENCE */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1.25rem', borderRadius: '6px', border: '1px solid #E7E1D5', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                  <Wind size={16} color="#365FA8" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                    CIRCULATION FLOW & PRIVACY HIERARCHY
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#777970', margin: '0 0 1rem 0' }}>
                  The generative solver arranges hallways to minimize dead space and separate public living from private bedroom quarters.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '4px', background: '#FAF8F2', border: '1px solid #E7E1D5' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#252622' }}>Open Central Foyer</div>
                    <div style={{ fontSize: '0.68rem', color: '#777970' }}>Direct visual access to dining & lawn</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '4px', background: '#FAF8F2', border: '1px solid #E7E1D5' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#252622' }}>Acoustic Buffer Vestibule</div>
                    <div style={{ fontSize: '0.68rem', color: '#777970' }}>Insulated bedroom entry corridors</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', borderRadius: '6px', border: '1px solid #E7E1D5', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                  <Sun size={16} color="#B89A64" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                    PASSIVE SOLAR & DAYLIGHT FACTOR (NBC-2016)
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#777970', margin: '0 0 1rem 0' }}>
                  Glazing and fenestration are aligned along the {formData.entryDir} perimeter to ensure NBC 10% minimum floor-to-window ratio.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1, padding: '0.5rem 0.75rem', background: '#FAF8F2', borderRadius: '4px', fontSize: '0.72rem', color: '#474943' }}>
                    • Living rooms oriented for morning diffuse light
                  </div>
                  <div style={{ flex: 1, padding: '0.5rem 0.75rem', background: '#FAF8F2', borderRadius: '4px', fontSize: '0.72rem', color: '#474943' }}>
                    • Bathrooms and utilities placed on natural ventilation shafts
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SYNTHESIZE */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #E7E1D5',
                background: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(37,38,34,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E7E1D5', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: '#D85740', fontWeight: 700 }}>
                      ARCHITECTURAL SPECIFICATION DOSSIER
                    </span>
                    <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.3rem', fontWeight: 600, color: '#252622', margin: '2px 0 0 0' }}>
                      {formData.bedrooms}BHK {formData.duplex ? 'Duplex ' : ''}{formData.entryDir}-Facing Residence
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#252622' }}>
                      {plotArea.toLocaleString()} SQ.FT
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#777970' }}>{formData.length} × {formData.width} FT BOUNDARY</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace" }}>
                  <div>
                    <span style={{ color: '#777970', display: 'block' }}>LEVELS:</span>
                    <strong style={{ color: '#252622' }}>{formData.floors} Floor(s)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#777970', display: 'block' }}>BEDROOMS:</span>
                    <strong style={{ color: '#252622' }}>{formData.bedrooms} Suites</strong>
                  </div>
                  <div>
                    <span style={{ color: '#777970', display: 'block' }}>BATHROOMS:</span>
                    <strong style={{ color: '#252622' }}>{formData.bathrooms} Baths</strong>
                  </div>
                  <div>
                    <span style={{ color: '#777970', display: 'block' }}>ENTRY AXIS:</span>
                    <strong style={{ color: '#365FA8' }}>{formData.entryDir} Road</strong>
                  </div>
                  <div>
                    <span style={{ color: '#777970', display: 'block' }}>VASTU MANDALA:</span>
                    <strong style={{ color: formData.vastuToggle ? '#437A5D' : '#777970' }}>
                      {formData.vastuToggle ? 'Active' : 'Unchecked'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#777970', display: 'block' }}>CIRCULATION:</span>
                    <strong style={{ color: '#252622' }}>Optimized Flow</strong>
                  </div>
                </div>
              </div>

              {/* Multi-Floor Architecture Wizard launcher button */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: '6px',
                border: '1px solid #365FA8',
                background: 'rgba(54, 95, 168, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#365FA8', fontFamily: "'JetBrains Mono', monospace" }}>
                    MULTI-FLOOR ARCHITECTURE WIZARD (PRO)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#474943', marginTop: '2px' }}>
                    Configure floor-by-floor zoning, stair cores & vertical load alignments
                  </div>
                </div>
                <button
                  onClick={onOpenMultiFloorModal}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #365FA8',
                    background: '#FFFFFF',
                    color: '#365FA8',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                  }}
                >
                  OPEN WIZARD →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Interactive SVG Plot Diagram */}
        <div style={{
          width: '360px',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.25rem',
          boxShadow: '0 4px 16px rgba(37,38,34,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#252622' }}>
              LIVE PLOT TOPOLOGY
            </span>
            <span style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: '#777970' }}>
              1:100 CAD SCALE
            </span>
          </div>

          {/* SVG Plot Preview */}
          <div style={{
            flex: 1,
            minHeight: '260px',
            background: '#FAF8F2',
            borderRadius: '6px',
            border: '1px solid #E7E1D5',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <svg
              viewBox="0 0 200 240"
              style={{ width: '100%', height: '100%', padding: '15px' }}
            >
              {/* Construction Grid lines */}
              <defs>
                <pattern id="wizardGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(37, 38, 34, 0.05)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="200" height="240" fill="url(#wizardGrid)" />

              {/* Plot Boundary Rectangle */}
              {(() => {
                const maxDim = Math.max(formData.length, formData.width, 30);
                const scale = 140 / maxDim;
                const pw = formData.width * scale;
                const pl = formData.length * scale;
                const px = (200 - pw) / 2;
                const py = (240 - pl) / 2;

                return (
                  <g>
                    {/* Setback dash line */}
                    <rect
                      x={px - 8}
                      y={py - 8}
                      width={pw + 16}
                      height={pl + 16}
                      fill="none"
                      stroke="#A1A399"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />

                    {/* Main Building Envelope */}
                    <rect
                      x={px}
                      y={py}
                      width={pw}
                      height={pl}
                      fill="rgba(37, 38, 34, 0.04)"
                      stroke="#252622"
                      strokeWidth="2.5"
                    />

                    {/* Dimension annotations */}
                    {/* Width (Top) */}
                    <line x1={px} y1={py - 12} x2={px + pw} y2={py - 12} stroke="#365FA8" strokeWidth="1" />
                    <line x1={px - 2} y1={py - 15} x2={px + 2} y2={py - 9} stroke="#365FA8" strokeWidth="1.2" />
                    <line x1={px + pw - 2} y1={py - 15} x2={px + pw + 2} y2={py - 9} stroke="#365FA8" strokeWidth="1.2" />
                    <text x={px + pw / 2} y={py - 16} textAnchor="middle" fill="#365FA8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                      {formData.width} FT
                    </text>

                    {/* Length (Left) */}
                    <line x1={px - 14} y1={py} x2={px - 14} y2={py + pl} stroke="#365FA8" strokeWidth="1" />
                    <line x1={px - 17} y1={py - 2} x2={px - 11} y2={py + 2} stroke="#365FA8" strokeWidth="1.2" />
                    <line x1={px - 17} y1={py + pl - 2} x2={px - 11} y2={py + pl + 2} stroke="#365FA8" strokeWidth="1.2" />
                    <text x={px - 18} y={py + pl / 2} textAnchor="middle" fill="#365FA8" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700" transform={`rotate(-90 ${px - 18} ${py + pl / 2})`}>
                      {formData.length} FT
                    </text>

                    {/* Orientation road arrow */}
                    {(() => {
                      const dir = formData.entryDir.toLowerCase();
                      let arrowX = px + pw / 2;
                      let arrowY = py + pl + 14;
                      if (dir === 'north') { arrowY = py - 14; }
                      if (dir === 'east') { arrowX = px + pw + 14; arrowY = py + pl / 2; }
                      if (dir === 'west') { arrowX = px - 18; arrowY = py + pl / 2; }

                      return (
                        <g>
                          <circle cx={arrowX} cy={arrowY} r="8" fill="#D85740" />
                          <text x={arrowX} y={arrowY + 2.5} textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">
                            {formData.entryDir.charAt(0)}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Center Area watermark */}
                    <text x="100" y="118" textAnchor="middle" fill="#777970" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                      {plotArea} SQ.FT
                    </text>
                    <text x="100" y="130" textAnchor="middle" fill="#A1A399" fontSize="7" fontFamily="'JetBrains Mono', monospace">
                      {formData.bedrooms}BHK · {formData.floors}F
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Telemetry Summary */}
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E7E1D5', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#474943', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#777970' }}>Built-up Footprint:</span>
              <strong>{Math.round(plotArea * 0.72)} sqft (72% Coverage)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#777970' }}>Frontage Aspect Ratio:</span>
              <strong>{(formData.width / formData.length).toFixed(2)}:1</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#777970' }}>Entry Road Axis:</span>
              <strong style={{ color: '#365FA8' }}>{formData.entryDir} Facing</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Wizard Footer Navigation Bar ── */}
      <div style={{
        padding: '1rem 2.5rem',
        borderTop: '1px solid #E7E1D5',
        background: '#FAF8F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '5px',
            border: '1px solid #E7E1D5',
            background: '#FFFFFF',
            color: currentStep === 1 ? '#C5C7BC' : '#474943',
            fontSize: '0.78rem',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ArrowLeft size={13} />
          <span>PREVIOUS</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '5px',
                border: 'none',
                background: '#252622',
                color: '#FAF8F2',
                fontSize: '0.78rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37,38,34,0.15)',
              }}
            >
              <span>CONTINUE</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '5px',
                border: 'none',
                background: '#D85740',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(216, 87, 64, 0.3)',
                letterSpacing: '0.02em',
              }}
            >
              <Sparkles size={14} />
              <span>{isGenerating ? 'GENERATING ARCHITECTURAL BLUEPRINT...' : 'GENERATE ARCHITECTURAL PLANS'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
