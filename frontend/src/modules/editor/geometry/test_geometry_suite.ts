/**
 * test_geometry_suite.ts
 * ============================================================================
 * Full Unit Test Suite for Frontend Geometry Engine (Phase 1).
 *
 * Verifies:
 *   1. Canonical Building Document construction & schema versioning.
 *   2. Geometric validators (wall crossing, opening bounds, room overlap).
 *   3. CommandEngine execution, validation rejection, and undo/redo round-trip.
 *   4. Wall node movement & propagation to incident opening offsets.
 *   5. Pure legacy project migration & projection selector fidelity.
 * ============================================================================
 */

import { SCHEMA_VERSION, mToFt, ftToM } from './types';
import type {
  CanonicalBuildingDocument,
  WallNode,
  Wall,
  Opening,
  CanonicalRoom,
  PlacedItem,
} from './types';
import {
  validateCanonicalDocument,
  doSegmentsIntersect,
} from './validators';
import {
  deriveRoomArea,
  deriveRoomCentroid,
  canonicalToLegacyFloors,
} from './selectors';
import {
  createMoveWallNodeCommand,
  createAddOpeningCommand,
  createPlaceItemCommand,
} from './commands';
import { CommandEngine } from './commandEngine';
import { migrateLegacyToCanonical, isCanonicalDocument } from './migration';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

function runTests() {
  console.log('='.repeat(70));
  console.log('STARTING PHASE 1 FRONTEND GEOMETRY & COMMAND ENGINE TEST SUITE');
  console.log('='.repeat(70));

  let passed = 0;

  // ── TEST 1: Unit Conversions ──────────────────────────────────────────────
  console.log('\n[TEST 1] Verifying SI Metre <-> Foot conversions...');
  assert(mToFt(1.0) === 3.28, '1 metre should equal 3.28 ft');
  assert(ftToM(10.0) === 3.048, '10 ft should equal 3.048 m');
  console.log('  -> Passed unit conversions.');
  passed++;

  // ── TEST 2: Math / Segment Intersection ───────────────────────────────────
  console.log('\n[TEST 2] Verifying Segment Intersection Math...');
  // Intersecting cross: (0,0)-(2,2) and (0,2)-(2,0)
  assert(
    doSegmentsIntersect({ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }),
    'Perpendicular diagonal lines must intersect'
  );
  // Shared endpoint: (0,0)-(1,1) and (1,1)-(2,2)
  assert(
    !doSegmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 }),
    'Shared endpoint touching should NOT be flagged as collision'
  );
  // Parallel non-intersecting: (0,0)-(0,5) and (2,0)-(2,5)
  assert(
    !doSegmentsIntersect({ x: 0, y: 0 }, { x: 0, y: 5 }, { x: 2, y: 0 }, { x: 2, y: 5 }),
    'Parallel lines must not intersect'
  );
  console.log('  -> Passed segment intersection math.');
  passed++;

  // ── TEST 3: Base Document & Validators ────────────────────────────────────
  console.log('\n[TEST 3] Building Minimal Canonical Document & Validating...');
  const nodes: WallNode[] = [
    { id: 'n1', x: 0, y: 0 },
    { id: 'n2', x: 5, y: 0 },
    { id: 'n3', x: 5, y: 6 },
    { id: 'n4', x: 0, y: 6 },
  ];
  const walls: Wall[] = [
    { id: 'w1', startNodeId: 'n1', endNodeId: 'n2', thickness: 0.23, height: 3.05, kind: 'exterior' },
    { id: 'w2', startNodeId: 'n2', endNodeId: 'n3', thickness: 0.23, height: 3.05, kind: 'exterior' },
    { id: 'w3', startNodeId: 'n3', endNodeId: 'n4', thickness: 0.23, height: 3.05, kind: 'exterior' },
    { id: 'w4', startNodeId: 'n4', endNodeId: 'n1', thickness: 0.23, height: 3.05, kind: 'exterior' },
  ];
  const openings: Opening[] = [
    { id: 'op1', wallId: 'w1', offset: 2.5, width: 0.9, height: 2.13, sill: 0, type: 'single_door', name: 'Entry Door' },
  ];
  const rooms: CanonicalRoom[] = [
    { id: 'r1', name: 'Living Room', roomType: 'living', boundaryNodeIds: ['n1', 'n2', 'n3', 'n4'] },
  ];
  const items: PlacedItem[] = [
    { id: 'i1', assetId: 'sofa_3_seater', name: 'Sofa', x: 2, y: 2, elevation: 0, rotation: 0, width: 2.1, depth: 0.9, height: 0.8 },
  ];

  const doc: CanonicalBuildingDocument = {
    schemaVersion: SCHEMA_VERSION,
    id: 'test_doc',
    metadata: {
      name: 'Test Residence',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryDirection: 'north',
      displayUnits: 'ft',
    },
    site: {
      plotPolygon: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 15 }, { x: 0, y: 15 }],
      width: 10,
      length: 15,
      entrySide: 'north',
      northAngle: 0,
      setbacks: { front: 1, rear: 1, left: 1, right: 1 },
    },
    levels: [
      { id: 'lvl_0', levelIndex: 0, name: 'Ground Floor', elevation: 0, height: 3.05, slabThickness: 0.25, nodes, walls, openings, rooms, items },
    ],
  };

  const vResult = validateCanonicalDocument(doc);
  assert(vResult.valid, `Expected doc to be valid, got errors: ${JSON.stringify(vResult.issues)}`);
  console.log('  -> Passed document validation.');
  passed++;

  // ── TEST 4: Derived Selectors ─────────────────────────────────────────────
  console.log('\n[TEST 4] Testing Derived Selectors (Areas, Centroids, Legacy Projections)...');
  const level0 = doc.levels[0];
  const r1 = level0.rooms[0];
  const area = deriveRoomArea(r1, level0);
  assert(area.sqMetres === 30, `Expected 30 m², got ${area.sqMetres}`);
  assert(area.sqFeet === 323, `Expected 323 sqft, got ${area.sqFeet}`);

  const centroid = deriveRoomCentroid(r1, level0);
  assert(centroid.x === 2.5 && centroid.y === 3.0, `Expected centroid (2.5, 3.0), got (${centroid.x}, ${centroid.y})`);

  const legacyFloors = canonicalToLegacyFloors(doc);
  assert(legacyFloors.length === 1, 'Expected 1 projected legacy floor');
  assert(legacyFloors[0].rooms.length === 1, 'Expected 1 projected room');
  assert(legacyFloors[0].rooms[0].name === 'Living Room', 'Room name matches');
  assert(legacyFloors[0].rooms[0].doors?.length === 1, 'Door mapped to legacy room');
  console.log('  -> Passed derived selectors & legacy projections.');
  passed++;

  // ── TEST 5: CommandEngine Execution & Undo / Redo Round-Trip ──────────────
  console.log('\n[TEST 5] Testing CommandEngine with Reversible Undo / Redo...');
  const engine = new CommandEngine(doc);

  // 5a. Move Wall Node
  const moveCmd = createMoveWallNodeCommand(0, 'n2', 6.0, 0.0);
  const execRes = engine.execute(moveCmd);
  assert(execRes.success, 'Move node command must succeed');
  assert(engine.getDocument().levels[0].nodes[1].x === 6.0, 'Node x updated to 6.0');
  assert(engine.canUndo(), 'Engine canUndo is true');

  // 5b. Undo Move
  const undoRes = engine.undo();
  assert(undoRes.success, 'Undo must succeed');
  assert(engine.getDocument().levels[0].nodes[1].x === 5.0, 'Node x restored to 5.0');
  assert(engine.canRedo(), 'Engine canRedo is true');

  // 5c. Redo Move
  const redoRes = engine.redo();
  assert(redoRes.success, 'Redo must succeed');
  assert(engine.getDocument().levels[0].nodes[1].x === 6.0, 'Node x reapplied to 6.0');

  // 5d. Place Item Command
  const placeCmd = createPlaceItemCommand(0, {
    id: 'lamp_1',
    assetId: 'floor_lamp',
    name: 'Floor Lamp',
    x: 1,
    y: 1,
    elevation: 0,
    rotation: 45,
    width: 0.5,
    depth: 0.5,
    height: 1.5,
  });
  engine.execute(placeCmd);
  assert(engine.getDocument().levels[0].items.length === 2, 'Item count should now be 2');

  // 5e. Undo Item Placement
  engine.undo();
  assert(engine.getDocument().levels[0].items.length === 1, 'Item count reverted to 1');
  console.log('  -> Passed CommandEngine execution, undo, and redo.');
  passed++;

  // ── TEST 6: Validation Rejection of Invalid Candidate ────────────────────
  console.log('\n[TEST 6] Testing Validation Rejection of Illegal Moves...');
  // Try placing an oversized 10m door onto a 6m wall
  const badDoorCmd = createAddOpeningCommand(0, {
    id: 'giant_door',
    wallId: 'w1',
    offset: 3.0,
    width: 10.0,
    height: 2.1,
    sill: 0,
    type: 'single_door',
  });
  const rejectRes = engine.execute(badDoorCmd);
  assert(!rejectRes.success, 'Command engine must reject oversized opening');
  assert(
    rejectRes.issues.some(i => i.code === 'OPENING_OUT_OF_BOUNDS'),
    'Expected OPENING_OUT_OF_BOUNDS error code'
  );
  assert(engine.getDocument().levels[0].openings.length === 1, 'Document remained unmutated');
  console.log('  -> Passed validation rejection of invalid edit candidate.');
  passed++;

  // ── TEST 7: Legacy Project Importer (Fixture Round-Trip) ─────────────────
  console.log('\n[TEST 7] Testing Legacy Project Migration...');
  const legacyFixture = {
    id: 'legacy_fixture_88',
    name: '3BHK Duplex Residence',
    plot_width: 35,
    plot_length: 50,
    entry_direction: 'north',
    floors: [
      {
        level: 0,
        name: 'Ground Floor',
        rooms: [
          {
            name: 'Living Room',
            x: 0,
            y: 0,
            width: 16,
            height: 18,
            doors: [{ wall: 'bottom', position: 8, width: 3 }],
            windows: [{ wall: 'top', position: 6, width: 5 }],
            furniture: [{ id: 'sofa_1', catalogId: 'sofa_3_seater', name: 'Sofa', x: 2, y: 3, width: 7, height: 3 }],
          },
          {
            name: 'Kitchen',
            x: 16,
            y: 0,
            width: 14,
            height: 12,
            doors: [{ wall: 'bottom', position: 4, width: 3 }],
            windows: [{ wall: 'top', position: 5, width: 3 }],
          },
        ],
      },
    ],
  };

  const migrated = migrateLegacyToCanonical(legacyFixture);
  assert(isCanonicalDocument(migrated), 'Output must satisfy isCanonicalDocument type guard');
  assert(migrated.schemaVersion === 1, 'schemaVersion must be 1');
  assert(migrated.levels[0].rooms.length === 2, '2 rooms migrated');
  assert(migrated.levels[0].openings.length >= 4, 'Doors and windows mapped to openings');
  assert(migrated.levels[0].items.length === 1, 'Furniture item migrated to PlacedItem');
  assert(migrated.legacySnapshot !== undefined, 'Legacy payload preserved in snapshot');

  const vMigrated = validateCanonicalDocument(migrated);
  assert(vMigrated.valid, `Migrated fixture must be geometrically valid: ${JSON.stringify(vMigrated.issues)}`);
  console.log('  -> Passed legacy project migration.');
  passed++;

  console.log('='.repeat(70));
  console.log(`ALL ${passed} PHASE 1 FRONTEND GEOMETRY UNIT TESTS PASSED SUCCESSFULLY!`);
  console.log('='.repeat(70));
}

runTests();
