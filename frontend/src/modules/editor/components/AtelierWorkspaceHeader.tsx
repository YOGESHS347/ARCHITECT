import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Download, 
  Layers, 
  Box, 
  FileText, 
  Columns, 
  SlidersHorizontal,
  ChevronDown,
  FileCode,
  FileSpreadsheet,
  Undo2,
  Redo2,
  Compass,
  Edit2,
  Camera,
  Image as ImageIcon,
  LayoutTemplate
} from 'lucide-react';
import type { ExportResolutionPreset } from '../geometry';

export type WorkspaceMode = 'brief' | '2d' | '3d' | 'analysis' | 'compare';

interface AtelierWorkspaceHeaderProps {
  projectName: string;
  onProjectNameChange: (newName: string) => void;
  plotWidth: number;
  plotHeight: number;
  entryDir: string;
  activeFloorName: string;
  totalFloors: number;
  activeFloorIndex?: number;
  floorNames?: string[];
  onSelectFloor?: (index: number) => void;
  vastuScore?: number;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  activeMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  hasActivePlan: boolean;
  alternativeCount: number;
  
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onExportDxf: () => void;
  isExportingDxf: boolean;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  onExport3D?: (resolution: ExportResolutionPreset) => void;
  isExporting3D?: boolean;
  onExport2D?: (format: 'svg' | 'png') => void;
  isExporting2D?: boolean;
  onExportPresentationSheet?: () => void;
  isExportingPresentationSheet?: boolean;
  
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  
  isFurnitureDrawerOpen: boolean;
  onToggleFurnitureDrawer: () => void;
}

export const AtelierWorkspaceHeader: React.FC<AtelierWorkspaceHeaderProps> = ({
  projectName,
  onProjectNameChange,
  plotWidth,
  plotHeight,
  entryDir,
  activeFloorName,
  totalFloors,
  activeFloorIndex = 0,
  floorNames,
  onSelectFloor,
  vastuScore,
  saveStatus,
  activeMode,
  onModeChange,
  hasActivePlan,
  alternativeCount,
  onBack,
  onGenerate,
  isGenerating,
  onExportDxf,
  isExportingDxf,
  onExportPdf,
  isExportingPdf,
  onExport3D,
  isExporting3D = false,
  onExport2D,
  isExporting2D = false,
  onExportPresentationSheet,
  isExportingPresentationSheet = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isFurnitureDrawerOpen,
  onToggleFurnitureDrawer,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(projectName);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setNameValue(projectName);
  }, [projectName]);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameValue.trim() && nameValue !== projectName) {
      onProjectNameChange(nameValue.trim());
    } else {
      setNameValue(projectName);
    }
  };

  const modeTabs: { id: WorkspaceMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'brief', label: 'Brief & Plot', icon: <SlidersHorizontal size={14} /> },
    { id: '2d', label: '2D Drafting', icon: <Layers size={14} /> },
    { id: '3d', label: '3D Massing', icon: <Box size={14} /> },
    { id: 'analysis', label: 'Compliance', icon: <FileText size={14} />, badge: vastuScore ? `${vastuScore}pt` : undefined },
    { id: 'compare', label: 'Alternatives', icon: <Columns size={14} />, badge: alternativeCount > 1 ? `${alternativeCount}` : undefined },
  ];

  return (
    <header style={{
      height: '54px',
      minHeight: '54px',
      maxHeight: '54px',
      padding: '0 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#FAF8F2',
      borderBottom: '1px solid #E7E1D5',
      boxShadow: '0 1px 4px rgba(37, 38, 34, 0.04)',
      position: 'relative',
      zIndex: 50,
      userSelect: 'none',
      gap: '1rem',
    }}>
      {/* ── Left: Navigation & Project Identity ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '5px',
            border: '1px solid #E7E1D5',
            background: '#FFFFFF',
            color: '#474943',
            fontSize: '0.74rem',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#252622';
            e.currentTarget.style.color = '#252622';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#E7E1D5';
            e.currentTarget.style.color = '#474943';
          }}
          title="Return to Atelier Project Archive"
        >
          <ArrowLeft size={13} />
          <span>STUDIO</span>
        </button>

        <div style={{ width: '1px', height: '18px', background: '#E7E1D5' }} />

        {/* Project Name Editor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isEditingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setNameValue(projectName);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: '1rem',
                fontWeight: 600,
                color: '#252622',
                padding: '2px 8px',
                border: '1px solid #365FA8',
                borderRadius: '4px',
                background: '#FFFFFF',
                outline: 'none',
                minWidth: '220px',
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: '4px',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F0E7'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              title="Click to rename design sheet"
            >
              <span style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: '1.02rem',
                fontWeight: 600,
                color: '#252622',
                letterSpacing: '-0.01em',
              }}>
                {projectName || 'Untitled Architectural Design'}
              </span>
              <Edit2 size={11} color="#777970" />
            </div>
          )}

          {/* Save Status Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: '12px',
            background: saveStatus === 'saving' ? 'rgba(184, 154, 100, 0.12)' : 'rgba(67, 122, 93, 0.08)',
            border: `1px solid ${saveStatus === 'saving' ? '#B89A64' : 'rgba(67, 122, 93, 0.2)'}`,
            fontSize: '0.66rem',
            fontFamily: "'JetBrains Mono', monospace",
            color: saveStatus === 'saving' ? '#B89A64' : '#437A5D',
            fontWeight: 600,
          }}>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: saveStatus === 'saving' ? '#B89A64' : '#437A5D',
            }} />
            <span>{saveStatus === 'saving' ? 'SAVING...' : 'SAVED'}</span>
          </div>
        </div>

        {/* Undo / Redo */}
        {(onUndo || onRedo) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '0.25rem' }}>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              style={{
                background: 'transparent',
                border: 'none',
                color: canUndo ? '#474943' : '#C5C7BC',
                cursor: canUndo ? 'pointer' : 'default',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
              }}
              title="Undo modification (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              style={{
                background: 'transparent',
                border: 'none',
                color: canRedo ? '#474943' : '#C5C7BC',
                cursor: canRedo ? 'pointer' : 'default',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
              }}
              title="Redo modification (Ctrl+Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Center: Architectural Workspace Mode Tabs ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        background: '#EFECE6',
        padding: '3px',
        borderRadius: '7px',
        border: '1px solid #E7E1D5',
        gap: '2px',
      }}>
        {modeTabs.map(tab => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '5px',
                border: 'none',
                background: isActive ? '#FAF8F2' : 'transparent',
                color: isActive ? '#252622' : '#777970',
                fontSize: '0.74rem',
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                boxShadow: isActive ? '0 1px 3px rgba(37, 38, 34, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ color: isActive ? '#D85740' : '#777970' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(216, 87, 64, 0.1)' : 'rgba(37, 38, 34, 0.06)',
                  color: isActive ? '#D85740' : '#777970',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Right: Telemetry & Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Plot Telemetry Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 9px',
          background: '#F3F0E7',
          border: '1px solid #E7E1D5',
          borderRadius: '5px',
          fontSize: '0.68rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#474943',
        }}>
          <span>{plotWidth}×{plotHeight} FT</span>
          <span style={{ color: '#C5C7BC' }}>/</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#365FA8', fontWeight: 600 }}>
            <Compass size={11} />
            {entryDir.toUpperCase()}
          </span>
          <span style={{ color: '#C5C7BC' }}>/</span>
          {totalFloors > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {Array.from({ length: totalFloors }).map((_, i) => {
                const isSelected = i === activeFloorIndex;
                const rawName = floorNames?.[i] || (i === 0 ? 'Ground' : `L${i}`);
                const shortName = rawName.replace(/ Floor/i, '').trim();
                return (
                  <button
                    key={i}
                    id={`btn-hdr-floor-${i}`}
                    onClick={() => onSelectFloor?.(i)}
                    style={{
                      padding: '1px 6px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #252622' : '1px solid #E7E1D5',
                      background: isSelected ? '#252622' : 'transparent',
                      color: isSelected ? '#FAF8F2' : '#777970',
                      fontSize: '0.64rem',
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Switch to ${floorNames?.[i] || `Level ${i}`}`}
                  >
                    {`L${i} ${shortName}`}
                  </button>
                );
              })}
            </div>
          ) : (
            <span style={{ color: '#777970' }}>{activeFloorName}</span>
          )}
          {vastuScore !== undefined && (
            <>
              <span style={{ color: '#C5C7BC' }}>/</span>
              <span style={{ color: vastuScore >= 60 ? '#437A5D' : '#B89A64', fontWeight: 700 }}>
                {vastuScore}/100 VASTU
              </span>
            </>
          )}
        </div>

        {/* Furniture Studio Button */}
        <button
          onClick={onToggleFurnitureDrawer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 9px',
            borderRadius: '5px',
            border: isFurnitureDrawerOpen ? '1px solid #252622' : '1px solid #E7E1D5',
            background: isFurnitureDrawerOpen ? '#252622' : '#FFFFFF',
            color: isFurnitureDrawerOpen ? '#FAF8F2' : '#474943',
            fontSize: '0.72rem',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Open Furniture & Lighting Catalog Studio"
        >
          <span>🛋️</span>
          <span>FURNITURE</span>
        </button>

        {/* Export Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(prev => !prev)}
            disabled={!hasActivePlan}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '5px',
              border: '1px solid #E7E1D5',
              background: '#FFFFFF',
              color: hasActivePlan ? '#252622' : '#A1A399',
              fontSize: '0.72rem',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: hasActivePlan ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={12} />
            <span>EXPORT</span>
            <ChevronDown size={11} />
          </button>

          {showExportMenu && hasActivePlan && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: '260px',
                background: '#FAF8F2',
                border: '1px solid #E7E1D5',
                borderRadius: '7px',
                boxShadow: '0 8px 24px rgba(37, 38, 34, 0.12)',
                padding: '6px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              {/* 1. Master Architectural Presentation Sheet */}
              <button
                id="export-3d-sheet-btn"
                onClick={() => { setShowExportMenu(false); onExportPresentationSheet?.(); }}
                disabled={isExportingPresentationSheet}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  background: 'transparent',
                  color: '#252622',
                  fontSize: '0.74rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'left',
                  cursor: isExportingPresentationSheet ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F0E7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LayoutTemplate size={15} color="#D85740" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Presentation Sheet</span>
                    <span style={{ fontSize: '0.60rem', background: '#D85740', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>PNG</span>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#777970' }}>2D Plan + 3D View + Title Block</div>
                </div>
              </button>

              {/* 2. 3D Architectural Spatial Render */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 8px',
                  borderRadius: '5px',
                  background: 'rgba(184, 154, 100, 0.08)',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} color="#B89A64" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#252622' }}>
                    3D Perspective Render
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                  <button
                    id="export-3d-viewport-btn"
                    onClick={() => { setShowExportMenu(false); onExport3D?.('viewport'); }}
                    disabled={isExporting3D}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: '0.62rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      border: '1px solid #E7E1D5',
                      background: '#FFFFFF',
                      color: '#252622',
                      borderRadius: '3px',
                      cursor: isExporting3D ? 'not-allowed' : 'pointer',
                    }}
                    title="Export Current 3D Viewport Snapshot"
                  >
                    VIEWPORT
                  </button>
                  <button
                    id="export-3d-1080p-btn"
                    onClick={() => { setShowExportMenu(false); onExport3D?.('1080p'); }}
                    disabled={isExporting3D}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: '0.62rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      border: '1px solid #B89A64',
                      background: '#FFFFFF',
                      color: '#B89A64',
                      borderRadius: '3px',
                      cursor: isExporting3D ? 'not-allowed' : 'pointer',
                    }}
                    title="Export Full HD 1080p Architectural Render (1920×1080)"
                  >
                    1080P
                  </button>
                  <button
                    id="export-3d-4k-btn"
                    onClick={() => { setShowExportMenu(false); onExport3D?.('4k'); }}
                    disabled={isExporting3D}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: '0.62rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      border: '1px solid #E7E1D5',
                      background: '#FFFFFF',
                      color: '#252622',
                      borderRadius: '3px',
                      cursor: isExporting3D ? 'not-allowed' : 'pointer',
                    }}
                    title="Export Ultra-HD 4K Architectural Render (3840×2160)"
                  >
                    4K
                  </button>
                </div>
              </div>

              {/* 3. 2D Floor Plan Exports */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => { setShowExportMenu(false); onExport2D?.('svg'); }}
                  disabled={isExporting2D}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #E7E1D5',
                    background: '#FFFFFF',
                    color: '#252622',
                    fontSize: '0.70rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: isExporting2D ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F3F0E7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <FileCode size={13} color="#365FA8" />
                  <span style={{ fontWeight: 600 }}>2D (.SVG)</span>
                </button>
                <button
                  onClick={() => { setShowExportMenu(false); onExport2D?.('png'); }}
                  disabled={isExporting2D}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #E7E1D5',
                    background: '#FFFFFF',
                    color: '#252622',
                    fontSize: '0.70rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: isExporting2D ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F3F0E7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <ImageIcon size={13} color="#474943" />
                  <span style={{ fontWeight: 600 }}>2D (.PNG)</span>
                </button>
              </div>

              <div style={{ height: '1px', background: '#E7E1D5', margin: '2px 0' }} />

              {/* 4. CAD & PDF Legacy/Dossier */}
              <button
                onClick={() => { setShowExportMenu(false); onExportDxf(); }}
                disabled={isExportingDxf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  background: 'transparent',
                  color: '#252622',
                  fontSize: '0.72rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'left',
                  cursor: isExportingDxf ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F0E7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <FileCode size={13} color="#365FA8" />
                <div>
                  <div style={{ fontWeight: 600 }}>AutoCAD (.DXF)</div>
                  <div style={{ fontSize: '0.60rem', color: '#777970' }}>Layered 1:50 vector lines</div>
                </div>
              </button>

              <button
                onClick={() => { setShowExportMenu(false); onExportPdf(); }}
                disabled={isExportingPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  background: 'transparent',
                  color: '#252622',
                  fontSize: '0.72rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'left',
                  cursor: isExportingPdf ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F0E7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <FileSpreadsheet size={13} color="#D85740" />
                <div>
                  <div style={{ fontWeight: 600 }}>Blueprint Dossier (.PDF)</div>
                  <div style={{ fontSize: '0.60rem', color: '#777970' }}>Executive CAD portfolio</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Primary Generate / Regenerate CTA Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '5px',
            border: 'none',
            background: '#D85740',
            color: '#FFFFFF',
            fontSize: '0.76rem',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.03em',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(216, 87, 64, 0.25)',
            transition: 'all 0.15s ease',
            opacity: isGenerating ? 0.7 : 1,
          }}
          onMouseEnter={e => {
            if (!isGenerating) {
              e.currentTarget.style.background = '#B84530';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#D85740';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <Sparkles size={13} />
          <span>{isGenerating ? 'SYNTHESIZING...' : hasActivePlan ? 'REGENERATE' : 'GENERATE DESIGN'}</span>
        </button>
      </div>
    </header>
  );
};
