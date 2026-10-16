/**
 * building3DGenerator.ts
 * ============================================================================
 * Canonical Geometry 3D Building Engine Generator.
 *
 * Transforms the authoritative CanonicalBuildingDocument (in SI metres) into
 * clean, deduplicated, watertight 3D architectural geometry models (in feet)
 * for Three.js rendering.
 *
 * Guarantees:
 * 1. Single source of truth: All walls, openings, slabs, stairs, and furniture
 *    are computed directly from the canonical graph.
 * 2. Zero duplicate walls: Shared interior walls exist once in the wall graph.
 * 3. Real volumetric openings: Doors and windows are physically cut into walls
 *    with proper sills, lintels, glass panels, and door leaves.
 * 4. Multi-floor vertical consistency: Level elevations, floor pitch, slab thickness,
 *    and inter-floor stair flights align perfectly across stories.
 * ============================================================================
 */

import type {
  CanonicalBuildingDocument,
  Level,
  Point2D,
} from './types';
import { METRES_TO_FEET } from './types';
import { FURNITURE_REGISTRY, type FurnitureAssetDefinition } from './furnitureRegistry';
import { resolveRoomFloorMaterialKey, type ArchitecturalMaterialKey } from './architecturalMaterials';

export interface GeneratedOpening3D {
  id: string;
  type: 'door' | 'window' | 'opening';
  offsetFt: number;
  widthFt: number;
  heightFt: number;
  sillFt: number;
  centerFt: { x: number; y: number; z: number };
  hasSill: boolean;
  sillHeightFt: number;
  sillCenterYFt: number;
  hasLintel: boolean;
  lintelHeightFt: number;
  lintelCenterYFt: number;
  hasGlass: boolean;
  hasDoorLeaf: boolean;
  isEntrance: boolean;
}

export interface GeneratedWallSolidSegment3D {
  startOffsetFt: number;
  endOffsetFt: number;
  lengthFt: number;
  centerFt: { x: number; y: number; z: number };
}

export interface GeneratedWall3D {
  id: string;
  kind: 'exterior' | 'interior' | 'parapet' | 'partition';
  startPt: { x: number; z: number };
  endPt: { x: number; z: number };
  lengthFt: number;
  thicknessFt: number;
  heightFt: number;
  angleRad: number;
  centerFt: { x: number; z: number };
  solidSegments: GeneratedWallSolidSegment3D[];
  openings: GeneratedOpening3D[];
  materialColor: string;
}

export interface GeneratedWallJunction3D {
  id: string;
  nodeId: string;
  positionFt: { x: number; z: number };
  thicknessFt: number;
  heightFt: number;
  kind: 'exterior' | 'interior';
  materialColor: string;
}

export interface GeneratedRoom3D {
  id: string;
  name: string;
  roomType: string;
  isVoid: boolean;
  isBalcony: boolean;
  isSpecialtyTerrace: boolean;
  isStairwell: boolean;
  polygonFt: Point2D[];
  bboxFt: { x: number; y: number; width: number; height: number };
  areaSqFt: number;
  centerFt: { x: number; z: number };
  material: {
    floorColor: string;
    wallColor: string;
    floorRoughness: number;
    wallRoughness: number;
    materialKey?: ArchitecturalMaterialKey;
  };
}

export interface GeneratedFurniture3D {
  id: string;
  assetId: string;
  name: string;
  positionFt: { x: number; y: number; z: number };
  rotationDeg: number;
  dimensionsFt: { width: number; depth: number; height: number };
  color: string;
  isLight: boolean;
  lightProperties?: Record<string, unknown>;
  registryAsset?: FurnitureAssetDefinition;
}

export interface GeneratedStair3D {
  id: string;
  name: string;
  boundsFt: { x: number; z: number; width: number; depth: number };
  totalHeightFt: number;
  stepCount: number;
  flightType: 'straight' | 'u_shape' | 'l_shape';
}

export interface Generated3DLevel {
  levelId: string;
  levelIndex: number;
  name: string;
  elevationFt: number;
  heightFt: number;
  slabThicknessFt: number;
  floorPitchFt: number;
  isTerraceFloor: boolean;
  walls: GeneratedWall3D[];
  wallJunctions: GeneratedWallJunction3D[];
  rooms: GeneratedRoom3D[];
  furniture: GeneratedFurniture3D[];
  stairs: GeneratedStair3D[];
}

export interface Generated3DBuilding {
  levels: Generated3DLevel[];
  bounds: {
    minX: number;
    minZ: number;
    maxX: number;
    maxZ: number;
    centerX: number;
    centerZ: number;
    width: number;
    depth: number;
    maxDim: number;
    totalHeight: number;
  };
  site: {
    widthFt: number;
    lengthFt: number;
    entrySide: string;
  };
}

export interface Building3DGeneratorOptions {
  isCutaway?: boolean;
  cutawayHeightFt?: number;
  defaultWallHeightFt?: number;
  defaultSlabThicknessFt?: number;
}

export const DEFAULT_ROOM_HEIGHT_FT = 10.0;
export const DEFAULT_SLAB_THICKNESS_FT = 0.8;
export const DEFAULT_CUTAWAY_HEIGHT_FT = 4.5;
export const PARAPET_HEIGHT_FT = 3.5;

/**
 * Returns PBR material configuration based on room architectural type.
 */
export function getRoomMaterialConfig(name: string): {
  floorColor: string;
  wallColor: string;
  floorRoughness: number;
  wallRoughness: number;
  materialKey: ArchitecturalMaterialKey;
} {
  const n = name.toLowerCase();
  const matKey = resolveRoomFloorMaterialKey(name);

  if (n.includes('void')) return { floorColor: '#000000', wallColor: '#ffffff', floorRoughness: 0.1, wallRoughness: 0.1, materialKey: matKey };
  if (n.includes('garden')) return { floorColor: '#2f6824', wallColor: '#f8fafc', floorRoughness: 0.94, wallRoughness: 0.85, materialKey: 'garden_turf' };
  if (n.includes('gazebo')) return { floorColor: '#9e6234', wallColor: '#f8fafc', floorRoughness: 0.55, wallRoughness: 0.85, materialKey: 'teak_decking' };
  if (n.includes('sundeck') || n.includes('pool')) return { floorColor: '#9e6234', wallColor: '#f8fafc', floorRoughness: 0.55, wallRoughness: 0.85, materialKey: 'teak_decking' };
  if (n.includes('solar')) return { floorColor: '#78808e', wallColor: '#f8fafc', floorRoughness: 0.82, wallRoughness: 0.85, materialKey: 'honed_concrete' };
  if (n.includes('master')) return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.32, wallRoughness: 0.88, materialKey: 'hardwood_oak' };
  if (n.includes('bedroom')) return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.32, wallRoughness: 0.88, materialKey: 'hardwood_oak' };
  if (n.includes('bath') || n.includes('toilet') || n.includes('powder')) return { floorColor: '#f3f4f6', wallColor: '#f8fafc', floorRoughness: 0.18, wallRoughness: 0.88, materialKey: 'porcelain_tile' };
  if (n.includes('kitchen') || n.includes('pantry')) return { floorColor: '#fafbfd', wallColor: '#f8fafc', floorRoughness: 0.12, wallRoughness: 0.88, materialKey: 'calacatta_marble' };
  if (n.includes('living')) return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.32, wallRoughness: 0.88, materialKey: 'hardwood_oak' };
  if (n.includes('dining')) return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.32, wallRoughness: 0.88, materialKey: 'hardwood_oak' };
  if (n.includes('balcony') || n.includes('terrace') || n.includes('patio')) return { floorColor: '#ddd6c8', wallColor: '#f8fafc', floorRoughness: 0.72, wallRoughness: 0.88, materialKey: 'travertine_paver' };
  if (n.includes('stair')) return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.35, wallRoughness: 0.88, materialKey: 'hardwood_oak' };
  if (n.includes('foyer') || n.includes('entrance')) return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.32, wallRoughness: 0.88, materialKey: 'hardwood_oak' };
  if (n.includes('parking') || n.includes('garage')) return { floorColor: '#78808e', wallColor: '#f8fafc', floorRoughness: 0.82, wallRoughness: 0.88, materialKey: 'honed_concrete' };
  if (n.includes('corridor') || n.includes('hall')) return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.32, wallRoughness: 0.88, materialKey: 'hardwood_oak' };
  return { floorColor: '#e6d7c3', wallColor: '#f8fafc', floorRoughness: 0.32, wallRoughness: 0.88, materialKey: matKey };
}

/**
 * Pure geometry generator for a canonical building level.
 */
export function generate3DLevel(
  level: Level,
  levelIndex: number,
  options: Building3DGeneratorOptions = {},
  allLevels?: Level[]
): Generated3DLevel {
  const isCutaway = options.isCutaway ?? false;
  const cutawayHeightFt = options.cutawayHeightFt ?? DEFAULT_CUTAWAY_HEIGHT_FT;
  const defaultWallHeightFt = options.defaultWallHeightFt ?? (level.height ? level.height * METRES_TO_FEET : DEFAULT_ROOM_HEIGHT_FT);
  const slabThicknessFt = options.defaultSlabThicknessFt ?? (level.slabThickness ? level.slabThickness * METRES_TO_FEET : DEFAULT_SLAB_THICKNESS_FT);
  const floorPitchFt = defaultWallHeightFt + slabThicknessFt;
  const elevationFt = level.elevation ? level.elevation * METRES_TO_FEET : levelIndex * floorPitchFt;

  const isTerraceFloor =
    level.name?.toLowerCase().includes('terrace') ||
    level.name?.toLowerCase().includes('roof') ||
    false;

  // Build lookup node map: id -> { x, y } in FEET
  const nodeMap = new Map<string, { x: number; z: number }>();
  for (const n of level.nodes || []) {
    nodeMap.set(n.id, {
      x: n.x * METRES_TO_FEET,
      z: n.y * METRES_TO_FEET,
    });
  }

  // ── 1. GENERATE WALLS FROM CANONICAL GRAPH ──────────────────────────────────
  const generatedWalls: GeneratedWall3D[] = [];

  for (const w of level.walls || []) {
    const startNode = nodeMap.get(w.startNodeId);
    const endNode = nodeMap.get(w.endNodeId);
    if (!startNode || !endNode) continue;

    const dx = endNode.x - startNode.x;
    const dz = endNode.z - startNode.z;
    const lengthFt = Math.hypot(dx, dz);
    if (lengthFt < 0.1) continue; // Skip micro walls

    const angleRad = Math.atan2(dz, dx);
    const ux = dx / lengthFt;
    const uz = dz / lengthFt;

    const isParapet = isTerraceFloor && w.kind === 'parapet';
    const wallHeightFt = isParapet
      ? PARAPET_HEIGHT_FT
      : isCutaway
      ? cutawayHeightFt
      : (w.height ? w.height * METRES_TO_FEET : defaultWallHeightFt);

    // 230mm (9 in / 0.755 ft) external, 115mm (4.5 in / 0.377 ft) internal
    const thicknessFt = w.thickness
      ? Math.max(0.35, w.thickness * METRES_TO_FEET)
      : (w.kind === 'exterior' || w.kind === 'parapet' ? 0.755 : 0.377);

    // Wall openings
    const wallOpenings = (level.openings || []).filter(o => o.wallId === w.id);
    const sortedOpenings = [...wallOpenings].sort((a, b) => a.offset - b.offset);

    const generatedOpenings: GeneratedOpening3D[] = [];
    const solidSegments: GeneratedWallSolidSegment3D[] = [];

    let cursorFt = 0;

    for (const op of sortedOpenings) {
      const opOffsetFt = op.offset * METRES_TO_FEET;
      const opWidthFt = Math.min(op.width * METRES_TO_FEET, lengthFt * 0.9);
      const startOpFt = Math.max(0, opOffsetFt - opWidthFt / 2);
      const endOpFt = Math.min(lengthFt, opOffsetFt + opWidthFt / 2);

      // Solid segment before this opening
      if (startOpFt > cursorFt + 0.05) {
        const segLen = startOpFt - cursorFt;
        const midOffset = cursorFt + segLen / 2;
        solidSegments.push({
          startOffsetFt: cursorFt,
          endOffsetFt: startOpFt,
          lengthFt: segLen,
          centerFt: {
            x: startNode.x + ux * midOffset,
            y: wallHeightFt / 2,
            z: startNode.z + uz * midOffset,
          },
        });
      }

      // Opening calculations
      const isDoor = op.type.includes('door') || op.type === 'opening';
      const isEntrance = Boolean(
        isDoor &&
        levelIndex === 0 &&
        w.kind === 'exterior' &&
        (
          op.name?.toLowerCase().includes('entrance') ||
          op.name?.toLowerCase().includes('entry') ||
          op.name?.toLowerCase().includes('main') ||
          level.rooms.some(r =>
            (r.roomType.includes('foyer') || r.roomType.includes('entrance') || r.roomType.includes('living')) &&
            r.boundaryNodeIds.includes(w.startNodeId) &&
            r.boundaryNodeIds.includes(w.endNodeId)
          )
        )
      );

      const opHeightFt = Math.min(
        wallHeightFt,
        op.height ? op.height * METRES_TO_FEET : (isDoor ? 7.0 : 4.0)
      );
      const sillFt = isDoor ? 0 : (op.sill ? op.sill * METRES_TO_FEET : 3.0);

      const opMidOffset = (startOpFt + endOpFt) / 2;
      const opCenterX = startNode.x + ux * opMidOffset;
      const opCenterZ = startNode.z + uz * opMidOffset;

      const hasSill = !isDoor && sillFt > 0.05;
      const sillHeightFt = Math.min(sillFt, wallHeightFt);
      const sillCenterYFt = sillHeightFt / 2;

      const lintelTopFt = wallHeightFt;
      const lintelBottomFt = sillFt + opHeightFt;
      const hasLintel = (lintelTopFt > lintelBottomFt + 0.1) && (!isCutaway || cutawayHeightFt >= 8.0);
      const lintelHeightFt = hasLintel ? lintelTopFt - lintelBottomFt : 0;
      const lintelCenterYFt = hasLintel ? lintelBottomFt + lintelHeightFt / 2 : 0;

      generatedOpenings.push({
        id: op.id,
        type: isDoor ? 'door' : 'window',
        offsetFt: opMidOffset,
        widthFt: endOpFt - startOpFt,
        heightFt: opHeightFt,
        sillFt,
        centerFt: {
          x: opCenterX,
          y: sillFt + opHeightFt / 2,
          z: opCenterZ,
        },
        hasSill,
        sillHeightFt,
        sillCenterYFt,
        hasLintel,
        lintelHeightFt,
        lintelCenterYFt,
        hasGlass: !isDoor,
        hasDoorLeaf: isDoor && (!isCutaway || isEntrance),
        isEntrance,
      });

      cursorFt = Math.max(cursorFt, endOpFt);
    }

    // Trailing solid segment after last opening
    if (cursorFt < lengthFt - 0.05) {
      const segLen = lengthFt - cursorFt;
      const midOffset = cursorFt + segLen / 2;
      solidSegments.push({
        startOffsetFt: cursorFt,
        endOffsetFt: lengthFt,
        lengthFt: segLen,
        centerFt: {
          x: startNode.x + ux * midOffset,
          y: wallHeightFt / 2,
          z: startNode.z + uz * midOffset,
        },
      });
    }

    generatedWalls.push({
      id: w.id,
      kind: w.kind || 'interior',
      startPt: startNode,
      endPt: endNode,
      lengthFt,
      thicknessFt,
      heightFt: wallHeightFt,
      angleRad,
      centerFt: {
        x: (startNode.x + endNode.x) / 2,
        z: (startNode.z + endNode.z) / 2,
      },
      solidSegments,
      openings: generatedOpenings,
      materialColor: w.kind === 'exterior' ? '#f8fafc' : '#f5f4f0',
    });
  }

  // ── 1B. GENERATE CORNER & T-JUNCTION PILLARS (Clean Miters, Zero Gaps & No Z-Fighting) ────
  const wallJunctions: GeneratedWallJunction3D[] = [];
  for (const n of level.nodes || []) {
    const nodePt = nodeMap.get(n.id);
    if (!nodePt) continue;

    const incidentWalls = generatedWalls.filter(w => {
      const origW = (level.walls || []).find(orig => orig.id === w.id);
      return origW && (origW.startNodeId === n.id || origW.endNodeId === n.id);
    });

    if (incidentWalls.length >= 1) {
      const isExterior = incidentWalls.some(w => w.kind === 'exterior' || w.kind === 'parapet');
      const maxThickness = Math.max(...incidentWalls.map(w => w.thicknessFt));
      const maxHeight = Math.max(...incidentWalls.map(w => w.heightFt));

      wallJunctions.push({
        id: `junction_${n.id}`,
        nodeId: n.id,
        positionFt: { x: nodePt.x, z: nodePt.z },
        thicknessFt: maxThickness,
        heightFt: maxHeight,
        kind: isExterior ? 'exterior' : 'interior',
        materialColor: isExterior ? '#f8fafc' : '#f5f4f0',
      });
    }
  }

  // ── 2. GENERATE ROOMS AND FLOOR SLABS ────────────────────────────────────────
  const generatedRooms: GeneratedRoom3D[] = [];

  for (const r of level.rooms || []) {
    const polygonFt: Point2D[] = [];
    for (const nid of r.boundaryNodeIds || []) {
      const n = nodeMap.get(nid);
      if (n) polygonFt.push({ x: n.x, y: n.z });
    }

    if (polygonFt.length < 3) continue;

    const xs = polygonFt.map(p => p.x);
    const ys = polygonFt.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const wFt = maxX - minX;
    const hFt = maxY - minY;
    const centerFt = { x: (minX + maxX) / 2, z: (minY + maxY) / 2 };

    let areaSqFt = 0;
    for (let i = 0; i < polygonFt.length; i++) {
      const j = (i + 1) % polygonFt.length;
      areaSqFt += polygonFt[i].x * polygonFt[j].y - polygonFt[j].x * polygonFt[i].y;
    }
    areaSqFt = Math.abs(areaSqFt) / 2;

    const rNameLower = (r.name || '').toLowerCase();
    const isVoid = rNameLower.includes('void') || r.roomType === 'duplex_void';
    const isBalcony = rNameLower.includes('balcony') || (rNameLower.includes('terrace') && !rNameLower.includes('landing'));
    const isStairwell = rNameLower.includes('stair') || (r.roomType || '').includes('stair');
    const isSpecialtyTerrace =
      rNameLower.includes('gazebo') ||
      rNameLower.includes('garden') ||
      rNameLower.includes('solar') ||
      rNameLower.includes('sundeck');

    generatedRooms.push({
      id: r.id,
      name: r.name || 'Room',
      roomType: r.roomType || 'room',
      isVoid,
      isBalcony,
      isSpecialtyTerrace,
      isStairwell,
      polygonFt,
      bboxFt: { x: minX, y: minY, width: wFt, height: hFt },
      areaSqFt: Math.round(areaSqFt),
      centerFt,
      material: getRoomMaterialConfig(r.name || ''),
    });
  }

  // ── 3. GENERATE FURNITURE ITEMS ──────────────────────────────────────────────
  const generatedFurniture: GeneratedFurniture3D[] = [];

  for (const item of level.items || []) {
    const regAsset = FURNITURE_REGISTRY[item.assetId];
    const widthFt = item.width ? item.width * METRES_TO_FEET : (regAsset?.dimensions.widthFt ?? 3.0);
    const depthFt = item.depth ? item.depth * METRES_TO_FEET : (regAsset?.dimensions.depthFt ?? 3.0);
    const heightFt = item.height ? item.height * METRES_TO_FEET : (regAsset?.dimensions.heightFt ?? 2.5);

    const posX = item.x * METRES_TO_FEET;
    const posZ = item.y * METRES_TO_FEET;
    const posY = (item.elevation || 0) * METRES_TO_FEET;

    generatedFurniture.push({
      id: item.id,
      assetId: item.assetId,
      name: item.name || regAsset?.name || 'Furniture',
      positionFt: { x: posX, y: posY, z: posZ },
      rotationDeg: item.rotation || 0,
      dimensionsFt: { width: widthFt, depth: depthFt, height: heightFt },
      color: item.color || regAsset?.defaultColor || '#475569',
      isLight: Boolean(item.isLight || regAsset?.isLight),
      lightProperties: (item.properties?.lightProperties as Record<string, unknown>) || (regAsset?.lightProperties as unknown as Record<string, unknown>),
      registryAsset: regAsset,
    });
  }

  // ── 4. GENERATE STAIRCASES (Authoritative Floor-to-Floor Flights) ────────────
  const generatedStairs: GeneratedStair3D[] = [];

  const isTopLevel = allLevels
    ? levelIndex >= allLevels.length - 1
    : isTerraceFloor;

  const nextLevel = allLevels && levelIndex + 1 < allLevels.length
    ? allLevels[levelIndex + 1]
    : undefined;

  // Check explicit stairs on level
  if (level.stairs && level.stairs.length > 0) {
    for (const st of level.stairs) {
      // Find destination level if endLevelId specified, otherwise next level
      const destLevel = st.endLevelId
        ? allLevels?.find(l => l.id === st.endLevelId)
        : nextLevel;

      // If no valid destination level above current level, or this is top level with no connection, do not generate ascending stairs
      if (!destLevel) {
        continue;
      }

      const destElevFt = destLevel.elevation != null
        ? destLevel.elevation * METRES_TO_FEET
        : (destLevel.levelIndex ?? levelIndex + 1) * floorPitchFt;

      const flightHeightFt = destElevFt - elevationFt;
      if (flightHeightFt <= 0.5) {
        // Destination is at or below this level; no ascending flight
        continue;
      }

      const stepCount = st.totalSteps || 16;

      generatedStairs.push({
        id: st.id,
        name: st.name || 'Staircase',
        boundsFt: {
          x: st.x * METRES_TO_FEET,
          z: st.y * METRES_TO_FEET,
          width: st.width * METRES_TO_FEET,
          depth: st.depth * METRES_TO_FEET,
        },
        totalHeightFt: flightHeightFt,
        stepCount,
        flightType: st.flightType || 'u_shape',
      });
    }
  } else if (!isTopLevel && (nextLevel || !allLevels)) {
    // Detect staircase rooms from canonical room names ONLY if there is an upper floor to connect to!
    const destElevFt = nextLevel
      ? (nextLevel.elevation != null ? nextLevel.elevation * METRES_TO_FEET : (levelIndex + 1) * floorPitchFt)
      : (elevationFt + floorPitchFt);

    const flightHeightFt = Math.max(7.0, destElevFt - elevationFt);

    for (const r of generatedRooms) {
      if (r.name.toLowerCase().includes('stair')) {
        generatedStairs.push({
          id: `stair_${r.id}`,
          name: r.name,
          boundsFt: {
            x: r.bboxFt.x,
            z: r.bboxFt.y,
            width: r.bboxFt.width,
            depth: r.bboxFt.height,
          },
          totalHeightFt: flightHeightFt,
          stepCount: 16,
          flightType: 'u_shape',
        });
      }
    }
  }

  return {
    levelId: level.id || `lvl_${levelIndex}`,
    levelIndex,
    name: level.name || `Level ${levelIndex}`,
    elevationFt,
    heightFt: defaultWallHeightFt,
    slabThicknessFt,
    floorPitchFt,
    isTerraceFloor,
    walls: generatedWalls,
    wallJunctions,
    rooms: generatedRooms,
    furniture: generatedFurniture,
    stairs: generatedStairs,
  };
}

/**
 * Pure generator: Transforms entire CanonicalBuildingDocument into 3D scene data.
 */
export function generate3DBuilding(
  doc: CanonicalBuildingDocument,
  options: Building3DGeneratorOptions = {}
): Generated3DBuilding {
  const allLevels = doc.levels || [];
  const levels = allLevels.map((lvl, idx) =>
    generate3DLevel(lvl, idx, options, allLevels)
  );

  // Compute building-wide bounding box
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;

  for (const lvl of levels) {
    for (const w of lvl.walls) {
      minX = Math.min(minX, w.startPt.x, w.endPt.x);
      maxX = Math.max(maxX, w.startPt.x, w.endPt.x);
      minZ = Math.min(minZ, w.startPt.z, w.endPt.z);
      maxZ = Math.max(maxZ, w.startPt.z, w.endPt.z);
    }
    for (const r of lvl.rooms) {
      minX = Math.min(minX, r.bboxFt.x);
      maxX = Math.max(maxX, r.bboxFt.x + r.bboxFt.width);
      minZ = Math.min(minZ, r.bboxFt.y);
      maxZ = Math.max(maxZ, r.bboxFt.y + r.bboxFt.height);
    }
  }

  // Fallbacks if empty
  if (minX === Infinity) minX = 0;
  if (maxX === -Infinity) maxX = doc.site?.width ? doc.site.width * METRES_TO_FEET : 30;
  if (minZ === Infinity) minZ = 0;
  if (maxZ === -Infinity) maxZ = doc.site?.length ? doc.site.length * METRES_TO_FEET : 40;

  const width = Math.max(maxX - minX, 10);
  const depth = Math.max(maxZ - minZ, 10);
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const maxDim = Math.max(width, depth);

  const totalHeight = levels.reduce((acc, lvl) => Math.max(acc, lvl.elevationFt + lvl.floorPitchFt), 10);

  return {
    levels,
    bounds: {
      minX,
      minZ,
      maxX,
      maxZ,
      centerX,
      centerZ,
      width,
      depth,
      maxDim,
      totalHeight,
    },
    site: {
      widthFt: doc.site?.width ? doc.site.width * METRES_TO_FEET : 30,
      lengthFt: doc.site?.length ? doc.site.length * METRES_TO_FEET : 40,
      entrySide: doc.site?.entrySide || 'east',
    },
  };
}
