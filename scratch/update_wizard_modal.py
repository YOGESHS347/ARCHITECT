import sys

modal_path = r'c:\Users\yoges\OneDrive\Desktop\architect\AI-Architect\frontend\src\modules\editor\components\MultiFloorWizardModal.tsx'

with open(modal_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Normalize line endings to \n
text = text.replace('\r\n', '\n')

# 1. Update Stepper & Scroll Area
stepper_search = """          {/* ── Stepper Navigation ── */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(0, 242, 254, 0.15)',
              background: '#090A0F',
              padding: '0.75rem 1.75rem',
              gap: '2rem',
            }}
          >
            {[
              { step: 1, title: '01 // GLOBAL PLOT & MASSING' },
              { step: 2, title: '02 // FLOOR PROGRAMS & CORES' },
              { step: 3, title: '03 // BLUEPRINT AUDIT & SYNTHESIS' },
            ].map(s => {
              const isActive = currentStep === s.step;
              const isCompleted = currentStep > s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step as 1 | 2 | 3)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    paddingBottom: '0.4rem',
                    borderBottom: isActive ? '2px solid #00F2FE' : '2px solid transparent',
                    color: isActive ? '#00F2FE' : isCompleted ? '#10B981' : '#64748B',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      backgroundColor: isActive ? 'rgba(0, 242, 254, 0.2)' : isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#00F2FE' : isCompleted ? '#10B981' : '#64748B',
                      border: isActive ? '1px solid #00F2FE' : isCompleted ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                      fontWeight: 700,
                    }}
                  >
                    {isCompleted ? '✓' : s.step}
                  </span>
                  {s.title}
                </button>
              );
            })}
          </div>

          {/* ── Modal Body Scroll Area ── */}
          <div
            style={{
              padding: '1.5rem 1.75rem',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#090A0F',
            }}
          >"""

stepper_replace = """          {/* ── Stepper Navigation: Atelier Studio Stages ── */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E7E1D5',
              background: '#F3F0E7',
              padding: '0.75rem 1.75rem',
              gap: '2rem',
            }}
          >
            {[
              { step: 1, title: '01 // GLOBAL PLOT & MASSING' },
              { step: 2, title: '02 // FLOOR PROGRAMS & CORES' },
              { step: 3, title: '03 // BLUEPRINT AUDIT & SYNTHESIS' },
            ].map(s => {
              const isActive = currentStep === s.step;
              const isCompleted = currentStep > s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step as 1 | 2 | 3)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    paddingBottom: '0.4rem',
                    borderBottom: isActive ? '2px solid #252622' : '2px solid transparent',
                    color: isActive ? '#252622' : isCompleted ? '#365FA8' : '#777970',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.03em',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.68rem',
                      backgroundColor: isActive ? '#252622' : isCompleted ? 'rgba(54, 95, 168, 0.12)' : '#FFFFFF',
                      color: isActive ? '#FAF8F2' : isCompleted ? '#365FA8' : '#777970',
                      border: isActive ? '1px solid #252622' : isCompleted ? '1px solid #365FA8' : '1px solid #E7E1D5',
                      fontWeight: 700,
                    }}
                  >
                    {isCompleted ? '✓' : s.step}
                  </span>
                  {s.title}
                </button>
              );
            })}
          </div>

          {/* ── Modal Body Scroll Area ── */}
          <div
            style={{
              padding: '1.5rem 1.75rem',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#FAF8F2',
            }}
          >"""

if stepper_search in text:
    text = text.replace(stepper_search, stepper_replace)
    print("Stepper replaced successfully!")
else:
    print("WARNING: Stepper search not found!")

# 2. Update Step 1 Containers, Inputs, and Toggles
# Plot Dimensions Card
text = text.replace(
    "background: '#0E121B',\n                        padding: '1.25rem',\n                        borderRadius: '12px',\n                        border: '1px solid rgba(0, 242, 254, 0.15)',",
    "background: '#FFFFFF',\n                        padding: '1.25rem',\n                        borderRadius: '8px',\n                        border: '1px solid #E7E1D5',\n                        boxShadow: '0 2px 8px rgba(37,38,34,0.04)',"
)

# Text colors in Step 1
text = text.replace(
    "color: '#E2E8F0', fontFamily: \"'JetBrains Mono', monospace\"",
    "color: '#252622', fontFamily: \"'Plus Jakarta Sans', sans-serif\""
)
text = text.replace(
    "background: '#090A0F', padding: '0.2rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)'",
    "background: '#FAF8F2', padding: '0.2rem', borderRadius: '6px', border: '1px solid #E7E1D5'"
)
text = text.replace(
    "background: unit === 'ft' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',\n                              color: unit === 'ft' ? '#00F2FE' : '#64748B',",
    "background: unit === 'ft' ? '#252622' : 'transparent',\n                              color: unit === 'ft' ? '#FAF8F2' : '#777970',"
)
text = text.replace(
    "background: unit === 'm' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',\n                              color: unit === 'm' ? '#00F2FE' : '#64748B',",
    "background: unit === 'm' ? '#252622' : 'transparent',\n                              color: unit === 'm' ? '#FAF8F2' : '#777970',"
)

# Number inputs styling in Step 1
text = text.replace(
    "border: '1px solid rgba(0, 242, 254, 0.25)',\n                              background: '#090A0F',\n                              color: '#00F2FE',",
    "border: '1px solid #E7E1D5',\n                              background: '#FAF8F2',\n                              color: '#252622',"
)

# Footprint box
text = text.replace(
    "background: '#090A0F',\n                            padding: '0.5rem 0.75rem',\n                            borderRadius: '8px',\n                            border: '1px solid rgba(0, 242, 254, 0.15)',",
    "background: '#F3F0E7',\n                            padding: '0.5rem 0.75rem',\n                            borderRadius: '6px',\n                            border: '1px solid #E7E1D5',"
)
text = text.replace(
    "color: '#00F2FE', fontFamily: \"'JetBrains Mono', monospace\"",
    "color: '#252622', fontFamily: \"'JetBrains Mono', monospace\""
)

# Floor Count & Duplex Configuration
text = text.replace(
    "border: floorsCount === n ? '1px solid #00F2FE' : '1px solid rgba(255,255,255,0.08)',\n                                  background: floorsCount === n ? 'rgba(0, 242, 254, 0.15)' : '#090A0F',\n                                  color: floorsCount === n ? '#00F2FE' : '#94A3B8',",
    "border: floorsCount === n ? '1px solid #252622' : '1px solid #E7E1D5',\n                                  background: floorsCount === n ? '#252622' : '#FAF8F2',\n                                  color: floorsCount === n ? '#FAF8F2' : '#474943',"
)
text = text.replace(
    "border: isDuplex ? '1px solid #EC4899' : '1px solid rgba(255,255,255,0.08)',\n                              background: isDuplex ? 'rgba(236, 72, 153, 0.12)' : '#090A0F',",
    "border: isDuplex ? '1px solid #D85740' : '1px solid #E7E1D5',\n                              background: isDuplex ? 'rgba(216, 87, 64, 0.08)' : '#FAF8F2',"
)
text = text.replace(
    "color: isDuplex ? '#F472B6' : '#94A3B8'",
    "color: isDuplex ? '#D85740' : '#474943'"
)

# Orientation buttons
text = text.replace(
    "border: orientation === dir.id ? '1px solid #00F2FE' : '1px solid rgba(255,255,255,0.08)',\n                              background: orientation === dir.id ? 'rgba(0, 242, 254, 0.15)' : '#090A0F',\n                              color: orientation === dir.id ? '#00F2FE' : '#94A3B8',",
    "border: orientation === dir.id ? '1px solid #365FA8' : '1px solid #E7E1D5',\n                              background: orientation === dir.id ? '#365FA8' : '#FAF8F2',\n                              color: orientation === dir.id ? '#FAF8F2' : '#474943',"
)

# Budget Tier buttons
text = text.replace(
    "border: budgetTier === t.id ? '1px solid #00F2FE' : '1px solid rgba(255,255,255,0.08)',\n                              background: budgetTier === t.id ? 'rgba(0, 242, 254, 0.15)' : '#090A0F',\n                              color: budgetTier === t.id ? '#00F2FE' : '#94A3B8',",
    "border: budgetTier === t.id ? '1px solid #B89A64' : '1px solid #E7E1D5',\n                              background: budgetTier === t.id ? '#B89A64' : '#FAF8F2',\n                              color: budgetTier === t.id ? '#FAF8F2' : '#474943',"
)

# 3. Step 2: Floor Switcher Tabs & Room Program
text = text.replace(
    "border: isCurrent ? '1px solid #00F2FE' : '1px solid rgba(255,255,255,0.08)',\n                          background: isCurrent ? 'rgba(0, 242, 254, 0.15)' : '#0E121B',\n                          color: isCurrent ? '#00F2FE' : '#94A3B8',",
    "border: isCurrent ? '1px solid #252622' : '1px solid #E7E1D5',\n                          background: isCurrent ? '#252622' : '#FFFFFF',\n                          color: isCurrent ? '#FAF8F2' : '#474943',"
)
text = text.replace(
    "background: isCurrent ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255,255,255,0.05)',\n                            color: isCurrent ? '#00F2FE' : '#64748B',",
    "background: isCurrent ? 'rgba(255, 255, 255, 0.2)' : '#F3F0E7',\n                            color: isCurrent ? '#FAF8F2' : '#777970',"
)
text = text.replace(
    "color: '#FFFFFF', fontFamily: \"'JetBrains Mono', monospace\"",
    "color: '#252622', fontFamily: \"'Plus Jakarta Sans', sans-serif\""
)
text = text.replace(
    "backgroundColor: 'rgba(236, 72, 153, 0.15)',\n                          color: '#F472B6',\n                          fontWeight: 700,\n                          fontSize: '0.72rem',\n                          border: '1px solid rgba(236, 72, 153, 0.3)',",
    "backgroundColor: 'rgba(216, 87, 64, 0.08)',\n                          color: '#D85740',\n                          fontWeight: 700,\n                          fontSize: '0.72rem',\n                          border: '1px solid #D85740',"
)

# Room Cards grid
text = text.replace(
    "border: isSelected ? '1px solid #00F2FE' : '1px solid rgba(255,255,255,0.08)',\n                            background: isSelected ? 'rgba(0, 242, 254, 0.1)' : '#090A0F',",
    "border: isSelected ? '1px solid #365FA8' : '1px solid #E7E1D5',\n                            background: isSelected ? 'rgba(54, 95, 168, 0.06)' : '#FAF8F2',"
)
text = text.replace(
    "color: isSelected ? '#FFFFFF' : '#94A3B8'",
    "color: isSelected ? '#252622' : '#474943'"
)
text = text.replace(
    "border: isSelected ? '1px solid #00F2FE' : '1px solid rgba(255,255,255,0.15)',\n                                background: isSelected ? '#00F2FE' : 'transparent',\n                                color: '#090A0F',",
    "border: isSelected ? '1px solid #365FA8' : '1px solid #E7E1D5',\n                                background: isSelected ? '#365FA8' : 'transparent',\n                                color: '#FFFFFF',"
)
text = text.replace(
    "background: selectedRoom?.attached_bath ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',\n                                border: selectedRoom?.attached_bath ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',",
    "background: selectedRoom?.attached_bath ? 'rgba(161, 174, 151, 0.2)' : '#FAF8F2',\n                                border: selectedRoom?.attached_bath ? '1px solid #A1AE97' : '1px solid #E7E1D5',"
)
text = text.replace(
    "color: selectedRoom?.attached_bath ? '#10B981' : '#64748B',",
    "color: selectedRoom?.attached_bath ? '#252622' : '#777970',"
)

# Vertical Core lock card
text = text.replace(
    "background: '#0E121B',\n                    border: '1px solid rgba(245, 158, 11, 0.3)',\n                    borderRadius: '12px',",
    "background: '#FAF8F2',\n                    border: '1px solid #B89A64',\n                    borderRadius: '8px',"
)
text = text.replace(
    "color: '#FCD34D', fontFamily: \"'JetBrains Mono', monospace\"",
    "color: '#B89A64', fontFamily: \"'JetBrains Mono', monospace\""
)
text = text.replace(
    "border: staircaseType === 'internal' ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',\n                        background: staircaseType === 'internal' ? 'rgba(245, 158, 11, 0.18)' : '#090A0F',\n                        color: staircaseType === 'internal' ? '#FCD34D' : '#94A3B8',",
    "border: staircaseType === 'internal' ? '1px solid #B89A64' : '1px solid #E7E1D5',\n                        background: staircaseType === 'internal' ? '#B89A64' : '#FFFFFF',\n                        color: staircaseType === 'internal' ? '#FAF8F2' : '#777970',"
)
text = text.replace(
    "border: staircaseType === 'external' ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',\n                        background: staircaseType === 'external' ? 'rgba(245, 158, 11, 0.18)' : '#090A0F',\n                        color: staircaseType === 'external' ? '#FCD34D' : '#94A3B8',",
    "border: staircaseType === 'external' ? '1px solid #B89A64' : '1px solid #E7E1D5',\n                        background: staircaseType === 'external' ? '#B89A64' : '#FFFFFF',\n                        color: staircaseType === 'external' ? '#FAF8F2' : '#777970',"
)

# 4. Step 3: Executive Blueprint Dossier
text = text.replace(
    "background: '#0E121B',\n                    padding: '1.25rem',\n                    borderRadius: '12px',\n                    border: '1px solid rgba(0, 242, 254, 0.25)',\n                    boxShadow: '0 0 20px rgba(0, 242, 254, 0.05)',",
    "background: '#FFFFFF',\n                    padding: '1.25rem',\n                    borderRadius: '8px',\n                    border: '1px solid #E7E1D5',\n                    boxShadow: '0 2px 10px rgba(37,38,34,0.04)',"
)
text = text.replace(
    "color: '#00F2FE', fontFamily: \"'JetBrains Mono', monospace\", letterSpacing: '0.05em'",
    "color: '#252622', fontFamily: \"'Newsreader', Georgia, serif\", letterSpacing: '-0.01em', fontSize: '1.25rem'"
)
text = text.replace(
    "background: 'rgba(16, 185, 129, 0.15)',\n                          color: '#10B981',\n                          border: '1px solid #10B981',",
    "background: 'rgba(161, 174, 151, 0.2)',\n                          color: '#3D5434',\n                          border: '1px solid #A1AE97',"
)
text = text.replace(
    "background: 'rgba(0, 242, 254, 0.15)',\n                          color: '#00F2FE',\n                          border: '1px solid #00F2FE',",
    "background: 'rgba(54, 95, 168, 0.1)',\n                          color: '#365FA8',\n                          border: '1px solid #365FA8',"
)

# Dossier readouts
text = text.replace(
    "background: '#090A0F', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0, 242, 254, 0.15)'",
    "background: '#FAF8F2', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E7E1D5'"
)

# Registered floor plates
text = text.replace(
    "background: '#090A0F',\n                          border: '1px solid rgba(0, 242, 254, 0.15)',",
    "background: '#FAF8F2',\n                          border: '1px solid #E7E1D5',"
)
text = text.replace(
    "background: 'rgba(0, 242, 254, 0.15)',\n                              color: '#00F2FE',\n                              display: 'flex',\n                              alignItems: 'center',\n                              justifyContent: 'center',\n                              fontWeight: 800,\n                              fontSize: '0.75rem',\n                              fontFamily: \"'JetBrains Mono', monospace\",\n                              border: '1px solid rgba(0, 242, 254, 0.3)',",
    "background: '#252622',\n                              color: '#FAF8F2',\n                              display: 'flex',\n                              alignItems: 'center',\n                              justifyContent: 'center',\n                              fontWeight: 700,\n                              fontSize: '0.72rem',\n                              fontFamily: \"'JetBrains Mono', monospace\",\n                              border: '1px solid #252622',"
)
text = text.replace(
    "color: '#FFFFFF'}>{fl.name}",
    "color: '#252622'}>{fl.name}"
)
text = text.replace(
    "background: 'rgba(255, 255, 255, 0.05)',\n                                border: '1px solid rgba(255, 255, 255, 0.1)',\n                                color: '#94A3B8',",
    "background: '#FFFFFF',\n                                border: '1px solid #E7E1D5',\n                                color: '#474943',"
)

# 5. Footer actions
footer_search = """          {/* ── Modal Footer ── */}
          <div
            style={{
              padding: '1rem 1.75rem',
              borderTop: '1px solid rgba(0, 242, 254, 0.15)',
              background: '#090A0F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
                  disabled={loading}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'transparent',
                    color: '#94A3B8',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ← BACK
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                CANCEL
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3)}
                  style={{
                    padding: '0.55rem 1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #00F2FE',
                    background: 'rgba(0, 242, 254, 0.15)',
                    color: '#00F2FE',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 242, 254, 0.2)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  NEXT STEP →
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    padding: '0.55rem 1.75rem',
                    borderRadius: '8px',
                    border: '1px solid #00F2FE',
                    background: loading ? 'rgba(0, 242, 254, 0.3)' : '#00F2FE',
                    color: '#090A0F',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                      SOLVING SPATIAL MATRIX...
                    </>
                  ) : (
                    <>⚡ SYNTHESIZE ARCHITECTURAL BLUEPRINTS</>
                  )}
                </button>
              )}
            </div>
          </div>"""

footer_replace = """          {/* ── Modal Footer: Atelier Studio Controls ── */}
          <div
            style={{
              padding: '1rem 1.75rem',
              borderTop: '1px solid #E7E1D5',
              background: '#FAF8F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
                  disabled={loading}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: '1px solid #E7E1D5',
                    background: '#FFFFFF',
                    color: '#474943',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ← BACK
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  border: '1px solid #E7E1D5',
                  background: 'transparent',
                  color: '#777970',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                CANCEL
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3)}
                  style={{
                    padding: '0.55rem 1.5rem',
                    borderRadius: '6px',
                    border: '1px solid #252622',
                    background: '#252622',
                    color: '#FAF8F2',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37,38,34,0.12)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  NEXT STEP →
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    padding: '0.55rem 1.75rem',
                    borderRadius: '6px',
                    border: '1px solid #252622',
                    background: loading ? '#474943' : '#252622',
                    color: '#FAF8F2',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37,38,34,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                      SOLVING SPATIAL MATRIX...
                    </>
                  ) : (
                    <>⚡ SYNTHESIZE ARCHITECTURAL BLUEPRINTS</>
                  )}
                </button>
              )}
            </div>
          </div>"""

if footer_search in text:
    text = text.replace(footer_search, footer_replace)
    print("Footer replaced successfully!")
else:
    print("WARNING: Footer search not found!")

with open(modal_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Finished updating MultiFloorWizardModal!")
