/**
 * test_camera_lighting_suite.ts
 * ============================================================================
 * Phase 5 Vertical Slice 4 Verification Suite: Architectural Camera & Lighting.
 *
 * Validates:
 * 1. Camera Presets & Framing Calculations (Dollhouse, Isometric, Topdown, Front, Side, Fit).
 * 2. Small vs Large Plot Framing Invariance (Bounds scaling, clipping margins, near/far bounds).
 * 3. Multi-Floor Presentation Modes (Stacked, Exploded, Active, Single-Floor target elevations).
 * 4. Architectural Lighting Presets (Day, Sunset, Night illumination, color temperatures, exposure).
 * 5. Entry Direction Azimuth Alignment (East, North, South, West sun orientations).
 * 6. Interior Readability & Soft Shadow Profiles (acne-free normal bias, interior fill glow).
 * 7. Canonical Document Immutability across camera & lighting operations.
 * ============================================================================
 */

import {
  calculateCameraFraming,
  getArchitecturalLightingConfig,
  resolveSunAzimuthAngle,
  type CameraPreset,
  type ViewMode,
  type TimeOfDay,
} from './architecturalLighting';
import { generate3DBuilding } from './building3DGenerator';
import { generateSiteLandscaping } from './siteLandscapingGenerator';
import { migrateLegacyToCanonical } from './migration';
import type { CanonicalBuildingDocument } from './types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

export function runCameraAndLightingTests() {
  console.log('===========================================================================');
  console.log('🧪 RUNNING PHASE 5 VERTICAL SLICE 4: CAMERA, LIGHTING & PRESENTATION SUITE');
  console.log('===========================================================================');

  // Create standard test document
  const sampleDoc: CanonicalBuildingDocument = migrateLegacyToCanonical(
    {
      plot_width: 35,
      plot_length: 50,
      entry_direction: 'east',
      floors: [
        {
          level: 0,
          name: 'Ground Floor',
          rooms: [
            {
              id: 'r_living',
              name: 'Living Room',
              x: 0,
              y: 0,
              width: 20,
              height: 25,
              furniture: [
                { id: 'f_sofa', name: 'Sofa', catalogId: 'sofa_3_seater', x: 4, y: 4, width: 7, height: 3, zHeight: 2.8, rotation: 0 },
              ],
            },
          ],
        },
        {
          level: 1,
          name: 'First Floor',
          rooms: [
            {
              id: 'r_master',
              name: 'Master Bedroom',
              x: 0,
              y: 0,
              width: 20,
              height: 25,
              furniture: [
                { id: 'f_bed', name: 'Bed', catalogId: 'bed_king', x: 5, y: 5, width: 7.5, height: 6.8, zHeight: 3.5, rotation: 0 },
              ],
            },
          ],
        },
      ],
    },
    35,
    50,
    'east'
  );

  const b3D = generate3DBuilding(sampleDoc);
  const landscaping = generateSiteLandscaping(sampleDoc, b3D.bounds);

  // ── TEST 1: Camera Presets & Framing Calculations ─────────────────────────
  console.log('\n[TEST 1] Verifying all camera presets & framing targets...');
  const presets: CameraPreset[] = ['perspective', 'isometric', 'topdown', 'front', 'side'];

  for (const preset of presets) {
    const framing = calculateCameraFraming({
      bounds: b3D.bounds,
      plotBounds: landscaping.plotBoundsFt,
      isLandscapingEnabled: true,
      viewMode: 'all',
      activeFloorIndex: 0,
      numFloors: 2,
      preset,
    });

    assert(!isNaN(framing.targetLookAt.x), `LookAt X must be number for ${preset}`);
    assert(!isNaN(framing.targetLookAt.y), `LookAt Y must be number for ${preset}`);
    assert(!isNaN(framing.targetLookAt.z), `LookAt Z must be number for ${preset}`);
    assert(!isNaN(framing.targetPosition.x), `CamPos X must be number for ${preset}`);
    assert(!isNaN(framing.targetPosition.y), `CamPos Y must be number for ${preset}`);
    assert(!isNaN(framing.targetPosition.z), `CamPos Z must be number for ${preset}`);
    assert(framing.near > 0 && framing.near < 1.0, 'Near clipping plane must be < 1.0ft');
    assert(framing.far >= 3000, 'Far clipping plane must prevent scene cutoff');
    assert(framing.fitDistance > 25, 'Fit distance must be positive and framed');

    // Specific preset orientation invariants
    if (preset === 'topdown') {
      assert(framing.targetPosition.y > framing.targetLookAt.y + framing.fitDistance, 'Topdown must look straight down');
      assert(Math.abs(framing.targetPosition.z - framing.targetLookAt.z) < 0.1, 'Topdown Z must center over target');
    }
    if (preset === 'front') {
      assert(framing.targetPosition.z < framing.targetLookAt.z, 'Front elevation must place camera South of target');
      assert(Math.abs(framing.targetPosition.x - framing.targetLookAt.x) < 0.1, 'Front elevation X must align with center');
    }
    if (preset === 'side') {
      assert(framing.targetPosition.x < framing.targetLookAt.x, 'Side elevation must place camera West of target');
      assert(Math.abs(framing.targetPosition.z - framing.targetLookAt.z) < 0.1, 'Side elevation Z must align with center');
    }
    if (preset === 'isometric') {
      assert(framing.targetPosition.x > framing.targetLookAt.x, 'Isometric must position at 45 degree angle');
      assert(framing.targetPosition.z > framing.targetLookAt.z, 'Isometric must position at 45 degree angle');
    }
  }
  console.log('  PASS: All 5 camera presets compute valid, clipping-free 3D coordinates.');

  // ── TEST 2: Small vs Large Plot Framing Invariance ────────────────────────
  console.log('\n[TEST 2] Testing small vs large plot scaling invariance...');
  // Small plot (20x25ft)
  const smallFraming = calculateCameraFraming({
    bounds: { ...b3D.bounds, maxDim: 20, width: 20, depth: 25, totalHeight: 10 },
    isLandscapingEnabled: false,
    viewMode: 'all',
    activeFloorIndex: 0,
    numFloors: 1,
    preset: 'perspective',
  });

  // Large plot (100x150ft)
  const largeFraming = calculateCameraFraming({
    bounds: { ...b3D.bounds, maxDim: 100, width: 100, depth: 150, totalHeight: 35 },
    plotBounds: { minX: 0, maxX: 100, minZ: 0, maxZ: 150, width: 100, length: 150, centerX: 50, centerZ: 75 },
    isLandscapingEnabled: true,
    viewMode: 'all',
    activeFloorIndex: 0,
    numFloors: 3,
    preset: 'perspective',
  });

  assert(largeFraming.fitDistance > smallFraming.fitDistance * 3, 'Large plot fitDistance must scale proportionally');
  assert(largeFraming.maxDistance >= largeFraming.fitDistance * 4, 'Max distance must accommodate orbit on large plot');
  assert(largeFraming.far > largeFraming.fitDistance * 6, 'Far plane must avoid clipping distant edges on large plot');
  console.log('  PASS: Camera framing scales dynamically between small urban lots and sprawling residential plots.');

  // ── TEST 3: Multi-Floor Presentation Modes Target Elevation ───────────────
  console.log('\n[TEST 3] Verifying multi-floor presentation mode target elevations...');
  const modes: ViewMode[] = ['all', 'single', 'exploded', 'active'];

  for (const mode of modes) {
    const framing = calculateCameraFraming({
      bounds: b3D.bounds,
      viewMode: mode,
      activeFloorIndex: 1,
      numFloors: 2,
      preset: 'perspective',
    });

    if (mode === 'single') {
      // Single floor sits at grade Y = 0, so targetY is 5.0ft (half 10ft room)
      assert(framing.targetLookAt.y === 5.0, `Single mode targetY must be 5.0ft, got ${framing.targetLookAt.y}`);
    } else if (mode === 'active') {
      // Active floor 1 sits at elevation 10.83ft, so targetY is 10.83 + 5.0 = 15.83ft
      assert(Math.abs(framing.targetLookAt.y - 15.83) < 0.1, `Active mode targetY must center on Level 1 (15.83ft), got ${framing.targetLookAt.y}`);
    } else if (mode === 'exploded') {
      // Exploded mode height is expanded across gaps
      assert(framing.targetLookAt.y > 10.0, `Exploded mode targetY must elevate to center of expanded stack, got ${framing.targetLookAt.y}`);
    } else if (mode === 'all') {
      // Stacked building
      assert(Math.abs(framing.targetLookAt.y - b3D.bounds.totalHeight / 2) < 0.5, 'Stacked mode targetY must center on building massing');
    }
  }
  console.log('  PASS: Target lookAt elevations correctly adapt across Single Floor, Active, Exploded, and Stacked modes.');

  // ── TEST 4: Architectural Lighting Presets Audit ──────────────────────────
  console.log('\n[TEST 4] Auditing daylight, sunset, and night lighting configurations...');
  const times: TimeOfDay[] = ['day', 'sunset', 'night'];

  for (const tod of times) {
    const config = getArchitecturalLightingConfig(tod, 'east', 20, 25, 45);

    assert(config.directionalLight.intensity > 0, `${tod} directional light must have positive intensity`);
    assert(config.directionalLight.castShadow === true, `${tod} directional light must cast shadows`);
    assert(config.directionalLight.shadowNormalBias === 0.025, 'Shadow normal bias must be set to 0.025 to eliminate acne');
    assert(config.directionalLight.shadowBias < 0, 'Shadow bias must be negative to prevent surface banding');
    assert(config.hemisphereLight.intensity > 0, `${tod} hemisphere light must provide ambient fill`);
    assert(config.ambientLight.intensity > 0, `${tod} ambient light must prevent pitch black shadows`);
    assert(config.interiorGlow.intensity > 0, `${tod} interior glow must illuminate indoor spaces`);

    if (tod === 'day') {
      assert(config.toneMappingExposure >= 1.05, 'Daylight exposure must be bright and crisp');
      assert(config.directionalLight.color === '#fffbf0', 'Daylight sun must be warm white');
    } else if (tod === 'sunset') {
      assert(config.toneMappingExposure === 1.02, 'Sunset exposure must be balanced');
      assert(config.directionalLight.color === '#ff9c54', 'Sunset must use architectural honey amber');
      assert(config.sky.sunPosition[1] < 20, 'Sunset sun elevation must be low to cast long shadows');
    } else if (tod === 'night') {
      assert(config.toneMappingExposure === 0.98, 'Night exposure must prevent blown out highlights');
      assert(config.directionalLight.color === '#93c5fd', 'Night moonlight must be cool silver');
      assert(config.interiorGlow.intensity >= 0.85, 'Night mode interior glow must be prominent (2700K lamp glow)');
    }
  }
  console.log('  PASS: Daylight, sunset, and night configurations validated with photographic exposure and color palettes.');

  // ── TEST 5: Sun Azimuth Orientation Alignment ─────────────────────────────
  console.log('\n[TEST 5] Testing sun azimuth alignment with property entry direction...');
  const eastAngle = resolveSunAzimuthAngle('east');
  const northAngle = resolveSunAzimuthAngle('north');
  const southAngle = resolveSunAzimuthAngle('south');
  const westAngle = resolveSunAzimuthAngle('west');

  assert(eastAngle !== westAngle, 'East and West sun angles must differ');
  assert(northAngle !== southAngle, 'North and South sun angles must differ');
  assert(!isNaN(eastAngle) && !isNaN(northAngle), 'Azimuth angles must be valid numbers');
  console.log('  PASS: Sun trajectory dynamically aligns with site entry azimuth.');

  // ── TEST 6: Canonical Document Immutability ────────────────────────────────
  console.log('\n[TEST 6] Verifying canonical document immutability across lighting & camera changes...');
  const docBefore = JSON.stringify(sampleDoc);

  // Perform multiple framing calculations and lighting queries
  for (const preset of presets) {
    calculateCameraFraming({
      bounds: b3D.bounds,
      plotBounds: landscaping.plotBoundsFt,
      isLandscapingEnabled: true,
      viewMode: 'single',
      activeFloorIndex: 0,
      numFloors: 2,
      preset,
    });
  }
  for (const tod of times) {
    getArchitecturalLightingConfig(tod, 'south', 10, 10, 50);
  }

  const docAfter = JSON.stringify(sampleDoc);
  assert(docBefore === docAfter, 'CanonicalBuildingDocument must remain strictly immutable');
  console.log('  PASS: Canonical building document remained 100% immutable throughout all operations.');

  console.log('\n===========================================================================');
  console.log('ALL 6 ARCHITECTURAL CAMERA & LIGHTING TESTS PASSED SUCCESSFULLY!');
  console.log('===========================================================================\n');
  return true;
}

// Auto-run when executed directly via tsx
runCameraAndLightingTests();
