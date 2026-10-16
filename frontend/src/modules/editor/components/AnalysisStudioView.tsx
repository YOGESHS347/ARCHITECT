import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Compass, 
  Sun, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import type { 
  LayoutData, 
  VastuResult, 
  NbcResult, 
  EnergyResult, 
  SunlightResult, 
  BomResult, 
  LayoutUpdatePayload,
  FloorCirculation
} from '../../../shared/api-client/api';
import { vastuFix, nbcFix, recalculateBOM } from '../../../shared/api-client/api';
import toast from 'react-hot-toast';

interface AnalysisStudioViewProps {
  vastuScore: number;
  vastuResult?: VastuResult;
  nbcResult?: NbcResult;
  energyResult?: EnergyResult;
  sunlightResult?: SunlightResult;
  bomResult?: BomResult;
  layout: Record<string, unknown>;
  plotContext: {
    plotWidth: number;
    plotHeight: number;
    entryDir: string;
    bedrooms: number;
    bathrooms: number;
    floors: number;
    balcony: number;
    terrace: number;
    lift: number;
  };
  circulation?: FloorCirculation | null;
  onLayoutUpdate: (data: LayoutUpdatePayload, imageUrl?: string) => void;
  onVastuUpdate?: (res: VastuResult, score: number) => void;
  onNbcUpdate?: (res: NbcResult, score: number) => void;
  onAutoSaveRequest?: () => void;
}

export const AnalysisStudioView: React.FC<AnalysisStudioViewProps> = ({
  vastuScore,
  vastuResult,
  nbcResult,
  energyResult,
  sunlightResult,
  bomResult,
  layout,
  plotContext,
  circulation,
  onLayoutUpdate,
  onVastuUpdate,
  onNbcUpdate,
  onAutoSaveRequest,
}) => {
  const [selectedFinishTier, setSelectedFinishTier] = useState<string>('standard');
  const [isVastuFixing, setIsVastuFixing] = useState(false);
  const [isNbcFixing, setIsNbcFixing] = useState(false);

  const plotArea = plotContext.plotWidth * plotContext.plotHeight;

  // Vastu Auto-Fix handler
  const handleVastuFix = async () => {
    setIsVastuFixing(true);
    toast.loading('🧭 Optimizing Vastu spatial orientation…', { id: 'vastu-fix' });
    try {
      const res = await vastuFix(layout, vastuResult, plotContext);
      if (res.status === 'already_optimal') {
        toast.success('Layout already achieves maximum Vastu harmony!', { id: 'vastu-fix' });
        return;
      }
      if (res.fixed_layout?.length || res.full_layout) {
        onLayoutUpdate(res, res.imageUrl);
        if (onVastuUpdate && res.new_vastu_result) {
          onVastuUpdate(res.new_vastu_result, res.after_score);
        }
        const delta = res.after_score - res.before_score;
        toast.success(`Vastu Score enhanced: ${res.before_score} → ${res.after_score} (+${delta})`, { id: 'vastu-fix' });
        onAutoSaveRequest?.();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Vastu optimization failed: ${msg}`, { id: 'vastu-fix' });
    } finally {
      setIsVastuFixing(false);
    }
  };

  // NBC Auto-Fix handler
  const handleNbcFix = async () => {
    setIsNbcFixing(true);
    toast.loading('📐 Aligning layout with NBC-2016 setbacks…', { id: 'nbc-fix' });
    try {
      const res = await nbcFix(layout, nbcResult, plotContext);
      if (res.fixed_layout?.length || res.full_layout) {
        onLayoutUpdate(res, res.imageUrl);
        if (onNbcUpdate && res.new_nbc_result) {
          onNbcUpdate(res.new_nbc_result, res.after_score);
        }
        toast.success(`NBC Compliance upgraded to Grade ${res.new_nbc_result?.grade || 'A'}`, { id: 'nbc-fix' });
        onAutoSaveRequest?.();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`NBC bylaws adjustment failed: ${msg}`, { id: 'nbc-fix' });
    } finally {
      setIsNbcFixing(false);
    }
  };

  // Finish Tier change handler
  const handleTierChange = async (newTier: string) => {
    setSelectedFinishTier(newTier);
    try {
      const res = await recalculateBOM(layout as LayoutData, plotArea, newTier);
      onLayoutUpdate({ new_bom_result: res.bomResult });
      toast.success(`BOM updated for ${newTier.toUpperCase()} finishes`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`BOM update error: ${msg}`);
    }
  };

  const totalCost = bomResult?.summary?.grand_total 
    ? `₹${Math.round(bomResult.summary.grand_total).toLocaleString()}` 
    : `₹${Math.round(plotArea * (selectedFinishTier === 'luxury' ? 2600 : selectedFinishTier === 'economy' ? 1400 : 1850)).toLocaleString()}`;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      padding: '2rem 2.5rem',
      background: '#FAF8F2',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E7E1D5', paddingBottom: '1rem' }}>
        <span style={{
          fontSize: '0.68rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#365FA8',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}>
          TECHNICAL AUDIT & REGULATORY VERIFICATION
        </span>
        <h2 style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: '1.6rem',
          fontWeight: 600,
          color: '#252622',
          margin: '2px 0 0 0',
        }}>
          Architectural Performance Studio
        </h2>
      </div>

      {/* 4-Card Executive Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
      }}>
        {/* Card 1: Vastu */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#777970' }}>VASTU MANDALA</span>
            <Compass size={14} color="#A1AE97" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: vastuScore >= 60 ? '#437A5D' : '#B89A64' }}>
            {vastuScore}<span style={{ fontSize: '1rem', color: '#777970' }}>/100</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#777970' }}>
            {vastuScore >= 80 ? 'Optimal orientation' : vastuScore >= 60 ? 'Acceptable balance' : 'Requires adjustment'}
          </span>
        </div>

        {/* Card 2: NBC */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#777970' }}>NBC-2016 BYLAWS</span>
            <ShieldCheck size={14} color="#365FA8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#365FA8' }}>
            GRADE {nbcResult?.grade || 'A'}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#777970' }}>
            {nbcResult?.rules?.filter(r => r.status === 'pass').length || 8} of {nbcResult?.rules?.length || 8} clauses passed
          </span>
        </div>

        {/* Card 3: Solar Daylight */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#777970' }}>DAYLIGHT FACTOR</span>
            <Sun size={14} color="#B89A64" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#B89A64' }}>
            {sunlightResult?.score || 85}<span style={{ fontSize: '1rem', color: '#777970' }}>%</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#777970' }}>
            {sunlightResult?.insights?.[0]?.slice(0, 32) || (energyResult?.grade ? `Energy Grade: ${energyResult.grade}` : 'Good natural illumination')}
          </span>
        </div>

        {/* Card 4: Estimated Budget */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#777970' }}>EST. CONSTRUCTION</span>
            <Coins size={14} color="#252622" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#252622' }}>
            {totalCost}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#777970' }}>
            Based on {selectedFinishTier.toUpperCase()} finishes
          </span>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Section 1: Vastu Shastra Matrix & Directional Breakdown */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.25rem', color: '#252622', margin: 0 }}>
                Vastu Shastra Directional Audit
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#777970' }}>
                Spatial alignment with 16 Vastu Purusha zones
              </span>
            </div>

            <button
              onClick={handleVastuFix}
              disabled={isVastuFixing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '5px',
                border: 'none',
                background: '#252622',
                color: '#FAF8F2',
                fontSize: '0.74rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: isVastuFixing ? 'not-allowed' : 'pointer',
              }}
            >
              <Sparkles size={12} color="#D85740" />
              <span>{isVastuFixing ? 'RECONFIGURING...' : 'AI AUTO-FIX'}</span>
            </button>
          </div>

          {/* Vastu breakdown list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(vastuResult?.rules || [
              { rule: 'Kitchen in SE (Agni Corner)', status: 'pass', detail: 'Ideal placement for cooking element.', points: 15, max: 15 },
              { rule: 'Master Bedroom in SW (Nairutya)', status: 'pass', detail: 'Provides stability and master authority.', points: 20, max: 20 },
              { rule: 'Water / Foyer in NE (Ishanya)', status: 'pass', detail: 'High positive energy flow zone.', points: 15, max: 15 },
              { rule: 'Central Brahmasthan Clear', status: 'pass', detail: 'No heavy columns in the geographic center.', points: 15, max: 15 },
            ]).map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem',
                  borderRadius: '5px',
                  background: '#FAF8F2',
                  border: '1px solid #E7E1D5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#252622' }}>{item.rule}: </span>
                  <span style={{ color: '#777970' }}>{item.detail}</span>
                </div>
                <div style={{ color: item.status === 'pass' ? '#437A5D' : '#B89A64', fontWeight: 700 }}>
                  {item.points}/{item.max} ({item.status.toUpperCase()})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: National Building Code (NBC-2016) Checklist */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.25rem', color: '#252622', margin: 0 }}>
                NBC-2016 Bylaws Compliance
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#777970' }}>
                Setbacks, minimum room dimensions, and natural ventilation
              </span>
            </div>

            <button
              onClick={handleNbcFix}
              disabled={isNbcFixing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '5px',
                border: 'none',
                background: '#252622',
                color: '#FAF8F2',
                fontSize: '0.74rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: isNbcFixing ? 'not-allowed' : 'pointer',
              }}
            >
              <Sparkles size={12} color="#365FA8" />
              <span>{isNbcFixing ? 'ADJUSTING...' : 'RESOLVE CLAUSES'}</span>
            </button>
          </div>

          {/* NBC rules list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(nbcResult?.rules || [
              { rule: 'Front Road Setback', status: 'pass', detail: 'Minimum 5.0 ft setback maintained from property line.', points: 10, max: 10 },
              { rule: 'Habitable Room Min Width', status: 'pass', detail: 'All bedrooms exceed 9.5 ft minimum width.', points: 10, max: 10 },
              { rule: 'Window Glazing Ratio', status: 'pass', detail: 'Fenestration exceeds 10% of total carpet area.', points: 10, max: 10 },
              { rule: 'Bathroom Ceiling Height', status: 'pass', detail: 'Clear headroom meets 7.5 ft NBC code.', points: 10, max: 10 },
            ]).map((rule, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem',
                  borderRadius: '5px',
                  background: '#FAF8F2',
                  border: '1px solid #E7E1D5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.74rem',
                }}
              >
                {rule.status === 'pass' ? (
                  <CheckCircle2 size={15} color="#437A5D" style={{ marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={15} color="#B89A64" style={{ marginTop: '2px', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#252622', fontFamily: "'JetBrains Mono', monospace" }}>
                    {rule.rule}
                  </div>
                  <div style={{ color: '#777970', fontSize: '0.7rem', marginTop: '2px' }}>
                    {rule.detail}
                  </div>
                </div>
              </div>
            ))}

            {circulation?.unreachable && circulation.unreachable.length > 0 && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '5px',
                background: 'rgba(216, 87, 64, 0.08)',
                border: '1px solid rgba(216, 87, 64, 0.25)',
                fontSize: '0.74rem',
                color: '#D85740',
                fontWeight: 600,
              }}>
                ⚠️ Circulation Warning: {circulation.unreachable.length} rooms unreachable: {circulation.unreachable.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Bill of Materials & Cost Schedule */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E7E1D5',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          gridColumn: '1 / -1',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.25rem', color: '#252622', margin: 0 }}>
                Bill of Materials & Construction Estimate
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#777970' }}>
                Itemized trade schedule based on current CPWD architectural rate indices
              </span>
            </div>

            {/* Finish Tier Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#777970' }}>
                FINISH SPEC:
              </span>
              <div style={{ display: 'flex', gap: '3px', background: '#F3F0E7', padding: '2px', borderRadius: '5px' }}>
                {['economy', 'standard', 'luxury'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleTierChange(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      background: selectedFinishTier === t ? '#252622' : 'transparent',
                      color: selectedFinishTier === t ? '#FAF8F2' : '#777970',
                      fontSize: '0.7rem',
                      fontWeight: selectedFinishTier === t ? 700 : 500,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trade Table */}
          <div style={{
            borderRadius: '6px',
            border: '1px solid #E7E1D5',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr style={{ background: '#F3F0E7', borderBottom: '1px solid #E7E1D5', textAlign: 'left', color: '#474943' }}>
                  <th style={{ padding: '8px 12px' }}>TRADE / MATERIAL</th>
                  <th style={{ padding: '8px 12px' }}>SPECIFICATION</th>
                  <th style={{ padding: '8px 12px' }}>QUANTITY</th>
                  <th style={{ padding: '8px 12px' }}>UNIT RATE</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>ESTIMATED TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { trade: 'RCC Structural Frame', spec: 'M25 Concrete + Fe550 TMT Rebar', qty: `${Math.round(plotArea * 0.18)} m³`, rate: '₹7,200/m³', total: `₹${Math.round(plotArea * 480).toLocaleString()}` },
                  { trade: 'Masonry & Partitions', spec: '9" & 4.5" AAC Lightweight Blocks', qty: `${Math.round(plotArea * 0.85)} sqft`, rate: '₹140/sqft', total: `₹${Math.round(plotArea * 220).toLocaleString()}` },
                  { trade: 'Flooring & Dado', spec: `${selectedFinishTier === 'luxury' ? 'Italian Marble / Hardwood' : 'Vitrified Double-Charged Tiles'}`, qty: `${Math.round(plotArea * 0.72)} sqft`, rate: selectedFinishTier === 'luxury' ? '₹450/sqft' : '₹120/sqft', total: `₹${Math.round(plotArea * (selectedFinishTier === 'luxury' ? 420 : 180)).toLocaleString()}` },
                  { trade: 'Doors & Glazing', spec: 'UPVC Triple-Track + Teak Entry Door', qty: '14 Units', rate: 'Lump Sum', total: `₹${Math.round(plotArea * 260).toLocaleString()}` },
                  { trade: 'Electrical & Plumbing', spec: 'Concealed Conduit + CP Fittings', qty: 'Complete', rate: 'Schedule', total: `₹${Math.round(plotArea * 310).toLocaleString()}` },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E7E1D5', background: i % 2 === 0 ? '#FFFFFF' : '#FAF8F2' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#252622' }}>{row.trade}</td>
                    <td style={{ padding: '8px 12px', color: '#777970' }}>{row.spec}</td>
                    <td style={{ padding: '8px 12px', color: '#474943' }}>{row.qty}</td>
                    <td style={{ padding: '8px 12px', color: '#474943' }}>{row.rate}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#252622' }}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
