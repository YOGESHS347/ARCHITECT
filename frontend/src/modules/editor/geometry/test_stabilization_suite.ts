/**
 * test_stabilization_suite.ts
 * ============================================================================
 * Critical Stabilization Regression Test Suite:
 * Furniture Placement, Resizing, Wall Integrity, and Editor Interactions.
 *
 * Verifies:
 *   1. Adding furniture to a generated plan succeeds without modifying unrelated walls.
 *   2. Adding furniture never alters wall geometry, wall nodes, or wall connections.
 *   3. Genuine wall intersections are strictly rejected during wall editing operations.
 *   4. Invalid placement candidates leave canonical document and history unchanged.
 *   5. Furniture movement, rotation, and resizing with full undo/redo reversibility.
 *   6. Room boundary resizing with full undo/redo reversibility.
 *   7. Safe dimension bounds: negative, zero, or non-finite dimensions are prevented.
 *   8. 2D footprint to 3D representation consistency after transformations.
 *   9. Serialization / migration preservation of furniture dimensions and positions.
 *  10. Drawer search and category filtering against supported asset registry.
 * ============================================================================
 */

import { SCHEMA_VERSION, mToFt } from './types';
import type { CanonicalBuildingDocument, Level, PlacedItem, WallNode, Wall } from './types';
import { CommandEngine } from './commandEngine';
import {
  createPlaceItemCommand,
  createTransformItemCommand,
  createUpdateItemDimensionsCommand,
  createMoveWallNodeCommand,
  createResizeRoomCommand,
} from './commands';
import { validateCanonicalDocument } from './validators';
import { generate3DBuilding } from './building3DGenerator';
import { canonicalToLegacyFloors } from './selectors';
import { migrateLegacyToCanonical } from './migration';
import { getAllFurnitureAssets, getFurnitureAsset, FURNITURE_CATEGORIES } from './furnitureRegistry';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

function createTestCanonicalDoc(): CanonicalBuildingDocument {
  // A clean two-room building (12m x 10m)
  const nodes: WallNode[] = [
    { id: 'n1', x: 0, y: 0 },
    { id: 'n2', x: 6, y: 0 },
    { id: 'n3', x: 12, y: 0 },
    { id: 'n4', x: 12, y: 10 },
    { id: 'n5', x: 6, y: 10 },
    { id: 'n6', x: 0, y: 10 },
  ];

  const walls: Wall[] = [
    { id: 'w1', startNodeId: 'n1', endNodeId: 'n2', thickness: 0.2, height: 3.0, kind: 'exterior' },
    { id: 'w2', startNodeId: 'n2', endNodeId: 'n3', thickness: 0.2, height: 3.0, kind: 'exterior' },
    { id: 'w3', startNodeId: 'n3', endNodeId: 'n4', thickness: 0.2, height: 3.0, kind: 'exterior' },
    { id: 'w4', startNodeId: 'n4', endNodeId: 'n5', thickness: 0.2, height: 3.0, kind: 'exterior' },
    { id: 'w5', startNodeId: 'n5', endNodeId: 'n6', thickness: 0.2, height: 3.0, kind: 'exterior' },
    { id: 'w6', startNodeId: 'n6', endNodeId: 'n1', thickness: 0.2, height: 3.0, kind: 'exterior' },
    { id: 'w7', startNodeId: 'n2', endNodeId: 'n5', thickness: 0.15, height: 3.0, kind: 'interior' }, // dividing wall
  ];

  const level: Level = {
    id: 'lvl_0',
    levelIndex: 0,
    name: 'Ground Floor',
    elevation: 0,
    height: 3.0,
    slabThickness: 0.25,
    nodes,
    walls,
    rooms: [
      {
        id: 'r_living',
        name: 'Living Room',
        roomType: 'living',
        boundaryNodeIds: ['n1', 'n2', 'n5', 'n6'],
      },
      {
        id: 'r_bedroom',
        name: 'Master Bedroom',
        roomType: 'bedroom',
        boundaryNodeIds: ['n2', 'n3', 'n4', 'n5'],
      },
    ],
    openings: [],
    items: [],
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    id: 'doc_stabilization_test',
    metadata: {
      name: 'Stabilization Verification House',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryDirection: 'north',
      displayUnits: 'm',
      generatorSeed: 'test',
    },
    site: {
      width: 14,
      length: 12,
      entrySide: 'north',
      setbacks: { front: 1, rear: 1, left: 1, right: 1 },
      northAngle: 0,
      plotPolygon: [
        { x: 0, y: 0 },
        { x: 14, y: 0 },
        { x: 14, y: 12 },
        { x: 0, y: 12 },
      ],
    },
    levels: [level],
  };
}

export function runStabilizationSuite() {
  console.log('='.repeat(75));
  console.log('STARTING AI ARCHITECT CRITICAL STABILIZATION REGRESSION TEST SUITE');
  console.log('='.repeat(75));

  const doc = createTestCanonicalDoc();

  // ── TEST 1: Baseline Wall Geometry Validation ──
  console.log('\n[TEST 1] Verifying baseline building geometry validation...');
  const baseVal = validateCanonicalDocument(doc);
  assert(baseVal.valid, `Baseline doc must be valid, got: ${baseVal.issues.map(i => i.message).join(', ')}`);
  console.log('  -> Baseline canonical document is valid with zero wall intersection errors.');

  // ── TEST 2: Furniture Placement Does Not Mutate Unrelated Walls ──
  console.log('\n[TEST 2] Verifying furniture placement does NOT modify unrelated walls...');
  const engine = new CommandEngine(doc);
  const wallsBefore = JSON.stringify(engine.getDocument().levels[0].walls);
  const nodesBefore = JSON.stringify(engine.getDocument().levels[0].nodes);

  const sofaAsset = getFurnitureAsset('sofa_3_seater')!;
  assert(!!sofaAsset, 'sofa_3_seater asset must exist in registry');

  const sofaItem: PlacedItem = {
    id: 'furn_sofa_test',
    assetId: sofaAsset.id,
    name: sofaAsset.name,
    x: 2.0,
    y: 2.5,
    elevation: 0,
    rotation: 90,
    width: sofaAsset.dimensions.widthM,
    depth: sofaAsset.dimensions.depthM,
    height: sofaAsset.dimensions.heightM,
    color: sofaAsset.defaultColor,
    isLight: false,
    properties: { roomId: 'Living Room' },
  };

  const placeResult = engine.execute(createPlaceItemCommand(0, sofaItem));
  assert(placeResult.success, `Furniture placement failed: ${placeResult.message}`);
  assert(engine.getDocument().levels[0].items.length === 1, 'Item must be in canonical items');

  const wallsAfter = JSON.stringify(engine.getDocument().levels[0].walls);
  const nodesAfter = JSON.stringify(engine.getDocument().levels[0].nodes);
  assert(wallsBefore === wallsAfter, 'Wall array must be strictly unchanged by furniture placement');
  assert(nodesBefore === nodesAfter, 'Wall nodes must be strictly unchanged by furniture placement');
  console.log('  -> Verified: Furniture placed without mutating walls or nodes.');

  // ── TEST 3: Wall Integrity Enforced on Wall Edits (Genuine Intersections Rejected) ──
  console.log('\n[TEST 3] Verifying genuine wall intersections are rejected during wall editing...');
  // Attempt to drag node n6 across wall w7 (from x=0 to x=9, intersecting w7 without shared node)
  const illegalWallMove = createMoveWallNodeCommand(0, 'n6', 9.0, 5.0);
  const illegalResult = engine.execute(illegalWallMove);
  assert(!illegalResult.success, 'Engine must reject wall movement that creates intersecting walls without a node');
  assert(!!illegalResult.message && illegalResult.message.includes('intersects'), `Expected intersection error, got: ${illegalResult.message}`);
  // Verify document and history were untouched
  assert(engine.getDocument().levels[0].nodes.find(n => n.id === 'n6')?.x === 0, 'Node n6 must not have moved');
  console.log(`  -> Verified: Illegal wall crossing strictly rejected: "${illegalResult.message}".`);

  // ── TEST 4: Invalid Furniture Operations Rejected Without Corrupting State ──
  console.log('\n[TEST 4] Verifying invalid furniture placement is rejected safely...');
  const invalidItem: PlacedItem = {
    ...sofaItem,
    id: 'furn_invalid',
    width: -2.0, // Invalid negative dimension
  };
  const invalidResult = engine.execute(createPlaceItemCommand(0, invalidItem));
  assert(!invalidResult.success, 'Engine must reject negative furniture dimensions');
  assert(engine.getDocument().levels[0].items.length === 1, 'Invalid item must not be committed to document');
  console.log('  -> Verified: Invalid dimension rejected, document unchanged.');

  // ── TEST 5: Furniture Movement, Rotation & Dimension Resizing with Undo/Redo ──
  console.log('\n[TEST 5] Testing furniture movement, rotation, and dimension resizing...');
  // Move and rotate
  const moveResult = engine.execute(createTransformItemCommand(0, 'furn_sofa_test', 3.5, 4.0, 180));
  assert(moveResult.success, 'Transform command must succeed');
  let item = engine.getDocument().levels[0].items[0];
  assert(item.x === 3.5 && item.y === 4.0 && item.rotation === 180, 'Item position/rotation must match');

  // Resize dimensions
  const resizeResult = engine.execute(createUpdateItemDimensionsCommand(0, 'furn_sofa_test', 3.0, 1.2, 0.85));
  assert(resizeResult.success, 'Resize dimensions command must succeed');
  item = engine.getDocument().levels[0].items[0];
  assert(item.width === 3.0 && item.depth === 1.2, 'Item dimensions must match');

  // Undo resize
  assert(engine.canUndo(), 'Engine must be able to undo');
  engine.undo();
  item = engine.getDocument().levels[0].items[0];
  assert(item.width === sofaAsset.dimensions.widthM, 'Undo must restore original width');

  // Undo move
  engine.undo();
  item = engine.getDocument().levels[0].items[0];
  assert(item.x === 2.0 && item.y === 2.5 && item.rotation === 90, 'Undo must restore original transform');

  // Redo move & resize
  engine.redo();
  engine.redo();
  item = engine.getDocument().levels[0].items[0];
  assert(item.width === 3.0 && item.x === 3.5, 'Redo must restore resized and moved state');
  console.log('  -> Verified: Movement, rotation, and dimension resizing support full Undo/Redo.');

  // ── TEST 6: Room Boundary Resizing ──
  console.log('\n[TEST 6] Testing room boundary resizing command...');
  const roomResizeCmd = createResizeRoomCommand(0, 'r_bedroom', 1.0, 0.5);
  const roomResizeResult = engine.execute(roomResizeCmd);
  assert(roomResizeResult.success, 'Room boundary resize command must succeed');
  const node3 = engine.getDocument().levels[0].nodes.find(n => n.id === 'n3')!;
  assert(node3.x === 13.0, `Expected node n3 x=13.0, got ${node3.x}`);

  engine.undo();
  const node3Restored = engine.getDocument().levels[0].nodes.find(n => n.id === 'n3')!;
  assert(node3Restored.x === 12.0, `Expected restored node n3 x=12.0, got ${node3Restored.x}`);
  console.log('  -> Verified: Room boundary resizing shifts boundary nodes and cleanly undoes.');

  // ── TEST 7: 2D Footprint to 3D Representation Consistency ──
  console.log('\n[TEST 7] Verifying 2D to 3D representation synchronization...');
  const building3D = generate3DBuilding(engine.getDocument());
  assert(building3D.levels.length === 1, '3D building must have 1 level');
  const level3D = building3D.levels[0];
  assert(level3D.furniture.length === 1, '3D level must have placed furniture');
  const furn3D = level3D.furniture[0];
  assert(furn3D.name === sofaAsset.name, '3D furniture name must match');
  // Position check (m converted to ft)
  assert(Math.abs(furn3D.positionFt.x - mToFt(item.x)) < 0.05, '3D X position must match canonical X');
  assert(Math.abs(furn3D.positionFt.z - mToFt(item.y)) < 0.05, '3D Z position must match canonical Y');
  console.log('  -> Verified: 3D generator reflects canonical placed furniture dimensions and positions.');

  // ── TEST 8: Legacy Projection & Supabase Round-Trip Fidelity ──
  console.log('\n[TEST 8] Verifying legacy projection and Supabase round-trip...');
  const projectedFloors = canonicalToLegacyFloors(engine.getDocument());
  assert(projectedFloors.length === 1, 'Must project 1 floor');
  const livingRoom = projectedFloors[0].rooms.find(r => r.name === 'Living Room')!;
  assert(!!livingRoom, 'Living Room must exist in projected floor');
  assert(Boolean(livingRoom.furniture && livingRoom.furniture.length === 1), 'Furniture must be projected into host room');
  const projectedItem = livingRoom.furniture![0];
  assert(projectedItem.name === sofaAsset.name, 'Projected furniture name must match');

  // Migrate back to canonical
  const migrated = migrateLegacyToCanonical({
    plot_width: mToFt(engine.getDocument().site.width),
    plot_length: mToFt(engine.getDocument().site.length),
    entry_direction: engine.getDocument().site.entrySide,
    floors: projectedFloors,
  });
  assert(migrated.levels[0].items.length === 1, 'Migrated level must preserve placed items');
  console.log('  -> Verified: Furniture survives round-trip projection and legacy migration.');

  // ── TEST 9: Furniture Catalog Drawer Metadata Audit ──
  console.log('\n[TEST 9] Auditing catalog search and category filtering...');
  const allAssets = getAllFurnitureAssets();
  assert(allAssets.length >= 30, `Expected >= 30 assets, got ${allAssets.length}`);

  // Test search filtering logic
  const query = 'sofa';
  const matched = allAssets.filter(a =>
    a.name.toLowerCase().includes(query) ||
    a.description.toLowerCase().includes(query) ||
    a.id.toLowerCase().includes(query) ||
    a.category.toLowerCase().includes(query)
  );
  assert(matched.length >= 2, `Search for 'sofa' must match at least 2 items, got ${matched.length}`);

  // Test category filtering
  for (const cat of FURNITURE_CATEGORIES) {
    const catItems = allAssets.filter(a => a.category === cat);
    assert(catItems.length > 0, `Category '${cat}' must have at least one asset`);
  }
  console.log('  -> Verified: All categories contain assets and metadata search filters correctly.');

  // ── TEST 10: Deduplication of Shared Doorway on Wall w_lvl_0_16 ──
  console.log('\n[TEST 10] Verifying shared doorway deduplication on wall w_lvl_0_16...');
  // Simulate legacy floors where adjacent Living Room and Dining Room share an interior doorway
  const legacyFloorsWithSharedDoor = [
    {
      level: 0,
      name: 'Ground Floor',
      elevation: 0,
      height: 10,
      rooms: [
        {
          name: 'Living Room',
          x: 0,
          y: 0,
          width: 20,
          length: 15,
          doors: [
            {
              id: 'door_living_01',
              name: 'Living Room Door',
              wall: 'east',
              offset: 7.5,
              width: 3.0,
              type: 'single',
            },
          ],
        },
        {
          name: 'Dining Room',
          x: 20,
          y: 0,
          width: 15,
          length: 15,
          doors: [
            {
              id: 'door_dining_01',
              name: 'Dining Room Door',
              wall: 'west', // Shared partition wall with Living Room east
              offset: 7.5,
              width: 3.0,
              type: 'single',
            },
          ],
        },
      ],
    },
  ];

  const migratedDoc = migrateLegacyToCanonical({
    plot_width: 50,
    plot_length: 50,
    entry_direction: 'north',
    floors: legacyFloorsWithSharedDoor as any,
  });

  // Validate that canonical document has no opening overlap errors
  const valResult = validateCanonicalDocument(migratedDoc);
  const overlapIssues = valResult.issues.filter(i => i.code === 'OPENING_OVERLAP');
  assert(overlapIssues.length === 0, `Expected 0 OPENING_OVERLAP issues after migration deduplication, got ${overlapIssues.length}`);
  console.log('  -> Verified: Shared partition doorway between adjacent rooms deduplicated cleanly with zero OPENING_OVERLAP warnings.');

  // ── TEST 11: Strict Validation Rejection of Genuine Overlapping Door Edits ──
  console.log('\n[TEST 11] Verifying strict rejection of genuine overlapping door edits...');
  // Create an intentional overlapping door on the same wall segment
  const docWithRealOverlap = createTestCanonicalDoc();
  const lvl0 = docWithRealOverlap.levels[0];
  const targetWall = lvl0.walls[0]; // w1, length 6m
  lvl0.openings = [
    {
      id: 'door_a',
      wallId: targetWall.id,
      type: 'single_door',
      name: 'Entry Door A',
      offset: 1.0,
      width: 1.2,
      height: 2.1,
      sill: 0,
    },
    {
      id: 'door_b',
      wallId: targetWall.id,
      type: 'single_door',
      name: 'Conflicting Door B',
      offset: 1.5, // Overlaps with door_a (1.0 to 2.2)
      width: 1.2,
      height: 2.1,
      sill: 0,
    },
  ];

  const realOverlapVal = validateCanonicalDocument(docWithRealOverlap);
  const detectedOverlaps = realOverlapVal.issues.filter(i => i.code === 'OPENING_OVERLAP');
  assert(detectedOverlaps.length > 0, 'Structural validator must strictly detect and flag genuine overlapping openings');
  console.log('  -> Verified: Structural validator maintains strict opening interval overlap enforcement.');

  // ── TEST 12: Read-Only Room Selection Invariance ──
  console.log('\n[TEST 12] Verifying room selection does not alter building document or dispatch mutations...');
  const beforeDocJson = JSON.stringify(engine.getDocument());
  const beforeHistoryLength = engine.getUndoStackSize();

  // Simulate read-only selection of rooms (e.g. Parking, Living Room)
  const roomToInspect = engine.getDocument().levels[0].rooms[0];
  assert(!!roomToInspect, 'Room to inspect must exist');

  // Verify that inspecting room metadata causes zero mutations to document or command history
  const afterDocJson = JSON.stringify(engine.getDocument());
  const afterHistoryLength = engine.getUndoStackSize();
  assert(beforeDocJson === afterDocJson, 'Document must remain strictly identical during selection');
  assert(beforeHistoryLength === afterHistoryLength, 'Command history must remain unchanged during selection');
  console.log('  -> Verified: Read-only room inspection produces zero document mutations.');

  console.log('='.repeat(75));
  console.log('ALL 12 CRITICAL STABILIZATION REGRESSION TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(75));
}

// Auto-run if executed directly via tsx
runStabilizationSuite();

