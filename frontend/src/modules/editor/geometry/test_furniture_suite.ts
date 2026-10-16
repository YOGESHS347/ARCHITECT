/**
 * test_furniture_suite.ts
 * ============================================================================
 * Automated Test Suite for Furniture Asset Registry & Command Integration (Phase 3).
 *
 * Verifies:
 *   1. Furniture Asset Registry completeness, dimensions (ft <-> m), and categories.
 *   2. CommandEngine placement of PlacedItem with reversible Undo/Redo.
 *   3. Furniture transformation (move & rotation) with reversible Undo/Redo.
 *   4. Furniture numeric dimension resizing with reversible Undo/Redo.
 *   5. Furniture deletion with reversible Undo restoration.
 *   6. CanonicalToLegacyFloors projection fidelity for placed furniture.
 * ============================================================================
 */

import { SCHEMA_VERSION, ftToM } from './types';
import type { CanonicalBuildingDocument, Level, PlacedItem } from './types';
import { CommandEngine } from './commandEngine';
import {
  createPlaceItemCommand,
  createTransformItemCommand,
  createUpdateItemDimensionsCommand,
  createDeleteItemCommand,
} from './commands';
import { canonicalToLegacyFloors } from './selectors';
import {
  FURNITURE_CATEGORIES,
  getAllFurnitureAssets,
  getFurnitureAsset,
} from './furnitureRegistry';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

function runTests() {
  console.log('='.repeat(70));
  console.log('STARTING PHASE 3 FURNITURE & ASSET REGISTRY TEST SUITE');
  console.log('='.repeat(70));

  let passed = 0;

  // ── TEST 1: Furniture Registry Audit ──────────────────────────────────────
  console.log('\n[TEST 1] Auditing Furniture Registry Assets & Metadata...');
  const assets = getAllFurnitureAssets();
  assert(assets.length >= 30, `Expected at least 30 registered assets, found ${assets.length}`);

  for (const asset of assets) {
    assert(!!asset.id, `Asset must have an ID: ${asset.name}`);
    assert(!!asset.name, `Asset must have a name: ${asset.id}`);
    assert(FURNITURE_CATEGORIES.includes(asset.category), `Invalid category: ${asset.category}`);
    assert(asset.dimensions.widthFt > 0, `WidthFt must be positive: ${asset.id}`);
    assert(asset.dimensions.depthFt > 0, `DepthFt must be positive: ${asset.id}`);
    assert(asset.dimensions.heightFt > 0, `HeightFt must be positive: ${asset.id}`);
    assert(
      Math.abs(asset.dimensions.widthM - ftToM(asset.dimensions.widthFt)) < 0.001,
      `WidthM must match ftToM for ${asset.id}`
    );
    assert(
      asset.representation3D === 'procedural' || asset.representation3D === 'gltf',
      `Valid 3D representation required for ${asset.id}`
    );
  }
  console.log(`  -> Passed audit of all ${assets.length} furniture assets.`);
  passed++;

  // ── TEST 2: Base Document Setup ───────────────────────────────────────────
  console.log('\n[TEST 2] Setting up Canonical Document & CommandEngine...');
  const testLevel: Level = {
    id: 'lvl_0',
    levelIndex: 0,
    name: 'Ground Floor',
    elevation: 0,
    height: 3.05,
    slabThickness: 0.25,
    nodes: [
      { id: 'n1', x: 0, y: 0 },
      { id: 'n2', x: 8, y: 0 },
      { id: 'n3', x: 8, y: 6 },
      { id: 'n4', x: 0, y: 6 },
    ],
    walls: [
      { id: 'w1', startNodeId: 'n1', endNodeId: 'n2', thickness: 0.23, height: 3.05, kind: 'exterior' },
      { id: 'w2', startNodeId: 'n2', endNodeId: 'n3', thickness: 0.23, height: 3.05, kind: 'exterior' },
      { id: 'w3', startNodeId: 'n3', endNodeId: 'n4', thickness: 0.23, height: 3.05, kind: 'exterior' },
      { id: 'w4', startNodeId: 'n4', endNodeId: 'n1', thickness: 0.23, height: 3.05, kind: 'exterior' },
    ],
    openings: [],
    rooms: [
      { id: 'r1', name: 'Living Room', roomType: 'living', boundaryNodeIds: ['n1', 'n2', 'n3', 'n4'] },
    ],
    items: [],
  };

  const doc: CanonicalBuildingDocument = {
    schemaVersion: SCHEMA_VERSION,
    id: 'doc_furn_test',
    metadata: {
      name: 'Residence Furniture Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryDirection: 'east',
      displayUnits: 'ft',
    },
    site: {
      plotPolygon: [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 15 }, { x: 0, y: 15 }],
      width: 12,
      length: 15,
      entrySide: 'east',
      northAngle: 0,
      setbacks: { front: 1, rear: 1, left: 1, right: 1 },
    },
    levels: [testLevel],
  };

  const engine = new CommandEngine(doc);
  assert(engine.getDocument().levels[0].items.length === 0, 'Initial items must be empty');
  console.log('  -> Initialized CommandEngine with zero items.');
  passed++;

  // ── TEST 3: Place Furniture Item Command ──────────────────────────────────
  console.log('\n[TEST 3] Testing createPlaceItemCommand & Undo/Redo...');
  const sofaDef = getFurnitureAsset('sofa_3_seater')!;
  assert(!!sofaDef, 'sofa_3_seater must exist in registry');

  const sofaItem: PlacedItem = {
    id: 'item_sofa_1',
    assetId: sofaDef.id,
    name: sofaDef.name,
    x: 2.0,
    y: 2.0,
    elevation: 0,
    rotation: 0,
    width: sofaDef.dimensions.widthM,
    depth: sofaDef.dimensions.depthM,
    height: sofaDef.dimensions.heightM,
    color: sofaDef.defaultColor,
  };

  const placeCmd = createPlaceItemCommand(0, sofaItem);
  const placeRes = engine.execute(placeCmd);
  assert(placeRes.success, 'Place item command must succeed');
  assert(engine.getDocument().levels[0].items.length === 1, 'Item count must be 1');
  assert(engine.getDocument().levels[0].items[0].id === 'item_sofa_1', 'Item ID matches');

  // Undo placement
  const undoPlace = engine.undo();
  assert(undoPlace.success, 'Undo must succeed');
  assert(engine.getDocument().levels[0].items.length === 0, 'Item count restored to 0');

  // Redo placement
  const redoPlace = engine.redo();
  assert(redoPlace.success, 'Redo must succeed');
  assert(engine.getDocument().levels[0].items.length === 1, 'Item count restored to 1');
  console.log('  -> Passed createPlaceItemCommand with reversible Undo/Redo.');
  passed++;

  // ── TEST 4: Transform Furniture Item (Move & Rotation) ────────────────────
  console.log('\n[TEST 4] Testing createTransformItemCommand...');
  const moveCmd = createTransformItemCommand(0, 'item_sofa_1', 3.5, 2.8, 90);
  const moveRes = engine.execute(moveCmd);
  assert(moveRes.success, 'Transform command must succeed');
  const transformedItem = engine.getDocument().levels[0].items[0];
  assert(transformedItem.x === 3.5, `Expected x=3.5, got ${transformedItem.x}`);
  assert(transformedItem.y === 2.8, `Expected y=2.8, got ${transformedItem.y}`);
  assert(transformedItem.rotation === 90, `Expected rotation=90, got ${transformedItem.rotation}`);

  // Undo transform
  engine.undo();
  const revertedItem = engine.getDocument().levels[0].items[0];
  assert(revertedItem.x === 2.0, `Expected x=2.0 after undo, got ${revertedItem.x}`);
  assert(revertedItem.rotation === 0, `Expected rotation=0 after undo, got ${revertedItem.rotation}`);

  // Redo transform
  engine.redo();
  const reappliedItem = engine.getDocument().levels[0].items[0];
  assert(reappliedItem.x === 3.5 && reappliedItem.rotation === 90, 'Transform reapplied');
  console.log('  -> Passed createTransformItemCommand with reversible Undo/Redo.');
  passed++;

  // ── TEST 5: Resize Furniture Item Dimensions ──────────────────────────────
  console.log('\n[TEST 5] Testing createUpdateItemDimensionsCommand...');
  const resizeCmd = createUpdateItemDimensionsCommand(0, 'item_sofa_1', 2.5, 1.1, 0.9);
  const resizeRes = engine.execute(resizeCmd);
  assert(resizeRes.success, 'Resize command must succeed');
  const resized = engine.getDocument().levels[0].items[0];
  assert(resized.width === 2.5, `Expected width=2.5, got ${resized.width}`);
  assert(resized.depth === 1.1, `Expected depth=1.1, got ${resized.depth}`);

  // Undo resize
  engine.undo();
  assert(engine.getDocument().levels[0].items[0].width === sofaDef.dimensions.widthM, 'Width restored');

  // Redo resize
  engine.redo();
  assert(engine.getDocument().levels[0].items[0].width === 2.5, 'Width reapplied');
  console.log('  -> Passed createUpdateItemDimensionsCommand with reversible Undo/Redo.');
  passed++;

  // ── TEST 6: Delete Furniture Item ─────────────────────────────────────────
  console.log('\n[TEST 6] Testing createDeleteItemCommand & Undo restoration...');
  const delCmd = createDeleteItemCommand(0, 'item_sofa_1');
  const delRes = engine.execute(delCmd);
  assert(delRes.success, 'Delete item command must succeed');
  assert(engine.getDocument().levels[0].items.length === 0, 'Item was deleted from document');

  // Undo delete
  const undoDel = engine.undo();
  assert(undoDel.success, 'Undo delete must succeed');
  assert(engine.getDocument().levels[0].items.length === 1, 'Deleted item restored');
  assert(engine.getDocument().levels[0].items[0].id === 'item_sofa_1', 'Restored item ID matches');
  console.log('  -> Passed createDeleteItemCommand with complete state restoration.');
  passed++;

  // ── TEST 7: Projection to Legacy Floor with Furniture ─────────────────────
  console.log('\n[TEST 7] Testing canonicalToLegacyFloors projection...');
  const legacyFloors = canonicalToLegacyFloors(engine.getDocument());
  assert(legacyFloors.length === 1, '1 legacy floor projected');
  assert(legacyFloors[0].rooms.length === 1, '1 legacy room projected');
  const projRoom = legacyFloors[0].rooms[0];
  assert(projRoom.furniture !== undefined && projRoom.furniture.length === 1, 'Furniture projected into room');
  const projFurn = projRoom.furniture![0];
  assert(projFurn.catalogId === 'sofa_3_seater', 'CatalogId matches');
  assert(projFurn.name === '3-Seater Sofa', 'Name matches');
  assert(projFurn.width > 0 && projFurn.height > 0, 'Dimensions projected in feet');
  console.log(`  -> Projected furniture: ${projFurn.name} (${projFurn.width.toFixed(1)}x${projFurn.height.toFixed(1)}ft) at (${projFurn.x.toFixed(1)}, ${projFurn.y.toFixed(1)}ft)`);
  passed++;

  console.log('='.repeat(70));
  console.log(`ALL ${passed} PHASE 3 FURNITURE & COMMAND TESTS PASSED SUCCESSFULLY!`);
  console.log('='.repeat(70));
}

runTests();
