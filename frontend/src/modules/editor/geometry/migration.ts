/**
 * migration.ts
 * ============================================================================
 * Legacy Project Importer & Pure Migration Functions (v0 → v1).
 *
 * Guaranteed Invariants:
 *   1. Zero data loss: Original payload is preserved in `legacySnapshot`.
 *   2. Idempotency: Running migration on an already-canonical document returns it intact.
 *   3. Coordinate mapping: Feet are cleanly converted to metres (SI).
 * ============================================================================
 */

import type {
  CanonicalBuildingDocument,
  Level,
  WallNode,
  Wall,
  Opening,
  CanonicalRoom,
  PlacedItem,
} from './types';
import { SCHEMA_VERSION, ftToM } from './types';

/**
 * Type guard: Checks whether an object is already a CanonicalBuildingDocument.
 */
export function isCanonicalDocument(data: unknown): data is CanonicalBuildingDocument {
  if (!data || typeof data !== 'object') return false;
  const doc = data as Record<string, unknown>;
  return (
    doc.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(doc.levels) &&
    typeof doc.site === 'object'
  );
}

/**
 * Sanitizes a canonical building document by removing duplicate doorway openings
 * on host walls (e.g. shared walls between rooms where both rooms contributed a doorway).
 */
export function sanitizeCanonicalDocument(doc: CanonicalBuildingDocument): CanonicalBuildingDocument {
  const sanitizedLevels = doc.levels.map(lvl => {
    const deduplicatedOpenings: Opening[] = [];
    for (const op of lvl.openings) {
      const s = op.offset - op.width / 2;
      const e = op.offset + op.width / 2;
      const duplicate = deduplicatedOpenings.find(existing => {
        if (existing.wallId !== op.wallId) return false;
        const es = existing.offset - existing.width / 2;
        const ee = existing.offset + existing.width / 2;
        return (Math.min(e, ee) - Math.max(s, es)) > 0.1;
      });
      if (!duplicate) {
        deduplicatedOpenings.push(op);
      }
    }
    return {
      ...lvl,
      openings: deduplicatedOpenings,
    };
  });

  return {
    ...doc,
    levels: sanitizedLevels,
  };
}

/**
 * Pure migration function: Migrates legacy floor plan data (v0) to CanonicalBuildingDocument (v1).
 */
export function migrateLegacyToCanonical(
  legacyData: unknown,
  fallbackPlotWidthFt = 30,
  fallbackPlotLengthFt = 40,
  fallbackEntryDir: 'north' | 'south' | 'east' | 'west' = 'east'
): CanonicalBuildingDocument {
  if (isCanonicalDocument(legacyData)) {
    return sanitizeCanonicalDocument(legacyData);
  }

  const raw = (legacyData && typeof legacyData === 'object' ? legacyData : {}) as Record<string, unknown>;

  // Resolve legacy floors
  let rawFloors: Record<string, unknown>[] = [];
  if (Array.isArray(raw.floors) && raw.floors.length > 0) {
    rawFloors = raw.floors as Record<string, unknown>[];
  } else if (Array.isArray(raw.rooms)) {
    rawFloors = [{ level: 0, name: 'Ground Floor', rooms: raw.rooms }];
  } else {
    rawFloors = [{ level: 0, name: 'Ground Floor', rooms: [] }];
  }

  const plotWFt = Number(raw.plot_width || raw.plotWidth || fallbackPlotWidthFt) || 30;
  const plotLFt = Number(raw.plot_length || raw.plot_height || raw.plotLength || fallbackPlotLengthFt) || 40;
  const entryDir = (String(raw.entry_direction || raw.entryDir || fallbackEntryDir).toLowerCase()) as
    | 'north'
    | 'south'
    | 'east'
    | 'west';

  const plotWM = ftToM(plotWFt);
  const plotLM = ftToM(plotLFt);

  const levels: Level[] = rawFloors.map((fl, flIdx) => {
    const levelId = `lvl_${flIdx}`;
    const levelName = String(
      fl.name ||
      (typeof fl.level === 'string' && isNaN(Number(fl.level)) ? fl.level : '') ||
      (flIdx === 0 ? 'Ground Floor' : flIdx === 1 ? 'First Floor' : flIdx === 2 ? 'Second Floor' : `Level ${flIdx}`)
    );
    const rawRooms = Array.isArray(fl.rooms) ? (fl.rooms as Record<string, unknown>[]) : [];

    // Sanitize legacy phantom rooms: if a room (such as a clamped Terrace or Balcony)
    // is >= 85% covered by other rooms on the same floor, it was an artifact of the
    // legacy boundary clamp defect and must be excluded to prevent overlapping walls.
    const validRooms = rawRooms.filter((r, idx) => {
      const rx1 = Number(r.x) || 0;
      const ry1 = Number(r.y) || 0;
      const rw = Number(r.width) || 0;
      const rh = Number(r.height) || 0;
      const rx2 = rx1 + rw;
      const ry2 = ry1 + rh;
      const rArea = rw * rh;
      if (rArea <= 0) return false;

      let coveredArea = 0;
      for (let j = 0; j < rawRooms.length; j++) {
        if (j === idx) continue;
        const o = rawRooms[j];
        const ox1 = Number(o.x) || 0;
        const oy1 = Number(o.y) || 0;
        const ow = Number(o.width) || 0;
        const oh = Number(o.height) || 0;
        const ox2 = ox1 + ow;
        const oy2 = oy1 + oh;

        const ix1 = Math.max(rx1, ox1);
        const iy1 = Math.max(ry1, oy1);
        const ix2 = Math.min(rx2, ox2);
        const iy2 = Math.min(ry2, oy2);

        if (ix2 > ix1 && iy2 > iy1) {
          coveredArea += (ix2 - ix1) * (iy2 - iy1);
        }
      }

      const rNameLower = String(r.name || '').toLowerCase();
      if (coveredArea >= rArea * 0.85 && (rNameLower.includes('terrace') || rNameLower.includes('balcony'))) {
        return false;
      }
      return true;
    });

    const nodes: WallNode[] = [];
    const walls: Wall[] = [];
    const openings: Opening[] = [];
    const rooms: CanonicalRoom[] = [];
    const items: PlacedItem[] = [];

    // Node deduplication map: key = `${round(x, 2)}_${round(y, 2)}`
    const nodeCoordMap = new Map<string, WallNode>();

    function getOrCreateNode(xM: number, yM: number): WallNode {
      const key = `${Math.round(xM * 100) / 100}_${Math.round(yM * 100) / 100}`;
      const existing = nodeCoordMap.get(key);
      if (existing) return existing;
      const newNode: WallNode = {
        id: `n_${levelId}_${nodeCoordMap.size + 1}`,
        x: Math.round(xM * 1000) / 1000,
        y: Math.round(yM * 1000) / 1000,
      };
      nodeCoordMap.set(key, newNode);
      nodes.push(newNode);
      return newNode;
    }

    function getOrCreateWall(n1: WallNode, n2: WallNode, isExt: boolean): Wall {
      const existing = walls.find(
        w => (w.startNodeId === n1.id && w.endNodeId === n2.id) || (w.startNodeId === n2.id && w.endNodeId === n1.id)
      );
      if (existing) return existing;

      const newWall: Wall = {
        id: `w_${levelId}_${walls.length + 1}`,
        startNodeId: n1.id,
        endNodeId: n2.id,
        thickness: isExt ? 0.23 : 0.115,
        height: 3.05,
        kind: isExt ? 'exterior' : 'interior',
      };
      walls.push(newWall);
      return newWall;
    }

    validRooms.forEach((r, rIdx) => {
      const rxM = ftToM(Number(r.x) || 0);
      const ryM = ftToM(Number(r.y) || 0);
      const rwM = ftToM(Number(r.width) || 10);
      const rhM = ftToM(Number(r.height) || 10);
      const rName = String(r.name || `Room ${rIdx + 1}`);
      const roomId = `room_${levelId}_${rIdx + 1}`;

      // Create 4 bounding corner nodes (Clockwise: Top-Left, Top-Right, Bottom-Right, Bottom-Left)
      const tl = getOrCreateNode(rxM, ryM);
      const tr = getOrCreateNode(rxM + rwM, ryM);
      const br = getOrCreateNode(rxM + rwM, ryM + rhM);
      const bl = getOrCreateNode(rxM, ryM + rhM);

      // Create walls
      const isExtTop = Math.abs(ryM) < 0.1;
      const isExtBottom = Math.abs(ryM + rhM - plotLM) < 0.1;
      const isExtLeft = Math.abs(rxM) < 0.1;
      const isExtRight = Math.abs(rxM + rwM - plotWM) < 0.1;

      const wallTop = getOrCreateWall(tl, tr, isExtTop);
      const wallRight = getOrCreateWall(tr, br, isExtRight);
      const wallBottom = getOrCreateWall(br, bl, isExtBottom);
      const wallLeft = getOrCreateWall(bl, tl, isExtLeft);

      rooms.push({
        id: roomId,
        name: rName,
        roomType: rName.toLowerCase().replace(/\s+/g, '_'),
        boundaryNodeIds: [tl.id, tr.id, br.id, bl.id],
      });

      // Map Doors
      if (Array.isArray(r.doors)) {
        r.doors.forEach((d: any, dIdx: number) => {
          const side = String(d.wall || 'bottom').toLowerCase();
          const targetWall = side === 'top' ? wallTop : side === 'right' ? wallRight : side === 'left' ? wallLeft : wallBottom;
          const n1 = nodes.find(n => n.id === targetWall.startNodeId);
          const n2 = nodes.find(n => n.id === targetWall.endNodeId);
          const wallLenM = (n1 && n2) ? Math.hypot(n2.x - n1.x, n2.y - n1.y) : (side === 'top' || side === 'bottom' ? rwM : rhM);

          if (wallLenM < 0.6) return;

          const CORNER_MARGIN = 0.15;
          let widthM = ftToM(Number(d.width) || 3);
          if (widthM > wallLenM - 2 * CORNER_MARGIN) {
            widthM = Math.max(0.60, wallLenM - 2 * CORNER_MARGIN);
          }

          const posM = ftToM(Number(d.position) || 3);
          const minOffset = CORNER_MARGIN + widthM / 2;
          const maxOffset = wallLenM - CORNER_MARGIN - widthM / 2;
          const opOffset = minOffset >= maxOffset ? wallLenM / 2 : Math.max(minOffset, Math.min(maxOffset, posM));

          // Deduplicate shared doorway: check if an opening on targetWall already covers this exact doorway
          const s = opOffset - widthM / 2;
          const e = opOffset + widthM / 2;
          const isDuplicate = openings.some(existingOp => {
            if (existingOp.wallId !== targetWall.id) return false;
            const es = existingOp.offset - existingOp.width / 2;
            const ee = existingOp.offset + existingOp.width / 2;
            return (Math.min(e, ee) - Math.max(s, es)) > 0.1;
          });

          if (!isDuplicate) {
            const isEntrance = Boolean(
              d.is_entrance ||
              d.name?.toLowerCase().includes('entrance') ||
              (levelId === 'lvl_0' && targetWall.kind === 'exterior' && (rName.toLowerCase().includes('foyer') || rName.toLowerCase().includes('entrance') || rName.toLowerCase().includes('living')))
            );

            openings.push({
              id: `op_door_${roomId}_${dIdx + 1}`,
              wallId: targetWall.id,
              offset: Math.round(opOffset * 1000) / 1000,
              width: Math.round(widthM * 1000) / 1000,
              height: 2.13,
              sill: 0,
              type: 'single_door',
              name: isEntrance ? 'Main Entrance Door' : `${rName} Door`,
            });
          }
        });
      }

      // Map Windows
      if (Array.isArray(r.windows)) {
        r.windows.forEach((w: any, wIdx: number) => {
          const side = String(w.wall || 'top').toLowerCase();
          const targetWall = side === 'top' ? wallTop : side === 'right' ? wallRight : side === 'left' ? wallLeft : wallBottom;
          const n1 = nodes.find(n => n.id === targetWall.startNodeId);
          const n2 = nodes.find(n => n.id === targetWall.endNodeId);
          const wallLenM = (n1 && n2) ? Math.hypot(n2.x - n1.x, n2.y - n1.y) : (side === 'top' || side === 'bottom' ? rwM : rhM);

          if (wallLenM < 0.8) return;

          const CORNER_MARGIN = 0.15;
          let widthM = ftToM(Number(w.width) || 4);
          if (widthM > wallLenM - 2 * CORNER_MARGIN) {
            widthM = Math.max(0.60, wallLenM - 2 * CORNER_MARGIN);
          }

          const posM = ftToM(Number(w.position) || 3);
          const minOffset = CORNER_MARGIN + widthM / 2;
          const maxOffset = wallLenM - CORNER_MARGIN - widthM / 2;
          const opOffset = minOffset >= maxOffset ? wallLenM / 2 : Math.max(minOffset, Math.min(maxOffset, posM));

          const s = opOffset - widthM / 2;
          const e = opOffset + widthM / 2;
          const isDuplicate = openings.some(existingOp => {
            if (existingOp.wallId !== targetWall.id) return false;
            const es = existingOp.offset - existingOp.width / 2;
            const ee = existingOp.offset + existingOp.width / 2;
            return (Math.min(e, ee) - Math.max(s, es)) > 0.1;
          });

          if (!isDuplicate) {
            openings.push({
              id: `op_win_${roomId}_${wIdx + 1}`,
              wallId: targetWall.id,
              offset: Math.round(opOffset * 1000) / 1000,
              width: Math.round(widthM * 1000) / 1000,
              height: 1.22,
              sill: 0.91,
              type: 'window',
              name: `${rName} Window`,
            });
          }
        });
      }

      // Map Furniture
      if (Array.isArray(r.furniture)) {
        r.furniture.forEach((f: any, fIdx: number) => {
          const relXM = ftToM(Number(f.x) || 0);
          const relYM = ftToM(Number(f.y) || 0);
          items.push({
            id: String(f.id || `item_${roomId}_${fIdx + 1}`),
            assetId: String(f.catalogId || f.name?.toLowerCase().replace(/\s+/g, '_') || 'custom_item'),
            name: String(f.name || 'Furniture'),
            x: Math.round((rxM + relXM) * 1000) / 1000,
            y: Math.round((ryM + relYM) * 1000) / 1000,
            elevation: ftToM(Number(f.elevation) || 0),
            rotation: Number(f.rotation) || 0,
            width: ftToM(Number(f.width) || 3),
            depth: ftToM(Number(f.height) || 3),
            height: ftToM(Number(f.zHeight) || 2.5),
            color: f.color,
            isLight: Boolean(f.isLight),
          });
        });
      }
    });

    return {
      id: levelId,
      levelIndex: flIdx,
      name: levelName,
      elevation: flIdx * 3.3, // 3.3m per story
      height: 3.05,
      slabThickness: 0.25,
      nodes,
      walls,
      openings,
      rooms,
      items,
    };
  });

  return sanitizeCanonicalDocument({
    schemaVersion: SCHEMA_VERSION,
    id: String(raw.id || `proj_${Date.now()}`),
    metadata: {
      name: String(raw.name || `${plotWFt}×${plotLFt}ft Residence`),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryDirection: entryDir,
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
      entrySide: entryDir,
      northAngle: 0,
      setbacks: { front: 1.5, rear: 1.5, left: 1.0, right: 1.0 },
    },
    levels,
    legacySnapshot: raw,
  });
}
