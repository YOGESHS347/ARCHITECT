import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/store/AuthContext';
import type { Room } from '../../../shared/api-client/api';
import { getProjects, deleteProject } from '../../../shared/api-client/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  Plus,
  Trash2,
  Search,
  Compass,
  Building2,
  Layers,
  ArrowRight,
  ExternalLink,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConceptSketchArtwork from '../components/artwork/ConceptSketchArtwork';

interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  layout_data: {
    rooms?: Room[];
    floors?: { level?: string; rooms?: Room[] }[];
    vastuScore?: number;
    vastuResult?: { score?: number };
    form?: { length?: number; width?: number; floors?: number };
  };
  image_url: string;
}

// Mini Drafting Sheet Vector Preview
function PaperPlanThumbnail({ rooms, width = 40, length = 30 }: { rooms?: Room[]; width?: number; length?: number }) {
  const plotW = width || 40;
  const plotH = length || 30;

  if (!rooms || rooms.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper-sheet)',
        color: 'var(--ink-annotation)',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)'
      }}>
        <Layers size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
        <span>UNCONFIGURED PLAN</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--paper-crisp)', position: 'relative', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${plotW} ${plotH}`} style={{ display: 'block', padding: '12px' }}>
        <defs>
          <pattern id="thumbGrid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(37,38,34,0.04)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width={plotW} height={plotH} fill="url(#thumbGrid)" stroke="#777970" strokeWidth="0.8" strokeDasharray="2 1" />

        {rooms.map((room, i) => (
          <g key={i}>
            <rect
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              fill="rgba(37, 38, 34, 0.03)"
              stroke="#252622"
              strokeWidth="1"
              rx="0.3"
            />
            {room.width > 7 && room.height > 5 && (
              <text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2 + 0.8}
                fontSize="1.8"
                fill="#252622"
                fontWeight="700"
                fontFamily="var(--font-sans)"
                textAnchor="middle"
              >
                {room.name.split(' ')[0]}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        background: 'rgba(250, 248, 242, 0.9)',
        border: '1px solid var(--paper-border)',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '0.62rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--ink-secondary)'
      }}>
        {rooms.length} SPACES
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vastuFilter, setVastuFilter] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectPendingDelete, setProjectPendingDelete] = useState<ProjectData | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
      toast.error('Session expired. Please log in again.');
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = (proj: ProjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectPendingDelete(proj);
  };

  const confirmDeleteProject = async () => {
    if (!projectPendingDelete) return;
    const targetId = projectPendingDelete.id;
    setDeletingId(targetId);
    try {
      await deleteProject(targetId);
      setProjects(prev => prev.filter(p => p.id !== targetId));
      toast.success(`Design "${projectPendingDelete.name}" deleted successfully`);
      setProjectPendingDelete(null);
    } catch (err: any) {
      console.error('Delete project failed:', err);
      toast.error(err?.message || 'Failed to delete design');
    } finally {
      setDeletingId(null);
    }
  };

  const totalRooms = useMemo(() => {
    return Array.isArray(projects) ? projects.reduce((acc, curr) => {
      if (curr.layout_data?.floors) {
        return acc + curr.layout_data.floors.reduce((sum, f) => sum + (f.rooms?.length || 0), 0);
      }
      if (curr.layout_data?.rooms) {
        return acc + (curr.layout_data.rooms.length || 0);
      }
      return acc;
    }, 0) : 0;
  }, [projects]);

  const vastuCompliantCount = useMemo(() => {
    return Array.isArray(projects) ? projects.filter(p => (p.layout_data?.vastuScore ?? p.layout_data?.vastuResult?.score ?? 0) > 0).length : 0;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return Array.isArray(projects) ? projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const vScore = p.layout_data?.vastuScore ?? p.layout_data?.vastuResult?.score ?? 0;
      const isVastuCompliant = vScore > 0;
      const matchesVastu = vastuFilter ? isVastuCompliant : true;
      return matchesSearch && matchesVastu;
    }) : [];
  }, [projects, searchQuery, vastuFilter]);

  const featuredProject = filteredProjects[0];
  const remainingProjects = filteredProjects.slice(1);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper-warm)',
      color: 'var(--ink-primary)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ═══════════════════════════════════════════════════════════════════════
          STUDIO HEADER & NAVIGATION
      ═══════════════════════════════════════════════════════════════════════ */}
      <header style={{
        padding: '1rem 2.5rem',
        background: 'var(--paper-sheet)',
        borderBottom: '1px solid var(--paper-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.4rem', fontWeight: 600 }}>
              AI Architect
            </span>
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-annotation)', letterSpacing: '0.08em' }}>
            STUDIO ARCHIVE
          </span>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/editor?wizard=true')}
            className="atelier-btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', gap: '6px' }}
          >
            <Building2 size={15} /> Multi-Floor Wizard
          </button>

          <button
            onClick={() => navigate('/editor')}
            className="atelier-btn-primary"
            style={{ fontSize: '0.85rem', padding: '8px 18px', gap: '6px' }}
          >
            <Plus size={15} /> New Drawing
          </button>

          <div style={{ height: '24px', width: '1px', background: 'var(--paper-border)', margin: '0 4px' }} />

          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-annotation)',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
            title="Sign out"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          STUDIO WORKSPACE DESK BODY
      ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', padding: '3rem 2rem', flex: 1 }}>
        
        {/* Desk Welcome & Typographic Summary Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: '1px solid var(--paper-border)',
          paddingBottom: '1.5rem',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-annotation)', letterSpacing: '0.08em', marginBottom: '4px' }}>
              RESIDENTIAL DESIGN ATELIER // ARCHITECT DESK
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '2.6rem', fontWeight: 500, color: 'var(--ink-primary)', margin: 0 }}>
              Welcome back, {user?.name || 'Architect'}.
            </h1>
          </div>

          {/* Compact Typographic Metric Summary */}
          <div style={{ display: 'flex', gap: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
            <div>
              <span style={{ color: 'var(--ink-primary)', fontWeight: 700, fontSize: '1rem', marginRight: '6px' }}>{projects.length}</span>
              PLANS IN ARCHIVE
            </div>
            <div>
              <span style={{ color: 'var(--accent-vermilion)', fontWeight: 700, fontSize: '1rem', marginRight: '6px' }}>{totalRooms}</span>
              ROOMS SYNTHESIZED
            </div>
            <div>
              <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1rem', marginRight: '6px' }}>{vastuCompliantCount}</span>
              VASTU COMPLIANT
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Field */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-annotation)' }} />
            <input
              type="text"
              placeholder="Filter drawings by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid var(--paper-border)',
                background: 'var(--paper-sheet)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {/* Vastu filter pill */}
          <button
            onClick={() => setVastuFilter(!vastuFilter)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: vastuFilter ? 'var(--success)' : 'var(--paper-border)',
              background: vastuFilter ? 'var(--success-bg)' : 'var(--paper-sheet)',
              color: vastuFilter ? 'var(--success)' : 'var(--ink-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Compass size={14} /> Vastu Compliant Only {vastuFilter && '✓'}
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '320px', background: 'var(--paper-sheet)', borderRadius: '12px', border: '1px solid var(--paper-border)', opacity: 0.5 }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* DELIBERATE EMPTY STATE WITH ARCHITECTURAL SKETCH */
          <div style={{
            background: 'var(--paper-sheet)',
            border: '1px solid var(--paper-border)',
            borderRadius: '16px',
            padding: '4rem 2rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
              <div>
                <ConceptSketchArtwork isAnimated={false} />
              </div>

              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-vermilion)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  STUDIO ARCHIVE EMPTY
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '2.2rem', color: 'var(--ink-primary)', margin: '8px 0 12px 0' }}>
                  Begin your first floor plan.
                </h3>
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Specify plot dimensions, setback standards, and spatial requirements. AI Architect will synthesize a buildable, Vastu-evaluated 2D plan in under a second.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/editor')}
                    className="atelier-btn-primary"
                    style={{ padding: '10px 22px', fontSize: '0.9rem' }}
                  >
                    Start First Design <ArrowRight size={15} style={{ marginLeft: '6px' }} />
                  </button>
                  <button
                    onClick={() => navigate('/editor?wizard=true')}
                    className="atelier-btn-secondary"
                    style={{ padding: '10px 18px', fontSize: '0.9rem' }}
                  >
                    Multi-Floor Wizard
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Search Empty State */
          <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--paper-sheet)', borderRadius: '12px', border: '1px dashed var(--paper-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.6rem', color: 'var(--ink-primary)', marginBottom: '8px' }}>
              No matching drawings found in archive.
            </h3>
            <p style={{ color: 'var(--ink-annotation)', fontSize: '0.9rem' }}>
              Try adjusting your search query or toggling off the Vastu filter.
            </p>
          </div>
        ) : (
          /* PROJECT SHOWCASE & ARCHIVE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* 1. FEATURED PROJECT PRESENTATION (Most Recent Active Design) */}
            {featuredProject && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-annotation)', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  FEATURED WORKSPACE // MOST RECENT DESIGN
                </div>

                <div
                  onClick={() => navigate(`/editor?project=${featuredProject.id}`)}
                  style={{
                    background: 'var(--paper-sheet)',
                    border: '1px solid var(--paper-border)',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: 'var(--shadow-elevated)',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: '2.5rem',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-vermilion)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--paper-border)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
                  }}
                >
                  {/* Drawing Sheet Viewport */}
                  <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--paper-border)' }}>
                    {featuredProject.image_url ? (
                      <img src={featuredProject.image_url} alt={featuredProject.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <PaperPlanThumbnail
                        rooms={featuredProject.layout_data?.floors?.[0]?.rooms || featuredProject.layout_data?.rooms || []}
                        width={featuredProject.layout_data?.form?.width}
                        length={featuredProject.layout_data?.form?.length}
                      />
                    )}
                  </div>

                  {/* Portfolio Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(37,38,34,0.06)', color: 'var(--ink-secondary)' }}>
                          {(featuredProject.layout_data?.floors?.length ?? 1) > 1 ? `${featuredProject.layout_data?.floors?.length} LEVELS` : '1 LEVEL'}
                        </span>
                        {(featuredProject.layout_data?.vastuScore ?? featuredProject.layout_data?.vastuResult?.score ?? 0) > 0 && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 600 }}>
                            VASTU {featuredProject.layout_data.vastuScore ?? featuredProject.layout_data.vastuResult?.score}%
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '2rem', color: 'var(--ink-primary)', margin: '0 0 10px 0', lineHeight: 1.2 }}>
                        {featuredProject.name}
                      </h3>

                      <div style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                        <Calendar size={14} style={{ color: 'var(--ink-annotation)' }} />
                        <span>Created {new Date(featuredProject.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--paper-border)', paddingTop: '1rem' }}>
                      <button className="atelier-btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                        Resume Drafting <ExternalLink size={14} style={{ marginLeft: '6px' }} />
                      </button>

                      <button
                        onClick={e => handleDelete(featuredProject, e)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--ink-annotation)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
                        title="Delete project"
                        disabled={deletingId === featuredProject.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RECENT PROJECTS ARCHIVE (Grid of Portfolio Sheets) */}
            {remainingProjects.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-annotation)', letterSpacing: '0.08em', marginBottom: '16px' }}>
                  DRAWING ARCHIVE ({remainingProjects.length} DESIGNS)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                  {remainingProjects.map((p) => {
                    const roomsCount = p.layout_data?.floors
                      ? p.layout_data.floors.reduce((sum, f) => sum + (f.rooms?.length || 0), 0)
                      : (p.layout_data?.rooms?.length || 0);

                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/editor?project=${p.id}`)}
                        className="atelier-card"
                        style={{
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '12px'
                        }}
                      >
                        {/* Drawing Preview Sheet */}
                        <div style={{ height: '200px', borderBottom: '1px solid var(--paper-border)' }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <PaperPlanThumbnail
                              rooms={p.layout_data?.floors?.[0]?.rooms || p.layout_data?.rooms || []}
                              width={p.layout_data?.form?.width}
                              length={p.layout_data?.form?.length}
                            />
                          )}
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                              <h4 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--ink-primary)', margin: 0 }}>
                                {p.name}
                              </h4>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-annotation)', marginBottom: '1rem' }}>
                              {roomsCount} SPACES // {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--paper-border-soft)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-vermilion)', fontWeight: 600 }}>
                              Open Sheet →
                            </span>

                            <button
                              onClick={e => handleDelete(p, e)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--ink-annotation)', cursor: 'pointer', padding: '4px' }}
                              title="Delete project"
                              disabled={deletingId === p.id}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ── Studio Archive Design Deletion Confirmation Modal ── */}
      {projectPendingDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 7, 12, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--paper-card, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--paper-border, #E7E1D5)',
            boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Trash2 size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink-primary, #252622)', fontFamily: 'var(--font-serif, serif)', fontStyle: 'italic' }}>
                  Delete Architectural Design?
                </h4>
                <span style={{ fontSize: '0.74rem', color: 'var(--ink-annotation, #777970)', fontFamily: 'var(--font-mono, monospace)' }}>
                  ID: {projectPendingDelete.id}
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-secondary, #474943)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>"{projectPendingDelete.name}"</strong> from your studio archive? This will remove all layout snapshots and furniture arrangements.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setProjectPendingDelete(null)}
                disabled={deletingId !== null}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--paper-border, #E7E1D5)',
                  background: 'transparent',
                  color: 'var(--ink-secondary, #474943)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteProject}
                disabled={deletingId !== null}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  cursor: deletingId !== null ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  opacity: deletingId !== null ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {deletingId !== null ? 'Deleting...' : 'Delete Design'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
