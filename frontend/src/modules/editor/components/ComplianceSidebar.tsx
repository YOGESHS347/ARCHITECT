import { useState } from 'react';
import type { LayoutData, VastuResult, NbcResult, EnergyResult, SunlightResult, BomResult, VastuFixResult, NbcFixResult, LayoutUpdatePayload } from '../../../shared/api-client/api';
import { vastuFix, nbcFix, recalculateBOM } from '../../../shared/api-client/api';
import toast from 'react-hot-toast';

interface PlotContext {
  plotWidth: number;
  plotHeight: number;
  entryDir: string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  balcony: number;
  terrace: number;
  lift: number;
}

interface ComplianceSidebarProps {
  vastuScore: number;
  vastuResult?: VastuResult;
  nbcResult?: NbcResult;
  energyResult?: EnergyResult;
  sunlightResult?: SunlightResult;
  bomResult?: BomResult;
  layout: Record<string, unknown>;
  plotContext: PlotContext;
  onLayoutUpdate: (data: LayoutUpdatePayload, imageUrl?: string) => void;
  onVastuUpdate?: (newVastuResult: VastuResult, newScore: number) => void;
  onNbcUpdate?: (newNbcResult: NbcResult, newScore: number) => void;
  onAutoSaveRequest?: () => void;
}

export default function ComplianceSidebar({
  vastuScore,
  vastuResult,
  nbcResult,
  energyResult,
  sunlightResult,
  bomResult,
  layout,
  plotContext,
  onLayoutUpdate,
  onVastuUpdate,
  onNbcUpdate,
  onAutoSaveRequest,
}: ComplianceSidebarProps) {
  const [vastuOpen, setVastuOpen] = useState(false);
  const [nbcOpen, setNbcOpen] = useState(false);
  const [energyOpen, setEnergyOpen] = useState(false);

  const [bomOpen, setBomOpen] = useState(false);
  const [vastuFixing, setVastuFixing] = useState(false);
  const [lastFixResult, setLastFixResult] = useState<VastuFixResult | null>(null);
  const [nbcFixing, setNbcFixing] = useState(false);
  const [lastNbcFixResult, setLastNbcFixResult] = useState<NbcFixResult | null>(null);
  const [tier, setTier] = useState<string>('standard');
  const [bomRecalculating, setBomRecalculating] = useState(false);

  const handleTierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTier = e.target.value;
    setTier(newTier);
    
    const sqft = plotContext.plotWidth * plotContext.plotHeight;
    setBomRecalculating(true);
    try {
      const res = await recalculateBOM(layout as LayoutData, sqft, newTier);
      onLayoutUpdate({ new_bom_result: res.bomResult });
      toast.success(`BOM updated for ${newTier} finish`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`BOM recalculation failed: ${msg}`);
    } finally {
      setBomRecalculating(false);
    }
  };

  const handleVastuFix = async () => {
    setVastuFixing(true);
    setLastFixResult(null);
    toast.loading('🧭 AI is revising the Vastu topology…', { id: 'vastu-fix' });
    try {
      const result = await vastuFix(layout, vastuResult, plotContext);
      setLastFixResult(result);

      if (result.status === 'already_optimal') {
        toast.success(result.message || 'Layout is already Vastu-optimal!', { id: 'vastu-fix' });
        return;
      }

      if (result.fixed_layout?.length || result.full_layout) {
        onLayoutUpdate(result, result.imageUrl);
        if (onVastuUpdate && result.new_vastu_result) {
          onVastuUpdate(result.new_vastu_result, result.after_score);
        }

        const delta = result.after_score - result.before_score;
        const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
        toast.success(
          `Vastu improved: ${result.before_score} → ${result.after_score} (${deltaStr})`,
          { id: 'vastu-fix', duration: 5000 }
        );
        if (onAutoSaveRequest) {
          onAutoSaveRequest();
        }
      } else {
        toast.error('Vastu fix did not return a valid layout.', { id: 'vastu-fix' });
      }
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Vastu fix failed: ${msg}`, { id: 'vastu-fix' });
    } finally {
      setVastuFixing(false);
    }
  };

  const handleNbcFix = async () => {
    setNbcFixing(true);
    setLastNbcFixResult(null);
    toast.loading('🏗️ AI is revising the NBC topology...', { id: 'nbc-fix' });
    try {
      const result = await nbcFix(layout, nbcResult, plotContext);
      setLastNbcFixResult(result);

      if (result.status === 'already_optimal') {
        toast.success(result.message || 'Layout is already NBC-optimal!', { id: 'nbc-fix' });
        return;
      }

      if (result.fixed_layout?.length || result.full_layout) {
        onLayoutUpdate(result, result.imageUrl);
        if (onNbcUpdate && result.new_nbc_result) {
          onNbcUpdate(result.new_nbc_result, result.after_score);
        }

        const delta = result.after_score - result.before_score;
        const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
        toast.success(
          `NBC improved: ${result.before_score} → ${result.after_score} (${deltaStr})`,
          { id: 'nbc-fix', duration: 5000 }
        );
        if (onAutoSaveRequest) {
          onAutoSaveRequest();
        }
      } else {
        toast.error('NBC fix did not return a valid layout.', { id: 'nbc-fix' });
      }
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`NBC fix failed: ${msg}`, { id: 'nbc-fix' });
    } finally {
      setNbcFixing(false);
    }
  };

  const getBadgeStyle = (score: number) => {
    if (score >= 80) return { bg: 'rgba(161, 174, 151, 0.25)', color: '#252622', border: '#A1AE97' };
    if (score >= 50) return { bg: 'rgba(184, 154, 100, 0.2)', color: '#252622', border: '#B89A64' };
    return { bg: 'rgba(216, 87, 64, 0.15)', color: '#D85740', border: '#D85740' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Vastu Panel */}
      {vastuResult && vastuResult.rules.length > 0 && (
        <div style={{ background: '#FAF8F2', border: '1px solid #E7E1D5', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            onClick={() => setVastuOpen(!vastuOpen)}
            style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: vastuOpen ? '#F3F0E7' : 'transparent', transition: 'all 0.15s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem', color: '#252622' }}>
              <span>🧭</span> Vastu Analysis
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {(() => {
                const b = getBadgeStyle(vastuScore);
                return (
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: b.color, background: b.bg, border: `1px solid ${b.border}` }}>
                    {vastuScore}/100
                  </span>
                );
              })()}
              <span style={{ fontSize: '0.65rem', color: '#777970' }}>{vastuOpen ? '▲' : '▼'}</span>
            </div>
          </div>
          
          {vastuOpen && (
            <div style={{ padding: '1rem', borderTop: '1px solid #E7E1D5', background: '#FAF8F2' }}>
              {vastuScore < 100 && (
                <button
                  onClick={handleVastuFix}
                  disabled={vastuFixing}
                  style={{
                    width: '100%',
                    marginBottom: '0.85rem',
                    padding: '0.5rem',
                    fontSize: '0.78rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    background: '#252622',
                    color: '#FAF8F2',
                    border: '1px solid #252622',
                    borderRadius: '4px',
                    cursor: vastuFixing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {vastuFixing ? 'Revising orientation…' : 'Optimize Vastu Layout (AI)'}
                </button>
              )}

              {/* Before/after result banner */}
              {lastFixResult && lastFixResult.status !== 'already_optimal' && (
                <div style={{ padding: '0.75rem', marginBottom: '0.85rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                    Score: {lastFixResult.before_score} → <strong style={{ color: '#252622' }}>{lastFixResult.after_score}</strong>
                  </div>
                  {lastFixResult.design_rationale && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#777970', lineHeight: 1.4 }}>{lastFixResult.design_rationale}</div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {vastuResult.rules.map((r, i) => {
                  if (r.max === 0) return null;
                  const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '!' : '×';
                  const iconColor = r.status === 'pass' ? '#252622' : r.status === 'warn' ? '#B89A64' : '#D85740';
                  return (
                    <div key={i} style={{ padding: '0.65rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                        <strong style={{ color: '#252622', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <span style={{ color: iconColor, fontWeight: 800 }}>{icon}</span>{r.rule}
                        </strong>
                        <span style={{ color: '#777970', fontWeight: 600, fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace" }}>{r.points}/{r.max}</span>
                      </div>
                      <div style={{ color: '#777970', lineHeight: 1.4, fontSize: '0.72rem' }}>{r.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NBC Compliance Panel */}
      {nbcResult && nbcResult.rules.length > 0 && (
        <div style={{ background: '#FAF8F2', border: '1px solid #E7E1D5', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            onClick={() => setNbcOpen(!nbcOpen)}
            style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: nbcOpen ? '#F3F0E7' : 'transparent', transition: 'all 0.15s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem', color: '#252622' }}>
              <span>🏛</span> NBC 2016 Compliance
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {(() => {
                const b = getBadgeStyle(nbcResult.score);
                return (
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: b.color, background: b.bg, border: `1px solid ${b.border}` }}>
                    {nbcResult.score}/100
                  </span>
                );
              })()}
              <span style={{ fontSize: '0.65rem', color: '#777970' }}>{nbcOpen ? '▲' : '▼'}</span>
            </div>
          </div>
          {nbcOpen && (
            <div style={{ padding: '1rem', borderTop: '1px solid #E7E1D5', background: '#FAF8F2' }}>
              {nbcResult.score < 100 && (
                <button
                  onClick={handleNbcFix}
                  disabled={nbcFixing}
                  style={{
                    width: '100%',
                    marginBottom: '0.85rem',
                    padding: '0.5rem',
                    fontSize: '0.78rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    background: '#252622',
                    color: '#FAF8F2',
                    border: '1px solid #252622',
                    borderRadius: '4px',
                    cursor: nbcFixing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {nbcFixing ? 'Revising geometry…' : 'Apply NBC 2016 Fixes (AI)'}
                </button>
              )}

              {lastNbcFixResult && lastNbcFixResult.status !== 'already_optimal' && (
                <div style={{ padding: '0.75rem', marginBottom: '0.85rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                    Score: {lastNbcFixResult.before_score} → <strong style={{ color: '#252622' }}>{lastNbcFixResult.after_score}</strong>
                  </div>
                  {lastNbcFixResult.design_rationale && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#777970', lineHeight: 1.4 }}>{lastNbcFixResult.design_rationale}</div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {nbcResult.rules.map((r, i) => {
                  if (r.max === 0) return null;
                  const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '!' : '×';
                  const iconColor = r.status === 'pass' ? '#252622' : r.status === 'warn' ? '#B89A64' : '#D85740';
                  return (
                    <div key={i} style={{ padding: '0.65rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                        <strong style={{ color: '#252622', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <span style={{ color: iconColor, fontWeight: 800 }}>{icon}</span>{r.rule}
                        </strong>
                        <span style={{ color: '#777970', fontWeight: 600, fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace" }}>{r.points}/{r.max}</span>
                      </div>
                      <div style={{ color: '#777970', lineHeight: 1.4, fontSize: '0.72rem' }}>{r.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Energy & Environment Panel */}
      {((energyResult && energyResult.rules.length > 0) || sunlightResult) && (
        <div style={{ background: '#FAF8F2', border: '1px solid #E7E1D5', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            onClick={() => setEnergyOpen(!energyOpen)}
            style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: energyOpen ? '#F3F0E7' : 'transparent', transition: 'all 0.15s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem', color: '#252622' }}>
              <span>🌱</span> Climate & Environmental
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#252622', background: 'rgba(161, 174, 151, 0.25)', border: '1px solid #A1AE97' }}>
                {energyResult ? `Grade ${energyResult.grade}` : sunlightResult ? `Grade ${sunlightResult.grade}` : 'Active'}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#777970' }}>{energyOpen ? '▲' : '▼'}</span>
            </div>
          </div>
          {energyOpen && (
            <div style={{ padding: '1rem', borderTop: '1px solid #E7E1D5', background: '#FAF8F2' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                
                {/* Sunlight Insights */}
                {sunlightResult?.insights && sunlightResult.insights.length > 0 && (
                  <>
                    <strong style={{ fontSize: '0.8rem', color: '#252622', marginTop: '0.25rem', fontWeight: 600 }}>Natural Daylight Assessment</strong>
                    {sunlightResult.insights.map((insight, i) => (
                      <div key={`sun-${i}`} style={{ padding: '0.65rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.85rem' }}>☀️</span>
                        <div style={{ color: '#777970', lineHeight: 1.4, fontSize: '0.72rem' }}>{insight}</div>
                      </div>
                    ))}
                  </>
                )}

                {/* Energy Rules */}
                {energyResult?.rules && energyResult.rules.length > 0 && (
                  <>
                    <strong style={{ fontSize: '0.8rem', color: '#252622', marginTop: '0.25rem', fontWeight: 600 }}>Thermal Efficiency Checklist</strong>
                    {energyResult.rules.map((r, i) => {
                      if (r.max === 0) return null;
                      const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '!' : '×';
                      const iconColor = r.status === 'pass' ? '#252622' : r.status === 'warn' ? '#B89A64' : '#D85740';
                      return (
                        <div key={`energy-${i}`} style={{ padding: '0.65rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                            <strong style={{ color: '#252622', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                              <span style={{ color: iconColor, fontWeight: 800 }}>{icon}</span>{r.rule}
                            </strong>
                            <span style={{ color: '#777970', fontWeight: 600, fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace" }}>{r.points}/{r.max}</span>
                          </div>
                          <div style={{ color: '#777970', lineHeight: 1.4, fontSize: '0.72rem' }}>{r.detail}</div>
                        </div>
                      );
                    })}
                  </>
                )}
                
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Bill of Materials (BOM) Estimation Panel */}
      {bomResult && (
        <div style={{ background: '#FAF8F2', border: '1px solid #E7E1D5', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            onClick={() => setBomOpen(!bomOpen)}
            style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: bomOpen ? '#F3F0E7' : 'transparent', transition: 'all 0.15s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem', color: '#252622' }}>
              <span>💰</span> Cost Estimate (BOM)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#252622', background: 'rgba(184, 154, 100, 0.2)', border: '1px solid #B89A64' }}>
                ₹{bomResult.summary.grand_total.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#777970' }}>{bomOpen ? '▲' : '▼'}</span>
            </div>
          </div>
          {bomOpen && (
            <div style={{ padding: '1rem', borderTop: '1px solid #E7E1D5', background: '#FAF8F2' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#252622' }}>Specification Tier</label>
                    <div style={{ position: 'relative' }}>
                      <select value={tier} onChange={handleTierChange} disabled={bomRecalculating} style={{ padding: '0.35rem 1.6rem 0.35rem 0.75rem', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", appearance: 'none', width: '120px', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px', color: '#252622' }}>
                          <option value="economy">Economy</option>
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                      </select>
                      <div style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#777970', fontSize: '0.6rem' }}>▼</div>
                    </div>
                </div>
                
                {bomRecalculating && <div style={{ fontSize: '0.75rem', color: '#777970', textAlign: 'center' }}>Recalculating rates…</div>}
                
                <div style={{ padding: '0.85rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px', opacity: bomRecalculating ? 0.5 : 1 }}>
                  <strong style={{ display: 'block', marginBottom: '0.6rem', color: '#252622', fontSize: '0.82rem', fontWeight: 600 }}>Construction Cost Summary</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777970', marginBottom: '0.35rem' }}>
                    <span>Total Area:</span> <strong style={{ color: '#252622' }}>{bomResult.summary.total_area_sqft} sqft</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777970', marginBottom: '0.35rem' }}>
                    <span>Rate per sqft:</span> <strong style={{ color: '#252622' }}>₹{bomResult.summary.rate_per_sqft.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777970', marginTop: '0.5rem', borderTop: '1px solid #E7E1D5', paddingTop: '0.5rem', marginBottom: '0.35rem' }}>
                    <span>Material:</span> <strong style={{ color: '#252622' }}>₹{bomResult.summary.material_total.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777970' }}>
                    <span>Labour:</span> <strong style={{ color: '#252622' }}>₹{bomResult.summary.labour_total.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #252622', fontWeight: 700, color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                    <span>Grand Total:</span> <span>₹{bomResult.summary.grand_total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.4rem', color: '#777970', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Room Schedule</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {bomResult.rooms.map((room, i) => (
                      <div key={i} style={{ padding: '0.65rem', background: '#FFFFFF', border: '1px solid #E7E1D5', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                          <strong style={{ color: '#252622', fontSize: '0.78rem', fontWeight: 600 }}>{room.name}</strong>
                          <span style={{ color: '#252622', fontWeight: 600, fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace" }}>₹{room.costs.total.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ color: '#777970', lineHeight: 1.4, fontSize: '0.7rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.75rem' }}>
                          <span>Area: {room.area_sqft} sqft</span>
                          <span>Structure: ₹{room.costs.structure.toLocaleString('en-IN')}</span>
                          <span>Flooring: ₹{room.costs.flooring.toLocaleString('en-IN')}</span>
                          <span>Paint: ₹{room.costs.painting.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
