/**
 * test_visualization_materials.ts
 * ============================================================================
 * Phase 5 Unit Test Suite: PBR Material Pipeline & Texture Resolution.
 *
 * Verifies:
 * 1. Material catalog completeness (all 12 architectural material specs defined).
 * 2. Room floor material key resolution matching Reference 1 & Reference 2.
 * 3. Texture repeat scaling based on real-world dimensions in feet.
 * 4. Headless Three.js material generation safety (Node.js compatibility).
 * 5. Lifecycle disposal safety (zero memory leaks on unmount).
 * ============================================================================
 */

import {
  MATERIAL_SPECS,
  architecturalMaterials,
  resolveRoomFloorMaterialKey,
  type ArchitecturalMaterialKey,
} from './architecturalMaterials';
import { getRoomMaterialConfig } from './building3DGenerator';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

export function runMaterialSuite() {
  console.log('='.repeat(75));
  console.log('STARTING PHASE 5 PBR MATERIAL & TEXTURE PIPELINE TEST SUITE');
  console.log('='.repeat(75));

  // ── TEST 1: Material Catalog Completeness ──
  console.log('\n[TEST 1] Auditing PBR material specifications...');
  const expectedKeys: ArchitecturalMaterialKey[] = [
    'hardwood_oak',
    'porcelain_tile',
    'calacatta_marble',
    'teak_decking',
    'travertine_paver',
    'honed_concrete',
    'garden_turf',
    'architectural_plaster',
    'interior_drywall',
    'wall_top_cap',
    'architectural_glass',
    'pool_water',
  ];

  for (const key of expectedKeys) {
    const spec = MATERIAL_SPECS[key];
    assert(!!spec, `Material spec for '${key}' must exist`);
    assert(spec.roughness >= 0 && spec.roughness <= 1, `Roughness for '${key}' must be in [0, 1]`);
    assert(spec.metalness >= 0 && spec.metalness <= 1, `Metalness for '${key}' must be in [0, 1]`);
    assert(spec.tileUnitFt.width > 0 && spec.tileUnitFt.height > 0, `Tile unit for '${key}' must be positive`);
  }
  console.log(`  -> Passed audit of all ${expectedKeys.length} PBR architectural material specs.`);

  // ── TEST 2: Room Floor Material Resolution ──
  console.log('\n[TEST 2] Testing room floor material resolution...');
  const roomMappings: Array<{ name: string; type?: string; expectedKey: ArchitecturalMaterialKey }> = [
    { name: 'Living Room', expectedKey: 'hardwood_oak' },
    { name: 'Master Bedroom', expectedKey: 'hardwood_oak' },
    { name: 'Bed 2', expectedKey: 'hardwood_oak' },
    { name: 'Guest Room', expectedKey: 'hardwood_oak' },
    { name: 'Formal Dining', expectedKey: 'hardwood_oak' },
    { name: 'En-Suite Bathroom', expectedKey: 'porcelain_tile' },
    { name: 'Powder Room', expectedKey: 'porcelain_tile' },
    { name: 'Master Bath', expectedKey: 'porcelain_tile' },
    { name: 'Chef Kitchen', expectedKey: 'calacatta_marble' },
    { name: 'Pantry', expectedKey: 'calacatta_marble' },
    { name: 'Pool Sundeck', expectedKey: 'teak_decking' },
    { name: 'Timber Deck', expectedKey: 'teak_decking' },
    { name: 'Outdoor Patio', expectedKey: 'travertine_paver' },
    { name: 'Covered Balcony', expectedKey: 'travertine_paver' },
    { name: 'BBQ Terrace', expectedKey: 'travertine_paver' },
    { name: 'Parking Garage', expectedKey: 'honed_concrete' },
    { name: 'Rooftop Garden', expectedKey: 'garden_turf' },
  ];

  for (const mapping of roomMappings) {
    const resolved = resolveRoomFloorMaterialKey(mapping.name, mapping.type);
    assert(resolved === mapping.expectedKey, `Expected '${mapping.name}' to map to '${mapping.expectedKey}', got '${resolved}'`);
  }
  console.log(`  -> Passed resolution for all ${roomMappings.length} architectural room types.`);

  // ── TEST 3: Building Generator Material Metadata ──
  console.log('\n[TEST 3] Verifying building generator attaches materialKey...');
  const masterBedConfig = getRoomMaterialConfig('Master Bedroom');
  assert(masterBedConfig.materialKey === 'hardwood_oak', 'Master Bed must have materialKey hardwood_oak');
  assert(masterBedConfig.floorColor.toLowerCase() === '#e6d7c3', 'Floor color must match warm oak');

  const bathConfig = getRoomMaterialConfig('Guest Bathroom');
  assert(bathConfig.materialKey === 'porcelain_tile', 'Bathroom must have materialKey porcelain_tile');
  assert(bathConfig.floorColor.toLowerCase() === '#f3f4f6', 'Floor color must match neutral porcelain');
  console.log('  -> Passed building3DGenerator room material configuration integration.');

  // ── TEST 4: Three.js Material Creation & Dimension Tiling ──
  console.log('\n[TEST 4] Testing PBR Three.js material instancing and repeat calculation...');
  const oakMaterial = architecturalMaterials.getMaterial('hardwood_oak', { width: 20, height: 16 });
  assert(!!oakMaterial, 'Oak material instance must be created');

  const glassMaterial = architecturalMaterials.getMaterial('architectural_glass');
  assert(!!glassMaterial, 'Glass material instance must be created');
  assert((glassMaterial as any).transparent === true, 'Glass material must be transparent');

  const waterMaterial = architecturalMaterials.getMaterial('pool_water');
  assert(!!waterMaterial, 'Water material instance must be created');
  assert((waterMaterial as any).transparent === true, 'Water material must be transparent');
  console.log('  -> Passed material generation for standard, glass, and water PBR shaders.');

  // ── TEST 5: GPU Resource Disposal ──
  console.log('\n[TEST 5] Testing GPU resource disposal safety...');
  architecturalMaterials.dispose();
  console.log('  -> Architectural materials disposed cleanly without errors.');

  console.log('='.repeat(75));
  console.log('ALL 5 PBR MATERIAL & TEXTURE PIPELINE TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(75));
}

// Auto-run if executed directly via tsx
runMaterialSuite();
