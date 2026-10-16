import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FURNITURE_CATEGORIES,
  getAllFurnitureAssets,
  type FurnitureAssetDefinition,
  type FurnitureCategory,
} from '../geometry/furnitureRegistry';
import { FurnitureThumbnail } from './FurnitureThumbnail';
import { FurnitureProductImage } from './FurnitureProductImage';
import {
  Search,
  X,
  Plus,
  GripVertical,
  Layers,
  Sparkles,
  Info,
  Box,
  Compass,
  CheckCircle2,
  Maximize2,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react';

interface FurnitureCatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: FurnitureAssetDefinition) => void;
  selectedRoomName?: string | null;
  activeFloorName?: string;
}

export const FurnitureCatalogDrawer: React.FC<FurnitureCatalogDrawerProps> = ({
  isOpen,
  onClose,
  onAddItem,
  selectedRoomName,
  activeFloorName = 'Ground Floor',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'list'>('grid');
  const [inspectingAsset, setInspectingAsset] = useState<FurnitureAssetDefinition | null>(null);
  const [recentlyPlacedId, setRecentlyPlacedId] = useState<string | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(460);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Track window resize for mobile logic
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectingAsset) {
          setInspectingAsset(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, inspectingAsset]);

  const allAssets = useMemo(() => getAllFurnitureAssets(), []);

  // Compute item counts per category for the chips
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allAssets.length };
    for (const cat of FURNITURE_CATEGORIES) {
      counts[cat] = allAssets.filter(item => item.category === cat).length;
    }
    return counts;
  }, [allAssets]);

  const filteredItems = useMemo(() => {
    return allAssets.filter(item => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allAssets, searchQuery, selectedCategory]);

  const handleAddItemWithFeedback = (item: FurnitureAssetDefinition) => {
    onAddItem(item);
    setRecentlyPlacedId(item.id);
    setTimeout(() => {
      setRecentlyPlacedId(prev => (prev === item.id ? null : prev));
    }, 1400);
  };

  // Drawer Width Resizing Handlers
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const clamped = Math.max(340, Math.min(640, e.clientX));
    setDrawerWidth(clamped);
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizing) return;
    setIsResizing(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  // Check if grid should collapse to 1 column on narrow widths
  const isSingleColGrid = drawerWidth < 410;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Responsive overlay backdrop on mobile */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="furniture-drawer-backdrop"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(5, 7, 12, 0.7)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                zIndex: 48,
              }}
            />
          )}

          {/* Dedicated Architectural Catalog Drawer (left-docked with draggable divider) */}
          <motion.div
            initial={{ x: -drawerWidth, opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -drawerWidth, opacity: 0 }}
            transition={isResizing ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${drawerWidth}px`,
              maxWidth: '94vw',
              background: '#090D16',
              borderRight: '1px solid rgba(56, 189, 248, 0.22)',
              boxShadow: '16px 0 48px rgba(0, 0, 0, 0.85), 0 0 32px rgba(56, 189, 248, 0.08)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              userSelect: isResizing ? 'none' : 'auto',
            }}
          >
            {/* ── Draggable Divider on Right Border ── */}
            <div
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              style={{
                position: 'absolute',
                top: 0,
                right: -6,
                width: '12px',
                height: '100%',
                cursor: 'col-resize',
                zIndex: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none',
              }}
              title="Drag to resize library width (340px - 640px)"
            >
              <div
                style={{
                  width: '3px',
                  height: '52px',
                  borderRadius: '2px',
                  background: isResizing ? '#38BDF8' : 'rgba(56, 189, 248, 0.35)',
                  boxShadow: isResizing ? '0 0 12px #38BDF8' : 'none',
                  transition: 'background 0.15s ease, box-shadow 0.15s ease',
                }}
              />
            </div>

            {/* ── Drawer Header ── */}
            <div
              style={{
                padding: '0.9rem 1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#060910',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#38BDF8" />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: '#F8FAFC',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.04em',
                    }}
                  >
                    ARCHITECTURAL ASSETS
                  </h3>
                </div>
                <div
                  style={{
                    margin: '3px 0 0 0',
                    fontSize: '0.7rem',
                    color: '#94A3B8',
                    fontFamily: "'JetBrains Mono', monospace",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>LEVEL: <strong style={{ color: '#38BDF8' }}>{activeFloorName.toUpperCase()}</strong></span>
                  {selectedRoomName && (
                    <span>• ZONE: <strong style={{ color: '#C084FC' }}>{selectedRoomName.toUpperCase()}</strong></span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#F8FAFC';
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#94A3B8';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  title="Close Library (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Mode & Layout Controls Bar ── */}
            <div
              style={{
                padding: '0.7rem 1.25rem 0.4rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                gap: '8px',
              }}
            >
              {/* 3D Render vs 2D CAD Segmented Pill */}
              <div
                style={{
                  display: 'flex',
                  background: '#04060C',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '7px',
                  padding: '2px',
                  gap: '2px',
                }}
              >
                <button
                  onClick={() => setViewMode('3d')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: 'none',
                    background: viewMode === '3d' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                    color: viewMode === '3d' ? '#38BDF8' : '#64748B',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: viewMode === '3d' ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                  }}
                  title="View photorealistic 3D architectural asset renders"
                >
                  <Box size={12} />
                  <span>3D RENDER</span>
                </button>

                <button
                  onClick={() => setViewMode('2d')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: 'none',
                    background: viewMode === '2d' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                    color: viewMode === '2d' ? '#38BDF8' : '#64748B',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: viewMode === '2d' ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                  }}
                  title="View top-down 2D CAD architectural plan symbols"
                >
                  <Compass size={12} />
                  <span>2D CAD</span>
                </button>
              </div>

              {/* Density / Layout Switcher (Grid vs List) + Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    background: '#04060C',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '2px',
                    gap: '2px',
                  }}
                >
                  <button
                    onClick={() => setLayoutStyle('grid')}
                    style={{
                      background: layoutStyle === 'grid' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: layoutStyle === 'grid' ? '#38BDF8' : '#64748B',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Spacious 2-column architectural grid"
                  >
                    <LayoutGrid size={12} />
                  </button>
                  <button
                    onClick={() => setLayoutStyle('list')}
                    style={{
                      background: layoutStyle === 'list' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: layoutStyle === 'list' ? '#38BDF8' : '#64748B',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Detailed architectural spec list"
                  >
                    <List size={12} />
                  </button>
                </div>

                <div
                  style={{
                    fontSize: '0.64rem',
                    color: '#94A3B8',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                  }}
                >
                  <strong style={{ color: '#38BDF8' }}>{filteredItems.length}</strong> / {allAssets.length}
                </div>
              </div>
            </div>

            {/* ── Search Bar ── */}
            <div style={{ padding: '0.35rem 1.25rem 0.45rem 1.25rem', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#04060C',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '7px',
                  padding: '0.45rem 0.75rem',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                <Search size={14} color="#38BDF8" />
                <input
                  type="text"
                  placeholder="Search 32 premium architectural assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#F8FAFC',
                    fontSize: '0.78rem',
                    width: '100%',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Category Filter Pills with Item Counts ── */}
            <div
              ref={categoryScrollRef}
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                padding: '0.2rem 1.25rem 0.65rem 1.25rem',
                scrollbarWidth: 'none',
                flexShrink: 0,
              }}
            >
              {(['All', ...FURNITURE_CATEGORIES] as const).map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '0.32rem 0.7rem',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : '#04060C',
                      color: isSelected ? '#38BDF8' : '#94A3B8',
                      fontSize: '0.68rem',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span>{cat}</span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        opacity: isSelected ? 0.9 : 0.6,
                        background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Catalog Item Cards Container (Independent Scrolling) ── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 1.25rem 0.85rem 1.25rem',
              }}
            >
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
                  <Layers size={28} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>NO ASSETS MATCHING "{searchQuery}"</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: '#475569' }}>
                    Try searching for sofa, bed, table, desk, lamp, or shower
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    style={{
                      marginTop: '12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38BDF8',
                      fontSize: '0.72rem',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : layoutStyle === 'grid' ? (
                /* ══════════════════════════════════════════════════════════════
                   GRID VIEW (2-COLUMN ARCHITECTURAL TILES)
                   ══════════════════════════════════════════════════════════════ */
                <motion.div
                  key={`grid-${selectedCategory}-${viewMode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isSingleColGrid ? '1fr' : 'repeat(2, 1fr)',
                    gap: '10px',
                  }}
                >
                  {filteredItems.map(item => {
                    const isLighting = item.category === 'Lighting Fixtures';
                    const isRecentlyPlaced = recentlyPlacedId === item.id;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(item));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        style={{
                          background: '#070B14',
                          border: isRecentlyPlaced
                            ? '1px solid #10B981'
                            : isLighting
                            ? '1px solid rgba(253, 224, 71, 0.28)'
                            : '1px solid rgba(255, 255, 255, 0.09)',
                          borderRadius: '9px',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          cursor: 'grab',
                          boxShadow: isRecentlyPlaced
                            ? '0 0 16px rgba(16, 185, 129, 0.3)'
                            : '0 2px 10px rgba(0, 0, 0, 0.45)',
                          transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          if (!isRecentlyPlaced) {
                            e.currentTarget.style.borderColor = isLighting ? '#FDE047' : '#38BDF8';
                            e.currentTarget.style.boxShadow = isLighting
                              ? '0 6px 18px rgba(0,0,0,0.6), 0 0 14px rgba(253, 224, 71, 0.22)'
                              : '0 6px 18px rgba(0,0,0,0.6), 0 0 14px rgba(56, 189, 248, 0.22)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          if (!isRecentlyPlaced) {
                            e.currentTarget.style.borderColor = isLighting
                              ? 'rgba(253, 224, 71, 0.28)'
                              : 'rgba(255, 255, 255, 0.09)';
                            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.45)';
                          }
                        }}
                      >
                        {/* Architectural Viewport Container (108px height) */}
                        <div
                          style={{
                            height: '108px',
                            background:
                              'radial-gradient(circle, rgba(56, 189, 248, 0.08) 1px, transparent 1px) 0 0 / 12px 12px, #030509',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Drag grip indicator in top left */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'grab',
                            }}
                            title="Drag onto floor plan"
                          >
                            <GripVertical size={13} />
                          </div>

                          {/* Quick spec inspect button in top right */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingAsset(item);
                            }}
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              background: 'rgba(5, 7, 12, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '4px',
                              padding: '3px',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                              zIndex: 2,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = '#38BDF8';
                              e.currentTarget.style.borderColor = '#38BDF8';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = '#94A3B8';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                            }}
                            title="Inspect specifications & materials"
                          >
                            <Eye size={12} />
                          </button>

                          {/* Vector Asset Preview */}
                          <div
                            onClick={() => setInspectingAsset(item)}
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            {viewMode === '3d' ? (
                              <FurnitureProductImage assetId={item.id} width={130} height={96} />
                            ) : (
                              <FurnitureThumbnail assetId={item.id} width={100} height={75} />
                            )}
                          </div>
                        </div>

                        {/* Card Body & Information */}
                        <div
                          style={{
                            padding: '0.65rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            flex: 1,
                          }}
                        >
                          {/* Asset Name */}
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#F8FAFC',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.2,
                            }}
                            title={item.name}
                          >
                            {item.name}
                          </div>

                          {/* Dimensions */}
                          <div
                            style={{
                              fontSize: '0.66rem',
                              color: '#94A3B8',
                              fontFamily: "'JetBrains Mono', monospace",
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
                              {item.dimensions.widthFt} × {item.dimensions.depthFt} ft
                            </span>
                            <span style={{ color: '#64748B', fontSize: '0.62rem' }}>
                              {item.dimensions.widthM.toFixed(1)}×{item.dimensions.depthM.toFixed(1)}m
                            </span>
                          </div>

                          {/* Tag / Category */}
                          <div
                            style={{
                              fontSize: '0.62rem',
                              color: isLighting ? '#FDE047' : '#64748B',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {item.lightProperties ? (
                              <span>⚡ {item.lightProperties.radius}ft radius</span>
                            ) : (
                              <span>{item.category}</span>
                            )}
                          </div>

                          {/* Add Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItemWithFeedback(item);
                            }}
                            style={{
                              marginTop: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '0.38rem 0.5rem',
                              borderRadius: '6px',
                              border: isRecentlyPlaced
                                ? '1px solid #10B981'
                                : isLighting
                                ? '1px solid #FDE047'
                                : '1px solid #38BDF8',
                              background: isRecentlyPlaced
                                ? 'rgba(16, 185, 129, 0.22)'
                                : isLighting
                                ? 'rgba(234, 179, 8, 0.18)'
                                : 'rgba(56, 189, 248, 0.15)',
                              color: isRecentlyPlaced
                                ? '#10B981'
                                : isLighting
                                ? '#FDE047'
                                : '#38BDF8',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              fontFamily: "'JetBrains Mono', monospace",
                              width: '100%',
                            }}
                            onMouseEnter={e => {
                              if (!isRecentlyPlaced) {
                                e.currentTarget.style.background = isLighting ? '#FDE047' : '#38BDF8';
                                e.currentTarget.style.color = '#0B0F19';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isRecentlyPlaced) {
                                e.currentTarget.style.background = isLighting ? 'rgba(234, 179, 8, 0.18)' : 'rgba(56, 189, 248, 0.15)';
                                e.currentTarget.style.color = isLighting ? '#FDE047' : '#38BDF8';
                              }
                            }}
                            title={`Place ${item.name} onto floor plan`}
                          >
                            {isRecentlyPlaced ? (
                              <>
                                <CheckCircle2 size={12} color="#10B981" />
                                <span>ADDED</span>
                              </>
                            ) : (
                              <>
                                <Plus size={12} />
                                <span>ADD</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                /* ══════════════════════════════════════════════════════════════
                   LIST VIEW (TECHNICAL ARCHITECTURAL ROWS)
                   ══════════════════════════════════════════════════════════════ */
                <motion.div
                  key={`list-${selectedCategory}-${viewMode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {filteredItems.map(item => {
                    const isLighting = item.category === 'Lighting Fixtures';
                    const isRecentlyPlaced = recentlyPlacedId === item.id;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(item));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        style={{
                          background: '#070B14',
                          border: isRecentlyPlaced
                            ? '1px solid #10B981'
                            : isLighting
                            ? '1px solid rgba(253, 224, 71, 0.28)'
                            : '1px solid rgba(255, 255, 255, 0.09)',
                          borderRadius: '8px',
                          padding: '0.55rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          cursor: 'grab',
                          boxShadow: isRecentlyPlaced
                            ? '0 0 16px rgba(16, 185, 129, 0.3)'
                            : '0 2px 8px rgba(0, 0, 0, 0.4)',
                          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          if (!isRecentlyPlaced) {
                            e.currentTarget.style.borderColor = isLighting ? '#FDE047' : '#38BDF8';
                            e.currentTarget.style.boxShadow = isLighting
                              ? '0 0 14px rgba(253, 224, 71, 0.2)'
                              : '0 0 14px rgba(56, 189, 248, 0.2)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          if (!isRecentlyPlaced) {
                            e.currentTarget.style.borderColor = isLighting
                              ? 'rgba(253, 224, 71, 0.28)'
                              : 'rgba(255, 255, 255, 0.09)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.4)';
                          }
                        }}
                      >
                        {/* Left: Drag Grip + Preview */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ color: '#475569', cursor: 'grab' }} title="Drag onto floor plan">
                            <GripVertical size={14} />
                          </span>

                          <div
                            onClick={() => setInspectingAsset(item)}
                            style={{
                              width: '84px',
                              height: '62px',
                              flexShrink: 0,
                              background: '#030509',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              position: 'relative',
                              cursor: 'pointer',
                            }}
                          >
                            {viewMode === '3d' ? (
                              <FurnitureProductImage assetId={item.id} width={80} height={58} />
                            ) : (
                              <FurnitureThumbnail assetId={item.id} width={64} height={48} />
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingAsset(item);
                              }}
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'rgba(5, 7, 12, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '4px',
                                padding: '2px',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Inspect specifications & materials"
                            >
                              <Maximize2 size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Middle: Metadata */}
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#F8FAFC',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            {isLighting && (
                              <span
                                style={{
                                  fontSize: '0.58rem',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  background: 'rgba(234, 179, 8, 0.2)',
                                  color: '#FDE047',
                                  border: '1px solid rgba(234, 179, 8, 0.4)',
                                  fontWeight: 800,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  flexShrink: 0,
                                }}
                              >
                                LIGHT
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.68rem',
                              color: '#94A3B8',
                              marginTop: '2px',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
                              {item.dimensions.widthFt} × {item.dimensions.depthFt} ft
                            </span>
                            <span style={{ color: '#64748B' }}>
                              • {item.dimensions.widthM.toFixed(1)}×{item.dimensions.depthM.toFixed(1)}m
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: '0.64rem',
                              color: '#64748B',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.lightProperties ? (
                              <span style={{ color: '#FDE047', fontWeight: 600 }}>⚡ {item.lightProperties.radius}ft luminous radius</span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>{item.category}</span>
                            )}
                          </div>
                        </div>

                        {/* Right: ADD Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddItemWithFeedback(item);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '0.38rem 0.7rem',
                            borderRadius: '6px',
                            border: isRecentlyPlaced
                              ? '1px solid #10B981'
                              : isLighting
                              ? '1px solid #FDE047'
                              : '1px solid #38BDF8',
                            background: isRecentlyPlaced
                              ? 'rgba(16, 185, 129, 0.22)'
                              : isLighting
                              ? 'rgba(234, 179, 8, 0.18)'
                              : 'rgba(56, 189, 248, 0.15)',
                            color: isRecentlyPlaced
                              ? '#10B981'
                              : isLighting
                              ? '#FDE047'
                              : '#38BDF8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                          onMouseEnter={e => {
                            if (!isRecentlyPlaced) {
                              e.currentTarget.style.background = isLighting ? '#FDE047' : '#38BDF8';
                              e.currentTarget.style.color = '#0B0F19';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isRecentlyPlaced) {
                              e.currentTarget.style.background = isLighting ? 'rgba(234, 179, 8, 0.18)' : 'rgba(56, 189, 248, 0.15)';
                              e.currentTarget.style.color = isLighting ? '#FDE047' : '#38BDF8';
                            }
                          }}
                          title={`Place ${item.name}`}
                        >
                          {isRecentlyPlaced ? (
                            <>
                              <CheckCircle2 size={12} color="#10B981" />
                              <span>ADDED</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>ADD</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* ── Footer Tips & Status ── */}
            <div
              style={{
                padding: '0.7rem 1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#060910',
                fontSize: '0.7rem',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: "'JetBrains Mono', monospace",
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={13} color="#38BDF8" />
                <span>Drag to plan or click <strong>ADD</strong>. Press Esc to close.</span>
              </div>
              <span style={{ fontSize: '0.62rem', color: '#64748B' }}>32 ASSETS</span>
            </div>
          </motion.div>

          {/* ── Asset Specifications / Quick Specs Modal ── */}
          {inspectingAsset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectingAsset(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(3, 5, 10, 0.78)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '480px',
                  maxWidth: '94vw',
                  background: '#0B0F19',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    padding: '0.85rem 1.2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#070A12',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={15} color="#38BDF8" />
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#F8FAFC',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      ARCHITECTURAL SPECIFICATION
                    </span>
                  </div>
                  <button
                    onClick={() => setInspectingAsset(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* High-Res Asset View */}
                <div
                  style={{
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 1px, transparent 1px) 0 0 / 14px 14px, #04060B',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {viewMode === '3d' ? (
                    <FurnitureProductImage assetId={inspectingAsset.id} width={260} height={175} />
                  ) : (
                    <FurnitureThumbnail assetId={inspectingAsset.id} width={200} height={150} />
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 12,
                      fontSize: '0.62rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#64748B',
                    }}
                  >
                    {viewMode === '3d' ? 'ISOMETRIC 3D CAD RENDER' : 'PLAN CAD VECTOR SYMBOL'}
                  </span>
                </div>

                {/* Details Content */}
                <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                      {inspectingAsset.name}
                    </h4>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.74rem', color: '#94A3B8' }}>
                      {inspectingAsset.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      background: '#060910',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.7rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748B' }}>CATEGORY:</span>
                      <div style={{ color: '#F8FAFC', fontWeight: 600 }}>{inspectingAsset.category}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>DIMENSIONS (FT):</span>
                      <div style={{ color: '#38BDF8', fontWeight: 600 }}>
                        {inspectingAsset.dimensions.widthFt} × {inspectingAsset.dimensions.depthFt} ft
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>METRIC (M):</span>
                      <div style={{ color: '#F8FAFC', fontWeight: 600 }}>
                        {inspectingAsset.dimensions.widthM.toFixed(2)} × {inspectingAsset.dimensions.depthM.toFixed(2)} m
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>HEIGHT:</span>
                      <div style={{ color: '#A78BFA', fontWeight: 600 }}>
                        {inspectingAsset.dimensions.heightFt} ft ({inspectingAsset.dimensions.heightM.toFixed(2)} m)
                      </div>
                    </div>
                  </div>

                  {/* Architectural Placement Guidance */}
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.18)',
                      borderRadius: '6px',
                      padding: '0.6rem 0.8rem',
                      fontSize: '0.7rem',
                      color: '#94A3B8',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <strong style={{ color: '#38BDF8' }}>PLANNING GUIDANCE:</strong> Maintain min 2.5 ft clearance from circulation corridors and door swing arcs. Snap to interior room perimeter.
                  </div>

                  {inspectingAsset.lightProperties && (
                    <div
                      style={{
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: '6px',
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.72rem',
                        color: '#FDE047',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      ⚡ <strong>Luminous Fixture:</strong> {inspectingAsset.lightProperties.radius}ft radius •{' '}
                      {inspectingAsset.lightProperties.intensity} intensity ({inspectingAsset.lightProperties.color})
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      onClick={() => {
                        handleAddItemWithFeedback(inspectingAsset);
                        setInspectingAsset(null);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #38BDF8',
                        background: '#38BDF8',
                        color: '#0B0F19',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <Plus size={14} />
                      <span>PLACE ASSET ON FLOOR PLAN</span>
                    </button>
                    <button
                      onClick={() => setInspectingAsset(null)}
                      style={{
                        padding: '0.55rem 0.9rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#94A3B8',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default FurnitureCatalogDrawer;
