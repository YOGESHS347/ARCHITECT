/**
 * architecturalLighting.ts
 * ============================================================================
 * Phase 5 Signature Architectural Visualization: Lighting & Camera Pipeline.
 *
 * Provides calibrated, reusable architectural lighting profiles (Daylight,
 * Warm Sunset, Night Glow) and deterministic, plot-aware camera framing
 * presets (Dollhouse, Isometric, Top-Down Plan Cut, Front/Side Elevations).
 *
 * Invariants:
 * 1. Single Authoritative Source: Geometry and coordinates strictly derive
 *    from CanonicalBuildingDocument and Generated3DBuilding.
 * 2. Visual Readability: Ambient fill and bounce illumination keep interior
 *    rooms and furniture legible without pitch-black shadows or blown-out whites.
 * 3. Soft Shadow Precision: Shadow camera frustum bounds tightly encompass
 *    the active site with PCF soft filtering and normal bias to eliminate shadow acne.
 * 4. Non-Mutating: Lighting and camera operations never mutate building geometry
 *    or saved document state.
 * ============================================================================
 */

export type TimeOfDay = 'morning' | 'noon' | 'golden_hour' | 'night' | 'day' | 'sunset';
export type CameraPreset = 'perspective' | 'isometric' | 'topdown' | 'front' | 'side' | 'exterior';
export type ViewMode = 'all' | 'single' | 'exploded' | 'active';

export interface DirectionalLightConfig {
  color: string;
  intensity: number;
  position: [number, number, number];
  castShadow: boolean;
  shadowMapSize: number;
  shadowBias: number;
  shadowNormalBias: number;
  shadowCameraNear: number;
  shadowCameraFar: number;
  shadowFrustumSize: number;
}

export interface HemisphereLightConfig {
  skyColor: string;
  groundColor: string;
  intensity: number;
}

export interface AmbientLightConfig {
  color: string;
  intensity: number;
}

export interface InteriorGlowConfig {
  color: string;
  intensity: number;
  distance: number;
}

export interface LightingRigConfig {
  timeOfDay: TimeOfDay;
  toneMappingExposure: number;
  backgroundColor: string;
  fogColor: string;
  fogDensity: number;
  sky: {
    sunPosition: [number, number, number];
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
  };
  directionalLight: DirectionalLightConfig;
  hemisphereLight: HemisphereLightConfig;
  ambientLight: AmbientLightConfig;
  interiorGlow: InteriorGlowConfig;
}

export interface CameraFramingInput {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    depth: number;
    centerX: number;
    centerZ: number;
    maxDim: number;
    totalHeight: number;
  };
  plotBounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    length: number;
    centerX: number;
    centerZ: number;
  };
  isLandscapingEnabled?: boolean;
  viewMode: ViewMode;
  activeFloorIndex: number;
  activeFloorElevation?: number;
  numFloors: number;
  preset: CameraPreset;
  fov?: number;
}

export interface CameraFramingResult {
  targetLookAt: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  minDistance: number;
  maxDistance: number;
  near: number;
  far: number;
  effectiveDim: number;
  fitDistance: number;
}

// ── Sun Azimuth Resolver ─────────────────────────────────────────────────────

export function resolveSunAzimuthAngle(entryDir: string): number {
  const dir = (entryDir || 'east').toLowerCase().trim();
  if (dir.includes('north')) return Math.PI * 0.75;
  if (dir.includes('south')) return Math.PI * 1.35;
  if (dir.includes('west')) return Math.PI * 1.70;
  // Default East orientation
  return Math.PI * 0.35;
}

// ── Architectural Lighting Rig Configuration Generator ───────────────────────

export function getArchitecturalLightingConfig(
  timeOfDay: TimeOfDay,
  entryDir: string,
  centerX: number,
  centerZ: number,
  effectiveDim: number
): LightingRigConfig {
  const sunAngle = resolveSunAzimuthAngle(entryDir);
  const sunDist = Math.max(effectiveDim * 1.4, 85);
  const frustumSize = Math.max(effectiveDim * 1.3, 50);

  const sunX = centerX + Math.cos(sunAngle) * sunDist;
  const sunZ = centerZ + Math.sin(sunAngle) * sunDist;

  if (timeOfDay === 'night') {
    return {
      timeOfDay: 'night',
      toneMappingExposure: 0.98,
      backgroundColor: '#090d16',
      fogColor: '#0a101d',
      fogDensity: 0.0028,
      sky: {
        sunPosition: [sunX, -20, sunZ], // Below horizon
        turbidity: 15,
        rayleigh: 0.1,
        mieCoefficient: 0.001,
        mieDirectionalG: 0.8,
      },
      directionalLight: {
        color: '#93c5fd', // Cool silver moonlight
        intensity: 0.52,
        position: [centerX + 35, 70, centerZ + 35],
        castShadow: true,
        shadowMapSize: 2048,
        shadowBias: -0.0003,
        shadowNormalBias: 0.025,
        shadowCameraNear: 1.0,
        shadowCameraFar: Math.max(effectiveDim * 5, 450),
        shadowFrustumSize: frustumSize,
      },
      hemisphereLight: {
        skyColor: '#1e293b',
        groundColor: '#0f172a',
        intensity: 0.42,
      },
      ambientLight: {
        color: '#334155',
        intensity: 0.28,
      },
      interiorGlow: {
        color: '#fef08a', // Warm 2700K interior architectural lamp glow
        intensity: 0.90,
        distance: Math.max(effectiveDim * 0.75, 40),
      },
    };
  }

  if (timeOfDay === 'morning') {
    return {
      timeOfDay: 'morning',
      toneMappingExposure: 1.05,
      backgroundColor: '#0c1017',
      fogColor: '#0d131f',
      fogDensity: 0.0018,
      sky: {
        sunPosition: [sunX, 32, sunZ], // Early morning sun angle
        turbidity: 3.2,
        rayleigh: 0.52,
        mieCoefficient: 0.008,
        mieDirectionalG: 0.82,
      },
      directionalLight: {
        color: '#fff6e5', // Crisp morning gold
        intensity: 2.05,
        position: [sunX, 32, sunZ],
        castShadow: true,
        shadowMapSize: 2048,
        shadowBias: -0.0003,
        shadowNormalBias: 0.025,
        shadowCameraNear: 1.0,
        shadowCameraFar: Math.max(effectiveDim * 5, 450),
        shadowFrustumSize: frustumSize,
      },
      hemisphereLight: {
        skyColor: '#bae6fd',
        groundColor: '#364d25',
        intensity: 0.72,
      },
      ambientLight: {
        color: '#475569',
        intensity: 0.25,
      },
      interiorGlow: {
        color: '#fef3c7',
        intensity: 0.45,
        distance: Math.max(effectiveDim * 0.6, 35),
      },
    };
  }

  if (timeOfDay === 'sunset' || timeOfDay === 'golden_hour') {
    return {
      timeOfDay: timeOfDay === 'golden_hour' ? 'golden_hour' : 'sunset',
      toneMappingExposure: 1.02,
      backgroundColor: '#1f161a',
      fogColor: '#2b1719',
      fogDensity: 0.0022,
      sky: {
        sunPosition: [sunX, 14, sunZ], // Low golden-hour sun
        turbidity: 7.5,
        rayleigh: 2.6,
        mieCoefficient: 0.025,
        mieDirectionalG: 0.85,
      },
      directionalLight: {
        color: '#ff9c54', // Architectural honey amber
        intensity: 2.15,
        position: [sunX, 18, sunZ],
        castShadow: true,
        shadowMapSize: 2048,
        shadowBias: -0.0003,
        shadowNormalBias: 0.025,
        shadowCameraNear: 1.0,
        shadowCameraFar: Math.max(effectiveDim * 5, 450),
        shadowFrustumSize: frustumSize,
      },
      hemisphereLight: {
        skyColor: '#fb923c', // Warm sky bounce
        groundColor: '#3c2415', // Rich earthy ground reflection
        intensity: 0.68,
      },
      ambientLight: {
        color: '#78350f',
        intensity: 0.28,
      },
      interiorGlow: {
        color: '#fed7aa',
        intensity: 0.55,
        distance: Math.max(effectiveDim * 0.6, 35),
      },
    };
  }

  // Daylight / Noon (Clean crisp sunlight with balanced bounce)
  return {
    timeOfDay: timeOfDay === 'noon' ? 'noon' : 'day',
    toneMappingExposure: 1.08,
    backgroundColor: '#090a0f',
    fogColor: '#090a0f',
    fogDensity: 0.0016,
    sky: {
      sunPosition: [sunX, 65, sunZ],
      turbidity: 2.4,
      rayleigh: 0.32,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
    },
    directionalLight: {
      color: '#fffbf0', // High-noon crisp sunlight
      intensity: 1.95,
      position: [sunX, 65, sunZ],
      castShadow: true,
      shadowMapSize: 2048,
      shadowBias: -0.0004,
      shadowNormalBias: 0.025,
      shadowCameraNear: 1.0,
      shadowCameraFar: Math.max(effectiveDim * 5, 450),
      shadowFrustumSize: frustumSize,
    },
    hemisphereLight: {
      skyColor: '#e0f2fe', // Soft atmospheric sky blue
      groundColor: '#4d6836', // Grass green bounce onto floor ceilings
      intensity: 0.78,
    },
    ambientLight: {
      color: '#64748b',
      intensity: 0.24,
    },
    interiorGlow: {
      color: '#fef3c7',
      intensity: 0.35,
      distance: Math.max(effectiveDim * 0.5, 30),
    },
  };
}

// ── Camera Framing Calculation ───────────────────────────────────────────────

export function calculateCameraFraming(input: CameraFramingInput): CameraFramingResult {
  const {
    bounds,
    plotBounds,
    isLandscapingEnabled = false,
    viewMode,
    activeFloorIndex,
    numFloors,
    preset,
    fov = 45,
  } = input;

  // Resolve 2D bounding span across X and Z
  let minX = bounds.minX;
  let maxX = bounds.maxX;
  let minZ = bounds.minZ;
  let maxZ = bounds.maxZ;

  if (isLandscapingEnabled && plotBounds) {
    minX = Math.min(minX, plotBounds.minX);
    maxX = Math.max(maxX, plotBounds.maxX);
    minZ = Math.min(minZ, plotBounds.minZ);
    maxZ = Math.max(maxZ, plotBounds.maxZ);
  }

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;
  const effectiveDim = Math.max(spanX, spanZ, 20);

  // Determine vertical framing center (targetY) and height
  let targetY = 5.0; // Half standard 10ft room
  let effectiveHeight = 10.0;

  if (viewMode === 'single') {
    // Single isolated floor sits at grade Y = 0
    targetY = 5.0;
    effectiveHeight = 10.0;
  } else if (viewMode === 'active') {
    // Focus on active floor at its elevation
    const floorElevation = input.activeFloorElevation ?? (activeFloorIndex * 10.83);
    targetY = floorElevation + 5.0;
    effectiveHeight = 10.0;
  } else if (viewMode === 'exploded') {
    // Multi-floor exploded stack
    const explodedPitch = 10.83 + 14.0; // 24.83 ft per floor
    const totalExplodedHeight = Math.max(numFloors * explodedPitch, 20);
    targetY = totalExplodedHeight / 2;
    effectiveHeight = totalExplodedHeight;
  } else {
    // Stacked full building
    targetY = Math.max(bounds.totalHeight / 2, 5.0);
    effectiveHeight = Math.max(bounds.totalHeight, 10.0);
  }

  // Trigonometric frustum fit distance
  const fovRad = (fov * Math.PI) / 180;
  const halfFovTan = Math.tan(fovRad / 2);
  const baseFitDistance = (effectiveDim / 2) / halfFovTan * 1.25; // 25% safety margin
  const heightFitDistance = (effectiveHeight / 2) / halfFovTan * 1.35;
  const fitDistance = Math.max(baseFitDistance, heightFitDistance, 28);

  // Preset positions
  let camX = centerX;
  let camY = targetY;
  let camZ = centerZ;

  if (preset === 'topdown') {
    // Top-down Orthographic-style Plan View
    camX = centerX + 0.001; // Slight epsilon prevents lookAt singularity along Y axis
    camY = targetY + fitDistance * 1.15;
    camZ = centerZ;
  } else if (preset === 'isometric') {
    // True Axonometric 45° elevation angle
    const isoSpan = fitDistance * 0.82;
    camX = centerX + isoSpan;
    camY = targetY + fitDistance * 0.72;
    camZ = centerZ + isoSpan;
  } else if (preset === 'front') {
    // South / Front Elevation View
    camX = centerX;
    camY = targetY + 1.5;
    camZ = centerZ - fitDistance * 1.15;
  } else if (preset === 'side') {
    // East / Side Elevation View
    camX = centerX - fitDistance * 1.15;
    camY = targetY + 1.5;
    camZ = centerZ;
  } else if (preset === 'exterior') {
    // Cinematic Low-Angle Exterior Beauty View (Architectural Photograph Framing)
    const extDist = fitDistance * 0.95;
    camX = centerX + extDist * 0.72;
    camY = Math.max(3.5, bounds.totalHeight * 0.28);
    camZ = centerZ + extDist * 0.82;
  } else {
    // Perspective / Dollhouse 3D view
    camX = centerX + fitDistance * 0.65;
    camY = targetY + fitDistance * 0.52;
    camZ = centerZ + fitDistance * 0.85;
  }

  const minDistance = 4.0;
  const maxDistance = Math.max(fitDistance * 4.5, 600);
  const near = 0.5;
  const far = Math.max(fitDistance * 10, 3000);

  return {
    targetLookAt: { x: centerX, y: targetY, z: centerZ },
    targetPosition: { x: camX, y: camY, z: camZ },
    minDistance,
    maxDistance,
    near,
    far,
    effectiveDim,
    fitDistance,
  };
}
