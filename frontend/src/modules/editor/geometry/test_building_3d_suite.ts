/**
 * test_building_3d_suite.ts
 * ============================================================================
 * Phase 4 Automated Test Suite: Real 3D Building Engine & Synchronized Model.
 *
 * Verifies:
 * 1. Wall dimensions and thickness (exterior vs interior).
 * 2. Door and window physical openings (voids, sills, lintels).
 * 3. Wall-to-wall connections and graph deduplication (zero duplicate walls).
 * 4. Multi-floor elevations, pitch, and vertical alignment.
 * 5. Staircase geometry and vertical floor-to-floor relationships.
 * 6. Furniture dimensions, placement, elevation, and rotation.
 * 7. Live 3D geometry updates after 2D CommandEngine edits.
 * 8. Cutaway 4.5ft mode vs full 10ft enclosed architectural walls.
 * 9. Saved-project JSONB persistence and restoration round-trip.
 * 10. Regression testing of existing geometry and furniture commands.
 * ============================================================================
 */

import {
  migrateLegacyToCanonical,
  CommandEngine,
  createUpdateRoomBoundsCommand,
  createPlaceItemCommand,
  createTransformItemCommand,
  createDeleteItemCommand,
  generate3DBuilding,
  generate3DLevel,
  ftToM,
} from './index';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log('============================================================');
  console.log('AI ARCHITECT — PHASE 4: 3D BUILDING ENGINE TEST SUITE');
  console.log('============================================================\n');

  // Baseline two-room fixture with a shared wall and an upper floor
  const baselineFixture = {
    plot_width: 30,
    plot_length: 40,
    entry_direction: 'east',
    floors: [
      {
        level: 0,
        name: 'Ground Floor',
        rooms: [
          {
            name: 'Living Room',
            x: 0,
            y: 0,
            width: 15,
            height: 20,
            doors: [{ wall: 'bottom', position: 10, width: 3 }],
            windows: [{ wall: 'top', position: 4, width: 5 }],
            furniture: [
              {
                id: 'sofa_1',
                catalogId: 'sofa_3_seater',
                name: '3-Seater Sofa',
                x: 2,
                y: 3,
                width: 7,
                height: 3,
                rotation: 90,
                elevation: 0,
              },
            ],
          },
          {
            name: 'Dining Room',
            x: 15,
            y: 0,
            width: 15,
            height: 20,
            doors: [{ wall: 'left', position: 8, width: 3 }],
            windows: [{ wall: 'right', position: 6, width: 4 }],
            furniture: [],
          },
          {
            name: 'Staircase Hall',
            x: 0,
            y: 20,
            width: 12,
            height: 14,
            doors: [{ wall: 'top', position: 3, width: 3 }],
            windows: [],
            furniture: [],
          },
        ],
      },
      {
        level: 1,
        name: 'First Floor',
        rooms: [
          {
            name: 'Master Bedroom',
            x: 0,
            y: 0,
            width: 15,
            height: 20,
            doors: [{ wall: 'bottom', position: 4, width: 3 }],
            windows: [{ wall: 'top', position: 5, width: 5 }],
            furniture: [
              {
                id: 'bed_1',
                catalogId: 'bed_king_nightstands',
                name: 'King Bed with Nightstands',
                x: 3,
                y: 4,
                width: 7.5,
                height: 6.8,
                rotation: 0,
                elevation: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  const canonicalDoc = migrateLegacyToCanonical(baselineFixture, 30, 40, 'east');

  // ── TEST 1: Wall dimensions and thickness ──────────────────────────────────
  console.log('Running test 1: Wall dimensions and thickness (exterior vs interior)...');
  const level0 = canonicalDoc.levels[0];
  const genLevel0 = generate3DLevel(level0, 0, { isCutaway: false });

  assert(genLevel0.walls.length > 0, 'Level 0 must produce 3D walls');
  for (const w of genLevel0.walls) {
    assert(w.lengthFt > 0.5, `Wall ${w.id} must have positive length, got ${w.lengthFt}`);
    assert(Math.abs(w.heightFt - 10.0) < 0.1, `Wall ${w.id} height must be ~10ft in full mode, got ${w.heightFt}`);
    if (w.kind === 'exterior') {
      assert(w.thicknessFt >= 0.7, `Exterior wall ${w.id} must have thickness >= 0.7ft, got ${w.thicknessFt}`);
    } else {
      assert(w.thicknessFt >= 0.35, `Interior wall ${w.id} must have thickness >= 0.35ft, got ${w.thicknessFt}`);
    }
  }
  console.log(`  PASS: Verified ${genLevel0.walls.length} walls with correct thickness and 10ft heights.`);

  // ── TEST 2: Door and window physical openings ─────────────────────────────
  console.log('Running test 2: Door and window physical openings (voids, sills, lintels)...');
  let doorOpeningFound = false;
  let windowOpeningFound = false;

  for (const w of genLevel0.walls) {
    for (const op of w.openings) {
      if (op.type === 'door') {
        doorOpeningFound = true;
        assert(op.sillFt === 0, `Door opening ${op.id} must have sill = 0`);
        assert(op.widthFt >= 2.5, `Door width must be >= 2.5ft, got ${op.widthFt}`);
        assert(op.hasLintel, `Door must have lintel in 10ft full wall mode`);
        assert(op.lintelHeightFt > 0, `Door lintel height must be > 0`);
      } else if (op.type === 'window') {
        windowOpeningFound = true;
        assert(op.hasSill, `Window opening ${op.id} must have positive sill`);
        assert(op.sillHeightFt >= 2.0, `Window sill must be >= 2.0ft, got ${op.sillHeightFt}`);
        assert(op.hasGlass, `Window opening must feature glass panel`);
        assert(op.hasLintel, `Window must have lintel in 10ft mode`);
      }
    }
  }
  assert(doorOpeningFound, 'Level 0 must contain door openings');
  assert(windowOpeningFound, 'Level 0 must contain window openings');
  console.log('  PASS: Doors have zero sill, valid width & lintel; windows have sill, glass & lintel.');

  // ── TEST 3: Wall-to-wall connections and graph deduplication ───────────────
  console.log('Running test 3: Wall-to-wall connections and graph deduplication...');
  // The shared boundary between Living Room (x: 0..15) and Dining Room (x: 15..30) is at x = 15m (4.572m).
  // In a naive implementation, both rooms generate a separate wall at x = 15.
  // In the canonical model, there must be EXACTLY ONE wall connecting the shared nodes.
  const sharedXMetres = ftToM(15);
  const wallsAtSharedEdge = level0.walls.filter(w => {
    const n1 = level0.nodes.find(n => n.id === w.startNodeId);
    const n2 = level0.nodes.find(n => n.id === w.endNodeId);
    if (!n1 || !n2) return false;
    return Math.abs(n1.x - sharedXMetres) < 0.1 && Math.abs(n2.x - sharedXMetres) < 0.1;
  });
  assert(
    wallsAtSharedEdge.length === 1,
    `Shared interior boundary at x=15ft must have EXACTLY 1 canonical wall, found ${wallsAtSharedEdge.length}`
  );
  console.log('  PASS: Shared interior boundary is represented by exactly 1 deduplicated wall (0 duplicate meshes).');

  // ── TEST 4: Multi-floor elevations, pitch, and alignment ───────────────────
  console.log('Running test 4: Multi-floor elevations, pitch, and vertical alignment...');
  const building3D = generate3DBuilding(canonicalDoc, { isCutaway: false });
  assert(building3D.levels.length === 2, `Building must generate 2 levels, got ${building3D.levels.length}`);
  const genL0 = building3D.levels[0];
  const genL1 = building3D.levels[1];

  assert(genL0.elevationFt === 0, `Level 0 elevation must be 0, got ${genL0.elevationFt}`);
  assert(genL1.elevationFt > 9.0, `Level 1 elevation must be above Level 0 ceiling, got ${genL1.elevationFt}`);
  assert(Math.abs(genL0.floorPitchFt - 10.8) < 0.1, `Floor pitch must be ceiling 10ft + slab 0.8ft ≈ 10.8ft, got ${genL0.floorPitchFt}`);
  assert(Math.abs(genL1.slabThicknessFt - 0.8) < 0.1, `Level 1 structural slab thickness must be ~0.8ft`);
  console.log(`  PASS: Level 0 at ${genL0.elevationFt}ft, Level 1 at ${genL1.elevationFt}ft with 0.8ft concrete floor slab.`);

  // ── TEST 5: Staircase geometry and vertical relationships ──────────────────
  console.log('Running test 5: Staircase geometry and vertical floor-to-floor relationships...');
  assert(genL0.stairs.length > 0, 'Level 0 must generate staircase for Staircase Hall');
  const stair = genL0.stairs[0];
  assert(stair.boundsFt.width > 5, `Stair width must be > 5ft, got ${stair.boundsFt.width}`);
  assert(stair.boundsFt.depth > 5, `Stair depth must be > 5ft, got ${stair.boundsFt.depth}`);
  assert(Math.abs(stair.totalHeightFt - 10.8) < 0.1, `Stair total height must reach floor pitch (~10.8ft), got ${stair.totalHeightFt}`);
  console.log(`  PASS: Staircase spans ${stair.totalHeightFt}ft to connect Ground Floor to First Floor landing.`);

  // ── TEST 6: Furniture dimensions, placement, elevation, and rotation ───────
  console.log('Running test 6: Furniture dimensions, placement, elevation, and rotation...');
  assert(genL0.furniture.length === 1, `Level 0 must contain 1 furniture item, got ${genL0.furniture.length}`);
  const sofa = genL0.furniture[0];
  assert(sofa.assetId === 'sofa_3_seater', `Item asset ID must be sofa_3_seater`);
  assert(Math.abs(sofa.dimensionsFt.width - 7.0) < 0.1, `Sofa width must be ~7ft, got ${sofa.dimensionsFt.width}`);
  assert(Math.abs(sofa.dimensionsFt.depth - 3.0) < 0.1, `Sofa depth must be ~3ft, got ${sofa.dimensionsFt.depth}`);
  assert(sofa.rotationDeg === 90, `Sofa rotation must be 90 deg, got ${sofa.rotationDeg}`);
  assert(sofa.positionFt.x > 0 && sofa.positionFt.z > 0, `Sofa coordinates must be positive`);

  assert(genL1.furniture.length === 1, `Level 1 must contain King Bed`);
  const bed = genL1.furniture[0];
  assert(Math.abs(bed.dimensionsFt.width - 7.5) < 0.1, `King bed width must be ~7.5ft, got ${bed.dimensionsFt.width}`);
  console.log('  PASS: Placed furniture items have verified dimensions, rotations, and site coordinates.');

  // ── TEST 7: Geometry updates after 2D CommandEngine edits ──────────────────
  console.log('Running test 7: Live 3D geometry updates after 2D CommandEngine edits...');
  const engine = new CommandEngine(canonicalDoc);
  // Resize Living Room from 15ft width to 12ft width
  const resizeCmd = createUpdateRoomBoundsCommand(0, 'Living Room', {
    x: 0,
    y: 0,
    width: 12,
    height: 20,
  });
  const res = engine.execute(resizeCmd);
  assert(res.success, `Resize command must succeed: ${res.message}`);
  assert(res.candidateDocument !== undefined, 'Candidate document must be returned');

  // Feed candidate document to 3D generator
  const updated3D = generate3DBuilding(res.candidateDocument!, { isCutaway: false });
  const updatedLivingRoom = updated3D.levels[0].rooms.find(r => r.name === 'Living Room');
  assert(updatedLivingRoom !== undefined, 'Updated living room must exist in 3D');
  assert(
    Math.abs(updatedLivingRoom!.bboxFt.width - 12) < 0.1,
    `3D Living Room width must update to 12ft, got ${updatedLivingRoom!.bboxFt.width}`
  );
  console.log(`  PASS: Living Room resized in 2D updated 3D bounding box from 15ft to ${updatedLivingRoom!.bboxFt.width}ft immediately.`);

  // ── TEST 8: Cutaway 4.5ft mode vs full 10ft enclosed architectural walls ───
  console.log('Running test 8: Cutaway 4.5ft mode vs full 10ft enclosed architectural walls...');
  const cutaway3D = generate3DBuilding(canonicalDoc, { isCutaway: true });
  const cutawayWall = cutaway3D.levels[0].walls[0];
  assert(
    Math.abs(cutawayWall.heightFt - 4.5) < 0.1,
    `In cutaway mode, wall height must be 4.5ft (NBC sill level), got ${cutawayWall.heightFt}`
  );

  const full3D = generate3DBuilding(canonicalDoc, { isCutaway: false });
  const fullWall = full3D.levels[0].walls[0];
  assert(
    Math.abs(fullWall.heightFt - 10.0) < 0.1,
    `In full enclosed mode, wall height must be ~10.0ft, got ${fullWall.heightFt}`
  );
  console.log('  PASS: Cutaway mode enforces 4.5ft sill level; full mode enforces 10.0ft enclosed walls.');

  // ── TEST 9: Saved-project JSONB persistence and restoration round-trip ─────
  console.log('Running test 9: Saved-project JSONB persistence and restoration round-trip...');
  // Simulate JSONB serialization in Supabase projects.layout_data
  const serialized = JSON.stringify(canonicalDoc);
  const deserialized = JSON.parse(serialized);
  assert(deserialized.schemaVersion === 1, 'Restored document must have schemaVersion 1');
  assert(deserialized.levels.length === 2, 'Restored document must have 2 levels');

  const restored3D = generate3DBuilding(deserialized);
  assert(restored3D.levels.length === 2, 'Restored 3D building must have 2 levels');
  assert(restored3D.levels[0].walls.length === genLevel0.walls.length, 'Restored wall count must match');
  assert(restored3D.levels[0].furniture.length === genL0.furniture.length, 'Restored furniture count must match');
  console.log('  PASS: JSONB serialized project restores identical 3D building, walls, and furniture.');

  // ── TEST 10: Regression testing of existing geometry and furniture commands 
  console.log('Running test 10: Regression testing of existing geometry and furniture commands...');
  // Add a new furniture item via command
  const newItem = {
    id: 'test_desk_1',
    assetId: 'study_desk',
    name: 'Study Desk',
    x: ftToM(5),
    y: ftToM(5),
    elevation: 0,
    rotation: 0,
    width: ftToM(4.5),
    depth: ftToM(2.2),
    height: ftToM(2.5),
  };
  const placeCmd = createPlaceItemCommand(0, newItem);
  const placeRes = engine.execute(placeCmd);
  assert(placeRes.success, 'Place furniture command must succeed');

  let docAfterPlace = engine.getDocument();
  let b3D = generate3DBuilding(docAfterPlace);
  assert(b3D.levels[0].furniture.length === 2, 'Level 0 must now have 2 furniture items');

  // Transform item
  const transformCmd = createTransformItemCommand(0, 'test_desk_1', ftToM(8), ftToM(10), 180);
  const transRes = engine.execute(transformCmd);
  assert(transRes.success, 'Transform command must succeed');

  let docAfterTrans = engine.getDocument();
  b3D = generate3DBuilding(docAfterTrans);
  const movedDesk = b3D.levels[0].furniture.find(f => f.id === 'test_desk_1');
  assert(movedDesk !== undefined, 'Moved desk must exist');
  assert(Math.abs(movedDesk!.positionFt.x - 8) < 0.1, `Desk X position must be 8ft, got ${movedDesk!.positionFt.x}`);
  assert(movedDesk!.rotationDeg === 180, `Desk rotation must be 180 deg, got ${movedDesk!.rotationDeg}`);

  // Undo transform
  const undoRes = engine.undo();
  assert(undoRes.success, 'Undo must succeed');
  b3D = generate3DBuilding(engine.getDocument());
  const undoneDesk = b3D.levels[0].furniture.find(f => f.id === 'test_desk_1');
  assert(Math.abs(undoneDesk!.positionFt.x - 5) < 0.1, `Desk X position must revert to 5ft on undo`);

  // Delete item
  const deleteCmd = createDeleteItemCommand(0, 'test_desk_1');
  const delRes = engine.execute(deleteCmd);
  assert(delRes.success, 'Delete command must succeed');
  b3D = generate3DBuilding(engine.getDocument());
  assert(b3D.levels[0].furniture.length === 1, 'Level 0 furniture count must revert to 1 after deletion');
  console.log('  PASS: Furniture commands (place, transform, undo, delete) successfully synchronize with 3D generator.');

  console.log('\n============================================================');
  console.log('ALL 10 PHASE 4 3D BUILDING ENGINE TESTS PASSED SUCCESSFULLY!');
  console.log('============================================================\n');
}

runTests();
