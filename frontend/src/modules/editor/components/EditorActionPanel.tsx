import React from 'react';

interface EditorActionPanelProps {
  currentRoomsLength: number;
  saveLoading: boolean;
  dxfLoading: boolean;
  reportLoading: boolean;
  loading: boolean;
  showCirculation: boolean;
  floorCirculation: boolean;
  showSunlight: boolean;
  hasSunlightResult: boolean;
  show3D: boolean;
  
  onSaveToDatabase: () => void;
  onExportDxf: () => void;
  onExportReport: () => void;
  onGenerate: () => void;
  onToggleCirculation: (v: boolean | ((prev: boolean) => boolean)) => void;
  onToggleSunlight: (v: boolean | ((prev: boolean) => boolean)) => void;
  onToggle3D: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export default function EditorActionPanel({
  currentRoomsLength, saveLoading, dxfLoading, reportLoading, loading,
  showCirculation, floorCirculation, showSunlight, hasSunlightResult, show3D,
  onSaveToDatabase, onExportDxf, onExportReport, onGenerate,
  onToggleCirculation, onToggleSunlight, onToggle3D
}: EditorActionPanelProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
  };

  const baseBtnStyle: React.CSSProperties = {
    padding: '0.5rem 0.6rem',
    fontSize: '0.72rem',
    borderRadius: '6px',
    border: '1px solid #E7E1D5',
    background: '#FAF8F2',
    color: '#474943',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const getToggleStyle = (isActive: boolean, activeTheme: 'sage' | 'brass' | 'cobalt' | 'vermilion'): React.CSSProperties => {
    const bgMap = {
      sage: 'rgba(161, 174, 151, 0.18)',
      brass: 'rgba(184, 154, 100, 0.18)',
      cobalt: 'rgba(54, 95, 168, 0.14)',
      vermilion: 'rgba(216, 87, 64, 0.12)',
    };
    const colorMap = {
      sage: '#252622',
      brass: '#B89A64',
      cobalt: '#365FA8',
      vermilion: '#D85740',
    };
    const borderMap = {
      sage: '#A1AE97',
      brass: '#B89A64',
      cobalt: '#365FA8',
      vermilion: '#D85740',
    };

    return {
      ...baseBtnStyle,
      background: isActive ? bgMap[activeTheme] : '#FAF8F2',
      borderColor: isActive ? borderMap[activeTheme] : '#E7E1D5',
      color: isActive ? colorMap[activeTheme] : '#777970',
      fontWeight: isActive ? 700 : 600,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #E7E1D5', paddingTop: '1rem' }}>
      {/* Primary Save Button */}
      <button 
        onClick={onSaveToDatabase} 
        disabled={saveLoading || !currentRoomsLength} 
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          borderRadius: '6px',
          border: '1px solid #252622',
          background: '#252622',
          color: '#FAF8F2',
          boxShadow: '0 2px 8px rgba(37, 38, 34, 0.15)',
          cursor: saveLoading || !currentRoomsLength ? 'not-allowed' : 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.15s ease',
          opacity: saveLoading || !currentRoomsLength ? 0.6 : 1,
        }}
      >
        {saveLoading ? (
          <>
            <span className="spinner" style={{ width: '13px', height: '13px', borderColor: '#FAF8F2', borderTopColor: 'transparent' }}></span>
            ARCHIVING DESIGN TO STUDIO...
          </>
        ) : (
          <>SAVE PROJECT ARCHIVE</>
        )}
      </button>
      
      <div style={gridStyle}>
        {/* CAD DXF Export */}
        <button 
          onClick={onExportDxf} 
          disabled={dxfLoading || !currentRoomsLength}
          title="Export multi-floor CAD drawing in AutoCAD DXF format with standard layers"
          style={{
            ...baseBtnStyle,
            borderColor: dxfLoading ? '#365FA8' : '#E7E1D5',
            color: dxfLoading ? '#365FA8' : '#252622',
            cursor: dxfLoading || !currentRoomsLength ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => {
            if (!dxfLoading && currentRoomsLength) {
              e.currentTarget.style.borderColor = '#365FA8';
              e.currentTarget.style.color = '#365FA8';
            }
          }}
          onMouseLeave={e => {
            if (!dxfLoading) {
              e.currentTarget.style.borderColor = '#E7E1D5';
              e.currentTarget.style.color = '#252622';
            }
          }}
        >
          {dxfLoading ? (
            <>
              <span className="spinner" style={{ width: '11px', height: '11px', borderColor: '#365FA8', borderTopColor: 'transparent' }}></span>
              DXF...
            </>
          ) : (
            <>CAD (DXF)</>
          )}
        </button>

        {/* PDF Blueprint Dossier Export */}
        <button 
          onClick={onExportReport} 
          disabled={reportLoading || !currentRoomsLength}
          title="Export multi-page Architectural Blueprint Dossier PDF"
          style={{
            ...baseBtnStyle,
            borderColor: reportLoading ? '#D85740' : '#E7E1D5',
            color: reportLoading ? '#D85740' : '#252622',
            cursor: reportLoading || !currentRoomsLength ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => {
            if (!reportLoading && currentRoomsLength) {
              e.currentTarget.style.borderColor = '#D85740';
              e.currentTarget.style.color = '#D85740';
            }
          }}
          onMouseLeave={e => {
            if (!reportLoading) {
              e.currentTarget.style.borderColor = '#E7E1D5';
              e.currentTarget.style.color = '#252622';
            }
          }}
        >
          {reportLoading ? (
            <>
              <span className="spinner" style={{ width: '11px', height: '11px', borderColor: '#D85740', borderTopColor: 'transparent' }}></span>
              PDF...
            </>
          ) : (
            <>PDF DOSSIER</>
          )}
        </button>

        {/* Redraw / Regenerate */}
        <button 
          onClick={onGenerate} 
          disabled={loading}
          style={{
            ...baseBtnStyle,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.borderColor = '#252622';
              e.currentTarget.style.color = '#252622';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#E7E1D5';
            e.currentTarget.style.color = '#474943';
          }}
        >
          {loading ? '...' : '↻ REDRAW'}
        </button>
        
        {/* Circulation Overlay Toggle */}
        <button
          onClick={() => onToggleCirculation(v => !v)}
          disabled={!floorCirculation}
          title={floorCirculation ? 'Toggle circulation path overlay' : 'Generate a plan to see paths'}
          style={getToggleStyle(showCirculation, 'sage')}
        >
          {showCirculation ? 'CIRCULATION ON' : 'CIRCULATION'}
        </button>

        {/* Sunlight Analysis Toggle */}
        <button
          onClick={() => onToggleSunlight(v => !v)}
          disabled={!hasSunlightResult}
          title={hasSunlightResult ? 'Toggle sunlight overlay' : 'Generate a plan to see sunlight'}
          style={getToggleStyle(showSunlight, 'brass')}
        >
          {showSunlight ? 'SOLAR ON' : 'SOLAR PATH'}
        </button>

        {/* 2D / 3D Switcher */}
        <button
          onClick={() => onToggle3D(v => !v)}
          disabled={!currentRoomsLength}
          style={getToggleStyle(show3D, 'vermilion')}
        >
          {show3D ? 'VIEW 3D' : 'VIEW 2D'}
        </button>
      </div>
    </div>
  );
}
