import React from 'react';
import { Columns, Download, Sparkles, CheckCircle2, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import type { LayoutData, VastuResult, NbcResult, Floor } from '../../../shared/api-client/api';

export interface CandidateMetrics {
  hard_constraint_score?: number;
  coverage_score?: number;
  adjacency_score?: number;
  circulation_score?: number;
  usable_area_ratio?: number;
  usable_area_score?: number;
  compactness_score?: number;
  total_score?: number;
}

export interface PlanOption {
  id: string;
  variantId?: string;
  title?: string;
  tag?: string;
  badge?: string;
  rank?: number;
  hardConstraintsMet?: boolean;
  rejectionReasons?: string[];
  reasons?: string[];
  metrics?: CandidateMetrics;
  compositeScore?: number;
  imageUrl: string;
  layout: LayoutData & { error?: string; floors?: Floor[] };
  vastuScore: number;
  vastuResult?: VastuResult;
  nbcResult?: NbcResult;
  nbcScore?: number;
}

interface ComparePlansStudioProps {
  plans: PlanOption[];
  activePlanId: string;
  previewPlanId?: string | null;
  onPreviewPlan: (plan: PlanOption) => void;
  onAcceptPlan: (plan: PlanOption) => void;
  onSelectPlan?: (plan: PlanOption) => void;
  onGenerateAlternative: () => void;
  isGenerating: boolean;
  onExportDxf: (plan: PlanOption) => void;
}

export const ComparePlansStudio: React.FC<ComparePlansStudioProps> = ({
  plans,
  activePlanId,
  previewPlanId,
  onPreviewPlan,
  onAcceptPlan,
  onSelectPlan: _onSelectPlan,
  onGenerateAlternative,
  isGenerating,
  onExportDxf,
}) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      padding: '2rem 2.5rem',
      background: '#FAF8F2',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #E7E1D5',
        paddingBottom: '1rem',
      }}>
        <div>
          <span style={{
            fontSize: '0.68rem',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#365FA8',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}>
            PHASE 6 // CONSTRAINT-AWARE GENERATION BENCHMARK
          </span>
          <h2 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#252622',
            margin: '2px 0 0 0',
          }}>
            Architectural Candidate Matrix ({plans.length} Options)
          </h2>
        </div>

        <button
          id="generate-new-variant-btn"
          onClick={onGenerateAlternative}
          disabled={isGenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '5px',
            border: 'none',
            background: '#252622',
            color: '#FAF8F2',
            fontSize: '0.76rem',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(37,38,34,0.15)',
          }}
        >
          <Sparkles size={13} color="#D85740" />
          <span>{isGenerating ? 'SOLVING CANDIDATES...' : '+ SYNTHESIZE CANDIDATES'}</span>
        </button>
      </div>

      {/* Grid of alternatives */}
      {plans.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
        }}>
          <Columns size={40} color="#777970" />
          <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.3rem', color: '#252622', marginTop: '1rem' }}>
            No Architectural Alternatives Generated Yet
          </h3>
          <p style={{ color: '#777970', fontSize: '0.85rem', maxWidth: '420px', margin: '0.5rem auto 1.5rem auto' }}>
            Generate multiple design candidates to evaluate buildable area setbacks, adjacency preferences, and staircase continuity side-by-side.
          </p>
          <button
            onClick={onGenerateAlternative}
            style={{
              padding: '8px 18px',
              borderRadius: '5px',
              border: 'none',
              background: '#D85740',
              color: '#FFFFFF',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            GENERATE CANDIDATES
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '1.5rem',
        }}>
          {plans.map((plan, index) => {
            const isActive = plan.id === activePlanId;
            const isPreview = plan.id === previewPlanId;
            const rooms = plan.layout?.floors?.[0]?.rooms || plan.layout?.rooms || [];
            const totalArea = rooms.reduce((acc, r) => acc + (r.width * r.height), 0);
            const isHardPassed = plan.hardConstraintsMet !== false;

            return (
              <div
                key={plan.id}
                id={`candidate-card-${plan.id}`}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: isPreview ? '2px solid #365FA8' : (isActive ? '2px solid #D85740' : '1px solid #E7E1D5'),
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isPreview
                    ? '0 6px 20px rgba(54,95,168,0.18)'
                    : (isActive ? '0 6px 20px rgba(216,87,64,0.12)' : '0 2px 8px rgba(37,38,34,0.04)'),
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Thumbnail Preview */}
                <div style={{
                  height: '210px',
                  background: '#FAF8F2',
                  borderBottom: '1px solid #E7E1D5',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {plan.imageUrl ? (
                    <img
                      src={plan.imageUrl}
                      alt={plan.title || "Plan Variant"}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ color: '#777970', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem' }}>
                      2D Vector Geometry
                    </div>
                  )}

                  {/* Badges on Thumbnail */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}>
                    {plan.badge && (
                      <div style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: plan.badge.includes('#1') ? '#B8860B' : '#252622',
                        color: '#FAF8F2',
                        fontSize: '0.64rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}>
                        {plan.badge}
                      </div>
                    )}

                    {isPreview && (
                      <div style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#365FA8',
                        color: '#FFFFFF',
                        fontSize: '0.64rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                      }}>
                        IN PREVIEW
                      </div>
                    )}

                    {isActive && (
                      <div style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#D85740',
                        color: '#FFFFFF',
                        fontSize: '0.64rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                      }}>
                        AUTHORITATIVE DESIGN
                      </div>
                    )}
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    background: 'rgba(37, 38, 34, 0.85)',
                    color: '#FAF8F2',
                    fontSize: '0.64rem',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {plan.tag || `OPTION 0${index + 1}`}
                  </div>
                </div>

                {/* Plan Metadata */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{
                        fontFamily: "'Newsreader', Georgia, serif",
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        color: '#252622',
                        margin: 0,
                      }}>
                        {plan.title || `Variant // Option 0${index + 1}`}
                      </h4>
                      <span style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: '#777970' }}>
                        ID: {plan.id.slice(0, 14)} {plan.rank ? `· Rank #${plan.rank}` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {/* Hard Constraint Status */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 7px',
                        borderRadius: '12px',
                        background: isHardPassed ? 'rgba(46, 125, 50, 0.1)' : 'rgba(216, 87, 64, 0.12)',
                        border: `1px solid ${isHardPassed ? '#2E7D32' : '#D85740'}`,
                        color: isHardPassed ? '#2E7D32' : '#D85740',
                        fontSize: '0.66rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                      }}>
                        {isHardPassed ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        <span>{isHardPassed ? 'CONSTRAINTS OK' : 'VIOLATION'}</span>
                      </div>

                      {/* Vastu Score */}
                      <div style={{
                        padding: '3px 7px',
                        borderRadius: '12px',
                        background: plan.vastuScore >= 60 ? 'rgba(67, 122, 93, 0.1)' : 'rgba(184, 154, 100, 0.12)',
                        border: `1px solid ${plan.vastuScore >= 60 ? '#437A5D' : '#B89A64'}`,
                        color: plan.vastuScore >= 60 ? '#437A5D' : '#B89A64',
                        fontSize: '0.66rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                      }}>
                        {plan.vastuScore}/100 VASTU
                      </div>
                    </div>
                  </div>

                  {/* Explainable Reasons or Rejection Warnings */}
                  {plan.rejectionReasons && plan.rejectionReasons.length > 0 ? (
                    <div style={{
                      padding: '0.6rem 0.8rem',
                      background: 'rgba(216, 87, 64, 0.08)',
                      borderRadius: '5px',
                      border: '1px solid rgba(216, 87, 64, 0.25)',
                      fontSize: '0.68rem',
                      color: '#B71C1C',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>Constraint Violations:</strong>
                      {plan.rejectionReasons.slice(0, 2).map((rej, ri) => (
                        <div key={ri}>• {rej}</div>
                      ))}
                    </div>
                  ) : plan.reasons && plan.reasons.length > 0 ? (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: '#F4F7F2',
                      borderRadius: '5px',
                      border: '1px solid #DCE6D7',
                      fontSize: '0.68rem',
                      color: '#2B5329',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {plan.reasons.slice(0, 2).map((rsn, ri) => (
                        <div key={ri} style={{ lineHeight: '1.35' }}>✓ {rsn}</div>
                      ))}
                    </div>
                  ) : null}

                  {/* Metrics Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.4rem',
                    fontSize: '0.66rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '0.6rem',
                    background: '#FAF8F2',
                    borderRadius: '5px',
                    border: '1px solid #E7E1D5',
                    textAlign: 'center',
                  }}>
                    <div>
                      <span style={{ color: '#777970', display: 'block' }}>Coverage</span>
                      <strong style={{ color: '#252622' }}>{plan.metrics?.coverage_score ?? 100}%</strong>
                    </div>
                    <div>
                      <span style={{ color: '#777970', display: 'block' }}>Adjacency</span>
                      <strong style={{ color: '#252622' }}>{plan.metrics?.adjacency_score ?? 85}%</strong>
                    </div>
                    <div>
                      <span style={{ color: '#777970', display: 'block' }}>Circulation</span>
                      <strong style={{ color: '#252622' }}>{plan.metrics?.circulation_score ?? 100}%</strong>
                    </div>
                    <div>
                      <span style={{ color: '#777970', display: 'block' }}>Usable Area</span>
                      <strong style={{ color: '#252622' }}>
                        {plan.metrics?.usable_area_ratio ? `${Math.round(plan.metrics.usable_area_ratio * 100)}%` : `${Math.round(totalArea)}sf`}
                      </strong>
                    </div>
                  </div>

                  {/* Room Breakdown summary */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.70rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#777970',
                    padding: '0 2px',
                  }}>
                    <span>{rooms.length} Spaces · {plan.layout?.floors?.length || 1} Floor(s)</span>
                    <span>Score: <strong style={{ color: '#252622' }}>{plan.compositeScore ?? plan.vastuScore}/100</strong></span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {/* Preview Button */}
                    <button
                      id={`preview-cand-btn-${index}`}
                      onClick={() => onPreviewPlan(plan)}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '5px',
                        border: isPreview ? '1px solid #365FA8' : '1px solid #D5CEBE',
                        background: isPreview ? '#365FA8' : '#FAF8F2',
                        color: isPreview ? '#FFFFFF' : '#252622',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Inspect this candidate non-destructively in 2D and 3D"
                    >
                      <Eye size={12} />
                      <span>{isPreview ? 'PREVIEWING' : 'PREVIEW 2D/3D'}</span>
                    </button>

                    {/* Explicit Accept Button */}
                    <button
                      id={`accept-cand-btn-${index}`}
                      disabled={plan.hardConstraintsMet === false}
                      onClick={() => onAcceptPlan(plan)}
                      style={{
                        flex: 1.1,
                        padding: '7px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        background: plan.hardConstraintsMet === false ? '#9CA3AF' : isActive ? '#437A5D' : '#252622',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: plan.hardConstraintsMet === false ? 'not-allowed' : 'pointer',
                        opacity: plan.hardConstraintsMet === false ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                      title={plan.hardConstraintsMet === false ? "Cannot apply candidate with hard-constraint violations" : "Apply this layout into authoritative document (supports undo/redo)"}
                    >
                      <ArrowRight size={12} />
                      <span>{plan.hardConstraintsMet === false ? 'INVALID' : isActive ? '✓ APPLIED' : 'ACCEPT PLAN'}</span>
                    </button>

                    {/* DXF Export Button */}
                    <button
                      onClick={() => onExportDxf(plan)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '5px',
                        border: '1px solid #E7E1D5',
                        background: '#FFFFFF',
                        color: '#474943',
                        fontSize: '0.72rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      title="Export this alternative to CAD DXF"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
