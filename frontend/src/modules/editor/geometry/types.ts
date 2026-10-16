/**
 * types.ts
 * ============================================================================
 * Canonical Building Document Specification (Schema Version 1)
 *
 * Core architectural invariant:
 * One canonical, versioned building document in SI units (metres).
 * 2D drafting, 3D viewport, presentation render, analysis, and exports
 * are all derived projections of this authoritative model.
 * ============================================================================
 */

export const SCHEMA_VERSION = 1 as const;

// Conversion Constants
export const METRES_TO_FEET = 3.28084;
export const FEET_TO_METRES = 0.3048;

export function mToFt(metres: number): number {
  return Math.round(metres * METRES_TO_FEET * 100) / 100;
}

export function ftToM(feet: number): number {
  return Math.round(feet * FEET_TO_METRES * 1000) / 1000;
}

export interface Point2D {
  x: number; // metres
  y: number; // metres (maps to North/South in 3D ground plane)
}

export interface SitePlot {
  plotPolygon: Point2D[]; // closed polygon in metres
  width: number;          // metres
  length: number;         // metres
  entrySide: 'north' | 'south' | 'east' | 'west';
  northAngle: number;     // degrees offset from +Y (0 = top/north)
  setbacks: {
    front: number; // metres
    rear: number;  // metres
    left: number;  // metres
    right: number; // metres
  };
}

export interface WallNode {
  id: string;
  x: number; // metres
  y: number; // metres
}

export type WallKind = 'exterior' | 'interior' | 'parapet' | 'partition';

export interface Wall {
  id: string;
  startNodeId: string;
  endNodeId: string;
  thickness: number; // metres (e.g. 0.23m = 9in exterior, 0.115m = 4.5in interior)
  height: number;    // metres (e.g. 3.05m = 10ft)
  kind: WallKind;
  materialId?: string;
}

export type OpeningType = 'single_door' | 'double_door' | 'sliding_door' | 'window' | 'opening';
export type DoorSwing = 'inward_left' | 'inward_right' | 'outward_left' | 'outward_right';

export interface Opening {
  id: string;
  wallId: string;
  offset: number;     // metres along wall from startNode to opening center
  width: number;      // metres (e.g. 0.91m = 3ft door)
  height: number;     // metres (e.g. 2.13m = 7ft)
  sill: number;       // metres above floor slab (0 for doors, ~0.9m for windows)
  type: OpeningType;
  swing?: DoorSwing;
  name?: string;
}

export interface CanonicalRoom {
  id: string;
  name: string;
  roomType: string;
  /**
   * Ordered sequence of WallNode IDs forming the closed loop boundary of the room.
   * e.g. ["n1", "n2", "n3", "n4"]
   */
  boundaryNodeIds: string[];
  materialId?: string;
}

export interface PlacedItem {
  id: string;
  assetId: string;           // references FurnitureCatalogItem.id
  name: string;
  x: number;                 // site coordinates in metres
  y: number;                 // site coordinates in metres
  elevation: number;         // metres above level slab
  rotation: number;          // degrees [0, 360)
  width: number;             // metres
  depth: number;             // metres
  height: number;            // metres
  color?: string;
  isLight?: boolean;
  locked?: boolean;
  properties?: Record<string, unknown>;
}

export interface Staircase {
  id: string;
  name: string;
  startLevelId: string;
  endLevelId: string;
  x: number;        // metres
  y: number;        // metres
  width: number;    // metres
  depth: number;    // metres
  totalSteps: number;
  flightType: 'straight' | 'u_shape' | 'l_shape';
}

export interface Level {
  id: string;
  levelIndex: number;
  name: string;
  elevation: number;     // metres above ground level
  height: number;        // ceiling height in metres (standard 3.05m = 10ft)
  slabThickness: number; // structural concrete floor slab thickness (0.25m = ~10in)
  nodes: WallNode[];
  walls: Wall[];
  openings: Opening[];
  rooms: CanonicalRoom[];
  items: PlacedItem[];
  stairs?: Staircase[];
}

export interface CanonicalBuildingDocument {
  schemaVersion: 1;
  id: string;
  metadata: {
    name: string;
    createdAt: string;
    updatedAt: string;
    generatorSeed?: string;
    entryDirection: 'north' | 'south' | 'east' | 'west';
    displayUnits: 'ft' | 'm';
  };
  site: SitePlot;
  levels: Level[];
  // Preserved legacy snapshot for lossless round-tripping
  legacySnapshot?: Record<string, unknown>;
}

// ── Validation Types ─────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  entityId?: string;
  levelId?: string;
}

export interface ValidationResult {
  valid: boolean; // false if ANY issue has severity === 'error'
  issues: ValidationIssue[];
}

// ── Command Pattern Types ───────────────────────────────────────────────────

export interface CommandResult {
  success: boolean;
  message: string;
  issues: ValidationIssue[];
  candidateDocument?: CanonicalBuildingDocument;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  category?: 'geometry' | 'furniture' | 'opening';
  validate?: (doc: CanonicalBuildingDocument) => ValidationResult;
  execute: (doc: CanonicalBuildingDocument) => CanonicalBuildingDocument;
  inverse: (doc: CanonicalBuildingDocument) => CanonicalBuildingDocument;
}
