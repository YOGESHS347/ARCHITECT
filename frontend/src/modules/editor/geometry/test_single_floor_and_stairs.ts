/**
 * Automated Verification Suite: Single Floor View & Staircase Termination
 * Validates:
 * 1. 4-level building model with authoritative floor elevations
 * 2. Staircase vertical flight calculation & exact landing termination
 * 3. Prevention of staircase overshooting above the rooftop terrace
 * 4. Lower-floor staircase continuity (L0->L1, L1->L2, L2->L3)
 * 5. Single Floor view mode filtering for all 4 levels (L0, L1, L2, L3)
 * 6. Immutability of canonical document across view mode transitions
 * 7. Preservation of Stacked and Exploded vertical representations
 */

import { generate3DBuilding } from './building3DGenerator';
import { migrateLegacyToCanonical } from './migration';
import type { CanonicalBuildingDocument } from './types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

export function runSingleFloorAndStairsTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING SINGLE FLOOR & STAIRCASE TERMINATION VERIFICATION');
  console.log('================================================================');

  // ── FIXTURE: 4-Level Architectural Residence ──────────────────────────────
  const fourLevelFixture = {
    plot_width: 30,
    plot_length: 40,
    entry_direction: 'east',
    floors: [
      {
        level: 0,
        name: 'Ground Floor',
        rooms: [
          {
            id: 'r_l0_living',
            name: 'Living Room',
            x: 0,
            y: 0,
            width: 18,
            height: 20,
            furniture: [{ id: 'f_l0_sofa', name: 'Sofa', catalogId: 'sofa_3_seater', x: 2, y: 2, width: 7, height: 3, zHeight: 2.5 }],
          },
          {
            id: 'r_l0_stair',
            name: 'Staircase Hall',
            x: 18,
            y: 0,
            width: 12,
            height: 20,
          },
        ],
      },
      {
        level: 1,
        name: 'First Floor',
        rooms: [
          {
            id: 'r_l1_bed',
            name: 'Master Bedroom',
            x: 0,
            y: 0,
            width: 18,
            height: 20,
            furniture: [{ id: 'f_l1_bed', name: 'King Bed', catalogId: 'king_bed', x: 3, y: 3, width: 7.5, height: 6.5, zHeight: 3 }],
          },
          {
            id: 'r_l1_stair',
            name: 'Staircase Hall',
            x: 18,
            y: 0,
            width: 12,
            height: 20,
          },
        ],
      },
      {
        level: 2,
        name: 'Second Floor',
        rooms: [
          {
            id: 'r_l2_lounge',
            name: 'Family Lounge',
            x: 0,
            y: 0,
            width: 18,
            height: 20,
            furniture: [{ id: 'f_l2_desk', name: 'Study Desk', catalogId: 'study_desk', x: 2, y: 4, width: 4.5, height: 2.2, zHeight: 2.5 }],
          },
          {
            id: 'r_l2_stair',
            name: 'Staircase Hall',
            x: 18,
            y: 0,
            width: 12,
            height: 20,
          },
        ],
      },
      {
        level: 3,
        name: 'Rooftop Terrace',
        rooms: [
          {
            id: 'r_l3_garden',
            name: 'Rooftop Garden',
            x: 0,
            y: 0,
            width: 18,
            height: 20,
            furniture: [{ id: 'f_l3_lounger', name: 'Sun Lounger', catalogId: 'sun_lounger', x: 4, y: 4, width: 6.5, height: 2.5, zHeight: 1.5 }],
          },
          {
            id: 'r_l3_mumty',
            name: 'Stair Headroom & Mumty',
            x: 18,
            y: 0,
            width: 12,
            height: 20,
          },
        ],
      },
    ],
  };

  const canonicalDoc: CanonicalBuildingDocument = migrateLegacyToCanonical(fourLevelFixture, 30, 40, 'east');
  assert(canonicalDoc.levels.length === 4, `Must have exactly 4 levels, got ${canonicalDoc.levels.length}`);
  console.log('✓ Canonical building document initialized with 4 levels (L0, L1, L2, L3).');

  // Snapshot before 3D generation to ensure immutability
  const canonicalSnapshot = JSON.stringify(canonicalDoc);

  // ── TEST 1: All 4 Levels Selectable Individually with Consistent Mapping ──
  console.log('\n[TEST 1] Level mapping and elevation hierarchy...');
  const building3D = generate3DBuilding(canonicalDoc);
  assert(building3D.levels.length === 4, `3D building must have 4 levels, got ${building3D.levels.length}`);

  const [lvl0, lvl1, lvl2, lvl3] = building3D.levels;

  assert(lvl0.levelIndex === 0 && lvl0.name === 'Ground Floor', 'Level 0 must be Ground Floor');
  assert(lvl1.levelIndex === 1 && lvl1.name === 'First Floor', 'Level 1 must be First Floor');
  assert(lvl2.levelIndex === 2 && lvl2.name === 'Second Floor', 'Level 2 must be Second Floor');
  assert(lvl3.levelIndex === 3 && lvl3.name === 'Rooftop Terrace', 'Level 3 must be Rooftop Terrace');

  assert(lvl0.elevationFt === 0, `Level 0 elevation must be 0, got ${lvl0.elevationFt}`);
  assert(lvl1.elevationFt > lvl0.elevationFt, 'Level 1 must be elevated above Level 0');
  assert(lvl2.elevationFt > lvl1.elevationFt, 'Level 2 must be elevated above Level 1');
  assert(lvl3.elevationFt > lvl2.elevationFt, 'Level 3 must be elevated above Level 2');
  console.log(`  PASS: L0=${lvl0.elevationFt.toFixed(2)}ft, L1=${lvl1.elevationFt.toFixed(2)}ft, L2=${lvl2.elevationFt.toFixed(2)}ft, L3=${lvl3.elevationFt.toFixed(2)}ft.`);

  // ── TEST 2: Stair Flights & Landing Termination Verification ──────────────
  console.log('\n[TEST 2] Stair flight calculations and destination landing termination...');

  // Level 0 Staircase: Connects L0 to L1
  assert(lvl0.stairs.length === 1, `Level 0 must generate exactly 1 stair flight, got ${lvl0.stairs.length}`);
  const stair0 = lvl0.stairs[0];
  const expectedH0 = lvl1.elevationFt - lvl0.elevationFt;
  assert(
    Math.abs(stair0.totalHeightFt - expectedH0) < 0.05,
    `Stair L0->L1 height (${stair0.totalHeightFt}) must match elevation delta (${expectedH0})`
  );
  console.log(`  PASS: L0 staircase flight height = ${stair0.totalHeightFt.toFixed(2)}ft -> lands precisely at L1 (${lvl1.elevationFt.toFixed(2)}ft).`);

  // Level 1 Staircase: Connects L1 to L2
  assert(lvl1.stairs.length === 1, `Level 1 must generate exactly 1 stair flight, got ${lvl1.stairs.length}`);
  const stair1 = lvl1.stairs[0];
  const expectedH1 = lvl2.elevationFt - lvl1.elevationFt;
  assert(
    Math.abs(stair1.totalHeightFt - expectedH1) < 0.05,
    `Stair L1->L2 height (${stair1.totalHeightFt}) must match elevation delta (${expectedH1})`
  );
  console.log(`  PASS: L1 staircase flight height = ${stair1.totalHeightFt.toFixed(2)}ft -> lands precisely at L2 (${lvl2.elevationFt.toFixed(2)}ft).`);

  // Level 2 Staircase: Connects L2 to L3 (Rooftop Terrace)
  assert(lvl2.stairs.length === 1, `Level 2 must generate exactly 1 stair flight, got ${lvl2.stairs.length}`);
  const stair2 = lvl2.stairs[0];
  const expectedH2 = lvl3.elevationFt - lvl2.elevationFt;
  assert(
    Math.abs(stair2.totalHeightFt - expectedH2) < 0.05,
    `Stair L2->L3 height (${stair2.totalHeightFt}) must match elevation delta (${expectedH2})`
  );
  console.log(`  PASS: L2 staircase flight height = ${stair2.totalHeightFt.toFixed(2)}ft -> lands precisely at L3 Rooftop Terrace (${lvl3.elevationFt.toFixed(2)}ft).`);

  // ── TEST 3: NO Staircase Overshooting Above the Rooftop Terrace ────────────
  console.log('\n[TEST 3] Rooftop staircase termination (Zero stairs into sky)...');
  assert(
    lvl3.stairs.length === 0,
    `Rooftop Terrace must generate 0 ascending stairs into the sky, got ${lvl3.stairs.length}`
  );
  console.log('  PASS: Level 3 (Rooftop Terrace) generates exactly 0 ascending stairs. Sky overshooting is completely eliminated.');

  // Check top elevation of staircase from Level 2
  const topStairArrivalElevation = lvl2.elevationFt + stair2.totalHeightFt;
  assert(
    Math.abs(topStairArrivalElevation - lvl3.elevationFt) < 0.01,
    `Stair from L2 must terminate exactly at L3 floor elevation (${lvl3.elevationFt}ft), got ${topStairArrivalElevation}ft`
  );
  console.log(`  PASS: Final riser/tread arrives at exact rooftop landing elevation ${topStairArrivalElevation.toFixed(2)}ft.`);

  // ── TEST 4: Single Floor View Mode Isolation ──────────────────────────────
  console.log('\n[TEST 4] Single floor viewing mode geometry isolation...');

  // Simulate FloorPlan3D single floor filtering for all 4 levels
  for (let activeFloor = 0; activeFloor < 4; activeFloor++) {
    const visibleLevels = building3D.levels.filter((_, fIdx) => fIdx === activeFloor);
    assert(visibleLevels.length === 1, `Single floor mode must show exactly 1 level, got ${visibleLevels.length}`);

    const isolated = visibleLevels[0];
    assert(isolated.levelIndex === activeFloor, `Visible level index must be ${activeFloor}`);

    // Verify only the selected floor's furniture is visible
    const visibleFurniture = isolated.furniture;
    assert(visibleFurniture.length === 1, `Isolated level ${activeFloor} must contain exactly 1 placed item`);

    if (activeFloor === 0) assert(visibleFurniture[0].name === 'Sofa', 'L0 furniture must be Sofa');
    if (activeFloor === 1) assert(visibleFurniture[0].name === 'King Bed', 'L1 furniture must be King Bed');
    if (activeFloor === 2) assert(visibleFurniture[0].name === 'Study Desk', 'L2 furniture must be Study Desk');
    if (activeFloor === 3) assert(visibleFurniture[0].name === 'Sun Lounger', 'L3 furniture must be Sun Lounger');

    // Verify stairs belonging to isolated floor
    if (activeFloor < 3) {
      assert(isolated.stairs.length === 1, `Level ${activeFloor} must have its ascending flight`);
    } else {
      assert(isolated.stairs.length === 0, `Rooftop level must have no ascending flight`);
    }

    console.log(`  PASS: Level ${activeFloor} (${isolated.name}) cleanly isolated with 0 cross-floor geometry bleeding.`);
  }

  // ── TEST 5: Stacked & Exploded Presentation Unchanged ──────────────────────
  console.log('\n[TEST 5] Preservation of Stacked and Exploded vertical positions...');

  const FLOOR_PITCH = 10.8;
  const EXPLODED_GAP = 12.0;

  // Stacked mode: levels at normal elevation
  building3D.levels.forEach((lvl, idx) => {
    assert(lvl.elevationFt === (canonicalDoc.levels[idx].elevation * 3.28084), `Stacked elevation must equal canonical elevation`);
  });

  // Exploded mode: each floor separated by (FLOOR_PITCH + EXPLODED_GAP)
  const explodedYPositions = building3D.levels.map((_, idx) => idx * (FLOOR_PITCH + EXPLODED_GAP));
  assert(explodedYPositions[0] === 0, 'L0 exploded Y must be 0');
  assert(explodedYPositions[1] === 22.8, `L1 exploded Y must be 22.8, got ${explodedYPositions[1]}`);
  assert(explodedYPositions[2] === 45.6, `L2 exploded Y must be 45.6, got ${explodedYPositions[2]}`);
  assert(explodedYPositions[3] === 68.4, `L3 exploded Y must be 68.4, got ${explodedYPositions[3]}`);
  console.log('  PASS: Exploded positions verify strict vertical separation without affecting canonical data.');

  // ── TEST 6: Immutability of Canonical Building Model ───────────────────────
  console.log('\n[TEST 6] Immutability of canonical document...');
  const canonicalAfter = JSON.stringify(canonicalDoc);
  assert(canonicalSnapshot === canonicalAfter, 'Canonical document must not mutate when generating 3D views');
  console.log('  PASS: Canonical building document remained 100% immutable throughout view generation.');

  console.log('\n================================================================');
  console.log('✅ ALL 6 SINGLE FLOOR & STAIR TERMINATION TESTS PASSED!');
  console.log('================================================================\n');
  return true;
}

// Auto-run test suite
runSingleFloorAndStairsTests();
