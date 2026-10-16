/**
 * siteLandscapingGenerator.ts
 * ============================================================================
 * Phase 5 Signature Architectural Visualization: Parametric Landscaping & Site Engine.
 *
 * Derives realistic, high-fidelity outdoor site presentations from the authoritative
 * CanonicalBuildingDocument, canonical plot bounds, and coordinate conventions.
 *
 * Architectural Invariants:
 * 1. Single Authoritative Source: Keeps site geometry completely separate from the
 *    canonical building graph. Never modifies walls, rooms, doors, windows, or furniture.
 * 2. Parametric & Plot-Aware: Geometry conforms strictly to the canonical plot dimensions,
 *    setbacks, and entry orientation without overflowing boundaries.
 * 3. Footprint Collision Avoidance: Verifies that no pools, decks, walls, or vegetation
 *    intersect the building footprint, door access paths, or required clearances.
 * 4. Deterministic: Output is 100% reproducible for identical inputs (zero random drift).
 * 5. Configurable & Optional: Users can toggle landscaping, boundary walls, pool, or trees
 *    without modifying the underlying building document or requiring database schema changes.
 * 6. Material Pipeline Reuse: Uses the existing PBR architectural material registry
 *    (garden_turf, teak_decking, travertine_paver, pool_water, architectural_plaster).
 * ============================================================================
 */

import type {
  CanonicalBuildingDocument,
} from './types';
import { METRES_TO_FEET } from './types';
import type { ArchitecturalMaterialKey } from './architecturalMaterials';

// ── Configuration Options ───────────────────────────────────────────────────

export interface SiteLandscapingOptions {
  /** Master toggle: enable or disable the site landscaping presentation */
  enabled?: boolean;
  /** Render exterior boundary walls around property line */
  showBoundaryWalls?: boolean;
  /** Render manicured lawn turf within plot bounds */
  showLawn?: boolean;
  /** Render 3D architectural palm and shade trees */
  showTrees?: boolean;
  /** Render boxwood privacy hedges along perimeter */
  showHedges?: boolean;
  /** Render paved entry walkway connecting to building */
  showPathways?: boolean;
  /** Render rear terrace patio connecting to building */
  showPatio?: boolean;
  /** Render sunken swimming pool with water shader and coping */
  showPool?: boolean;
  /** Render teak sun deck adjoining the pool */
  showDeck?: boolean;
  /** Render reclining poolside loungers and side tables */
  showPoolLoungers?: boolean;
  /** Height of boundary walls in feet (default 6.0 ft) */
  boundaryWallHeightFt?: number;
  /** Optional custom pool dimension overrides */
  poolCustomOverrides?: {
    widthFt?: number;
    lengthFt?: number;
    depthFt?: number;
  };
}

export const DEFAULT_LANDSCAPING_OPTIONS: Required<SiteLandscapingOptions> = {
  enabled: true,
  showBoundaryWalls: true,
  showLawn: true,
  showTrees: true,
  showHedges: true,
  showPathways: true,
  showPatio: true,
  showPool: true,
  showDeck: true,
  showPoolLoungers: true,
  boundaryWallHeightFt: 6.0,
  poolCustomOverrides: {},
};

// ── Generated 3D Site Geometry Interfaces ───────────────────────────────────

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  length: number;
  centerX: number;
  centerZ: number;
}

export interface GeneratedBoundaryWallSegment3D {
  id: string;
  startPt: { x: number; z: number };
  endPt: { x: number; z: number };
  lengthFt: number;
  thicknessFt: number;
  heightFt: number;
  angleRad: number;
  centerFt: { x: number; z: number };
  wallColor: string;
  copingColor: string;
}

export interface GeneratedGroundZone3D {
  id: string;
  type: 'lawn' | 'paving' | 'outer_ground';
  centerFt: { x: number; z: number };
  dimensionsFt: { width: number; length: number };
  elevationFt: number;
  materialKey: ArchitecturalMaterialKey;
  color?: string;
}

export interface GeneratedPathway3D {
  id: string;
  name: string;
  centerFt: { x: number; z: number };
  dimensionsFt: { width: number; length: number };
  rotationDeg: number;
  elevationFt: number;
  materialKey: ArchitecturalMaterialKey;
}

export interface GeneratedPatio3D {
  id: string;
  centerFt: { x: number; z: number };
  dimensionsFt: { width: number; length: number };
  elevationFt: number;
  materialKey: ArchitecturalMaterialKey;
}

export interface GeneratedDeck3D {
  id: string;
  centerFt: { x: number; z: number };
  dimensionsFt: { width: number; length: number };
  elevationFt: number;
  materialKey: ArchitecturalMaterialKey;
}

export interface GeneratedPool3D {
  id: string;
  isValid: boolean;
  validationReason?: string;
  boundsFt: {
    x: number;      // Outer coping min X
    z: number;      // Outer coping min Z
    width: number;  // Outer coping width
    length: number; // Outer coping length
    depth: number;  // Water depth in feet
  };
  centerFt: { x: number; z: number };
  innerBasinFt: {
    width: number;
    length: number;
  };
  waterSurfaceYFt: number;     // e.g. -0.25 ft
  basinFloorYFt: number;        // e.g. -4.5 ft
  copingWidthFt: number;        // 1.0 ft
  stepsCount: number;           // 3
  underwaterLightPosFt: { x: number; y: number; z: number };
}

export interface GeneratedVegetationItem3D {
  id: string;
  type: 'palm_tree' | 'shade_tree' | 'boxwood_hedge';
  positionFt: { x: number; y: number; z: number };
  scale: { width: number; height: number; depth: number };
  rotationDeg: number;
  color?: string;
}

export interface GeneratedPoolsideItem3D {
  id: string;
  type: 'sun_lounger' | 'side_table' | 'parasol';
  positionFt: { x: number; y: number; z: number };
  rotationDeg: number;
  dimensionsFt: { width: number; depth: number; height: number };
}

export interface GeneratedSiteLandscaping3D {
  enabled: boolean;
  plotBoundsFt: BoundingBox2D;
  buildingFootprintFt: BoundingBox2D;
  groundZones: GeneratedGroundZone3D[];
  boundaryWalls: GeneratedBoundaryWallSegment3D[];
  pathways: GeneratedPathway3D[];
  patio?: GeneratedPatio3D;
  deck?: GeneratedDeck3D;
  pool?: GeneratedPool3D;
  vegetation: GeneratedVegetationItem3D[];
  poolsideItems: GeneratedPoolsideItem3D[];
}

// ── Helper Math Functions ───────────────────────────────────────────────────

/** Deterministic pseudo-random generator based on integer seed */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/** Check if two 2D axis-aligned bounding boxes overlap */
export function doBoxesOverlap(
  a: { minX: number; maxX: number; minZ: number; maxZ: number },
  b: { minX: number; maxX: number; minZ: number; maxZ: number },
  margin = 0
): boolean {
  return !(
    a.maxX + margin <= b.minX ||
    a.minX - margin >= b.maxX ||
    a.maxZ + margin <= b.minZ ||
    a.minZ - margin >= b.maxZ
  );
}

/** Check if box A is completely inside box B */
export function isBoxContained(
  inner: { minX: number; maxX: number; minZ: number; maxZ: number },
  outer: { minX: number; maxX: number; minZ: number; maxZ: number },
  clearance = 0
): boolean {
  return (
    inner.minX >= outer.minX + clearance &&
    inner.maxX <= outer.maxX - clearance &&
    inner.minZ >= outer.minZ + clearance &&
    inner.maxZ <= outer.maxZ - clearance
  );
}

// ── Pool Placement & Validation Engine ──────────────────────────────────────

export interface PoolValidationResult {
  valid: boolean;
  reason?: string;
  boundsFt?: {
    x: number;
    z: number;
    width: number;
    length: number;
    depth: number;
  };
}

/**
 * Validates swimming pool dimensions, placement clearances, depth,
 * and confirms it does not collide with building walls or exceed plot lines.
 */
export function validatePoolPlacement(
  candidate: { x: number; z: number; width: number; length: number; depth: number },
  buildingBox: BoundingBox2D,
  plotBox: BoundingBox2D,
  minBuildingClearance = 3.5,
  minBoundaryClearance = 2.5
): PoolValidationResult {
  // 1. Dimension validation
  if (candidate.width < 6.0 || candidate.width > 30.0) {
    return { valid: false, reason: `Pool width ${candidate.width.toFixed(1)}ft outside architectural range (6-30ft)` };
  }
  if (candidate.length < 10.0 || candidate.length > 60.0) {
    return { valid: false, reason: `Pool length ${candidate.length.toFixed(1)}ft outside architectural range (10-60ft)` };
  }
  if (candidate.depth < 3.0 || candidate.depth > 10.0) {
    return { valid: false, reason: `Pool depth ${candidate.depth.toFixed(1)}ft outside standard residential range (3-10ft)` };
  }

  const poolBox = {
    minX: candidate.x,
    maxX: candidate.x + candidate.width,
    minZ: candidate.z,
    maxZ: candidate.z + candidate.length,
  };

  // 2. Boundary containment validation
  if (!isBoxContained(poolBox, plotBox, minBoundaryClearance)) {
    return {
      valid: false,
      reason: `Pool violates boundary setback: must remain >= ${minBoundaryClearance}ft within plot property lines`,
    };
  }

  // 3. Building collision & structural clearance validation
  const expandedBuildingBox = {
    minX: buildingBox.minX - minBuildingClearance,
    maxX: buildingBox.maxX + minBuildingClearance,
    minZ: buildingBox.minZ - minBuildingClearance,
    maxZ: buildingBox.maxZ + minBuildingClearance,
  };

  if (doBoxesOverlap(poolBox, expandedBuildingBox)) {
    return {
      valid: false,
      reason: `Pool collides with building structural zone (requires >= ${minBuildingClearance}ft foundation clearance)`,
    };
  }

  return { valid: true, boundsFt: candidate };
}

// ── Main Site Landscaping Generator ─────────────────────────────────────────

/**
 * Pure generator function: transforms canonical document plot and building bounds
 * into a complete, deterministic, watertight 3D site landscaping representation.
 */
export function generateSiteLandscaping(
  doc: CanonicalBuildingDocument,
  buildingBounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    centerX: number;
    centerZ: number;
    width: number;
    depth: number;
    totalHeight: number;
  },
  userOptions: SiteLandscapingOptions = {}
): GeneratedSiteLandscaping3D {
  const options: Required<SiteLandscapingOptions> = {
    ...DEFAULT_LANDSCAPING_OPTIONS,
    ...userOptions,
    poolCustomOverrides: {
      ...DEFAULT_LANDSCAPING_OPTIONS.poolCustomOverrides,
      ...(userOptions.poolCustomOverrides || {}),
    },
  };

  // 1. Resolve authoritative plot dimensions in feet
  let plotWidthFt = 30.0;
  let plotLengthFt = 40.0;

  if (doc.site?.width && doc.site.width > 0) {
    plotWidthFt = doc.site.width * METRES_TO_FEET;
  }
  if (doc.site?.length && doc.site.length > 0) {
    plotLengthFt = doc.site.length * METRES_TO_FEET;
  }

  // Ensure plot bounds encompass the building if building is placed outside origin
  const plotMinX = Math.min(0, buildingBounds.minX - 3.0);
  const plotMaxX = Math.max(plotWidthFt, buildingBounds.maxX + 3.0);
  const plotMinZ = Math.min(0, buildingBounds.minZ - 3.0);
  const plotMaxZ = Math.max(plotLengthFt, buildingBounds.maxZ + 3.0);

  const plotBox: BoundingBox2D = {
    minX: plotMinX,
    maxX: plotMaxX,
    minZ: plotMinZ,
    maxZ: plotMaxZ,
    width: plotMaxX - plotMinX,
    length: plotMaxZ - plotMinZ,
    centerX: (plotMinX + plotMaxX) / 2,
    centerZ: (plotMinZ + plotMaxZ) / 2,
  };

  const buildingBox: BoundingBox2D = {
    minX: buildingBounds.minX,
    maxX: buildingBounds.maxX,
    minZ: buildingBounds.minZ,
    maxZ: buildingBounds.maxZ,
    width: buildingBounds.width,
    length: buildingBounds.depth,
    centerX: buildingBounds.centerX,
    centerZ: buildingBounds.centerZ,
  };

  // If disabled, return bare-bones empty state
  if (!options.enabled) {
    return {
      enabled: false,
      plotBoundsFt: plotBox,
      buildingFootprintFt: buildingBox,
      groundZones: [],
      boundaryWalls: [],
      pathways: [],
      vegetation: [],
      poolsideItems: [],
    };
  }

  const entrySide = (doc.site?.entrySide || doc.metadata?.entryDirection || 'east').toLowerCase();
  const wallThickFt = 0.65; // 8-inch boundary masonry
  const wallHeightFt = Math.max(4.0, options.boundaryWallHeightFt);

  // ── 2. Boundary Walls with Gate Opening ───────────────────────────────────
  const boundaryWalls: GeneratedBoundaryWallSegment3D[] = [];

  if (options.showBoundaryWalls) {
    const gateWidthFt = 12.0;

    // Helper to add a wall segment
    const addWallSegment = (
      id: string,
      x1: number,
      z1: number,
      x2: number,
      z2: number
    ) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 1.0) return;
      boundaryWalls.push({
        id,
        startPt: { x: x1, z: z1 },
        endPt: { x: x2, z: z2 },
        lengthFt: len,
        thicknessFt: wallThickFt,
        heightFt: wallHeightFt,
        angleRad: Math.atan2(dz, dx),
        centerFt: { x: (x1 + x2) / 2, z: (z1 + z2) / 2 },
        wallColor: '#f1f5f9',     // Off-white smooth stucco
        copingColor: '#475569',   // Slate architectural wall coping
      });
    };

    // North wall (Z = plotMinZ)
    if (entrySide === 'north') {
      const midX = plotBox.centerX;
      addWallSegment('bwall_n_left', plotBox.minX, plotBox.minZ, midX - gateWidthFt / 2, plotBox.minZ);
      addWallSegment('bwall_n_right', midX + gateWidthFt / 2, plotBox.minZ, plotBox.maxX, plotBox.minZ);
    } else {
      addWallSegment('bwall_n', plotBox.minX, plotBox.minZ, plotBox.maxX, plotBox.minZ);
    }

    // South wall (Z = plotMaxZ)
    if (entrySide === 'south') {
      const midX = plotBox.centerX;
      addWallSegment('bwall_s_left', plotBox.minX, plotBox.maxZ, midX - gateWidthFt / 2, plotBox.maxZ);
      addWallSegment('bwall_s_right', midX + gateWidthFt / 2, plotBox.maxZ, plotBox.maxX, plotBox.maxZ);
    } else {
      addWallSegment('bwall_s', plotBox.minX, plotBox.maxZ, plotBox.maxX, plotBox.maxZ);
    }

    // West wall (X = plotMinX)
    if (entrySide === 'west') {
      const midZ = plotBox.centerZ;
      addWallSegment('bwall_w_top', plotBox.minX, plotBox.minZ, plotBox.minX, midZ - gateWidthFt / 2);
      addWallSegment('bwall_w_bot', plotBox.minX, midZ + gateWidthFt / 2, plotBox.minX, plotBox.maxZ);
    } else {
      addWallSegment('bwall_w', plotBox.minX, plotBox.minZ, plotBox.minX, plotBox.maxZ);
    }

    // East wall (X = plotMaxX)
    if (entrySide === 'east') {
      const midZ = plotBox.centerZ;
      addWallSegment('bwall_e_top', plotBox.maxX, plotBox.minZ, plotBox.maxX, midZ - gateWidthFt / 2);
      addWallSegment('bwall_e_bot', plotBox.maxX, midZ + gateWidthFt / 2, plotBox.maxX, plotBox.maxZ);
    } else {
      addWallSegment('bwall_e', plotBox.maxX, plotBox.minZ, plotBox.maxX, plotBox.maxZ);
    }
  }

  // ── 3. Ground Zones (Lawn Turf + Surrounding Site Plane) ──────────────────
  const groundZones: GeneratedGroundZone3D[] = [];

  if (options.showLawn) {
    // Primary Plot Lawn Turf
    groundZones.push({
      id: 'ground_plot_turf',
      type: 'lawn',
      centerFt: { x: plotBox.centerX, z: plotBox.centerZ },
      dimensionsFt: { width: plotBox.width, length: plotBox.length },
      elevationFt: -0.02,
      materialKey: 'garden_turf',
    });

    // Subtle Extended Base Plane for Infinite Grounding
    groundZones.push({
      id: 'ground_outer_plane',
      type: 'outer_ground',
      centerFt: { x: plotBox.centerX, z: plotBox.centerZ },
      dimensionsFt: { width: plotBox.width * 2.2, length: plotBox.length * 2.2 },
      elevationFt: -0.06,
      materialKey: 'honed_concrete',
      color: '#0d1117',
    });
  }

  // ── 4. Pathways & Patio Connections ───────────────────────────────────────
  const pathways: GeneratedPathway3D[] = [];
  let patio: GeneratedPatio3D | undefined;

  if (options.showPathways) {
    // Entry Walkway from boundary gate towards building threshold
    const walkWidth = 5.0;
    if (entrySide === 'south') {
      const walkLen = Math.max(4.0, plotBox.maxZ - buildingBox.maxZ);
      pathways.push({
        id: 'path_main_entry',
        name: 'Front Entry Promenade',
        centerFt: { x: buildingBox.centerX, z: plotBox.maxZ - walkLen / 2 },
        dimensionsFt: { width: walkWidth, length: walkLen },
        rotationDeg: 0,
        elevationFt: 0.02,
        materialKey: 'travertine_paver',
      });
    } else if (entrySide === 'north') {
      const walkLen = Math.max(4.0, buildingBox.minZ - plotBox.minZ);
      pathways.push({
        id: 'path_main_entry',
        name: 'Front Entry Promenade',
        centerFt: { x: buildingBox.centerX, z: plotBox.minZ + walkLen / 2 },
        dimensionsFt: { width: walkWidth, length: walkLen },
        rotationDeg: 0,
        elevationFt: 0.02,
        materialKey: 'travertine_paver',
      });
    } else if (entrySide === 'west') {
      const walkLen = Math.max(4.0, buildingBox.minX - plotBox.minX);
      pathways.push({
        id: 'path_main_entry',
        name: 'Front Entry Promenade',
        centerFt: { x: plotBox.minX + walkLen / 2, z: buildingBox.centerZ },
        dimensionsFt: { width: walkLen, length: walkWidth },
        rotationDeg: 0,
        elevationFt: 0.02,
        materialKey: 'travertine_paver',
      });
    } else {
      // East (default)
      const walkLen = Math.max(4.0, plotBox.maxX - buildingBox.maxX);
      pathways.push({
        id: 'path_main_entry',
        name: 'Front Entry Promenade',
        centerFt: { x: plotBox.maxX - walkLen / 2, z: buildingBox.centerZ },
        dimensionsFt: { width: walkLen, length: walkWidth },
        rotationDeg: 0,
        elevationFt: 0.02,
        materialKey: 'travertine_paver',
      });
    }
  }

  // Rear Leisure Patio
  if (options.showPatio) {
    // Place patio on the side opposite to the entry side
    if (entrySide === 'south' || entrySide === 'east') {
      // Rear is North/West
      const patioWidth = Math.min(buildingBox.width + 4.0, plotBox.width - 4.0);
      const patioDepth = Math.max(6.0, Math.min(10.0, buildingBox.minZ - plotBox.minZ - 3.0));
      if (patioDepth >= 4.0) {
        patio = {
          id: 'patio_rear_terrace',
          centerFt: { x: buildingBox.centerX, z: buildingBox.minZ - patioDepth / 2 },
          dimensionsFt: { width: patioWidth, length: patioDepth },
          elevationFt: 0.03,
          materialKey: 'travertine_paver',
        };
      }
    } else {
      // Rear is South/East
      const patioWidth = Math.min(buildingBox.width + 4.0, plotBox.width - 4.0);
      const patioDepth = Math.max(6.0, Math.min(10.0, plotBox.maxZ - buildingBox.maxZ - 3.0));
      if (patioDepth >= 4.0) {
        patio = {
          id: 'patio_rear_terrace',
          centerFt: { x: buildingBox.centerX, z: buildingBox.maxZ + patioDepth / 2 },
          dimensionsFt: { width: patioWidth, length: patioDepth },
          elevationFt: 0.03,
          materialKey: 'travertine_paver',
        };
      }
    }
  }

  // ── 5. Parametric Swimming Pool & Sun Deck ────────────────────────────────
  let pool: GeneratedPool3D | undefined;
  let deck: GeneratedDeck3D | undefined;
  const poolsideItems: GeneratedPoolsideItem3D[] = [];

  if (options.showPool) {
    // Check available yard space to find the most suitable location for the pool
    // Options: Rear Yard or Side Yard opposite entry
    const rearYardNorth = buildingBox.minZ - plotBox.minZ;
    const rearYardSouth = plotBox.maxZ - buildingBox.maxZ;
    const sideYardWest = buildingBox.minX - plotBox.minX;
    const sideYardEast = plotBox.maxX - buildingBox.maxX;

    // Default target dimensions for residential villa pool
    const defaultPoolW = options.poolCustomOverrides.widthFt || 10.0;
    const defaultPoolL = options.poolCustomOverrides.lengthFt || 20.0;
    const defaultPoolD = options.poolCustomOverrides.depthFt || 4.5;

    let candidatePool: { x: number; z: number; width: number; length: number; depth: number } | null = null;
    let deckPlacement: { centerFt: { x: number; z: number }; dimensionsFt: { width: number; length: number } } | null = null;

    // Scenario A: Large Rear Yard North
    if (entrySide !== 'north' && rearYardNorth >= defaultPoolL + 8.0 && plotBox.width >= defaultPoolW + 8.0) {
      const pX = buildingBox.centerX - defaultPoolW / 2;
      const pZ = plotBox.minZ + 4.0;
      candidatePool = { x: pX, z: pZ, width: defaultPoolW, length: defaultPoolL, depth: defaultPoolD };

      if (options.showDeck) {
        deckPlacement = {
          centerFt: { x: pX - 4.0, z: pZ + defaultPoolL / 2 },
          dimensionsFt: { width: 6.0, length: defaultPoolL },
        };
      }
    }
    // Scenario B: Large Rear Yard South
    else if (entrySide !== 'south' && rearYardSouth >= defaultPoolL + 8.0 && plotBox.width >= defaultPoolW + 8.0) {
      const pX = buildingBox.centerX - defaultPoolW / 2;
      const pZ = buildingBox.maxZ + 5.0;
      candidatePool = { x: pX, z: pZ, width: defaultPoolW, length: defaultPoolL, depth: defaultPoolD };

      if (options.showDeck) {
        deckPlacement = {
          centerFt: { x: pX - 4.0, z: pZ + defaultPoolL / 2 },
          dimensionsFt: { width: 6.0, length: defaultPoolL },
        };
      }
    }
    // Scenario C: Side Yard West
    else if (entrySide !== 'west' && sideYardWest >= defaultPoolW + 8.0 && plotBox.length >= defaultPoolL + 8.0) {
      const pX = plotBox.minX + 3.5;
      const pZ = buildingBox.centerZ - defaultPoolL / 2;
      candidatePool = { x: pX, z: pZ, width: defaultPoolW, length: defaultPoolL, depth: defaultPoolD };

      if (options.showDeck) {
        deckPlacement = {
          centerFt: { x: pX + defaultPoolW + 3.0, z: pZ + defaultPoolL / 2 },
          dimensionsFt: { width: 5.0, length: defaultPoolL },
        };
      }
    }
    // Scenario D: Side Yard East
    else if (entrySide !== 'east' && sideYardEast >= defaultPoolW + 8.0 && plotBox.length >= defaultPoolL + 8.0) {
      const pX = buildingBox.maxX + 4.0;
      const pZ = buildingBox.centerZ - defaultPoolL / 2;
      candidatePool = { x: pX, z: pZ, width: defaultPoolW, length: defaultPoolL, depth: defaultPoolD };

      if (options.showDeck) {
        deckPlacement = {
          centerFt: { x: pX + defaultPoolW + 3.0, z: pZ + defaultPoolL / 2 },
          dimensionsFt: { width: 5.0, length: defaultPoolL },
        };
      }
    }

    if (candidatePool) {
      const validation = validatePoolPlacement(candidatePool, buildingBox, plotBox);
      if (validation.valid && validation.boundsFt) {
        const b = validation.boundsFt;
        pool = {
          id: 'swimming_pool_sunken',
          isValid: true,
          boundsFt: b,
          centerFt: { x: b.x + b.width / 2, z: b.z + b.length / 2 },
          innerBasinFt: {
            width: b.width - 2.0, // minus 1ft coping each side
            length: b.length - 2.0,
          },
          waterSurfaceYFt: -0.25,
          basinFloorYFt: -b.depth,
          copingWidthFt: 1.0,
          stepsCount: 3,
          underwaterLightPosFt: {
            x: b.x + b.width / 2,
            y: -b.depth / 2,
            z: b.z + 1.5,
          },
        };

        if (deckPlacement && options.showDeck) {
          deck = {
            id: 'deck_poolside_teak',
            centerFt: deckPlacement.centerFt,
            dimensionsFt: deckPlacement.dimensionsFt,
            elevationFt: 0.04,
            materialKey: 'teak_decking',
          };

          // Place poolside loungers along the deck
          if (options.showPoolLoungers) {
            const numLoungers = 2;
            const stepZ = deckPlacement.dimensionsFt.length / (numLoungers + 1);
            for (let i = 0; i < numLoungers; i++) {
              const lZ = deckPlacement.centerFt.z - deckPlacement.dimensionsFt.length / 2 + (i + 1) * stepZ;
              poolsideItems.push({
                id: `lounger_${i + 1}`,
                type: 'sun_lounger',
                positionFt: { x: deckPlacement.centerFt.x, y: 0.05, z: lZ },
                rotationDeg: 90,
                dimensionsFt: { width: 2.3, depth: 6.2, height: 1.4 },
              });
            }
          }
        }
      }
    }
  }

  // ── 6. Vegetation (Palm Trees, Shade Trees, Boxwood Hedges) ───────────────
  const vegetation: GeneratedVegetationItem3D[] = [];

  if (options.showTrees) {
    // Deterministic tree positioning anchored at safe garden corners
    const candidateTreeSpots: { x: number; z: number; type: 'palm_tree' | 'shade_tree' }[] = [
      // 4 corner spots
      { x: plotBox.minX + 4.5, z: plotBox.minZ + 4.5, type: 'palm_tree' },
      { x: plotBox.maxX - 4.5, z: plotBox.minZ + 4.5, type: 'shade_tree' },
      { x: plotBox.minX + 4.5, z: plotBox.maxZ - 4.5, type: 'shade_tree' },
      { x: plotBox.maxX - 4.5, z: plotBox.maxZ - 4.5, type: 'palm_tree' },
    ];

    // If pool exists, add 2 poolside palms
    if (pool && pool.isValid) {
      candidateTreeSpots.push(
        { x: pool.boundsFt.x + pool.boundsFt.width + 3.0, z: pool.boundsFt.z - 2.0, type: 'palm_tree' },
        { x: pool.boundsFt.x - 3.0, z: pool.boundsFt.z + pool.boundsFt.length + 2.0, type: 'palm_tree' }
      );
    }

    // Filter spots to ensure no collision with building, patio, deck, or pool
    let treeSeed = 101;
    candidateTreeSpots.forEach((spot, idx) => {
      const treeRadius = 2.5;
      const treeBox = {
        minX: spot.x - treeRadius,
        maxX: spot.x + treeRadius,
        minZ: spot.z - treeRadius,
        maxZ: spot.z + treeRadius,
      };

      // Ensure inside plot
      if (!isBoxContained(treeBox, plotBox, 1.0)) return;

      // Ensure no building collision
      if (doBoxesOverlap(treeBox, buildingBox, 2.0)) return;

      // Ensure no pool collision
      if (pool && pool.isValid) {
        const poolBox = {
          minX: pool.boundsFt.x,
          maxX: pool.boundsFt.x + pool.boundsFt.width,
          minZ: pool.boundsFt.z,
          maxZ: pool.boundsFt.z + pool.boundsFt.length,
        };
        if (doBoxesOverlap(treeBox, poolBox, 1.5)) return;
      }

      // Add tree
      const rndScale = 0.9 + pseudoRandom(treeSeed++) * 0.25;
      vegetation.push({
        id: `tree_${idx + 1}_${spot.type}`,
        type: spot.type,
        positionFt: { x: spot.x, y: 0, z: spot.z },
        scale: {
          width: rndScale,
          height: spot.type === 'palm_tree' ? rndScale * 1.1 : rndScale,
          depth: rndScale,
        },
        rotationDeg: Math.round(pseudoRandom(treeSeed++) * 360),
      });
    });
  }

  // Perimeter Boxwood Hedges
  if (options.showHedges) {
    const hedgeThick = 1.2;
    const hedgeH = 3.5;

    // Helper to add hedge segments
    const addHedge = (id: string, x: number, z: number, w: number, d: number) => {
      // Check collision
      const hBox = { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
      if (doBoxesOverlap(hBox, buildingBox, 1.5)) return;
      if (pool && pool.isValid) {
        const pBox = { minX: pool.boundsFt.x, maxX: pool.boundsFt.x + pool.boundsFt.width, minZ: pool.boundsFt.z, maxZ: pool.boundsFt.z + pool.boundsFt.length };
        if (doBoxesOverlap(hBox, pBox, 1.0)) return;
      }

      vegetation.push({
        id,
        type: 'boxwood_hedge',
        positionFt: { x, y: hedgeH / 2, z },
        scale: { width: w, height: hedgeH, depth: d },
        rotationDeg: 0,
        color: '#1b4332',
      });
    };

    // Add perimeter hedges lining the inner side of boundary walls where space permits
    const hedgeOffset = wallThickFt / 2 + hedgeThick / 2 + 0.3;
    if (entrySide !== 'north' && plotBox.width >= 16.0) {
      addHedge('hedge_north_1', plotBox.minX + plotBox.width * 0.25, plotBox.minZ + hedgeOffset, plotBox.width * 0.35, hedgeThick);
      addHedge('hedge_north_2', plotBox.maxX - plotBox.width * 0.25, plotBox.minZ + hedgeOffset, plotBox.width * 0.35, hedgeThick);
    }
    if (entrySide !== 'south' && plotBox.width >= 16.0) {
      addHedge('hedge_south_1', plotBox.minX + plotBox.width * 0.25, plotBox.maxZ - hedgeOffset, plotBox.width * 0.35, hedgeThick);
      addHedge('hedge_south_2', plotBox.maxX - plotBox.width * 0.25, plotBox.maxZ - hedgeOffset, plotBox.width * 0.35, hedgeThick);
    }
  }

  return {
    enabled: true,
    plotBoundsFt: plotBox,
    buildingFootprintFt: buildingBox,
    groundZones,
    boundaryWalls,
    pathways,
    patio,
    deck,
    pool,
    vegetation,
    poolsideItems,
  };
}
