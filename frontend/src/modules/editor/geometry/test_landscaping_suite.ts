/**
 * test_landscaping_suite.ts
 * ============================================================================
 * Phase 5 Signature Architectural Visualization: Landscaping & Site Engine Tests.
 * ============================================================================
 */

import {
  type CanonicalBuildingDocument,
  ftToM,
} from './types';
import { generate3DBuilding } from './building3DGenerator';
import {
  generateSiteLandscaping,
  validatePoolPlacement,
  doBoxesOverlap,
  type BoundingBox2D,
} from './siteLandscapingGenerator';
import { architecturalMaterials } from './architecturalMaterials';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

// Construct standard multi-floor villa canonical document for testing
function createTestVillaDocument(plotWidthFt = 50, plotLengthFt = 70): CanonicalBuildingDocument {
  const plotWM = ftToM(plotWidthFt);
  const plotLM = ftToM(plotLengthFt);

  // Ground Floor: Living Room (20x16ft) and Dining (14x16ft)
  const n1 = { id: 'n1', x: ftToM(10), y: ftToM(15) };
  const n2 = { id: 'n2', x: ftToM(30), y: ftToM(15) };
  const n3 = { id: 'n3', x: ftToM(30), y: ftToM(31) };
  const n4 = { id: 'n4', x: ftToM(10), y: ftToM(31) };

  const w1 = { id: 'w1', startNodeId: 'n1', endNodeId: 'n2', thickness: 0.23, height: 3.05, kind: 'exterior' as const };
  const w2 = { id: 'w2', startNodeId: 'n2', endNodeId: 'n3', thickness: 0.23, height: 3.05, kind: 'exterior' as const };
  const w3 = { id: 'w3', startNodeId: 'n3', endNodeId: 'n4', thickness: 0.23, height: 3.05, kind: 'exterior' as const };
  const w4 = { id: 'w4', startNodeId: 'n4', endNodeId: 'n1', thickness: 0.23, height: 3.05, kind: 'exterior' as const };

  const r1 = {
    id: 'r_living',
    name: 'Living Room',
    roomType: 'living_room',
    boundaryNodeIds: ['n1', 'n2', 'n3', 'n4'],
  };

  // Level 1: Upper Floor Master Suite
  const un1 = { id: 'un1', x: ftToM(10), y: ftToM(15) };
  const un2 = { id: 'un2', x: ftToM(26), y: ftToM(15) };
  const un3 = { id: 'un3', x: ftToM(26), y: ftToM(31) };
  const un4 = { id: 'un4', x: ftToM(10), y: ftToM(31) };

  const uw1 = { id: 'uw1', startNodeId: 'un1', endNodeId: 'un2', thickness: 0.23, height: 3.05, kind: 'exterior' as const };
  const uw2 = { id: 'uw2', startNodeId: 'un2', endNodeId: 'un3', thickness: 0.23, height: 3.05, kind: 'exterior' as const };
  const uw3 = { id: 'uw3', startNodeId: 'un3', endNodeId: 'un4', thickness: 0.23, height: 3.05, kind: 'exterior' as const };
  const uw4 = { id: 'uw4', startNodeId: 'un4', endNodeId: 'un1', thickness: 0.23, height: 3.05, kind: 'exterior' as const };

  const ur1 = {
    id: 'r_master',
    name: 'Master Suite',
    roomType: 'master_bedroom',
    boundaryNodeIds: ['un1', 'un2', 'un3', 'un4'],
  };

  return {
    schemaVersion: 1,
    id: 'test_villa_doc',
    metadata: {
      name: '50x70 Luxury Villa',
      createdAt: '2026-10-11T12:00:00Z',
      updatedAt: '2026-10-11T12:00:00Z',
      entryDirection: 'south',
      displayUnits: 'ft',
    },
    site: {
      plotPolygon: [
        { x: 0, y: 0 },
        { x: plotWM, y: 0 },
        { x: plotWM, y: plotLM },
        { x: 0, y: plotLM },
      ],
      width: plotWM,
      length: plotLM,
      entrySide: 'south',
      northAngle: 0,
      setbacks: { front: 3.0, rear: 3.0, left: 2.5, right: 2.5 },
    },
    levels: [
      {
        id: 'lvl_0',
        levelIndex: 0,
        name: 'Ground Floor',
        elevation: 0,
        height: 3.05,
        slabThickness: 0.25,
        nodes: [n1, n2, n3, n4],
        walls: [w1, w2, w3, w4],
        openings: [],
        rooms: [r1],
        items: [],
      },
      {
        id: 'lvl_1',
        levelIndex: 1,
        name: 'First Floor',
        elevation: 3.3,
        height: 3.05,
        slabThickness: 0.25,
        nodes: [un1, un2, un3, un4],
        walls: [uw1, uw2, uw3, uw4],
        openings: [],
        rooms: [ur1],
        items: [],
      },
    ],
  };
}

export function runLandscapingTestSuite(): void {
  console.log('===========================================================================');
  console.log('STARTING PHASE 5 PARAMETRIC LANDSCAPING & POOL ENGINE TEST SUITE');
  console.log('===========================================================================');

  // ── TEST 1: Plot Dimensions and Coordinate Conversion ───────────────────────
  console.log('\n[TEST 1] Verifying plot dimensions and coordinate conversion...');
  const doc = createTestVillaDocument(50, 70);
  const building3D = generate3DBuilding(doc);
  const site = generateSiteLandscaping(doc, building3D.bounds);

  assert(site.enabled === true, 'Site landscaping should be enabled by default');
  assert(Math.abs(site.plotBoundsFt.width - 50.0) < 0.2, `Expected plot width ~50ft, got ${site.plotBoundsFt.width}`);
  assert(Math.abs(site.plotBoundsFt.length - 70.0) < 0.2, `Expected plot length ~70ft, got ${site.plotBoundsFt.length}`);
  console.log(`  -> Plot bounds resolved accurately: ${site.plotBoundsFt.width.toFixed(1)}ft × ${site.plotBoundsFt.length.toFixed(1)}ft.`);

  // ── TEST 2: Deterministic Generation ────────────────────────────────────────
  console.log('\n[TEST 2] Testing deterministic site generation reproducibility...');
  const siteRun1 = generateSiteLandscaping(doc, building3D.bounds);
  const siteRun2 = generateSiteLandscaping(doc, building3D.bounds);

  assert(siteRun1.boundaryWalls.length === siteRun2.boundaryWalls.length, 'Boundary walls count must match');
  assert(siteRun1.vegetation.length === siteRun2.vegetation.length, 'Vegetation items count must match');
  for (let i = 0; i < siteRun1.boundaryWalls.length; i++) {
    const w1 = siteRun1.boundaryWalls[i];
    const w2 = siteRun2.boundaryWalls[i];
    assert(w1.id === w2.id, `Wall ID ${w1.id} matches`);
    assert(Math.abs(w1.startPt.x - w2.startPt.x) < 0.0001, 'Wall coordinates must be 100% identical');
  }
  for (let i = 0; i < siteRun1.vegetation.length; i++) {
    const v1 = siteRun1.vegetation[i];
    const v2 = siteRun2.vegetation[i];
    assert(v1.positionFt.x === v2.positionFt.x, 'Vegetation X must be deterministic');
    assert(v1.positionFt.z === v2.positionFt.z, 'Vegetation Z must be deterministic');
  }
  console.log('  -> Confirmed 100% deterministic reproducibility across multiple runs.');

  // ── TEST 3: Boundary Containment & Gate Openings ────────────────────────────
  console.log('\n[TEST 3] Verifying boundary wall containment and entry gate...');
  assert(site.boundaryWalls.length >= 4, `Expected at least 4 boundary wall segments, got ${site.boundaryWalls.length}`);
  // Since entrySide is 'south', the South wall should be split into 2 segments leaving an entrance gate
  const southWalls = site.boundaryWalls.filter(w => w.id.includes('bwall_s'));
  assert(southWalls.length === 2, `South wall on entrySide must have an entrance opening (split into 2 segments), got ${southWalls.length}`);
  console.log('  -> Boundary walls enclose plot correctly with vehicular/pedestrian entrance opening.');

  // ── TEST 4: Pool Dimension Validation & Clearances ──────────────────────────
  console.log('\n[TEST 4] Testing pool placement, collision avoidance & clearance rules...');
  assert(site.pool !== undefined && site.pool.isValid === true, 'Pool should be generated and marked valid on 50x70 plot');
  if (site.pool) {
    const p = site.pool;
    assert(p.boundsFt.width >= 8.0, `Pool width ${p.boundsFt.width} must be >= 8ft`);
    assert(p.boundsFt.length >= 14.0, `Pool length ${p.boundsFt.length} must be >= 14ft`);
    assert(p.boundsFt.depth >= 3.5, `Pool depth ${p.boundsFt.depth} must be >= 3.5ft`);
    assert(p.waterSurfaceYFt < 0, `Water surface must be sunken below coping (got ${p.waterSurfaceYFt})`);

    // Verify pool is completely outside building bounding box with clearance
    const poolBox = {
      minX: p.boundsFt.x,
      maxX: p.boundsFt.x + p.boundsFt.width,
      minZ: p.boundsFt.z,
      maxZ: p.boundsFt.z + p.boundsFt.length,
    };
    const buildingBox = {
      minX: building3D.bounds.minX,
      maxX: building3D.bounds.maxX,
      minZ: building3D.bounds.minZ,
      maxZ: building3D.bounds.maxZ,
    };
    assert(!doBoxesOverlap(poolBox, buildingBox, 3.0), 'Pool must have >= 3ft clearance from building footprint');
    console.log(`  -> Pool validated at (${p.centerFt.x.toFixed(1)}, ${p.centerFt.z.toFixed(1)}) with safe clearance from villa.`);
  }

  // Test pool validator rejection on illegal coordinates
  const fakeBuildingBox: BoundingBox2D = { minX: 10, maxX: 30, minZ: 10, maxZ: 30, width: 20, length: 20, centerX: 20, centerZ: 20 };
  const fakePlotBox: BoundingBox2D = { minX: 0, maxX: 40, minZ: 0, maxZ: 40, width: 40, length: 40, centerX: 20, centerZ: 20 };

  // Candidate overlapping building
  const collidingPool = { x: 15, z: 15, width: 10, length: 20, depth: 4.5 };
  const overlapResult = validatePoolPlacement(collidingPool, fakeBuildingBox, fakePlotBox);
  assert(overlapResult.valid === false, 'Pool validator must reject collision with building');

  // Candidate outside plot
  const outOfBoundsPool = { x: 35, z: 10, width: 10, length: 20, depth: 4.5 };
  const oobResult = validatePoolPlacement(outOfBoundsPool, fakeBuildingBox, fakePlotBox);
  assert(oobResult.valid === false, 'Pool validator must reject pool extending past boundary setback');
  console.log('  -> Pool validator correctly rejects overlapping and out-of-bounds candidates.');

  // ── TEST 5: Non-Destructive Separation from Building Document ───────────────
  console.log('\n[TEST 5] Verifying separation from canonical building geometry...');
  const originalJson = JSON.stringify(doc);
  generateSiteLandscaping(doc, building3D.bounds, { showPool: true, showBoundaryWalls: true });
  const afterJson = JSON.stringify(doc);
  assert(originalJson === afterJson, 'CanonicalBuildingDocument must remain 100% immutable during landscaping generation');
  console.log('  -> Canonical building document preserved with zero side-effects or mutations.');

  // ── TEST 6: Landscaping Enable/Disable Toggle ────────────────────────────────
  console.log('\n[TEST 6] Testing landscaping toggle on/off behavior...');
  const disabledSite = generateSiteLandscaping(doc, building3D.bounds, { enabled: false });
  assert(disabledSite.enabled === false, 'Landscaping must report enabled = false');
  assert(disabledSite.boundaryWalls.length === 0, 'No boundary walls when disabled');
  assert(disabledSite.vegetation.length === 0, 'No vegetation when disabled');
  assert(disabledSite.pool === undefined, 'No pool when disabled');
  console.log('  -> Landscaping disabled mode returns clean empty geometry.');

  // ── TEST 7: PBR Material Consistency ────────────────────────────────────────
  console.log('\n[TEST 7] Verifying PBR material registry usage...');
  const turfMat = architecturalMaterials.getMaterial(site.groundZones[0].materialKey, { width: 1, height: 1 });
  assert(turfMat !== undefined, 'Turf material key must resolve cleanly from registry');
  if (site.deck) {
    const deckMat = architecturalMaterials.getMaterial(site.deck.materialKey, { width: 1, height: 1 });
    assert(deckMat !== undefined, 'Teak decking material key must resolve cleanly');
  }
  if (site.pool) {
    const waterMat = architecturalMaterials.getMaterial('pool_water');
    assert(waterMat !== undefined, 'Pool water material must resolve cleanly');
  }
  console.log('  -> All site elements successfully reference registered PBR materials.');

  // ── TEST 8: Multi-Floor Compatibility ───────────────────────────────────────
  console.log('\n[TEST 8] Verifying multi-floor level compatibility...');
  assert(doc.levels.length === 2, 'Test villa has 2 stories');
  assert(building3D.levels.length === 2, 'Building 3D generator generated 2 levels');
  assert(building3D.levels[1].elevationFt > 10.0, 'Upper story elevation is > 10ft');
  // Site elevation is always <= 0.05ft
  assert(site.groundZones.every(g => g.elevationFt <= 0.05), 'Site ground zones remain anchored at ground grade');
  console.log('  -> Multi-floor elevations remain completely separated from ground landscaping.');

  console.log('\n===========================================================================');
  console.log('ALL 8 PARAMETRIC LANDSCAPING TESTS PASSED SUCCESSFULLY!');
  console.log('===========================================================================');
}

// Run when executed via tsx
runLandscapingTestSuite();
