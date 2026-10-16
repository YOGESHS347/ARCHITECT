/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Edges, Text, Sky, Html, ContactShadows } from '@react-three/drei';
import { EffectComposer, Vignette, Bloom, SMAA } from '@react-three/postprocessing';
import type { Room, Floor } from '../../../shared/api-client/api';
import * as THREE from 'three';
import {
  Layers,
  Eye,
  Sun,
  Moon,
  Sunset,
  Camera,
  Box as BoxIcon,
  Maximize2,
  Building2,
  Info,
  Compass,
  ArrowUp,
  ArrowRight,
  Trees,
  Palmtree,
  Waves,
  Download,
  Scissors,
  UserCheck,
  Tag,
  ChevronLeft,
  ChevronRight,
  Home,
  Shield,
  Play,
  Square,
  RotateCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  type CanonicalBuildingDocument,
  isCanonicalDocument,
  migrateLegacyToCanonical,
  architecturalMaterials,
  generateSiteLandscaping,
  type GeneratedSiteLandscaping3D,
  calculateCameraFraming,
  getArchitecturalLightingConfig,
  type CameraFramingResult,
  type LightingRigConfig,
  type TimeOfDay,
  render3DSceneToDataUrl,
  export3DSceneImage,
  type ExportResolutionPreset,
} from '../geometry';
import {
  generate3DBuilding,
  type Generated3DBuilding,
  type GeneratedWall3D,
  type GeneratedWallJunction3D,
  type GeneratedRoom3D,
  type GeneratedStair3D,
  DEFAULT_ROOM_HEIGHT_FT,
  DEFAULT_SLAB_THICKNESS_FT,
} from '../geometry/building3DGenerator';
import { FurnitureItem3D } from './furniture3DMeshBuilder';

export interface ThreeSceneBundle {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  exportImage: (resolution?: ExportResolutionPreset) => Promise<string>;
}

export interface FloorPlan3DProps {
  rooms?: Room[];
  floors?: Floor[];
  canonicalDoc?: CanonicalBuildingDocument;
  activeFloorIndex?: number;
  entryDir?: string;
  plotWidth?: number;
  plotHeight?: number;
  onSelectFloor?: (index: number) => void;
  selectedFurnitureId?: string | null;
  onSelectFurniture?: (id: string | null) => void;
  onRegisterThreeBundle?: (bundle: ThreeSceneBundle | null) => void;
}

// ── Three.js Scene Export Bridge ──────────────────────────────────────────────
function ThreeBundleRegistrar({
  onRegisterThreeBundle,
}: {
  onRegisterThreeBundle?: (bundle: ThreeSceneBundle | null) => void;
}) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!onRegisterThreeBundle) return;
    const bundle: ThreeSceneBundle = {
      gl,
      scene,
      camera,
      exportImage: (resolution: ExportResolutionPreset = '1080p') =>
        render3DSceneToDataUrl(gl, scene, camera, resolution),
    };
    onRegisterThreeBundle(bundle);
    return () => {
      onRegisterThreeBundle(null);
    };
  }, [gl, scene, camera, onRegisterThreeBundle]);

  return null;
}

const ROOM_HEIGHT = DEFAULT_ROOM_HEIGHT_FT;        // 10.0 ft
const SLAB_THICKNESS = DEFAULT_SLAB_THICKNESS_FT;  // 0.8 ft
const FLOOR_PITCH = ROOM_HEIGHT + SLAB_THICKNESS; // 10.8 ft

// ── Scene renderer that configures ACES Filmic tonemapping, local clipping & cinematic fog ─────
function SceneSetup({ lightingConfig }: { lightingConfig: LightingRigConfig }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lightingConfig.toneMappingExposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.background = new THREE.Color(lightingConfig.backgroundColor);
    scene.fog = new THREE.FogExp2(lightingConfig.fogColor, lightingConfig.fogDensity);
  }, [gl, scene, lightingConfig]);
  return null;
}

// ── Sculptural Architectural Staircase (Floating Oak Treads, Steel Spine & Brass Handrail) ──────────────
function Stairs3D({
  stair,
  clippingPlane = null,
}: {
  stair: GeneratedStair3D;
  clippingPlane?: THREE.Plane | null;
}) {
  const [hovered, setHovered] = useState(false);
  const { boundsFt, totalHeightFt } = stair;

  // Code-standard parametric riser and tread math (Target ~7.0 inch riser, ~10.5 inch tread)
  const targetRiserFt = 0.583; // 7.0 inches
  const calculatedTotalSteps = Math.max(12, Math.round(totalHeightFt / targetRiserFt));
  const numStepsHalf = Math.max(4, Math.floor(calculatedTotalSteps / 2));
  const totalSteps = numStepsHalf * 2;
  const stepH = totalHeightFt / totalSteps;
  const stepD = (boundsFt.depth * 0.70) / numStepsHalf;
  const stepW = (boundsFt.width - 0.7) / 2;

  const startZ = boundsFt.z + 0.15;
  const landingZ = startZ + boundsFt.depth * 0.68;
  const landingD = boundsFt.depth * 0.32;
  const leftX = boundsFt.x + 0.35 + stepW / 2;
  const rightX = boundsFt.x + boundsFt.width - 0.35 - stepW / 2;
  const clipProps = clippingPlane ? { clippingPlanes: [clippingPlane], clipShadows: true } : {};

  // Flight 1: Open Floating Oak Treads + Black Steel Spine (Left, UP from front to back)
  const flight1 = Array.from({ length: numStepsHalf }).map((_, i) => {
    const y = i * stepH;
    const z = startZ + i * stepD;
    const isStepHovered = hovered;
    return (
      <group key={`f1_${i}`}>
        {/* Floating Solid Oak Wood Tread with Soft Chamfer */}
        <Box
          castShadow
          receiveShadow
          args={[stepW, 0.22, stepD * 1.12]}
          position={[leftX, y + stepH - 0.11, z + stepD / 2]}
        >
          <meshStandardMaterial
            color={isStepHovered ? '#d4a373' : '#c29b68'}
            emissive={isStepHovered ? '#ca8a04' : '#000000'}
            emissiveIntensity={isStepHovered ? 0.25 : 0}
            roughness={0.4}
            metalness={0.05}
            {...clipProps}
          />
          <Edges color={isStepHovered ? '#eab308' : '#854d0e'} />
        </Box>

        {/* Outer Vertical Baluster Rod */}
        <Cylinder
          args={[0.025, 0.025, 2.9, 8]}
          position={[leftX - stepW / 2 + 0.08, y + stepH + 1.35, z + stepD / 2]}
        >
          <meshStandardMaterial color="#18181b" metalness={0.85} roughness={0.25} {...clipProps} />
        </Cylinder>

        {/* Center Traversal Path Indicator Dot (When Hovered) */}
        {hovered && (
          <Box
            args={[stepW * 0.35, 0.02, 0.12]}
            position={[leftX, y + stepH + 0.01, z + stepD / 2]}
          >
            <meshBasicMaterial color="#38bdf8" />
          </Box>
        )}
      </group>
    );
  });

  // Central Slanted Structural Steel Spine for Flight 1
  const spine1Len = Math.hypot(landingZ - startZ, numStepsHalf * stepH);
  const spine1Angle = Math.atan2(numStepsHalf * stepH, landingZ - startZ);
  const spine1 = (
    <Box
      castShadow
      args={[0.28, 0.38, spine1Len]}
      position={[leftX, (numStepsHalf * stepH) / 2 - 0.32, startZ + (landingZ - startZ) / 2]}
      rotation={[spine1Angle, 0, 0]}
    >
      <meshStandardMaterial color="#18181b" metalness={0.88} roughness={0.28} {...clipProps} />
    </Box>
  );

  // Outer Glass Balustrade Panel for Flight 1
  const balustrade1 = (
    <group
      position={[leftX - stepW / 2 + 0.02, (numStepsHalf * stepH) / 2 + 1.4, startZ + (landingZ - startZ) / 2]}
      rotation={[spine1Angle, 0, 0]}
    >
      <Box args={[0.03, 2.7, spine1Len]}>
        <meshPhysicalMaterial
          color="#bae6fd"
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.08}
          ior={1.5}
          {...clipProps}
        />
      </Box>
    </group>
  );

  // Mid Landing (Oak Surface with structural steel frame)
  const landingY = numStepsHalf * stepH;
  const landing = (
    <group>
      <Box
        castShadow
        receiveShadow
        args={[boundsFt.width - 0.5, 0.28, landingD]}
        position={[boundsFt.x + boundsFt.width / 2, landingY - 0.14, landingZ + landingD / 2]}
      >
        <meshStandardMaterial
          color={hovered ? '#d4a373' : '#c29b68'}
          emissive={hovered ? '#ca8a04' : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
          roughness={0.4}
          metalness={0.05}
          {...clipProps}
        />
        <Edges color={hovered ? '#eab308' : '#854d0e'} />
      </Box>
      {/* Structural Support Beam under Landing */}
      <Box
        args={[boundsFt.width - 0.6, 0.35, 0.35]}
        position={[boundsFt.x + boundsFt.width / 2, landingY - 0.45, landingZ + landingD / 2]}
      >
        <meshStandardMaterial color="#18181b" metalness={0.88} roughness={0.28} {...clipProps} />
      </Box>
      {/* Landing Back Wall Glass Balustrade */}
      <Box
        args={[boundsFt.width - 0.6, 2.8, 0.04]}
        position={[boundsFt.x + boundsFt.width / 2, landingY + 1.4, landingZ + landingD - 0.05]}
      >
        <meshPhysicalMaterial
          color="#bae6fd"
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.08}
          ior={1.5}
          {...clipProps}
        />
      </Box>
    </group>
  );

  // Flight 2: Open Floating Oak Treads (Right, UP from back to front)
  const flight2 = Array.from({ length: numStepsHalf }).map((_, i) => {
    const y = landingY + i * stepH;
    const z = landingZ - (i + 1) * stepD;
    const isStepHovered = hovered;
    return (
      <group key={`f2_${i}`}>
        {/* Floating Solid Oak Wood Tread */}
        <Box
          castShadow
          receiveShadow
          args={[stepW, 0.22, stepD * 1.12]}
          position={[rightX, y + stepH - 0.11, z + stepD / 2]}
        >
          <meshStandardMaterial
            color={isStepHovered ? '#d4a373' : '#c29b68'}
            emissive={isStepHovered ? '#ca8a04' : '#000000'}
            emissiveIntensity={isStepHovered ? 0.25 : 0}
            roughness={0.4}
            metalness={0.05}
            {...clipProps}
          />
          <Edges color={isStepHovered ? '#eab308' : '#854d0e'} />
        </Box>

        {/* Outer Vertical Baluster Rod */}
        <Cylinder
          args={[0.025, 0.025, 2.9, 8]}
          position={[rightX + stepW / 2 - 0.08, y + stepH + 1.35, z + stepD / 2]}
        >
          <meshStandardMaterial color="#18181b" metalness={0.85} roughness={0.25} {...clipProps} />
        </Cylinder>

        {/* Center Traversal Path Indicator Dot (When Hovered) */}
        {hovered && (
          <Box
            args={[stepW * 0.35, 0.02, 0.12]}
            position={[rightX, y + stepH + 0.01, z + stepD / 2]}
          >
            <meshBasicMaterial color="#38bdf8" />
          </Box>
        )}
      </group>
    );
  });

  // Central Slanted Structural Steel Spine for Flight 2
  const spine2 = (
    <Box
      castShadow
      args={[0.28, 0.38, spine1Len]}
      position={[rightX, landingY + (numStepsHalf * stepH) / 2 - 0.32, landingZ - (landingZ - startZ) / 2]}
      rotation={[-spine1Angle, 0, 0]}
    >
      <meshStandardMaterial color="#18181b" metalness={0.88} roughness={0.28} {...clipProps} />
    </Box>
  );

  // Outer Glass Balustrade Panel for Flight 2
  const balustrade2 = (
    <group
      position={[rightX + stepW / 2 - 0.02, landingY + (numStepsHalf * stepH) / 2 + 1.4, landingZ - (landingZ - startZ) / 2]}
      rotation={[-spine1Angle, 0, 0]}
    >
      <Box args={[0.03, 2.7, spine1Len]}>
        <meshPhysicalMaterial
          color="#bae6fd"
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.08}
          ior={1.5}
          {...clipProps}
        />
      </Box>
    </group>
  );

  // Continuous Architectural Handrails (Brushed Brass / Bronze)
  const r1X = leftX - stepW / 2 + 0.08;
  const handrail1 = (
    <Box
      castShadow
      args={[0.08, 0.12, spine1Len]}
      position={[r1X, landingY / 2 + 2.8, startZ + (landingZ - startZ) / 2]}
      rotation={[spine1Angle, 0, 0]}
    >
      <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} {...clipProps} />
    </Box>
  );

  const r2X = rightX + stepW / 2 - 0.08;
  const handrail2 = (
    <Box
      castShadow
      args={[0.08, 0.12, spine1Len]}
      position={[r2X, landingY + (totalHeightFt - landingY) / 2 + 2.8, landingZ - (landingZ - startZ) / 2]}
      rotation={[-spine1Angle, 0, 0]}
    >
      <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} {...clipProps} />
    </Box>
  );

  // Top Arrival Threshold (Landing connector to upper floor slab)
  const topArrivalY = totalHeightFt;
  const topThreshold = (
    <Box
      castShadow
      receiveShadow
      args={[stepW + 0.2, 0.24, stepD * 1.5]}
      position={[rightX, topArrivalY - 0.12, startZ + stepD * 0.75]}
    >
      <meshStandardMaterial color="#c29b68" roughness={0.4} metalness={0.05} {...clipProps} />
      <Edges color="#854d0e" />
    </Box>
  );

  // Traversal Path Highlight Ribbon (glowing polyline ribbon when hovered)
  const pathRibbon = hovered && (
    <group>
      {/* Flight 1 Slanted Ribbon */}
      <Box
        args={[0.4, 0.03, spine1Len]}
        position={[leftX, (numStepsHalf * stepH) / 2 + 0.15, startZ + (landingZ - startZ) / 2]}
        rotation={[spine1Angle, 0, 0]}
      >
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
      </Box>
      {/* Landing Horizontal Ribbon Connector */}
      <Box
        args={[Math.abs(rightX - leftX), 0.03, 0.4]}
        position={[(leftX + rightX) / 2, landingY + 0.08, landingZ + landingD * 0.4]}
      >
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
      </Box>
      {/* Flight 2 Slanted Ribbon */}
      <Box
        args={[0.4, 0.03, spine1Len]}
        position={[rightX, landingY + (numStepsHalf * stepH) / 2 + 0.15, landingZ - (landingZ - startZ) / 2]}
        rotation={[-spine1Angle, 0, 0]}
      >
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
      </Box>
    </group>
  );

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {flight1}
      {spine1}
      {balustrade1}
      {landing}
      {flight2}
      {spine2}
      {balustrade2}
      {handrail1}
      {handrail2}
      {topThreshold}
      {pathRibbon}

      {/* Floating Architectural Telemetry Tag on Hover */}
      {hovered && (
        <Html position={[boundsFt.x + boundsFt.width / 2, landingY + 3.8, landingZ]} center distanceFactor={28}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#f8fafc',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>STAIRCASE</span>
            <span>•</span>
            <span>{totalSteps} RISERS</span>
            <span>•</span>
            <span>{(stepH * 12).toFixed(1)}″ RISE</span>
            <span>•</span>
            <span>{(stepD * 12).toFixed(1)}″ TREAD</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Balustrade Edge (Glass panels + Stainless steel posts + Top Handrail) ──────
function BalustradeEdge({
  x1, z1, x2, z2, height = 3.0,
}: {
  x1: number; z1: number; x2: number; z2: number; height?: number;
}) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  if (length < 0.2) return null;

  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const angle = Math.atan2(dz, dx);
  const numPosts = Math.max(2, Math.ceil(length / 4) + 1);

  return (
    <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
      {/* Tempered Glass Panel */}
      <Box args={[length - 0.1, height - 0.3, 0.04]} position={[0, height / 2, 0]}>
        <meshPhysicalMaterial
          color="#bae6fd"
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.06}
          ior={1.5}
          thickness={0.05}
        />
      </Box>

      {/* Top Handrail */}
      <Cylinder
        args={[0.04, 0.04, length, 12]}
        position={[0, height, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
      </Cylinder>

      {/* Base Channel Shoe */}
      <Box args={[length, 0.1, 0.08]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </Box>

      {/* Posts */}
      {Array.from({ length: numPosts }).map((_, i) => {
        const posX = -length / 2 + (i / (numPosts - 1)) * length;
        return (
          <Cylinder
            key={i}
            args={[0.03, 0.03, height, 10]}
            position={[posX, height / 2, 0]}
          >
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
          </Cylinder>
        );
      })}
    </group>
  );
}

// ── Duplex Void Component (NO solid floor slab, perimeter glass balustrades) ───
function DuplexVoid3D({ room }: { room: { x: number; y: number; width: number; height: number; name: string } }) {
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;
  const BALUSTRADE_H = 3.0;

  return (
    <group>
      <BalustradeEdge x1={room.x} z1={room.y} x2={room.x + room.width} z2={room.y} height={BALUSTRADE_H} />
      <BalustradeEdge x1={room.x} z1={room.y + room.height} x2={room.x + room.width} z2={room.y + room.height} height={BALUSTRADE_H} />
      <BalustradeEdge x1={room.x} z1={room.y} x2={room.x} z2={room.y + room.height} height={BALUSTRADE_H} />
      <BalustradeEdge x1={room.x + room.width} z1={room.y} x2={room.x + room.width} z2={room.y + room.height} height={BALUSTRADE_H} />

      <Text
        font="/assets/fonts/Roboto.woff"
        position={[cx, 0.5, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.0}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        OPEN TO BELOW (DUPLEX VOID)
      </Text>
    </group>
  );
}

// ── Gazebo / Timber Pergola Component ─────────────────────────────────────────
function Gazebo3D({ room }: { room: GeneratedRoom3D }) {
  const cx = room.centerFt.x;
  const cz = room.centerFt.z;
  const gw = Math.max(room.bboxFt.width - 1.5, 6);
  const gd = Math.max(room.bboxFt.height - 1.5, 6);
  const postH = 8.0;
  const woodColor = '#7c4a27';
  const beamColor = '#5e371a';

  return (
    <group position={[cx, 0, cz]}>
      <Box args={[gw + 0.8, 0.25, gd + 0.8]} position={[0, 0.12, 0]}>
        <meshStandardMaterial color="#965d33" roughness={0.7} />
      </Box>

      {([[-gw / 2, -gd / 2], [gw / 2, -gd / 2], [-gw / 2, gd / 2], [gw / 2, gd / 2]] as [number, number][]).map(([px, pz], i) => (
        <Box key={i} args={[0.4, postH, 0.4]} position={[px, postH / 2, pz]}>
          <meshStandardMaterial color={woodColor} roughness={0.6} />
        </Box>
      ))}

      <Box args={[gw + 1.2, 0.35, 0.3]} position={[0, postH, -gd / 2]}>
        <meshStandardMaterial color={beamColor} roughness={0.5} />
      </Box>
      <Box args={[gw + 1.2, 0.35, 0.3]} position={[0, postH, gd / 2]}>
        <meshStandardMaterial color={beamColor} roughness={0.5} />
      </Box>
      <Box args={[0.3, 0.35, gd + 1.2]} position={[-gw / 2, postH, 0]}>
        <meshStandardMaterial color={beamColor} roughness={0.5} />
      </Box>
      <Box args={[0.3, 0.35, gd + 1.2]} position={[gw / 2, postH, 0]}>
        <meshStandardMaterial color={beamColor} roughness={0.5} />
      </Box>

      {[-0.35, -0.15, 0.05, 0.25, 0.45].map((ratio, i) => (
        <Box key={i} args={[gw + 1.6, 0.2, 0.15]} position={[0, postH + 0.2, ratio * gd]}>
          <meshStandardMaterial color={woodColor} roughness={0.5} />
        </Box>
      ))}
    </group>
  );
}

// ── Rooftop Garden Component ──────────────────────────────────────────────────
function RooftopGarden3D({ room }: { room: GeneratedRoom3D }) {
  const cx = room.centerFt.x;
  const cz = room.centerFt.z;

  return (
    <group position={[0, 0, 0]}>
      <Box args={[room.bboxFt.width, 0.15, room.bboxFt.height]} position={[cx, 0.08, cz]} receiveShadow>
        <meshStandardMaterial color="#2d6a2e" roughness={0.95} />
      </Box>

      <Box args={[room.bboxFt.width * 0.75, 0.8, 1.0]} position={[cx, 0.4, room.bboxFt.y + 0.8]}>
        <meshStandardMaterial color="#453229" roughness={0.7} />
      </Box>
      {[-0.25, 0, 0.25].map((off, i) => (
        <Sphere key={`g1_${i}`} args={[0.55, 10, 10]} position={[cx + off * room.bboxFt.width, 1.1, room.bboxFt.y + 0.8]}>
          <meshStandardMaterial color="#1e5e22" roughness={0.9} />
        </Sphere>
      ))}
    </group>
  );
}

// ── Solar PV Utility Zone ─────────────────────────────────────────────────────
function SolarUtility3D({ room }: { room: GeneratedRoom3D }) {
  const cx = room.centerFt.x;
  const cz = room.centerFt.z;

  return (
    <group position={[cx, 0, cz]}>
      <Box args={[room.bboxFt.width - 0.5, 0.15, room.bboxFt.height - 0.5]} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </Box>

      {[-1.8, 1.8].map((offX, idx) => (
        <group key={idx} position={[offX, 1.2, 0]} rotation={[0.42, 0, 0]}>
          <Box args={[2.8, 0.08, 4.5]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[2.7, 0.04, 4.4]} position={[0, 0.05, 0]}>
            <meshStandardMaterial color="#172554" metalness={0.9} roughness={0.15} />
          </Box>
        </group>
      ))}
    </group>
  );
}

// ── Sundeck Teak Timber Decking ───────────────────────────────────────────────
function Sundeck3D({ room }: { room: GeneratedRoom3D }) {
  const cx = room.centerFt.x;
  const cz = room.centerFt.z;

  return (
    <group position={[cx, 0, cz]}>
      <Box args={[room.bboxFt.width, 0.15, room.bboxFt.height]} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#854d0e" roughness={0.7} />
      </Box>
    </group>
  );
}

// ── 3D Furniture Items are rendered via high-fidelity procedural FurnitureItem3D (furniture3DMeshBuilder.tsx) ──

// ── Wall Junction & Corner Miter Column (Guarantees Watertight Corners & Zero Z-Fighting) ──
function WallJunction3D({
  junction,
  isCutaway = false,
  isXRay = false,
  xrayOpacity = 0.25,
  sectionPlane = null,
}: {
  junction: GeneratedWallJunction3D;
  isCutaway?: boolean;
  isXRay?: boolean;
  xrayOpacity?: number;
  sectionPlane?: THREE.Plane | null;
}) {
  const plasterBump = architecturalMaterials.getProceduralTexture('architectural_plaster', 'bump');
  const clipProps = sectionPlane ? { clippingPlanes: [sectionPlane], clipShadows: true } : {};

  return (
    <group position={[junction.positionFt.x, 0, junction.positionFt.z]}>
      {/* Corner Column Body */}
      <Box
        castShadow={!isXRay}
        receiveShadow
        args={[junction.thicknessFt, junction.heightFt, junction.thicknessFt]}
        position={[0, junction.heightFt / 2, 0]}
      >
        {isXRay ? (
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={xrayOpacity}
            roughness={0.1}
            metalness={0.1}
            depthWrite={false}
            {...clipProps}
          />
        ) : (
          <meshStandardMaterial
            bumpMap={plasterBump || undefined}
            bumpScale={0.012}
            color={junction.materialColor}
            roughness={0.88}
            metalness={0.01}
            {...clipProps}
          />
        )}
        <Edges color={isXRay ? '#0284c7' : '#cbd5e1'} />
      </Box>

      {/* Clean Wall Junction Top Cap */}
      {(isCutaway || junction.heightFt < 7) && !isXRay && (
        <Box
          args={[junction.thicknessFt + 0.02, 0.06, junction.thicknessFt + 0.02]}
          position={[0, junction.heightFt + 0.03, 0]}
        >
          <meshStandardMaterial
            color={sectionPlane ? '#18181b' : '#ffffff'}
            roughness={0.25}
            metalness={0.02}
            {...clipProps}
          />
        </Box>
      )}
    </group>
  );
}

// ── Canonical Wall Segment Renderer with Door/Window Cutouts ──────────────────
function CanonicalWall3D({
  wall,
  isCutaway = false,
  isXRay = false,
  xrayOpacity = 0.25,
  sectionPlane = null,
}: {
  wall: GeneratedWall3D;
  isCutaway?: boolean;
  isXRay?: boolean;
  xrayOpacity?: number;
  sectionPlane?: THREE.Plane | null;
}) {
  const isParapet = wall.kind === 'parapet';
  const plasterBump = architecturalMaterials.getProceduralTexture('architectural_plaster', 'bump');
  const clipProps = sectionPlane ? { clippingPlanes: [sectionPlane], clipShadows: true } : {};

  return (
    <group position={[wall.centerFt.x, 0, wall.centerFt.z]} rotation={[0, -wall.angleRad, 0]}>
      {/* Solid wall segments */}
      {wall.solidSegments.map((seg, i) => {
        const localCenterX = -wall.lengthFt / 2 + seg.startOffsetFt + seg.lengthFt / 2;
        return (
          <group key={i}>
            <Box
              castShadow={!isXRay}
              receiveShadow
              args={[seg.lengthFt, wall.heightFt, wall.thicknessFt]}
              position={[localCenterX, wall.heightFt / 2, 0]}
            >
              {isXRay ? (
                <meshStandardMaterial
                  color="#38bdf8"
                  transparent
                  opacity={xrayOpacity}
                  roughness={0.1}
                  metalness={0.1}
                  depthWrite={false}
                  {...clipProps}
                />
              ) : (
                <meshStandardMaterial
                  bumpMap={plasterBump || undefined}
                  bumpScale={0.012}
                  color={wall.materialColor}
                  roughness={0.88}
                  metalness={0.01}
                  {...clipProps}
                />
              )}
              <Edges color={isXRay ? '#0284c7' : '#cbd5e1'} />
            </Box>

            {/* Crisp Wall Top Cap (Reference 1 & 2 presentation style for plan cuts) */}
            {(isCutaway || wall.heightFt < 7) && !isXRay && (
              <Box
                args={[seg.lengthFt + 0.02, 0.06, wall.thicknessFt + 0.02]}
                position={[localCenterX, wall.heightFt + 0.03, 0]}
              >
                <meshStandardMaterial
                  color={sectionPlane ? '#18181b' : '#ffffff'}
                  roughness={0.25}
                  metalness={0.02}
                  {...clipProps}
                />
              </Box>
            )}
          </group>
        );
      })}

      {/* Coping cap for parapet walls */}
      {isParapet && (
        <Box
          args={[wall.lengthFt + 0.1, 0.15, wall.thicknessFt + 0.15]}
          position={[0, wall.heightFt + 0.08, 0]}
        >
          <meshStandardMaterial color="#ffffff" roughness={0.35} {...clipProps} />
        </Box>
      )}

      {/* Real Volumetric Openings (Doors & Windows) */}
      {!isParapet && wall.openings.map((op, i) => {
        const localCenterX = -wall.lengthFt / 2 + op.offsetFt;

        if (op.type === 'door') {
          return (
            <group key={`door_${i}`}>
              {/* Lintel box above door */}
              {op.hasLintel && (
                <Box
                  args={[op.widthFt, op.lintelHeightFt, wall.thicknessFt]}
                  position={[localCenterX, op.lintelCenterYFt, 0]}
                >
                  <meshStandardMaterial
                    bumpMap={plasterBump || undefined}
                    bumpScale={0.012}
                    color={wall.materialColor}
                    roughness={0.88}
                    {...clipProps}
                  />
                </Box>
              )}

              {/* Swung door leaf / Entrance Door */}
              {op.hasDoorLeaf && (() => {
                if (op.isEntrance) {
                  // Dedicated Architectural Entrance Door
                  const frameThickness = 0.15;
                  const frameDepth = wall.thicknessFt * 1.1;
                  const doorH = Math.min(op.heightFt, (wall.heightFt || 7.2));
                  const doorW = op.widthFt - frameThickness * 2;
                  const doorT = 0.20; // Solid timber slab
                  const hingeX = localCenterX - op.widthFt / 2 + frameThickness;
                  const swingAngle = Math.PI / 10; // ~18 deg welcoming ajar

                  return (
                    <group key={`entrance_door_${op.id}`}>
                      {/* Anthracite Outer Frame: Left & Right Jambs */}
                      <Box
                        args={[frameThickness, doorH, frameDepth]}
                        position={[localCenterX - op.widthFt / 2 + frameThickness / 2, doorH / 2, 0]}
                      >
                        <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.25} {...clipProps} />
                      </Box>
                      <Box
                        args={[frameThickness, doorH, frameDepth]}
                        position={[localCenterX + op.widthFt / 2 - frameThickness / 2, doorH / 2, 0]}
                      >
                        <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.25} {...clipProps} />
                      </Box>

                      {/* Header Casing when wall height allows */}
                      {wall.heightFt > 6.0 && (
                        <Box
                          args={[op.widthFt, frameThickness, frameDepth]}
                          position={[localCenterX, doorH + frameThickness / 2, 0]}
                        >
                          <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.25} {...clipProps} />
                        </Box>
                      )}

                      {/* Threshold Plate */}
                      <Box
                        args={[op.widthFt + 0.2, 0.08, frameDepth + 0.15]}
                        position={[localCenterX, 0.04, 0]}
                      >
                        <meshStandardMaterial color="#334155" roughness={0.7} {...clipProps} />
                      </Box>

                      {/* Hardwood Door Leaf (pivoted welcoming ajar) */}
                      <group
                        position={[hingeX, 0, 0]}
                        rotation={[0, swingAngle, 0]}
                      >
                        {/* Solid Hardwood Slab */}
                        <Box
                          args={[doorW, doorH, doorT]}
                          position={[doorW / 2, doorH / 2, 0]}
                        >
                          <meshStandardMaterial color="#78350f" roughness={0.38} metalness={0.05} {...clipProps} />
                        </Box>

                        {/* Architectural Accent Grooves */}
                        {[0.25, 0.5, 0.75].map(ratio => (
                          <Box
                            key={`groove_${ratio}`}
                            args={[doorW * 0.85, 0.04, doorT + 0.02]}
                            position={[doorW / 2, doorH * ratio, 0]}
                          >
                            <meshStandardMaterial color="#451a03" roughness={0.6} {...clipProps} />
                          </Box>
                        ))}

                        {/* Contemporary Vertical Brushed Brass Pull Handle Bar */}
                        <group position={[doorW - 0.35, doorH * 0.45, doorT / 2 + 0.08]}>
                          <Cylinder
                            args={[0.035, 0.035, Math.min(3.2, doorH * 0.6), 16]}
                            position={[0, 0, 0]}
                          >
                            <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.16} {...clipProps} />
                          </Cylinder>
                          <Cylinder
                            args={[0.02, 0.02, 0.08, 12]}
                            position={[0, Math.min(1.4, doorH * 0.25), -0.04]}
                            rotation={[Math.PI / 2, 0, 0]}
                          >
                            <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.16} {...clipProps} />
                          </Cylinder>
                          <Cylinder
                            args={[0.02, 0.02, 0.08, 12]}
                            position={[0, -Math.min(1.4, doorH * 0.25), -0.04]}
                            rotation={[Math.PI / 2, 0, 0]}
                          >
                            <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.16} {...clipProps} />
                          </Cylinder>
                        </group>
                      </group>
                    </group>
                  );
                }

                // Standard interior swung door leaf
                const dw = op.widthFt * 0.9;
                const doorT = wall.thicknessFt * 0.25;
                const hingeX = localCenterX - op.widthFt / 2;
                return (
                  <group position={[hingeX + doorT / 2, op.heightFt / 2, dw / 2]} rotation={[0, Math.PI / 4, 0]}>
                    <Box args={[doorT, op.heightFt, dw]}>
                      <meshStandardMaterial color="#cca677" roughness={0.45} {...clipProps} />
                    </Box>
                    <Sphere args={[0.08, 12, 12]} position={[doorT / 2 + 0.05, 0, dw / 2 - 0.2]}>
                      <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} {...clipProps} />
                    </Sphere>
                  </group>
                );
              })()}
            </group>
          );
        } else {
          // Window with physical architectural glass panel
          return (
            <group key={`win_${i}`}>
              {/* Window sill box */}
              {op.hasSill && (
                <Box
                  args={[op.widthFt, op.sillHeightFt, wall.thicknessFt]}
                  position={[localCenterX, op.sillCenterYFt, 0]}
                >
                  <meshStandardMaterial
                    bumpMap={plasterBump || undefined}
                    bumpScale={0.012}
                    color={wall.materialColor}
                    roughness={0.88}
                    {...clipProps}
                  />
                </Box>
              )}

              {/* Lintel box above window */}
              {op.hasLintel && (
                <Box
                  args={[op.widthFt, op.lintelHeightFt, wall.thicknessFt]}
                  position={[localCenterX, op.lintelCenterYFt, 0]}
                >
                  <meshStandardMaterial
                    bumpMap={plasterBump || undefined}
                    bumpScale={0.012}
                    color={wall.materialColor}
                    roughness={0.88}
                    {...clipProps}
                  />
                </Box>
              )}

              {/* Physical glass panel & window sill */}
              {op.hasGlass && (
                <group position={[localCenterX, op.sillFt + op.heightFt / 2, 0]}>
                  <Box args={[op.widthFt, 0.08, wall.thicknessFt + 0.08]} position={[0, -op.heightFt / 2, 0]}>
                    <meshStandardMaterial color="#334155" roughness={0.4} {...clipProps} />
                  </Box>
                  <Box args={[op.widthFt - 0.05, op.heightFt - 0.05, wall.thicknessFt * 0.15]}>
                    <meshPhysicalMaterial
                      color="#e0f2fe"
                      transmission={0.94}
                      opacity={1}
                      transparent
                      roughness={0.04}
                      ior={1.52}
                      thickness={0.08}
                      {...clipProps}
                    />
                  </Box>
                </group>
              )}
            </group>
          );
        }
      })}
    </group>
  );
}

// ── Animated Floor Group with smooth physics dampening ─────────────────────────
function AnimatedFloorGroup({
  children,
  targetY,
  levelIndex,
  levelName,
  isExploded,
  isActive = false,
  minX,
  minZ,
  maxZ,
}: {
  children: React.ReactNode;
  targetY: number;
  levelIndex: number;
  levelName: string;
  isExploded: boolean;
  isActive?: boolean;
  minX: number;
  minZ: number;
  maxZ: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        targetY,
        7,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, targetY, 0]}>
      {children}
      {isExploded && (
        <group position={[minX - 2.5, 4.0, (minZ + maxZ) / 2]}>
          <Text
            font="/assets/fonts/Roboto.woff"
            rotation={[0, Math.PI / 4, 0]}
            fontSize={1.3}
            color="#38bdf8"
            anchorX="right"
            anchorY="middle"
          >
            {`L${levelIndex}: ${levelName}`}
          </Text>
        </group>
      )}
      {isActive && !isExploded && (
        <group position={[minX - 2.0, 3.0, (minZ + maxZ) / 2]}>
          <Text
            font="/assets/fonts/Roboto.woff"
            rotation={[0, Math.PI / 4, 0]}
            fontSize={1.0}
            color="#0ea5e9"
            anchorX="right"
            anchorY="middle"
          >
            {`▶ ACTIVE: L${levelIndex} ${levelName || ''}`}
          </Text>
        </group>
      )}
    </group>
  );
}

// ── Camera Controller for Presets & Focus with Smooth Interpolation ──────────
function CameraManager({
  framing,
  resetTrigger,
  isTurntableActive = false,
}: {
  framing: CameraFramingResult;
  resetTrigger: number;
  isTurntableActive?: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isTransitioningRef = useRef<boolean>(true);
  const introFlownRef = useRef<boolean>(false);
  const targetPosRef = useRef<THREE.Vector3>(
    new THREE.Vector3(framing.targetPosition.x, framing.targetPosition.y, framing.targetPosition.z)
  );
  const targetLookAtRef = useRef<THREE.Vector3>(
    new THREE.Vector3(framing.targetLookAt.x, framing.targetLookAt.y, framing.targetLookAt.z)
  );

  // Cinematic Intro Fly-in on initial load: smoothly swoops down from sky
  useEffect(() => {
    if (!introFlownRef.current && camera) {
      camera.position.set(
        framing.targetPosition.x + 30,
        framing.targetPosition.y + 38,
        framing.targetPosition.z + 42
      );
      introFlownRef.current = true;
      isTransitioningRef.current = true;
    }
  }, [camera, framing]);

  // Trigger smooth transition whenever framing target or resetTrigger changes
  useEffect(() => {
    targetPosRef.current.set(framing.targetPosition.x, framing.targetPosition.y, framing.targetPosition.z);
    targetLookAtRef.current.set(framing.targetLookAt.x, framing.targetLookAt.y, framing.targetLookAt.z);
    isTransitioningRef.current = true;
  }, [
    framing.targetPosition.x,
    framing.targetPosition.y,
    framing.targetPosition.z,
    framing.targetLookAt.x,
    framing.targetLookAt.y,
    framing.targetLookAt.z,
    resetTrigger,
  ]);

  // Cancel programmatic camera transition immediately if the user starts dragging or zooming
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      isTransitioningRef.current = false;
    };
    controls.addEventListener('start', onStart);
    return () => {
      controls.removeEventListener('start', onStart);
    };
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isTransitioningRef.current) {
      const dampFactor = 5.5;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPosRef.current.x, dampFactor, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPosRef.current.y, dampFactor, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPosRef.current.z, dampFactor, delta);

      controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookAtRef.current.x, dampFactor, delta);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookAtRef.current.y, dampFactor, delta);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLookAtRef.current.z, dampFactor, delta);

      controls.update();

      const distPos = camera.position.distanceTo(targetPosRef.current);
      const distTarget = controls.target.distanceTo(targetLookAtRef.current);
      if (distPos < 0.12 && distTarget < 0.08) {
        camera.position.copy(targetPosRef.current);
        controls.target.copy(targetLookAtRef.current);
        controls.update();
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[framing.targetLookAt.x, framing.targetLookAt.y, framing.targetLookAt.z]}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={framing.minDistance}
      maxDistance={framing.maxDistance}
      enableDamping
      dampingFactor={0.08}
      autoRotate={isTurntableActive}
      autoRotateSpeed={2.4}
    />
  );
}

// ── Integrated Architectural Sky & Sun Multi-Light Rig ────────────────────────
function SkyAndSun({
  config,
  centerX,
  centerZ,
}: {
  config: LightingRigConfig;
  centerX: number;
  centerZ: number;
}) {
  const { directionalLight, hemisphereLight, ambientLight, interiorGlow, sky, timeOfDay } = config;
  const frustum = directionalLight.shadowFrustumSize;

  return (
    <>
      {/* Sky component (visible in day and sunset modes) */}
      {timeOfDay !== 'night' && (
        <Sky
          sunPosition={sky.sunPosition}
          turbidity={sky.turbidity}
          rayleigh={sky.rayleigh}
          mieCoefficient={sky.mieCoefficient}
          mieDirectionalG={sky.mieDirectionalG}
        />
      )}

      {/* Atmospheric Hemisphere fill for natural ceiling and ground light bounce */}
      <hemisphereLight
        args={[hemisphereLight.skyColor, hemisphereLight.groundColor, hemisphereLight.intensity]}
      />

      {/* Controlled base ambient illumination */}
      <ambientLight color={ambientLight.color} intensity={ambientLight.intensity} />

      {/* Directional Sun or Moon light with crisp, acne-free PCF soft shadows */}
      <directionalLight
        position={directionalLight.position}
        intensity={directionalLight.intensity}
        color={directionalLight.color}
        castShadow={directionalLight.castShadow}
        shadow-mapSize-width={directionalLight.shadowMapSize}
        shadow-mapSize-height={directionalLight.shadowMapSize}
        shadow-camera-near={directionalLight.shadowCameraNear}
        shadow-camera-far={directionalLight.shadowCameraFar}
        shadow-camera-left={-frustum}
        shadow-camera-right={frustum}
        shadow-camera-top={frustum}
        shadow-camera-bottom={-frustum}
        shadow-bias={directionalLight.shadowBias}
        shadow-normalBias={directionalLight.shadowNormalBias}
      />

      {/* Interior architectural warm glow (illuminates rooms & furniture legibly in all modes) */}
      <pointLight
        position={[centerX, 7.5, centerZ]}
        color={interiorGlow.color}
        intensity={interiorGlow.intensity}
        distance={interiorGlow.distance}
        decay={1.8}
      />
    </>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("3D Studio WebGL Crash Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: '100%', height: '500px', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', borderRadius: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <h3>WebGL Crash Detected</h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>The 3D view failed to load. Your GPU might be out of VRAM or missing WebGL support.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Site Landscaping 3D Scene Component ─────────────────────────────────────
function SiteLandscaping3D({
  landscaping,
  timeOfDay,
  isSingleUpperFloor = false,
}: {
  landscaping: GeneratedSiteLandscaping3D;
  timeOfDay: TimeOfDay;
  isSingleUpperFloor?: boolean;
}) {
  if (!landscaping.enabled) return null;

  return (
    <group>
      {/* 1. Ground Zones (Lawn Turf & Outer Base Plane) */}
      {landscaping.groundZones.map((zone) => {
        if (zone.type === 'outer_ground') {
          return (
            <mesh
              key={zone.id}
              position={[zone.centerFt.x, zone.elevationFt, zone.centerFt.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[zone.dimensionsFt.width, zone.dimensionsFt.length]} />
              <meshStandardMaterial color="#090a0f" roughness={0.96} />
            </mesh>
          );
        }
        return (
          <mesh
            key={zone.id}
            position={[zone.centerFt.x, zone.elevationFt, zone.centerFt.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[zone.dimensionsFt.width, zone.dimensionsFt.length]} />
            <primitive
              object={architecturalMaterials.getMaterial(
                zone.materialKey,
                { width: zone.dimensionsFt.width, height: zone.dimensionsFt.length }
              )}
              attach="material"
            />
          </mesh>
        );
      })}

      {/* 2. Boundary Walls with Slate Coping Caps (Subdued on isolated upper floors) */}
      {!isSingleUpperFloor && landscaping.boundaryWalls.map((wall) => (
        <group
          key={wall.id}
          position={[wall.centerFt.x, 0, wall.centerFt.z]}
          rotation={[0, -wall.angleRad, 0]}
        >
          {/* Wall Body */}
          <Box
            castShadow
            receiveShadow
            args={[wall.lengthFt, wall.heightFt, wall.thicknessFt]}
            position={[0, wall.heightFt / 2, 0]}
          >
            <meshStandardMaterial color={wall.wallColor} roughness={0.7} />
          </Box>
          {/* Wall Coping Cap */}
          <Box
            castShadow
            receiveShadow
            args={[wall.lengthFt + 0.1, 0.2, wall.thicknessFt + 0.2]}
            position={[0, wall.heightFt + 0.1, 0]}
          >
            <meshStandardMaterial color={wall.copingColor} roughness={0.4} />
          </Box>
        </group>
      ))}

      {/* 3. Paved Promenade Walkways */}
      {landscaping.pathways.map((path) => (
        <Box
          key={path.id}
          receiveShadow
          args={[path.dimensionsFt.width, 0.08, path.dimensionsFt.length]}
          position={[path.centerFt.x, path.elevationFt, path.centerFt.z]}
        >
          <primitive
            object={architecturalMaterials.getMaterial(
              path.materialKey,
              { width: path.dimensionsFt.width, height: path.dimensionsFt.length }
            )}
            attach="material"
          />
        </Box>
      ))}

      {/* 4. Rear Leisure Patio Terrace */}
      {landscaping.patio && (
        <Box
          receiveShadow
          args={[landscaping.patio.dimensionsFt.width, 0.08, landscaping.patio.dimensionsFt.length]}
          position={[landscaping.patio.centerFt.x, landscaping.patio.elevationFt, landscaping.patio.centerFt.z]}
        >
          <primitive
            object={architecturalMaterials.getMaterial(
              landscaping.patio.materialKey,
              { width: landscaping.patio.dimensionsFt.width, height: landscaping.patio.dimensionsFt.length }
            )}
            attach="material"
          />
        </Box>
      )}

      {/* 5. Teak Poolside Timber Deck */}
      {landscaping.deck && (
        <Box
          receiveShadow
          args={[landscaping.deck.dimensionsFt.width, 0.12, landscaping.deck.dimensionsFt.length]}
          position={[landscaping.deck.centerFt.x, landscaping.deck.elevationFt, landscaping.deck.centerFt.z]}
        >
          <primitive
            object={architecturalMaterials.getMaterial(
              landscaping.deck.materialKey,
              { width: landscaping.deck.dimensionsFt.width, height: landscaping.deck.dimensionsFt.length }
            )}
            attach="material"
          />
        </Box>
      )}

      {/* 6. Sunken Swimming Pool with Water Shader */}
      {landscaping.pool && landscaping.pool.isValid && (
        <group position={[landscaping.pool.centerFt.x, 0, landscaping.pool.centerFt.z]}>
          {/* A. Travertine Coping Frame Border */}
          <Box
            args={[landscaping.pool.boundsFt.width, 0.16, 1.0]}
            position={[0, 0.08, -landscaping.pool.boundsFt.length / 2 + 0.5]}
            receiveShadow
          >
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </Box>
          <Box
            args={[landscaping.pool.boundsFt.width, 0.16, 1.0]}
            position={[0, 0.08, landscaping.pool.boundsFt.length / 2 - 0.5]}
            receiveShadow
          >
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </Box>
          <Box
            args={[1.0, 0.16, landscaping.pool.boundsFt.length - 2.0]}
            position={[-landscaping.pool.boundsFt.width / 2 + 0.5, 0.08, 0]}
            receiveShadow
          >
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </Box>
          <Box
            args={[1.0, 0.16, landscaping.pool.boundsFt.length - 2.0]}
            position={[landscaping.pool.boundsFt.width / 2 - 0.5, 0.08, 0]}
            receiveShadow
          >
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </Box>

          {/* B. Basin Interior Floor */}
          <Box
            args={[landscaping.pool.innerBasinFt.width, 0.2, landscaping.pool.innerBasinFt.length]}
            position={[0, -landscaping.pool.boundsFt.depth, 0]}
            receiveShadow
          >
            <meshStandardMaterial color="#06b6d4" roughness={0.2} metalness={0.1} />
          </Box>

          {/* C. Basin Interior Walls */}
          <Box
            args={[landscaping.pool.innerBasinFt.width, landscaping.pool.boundsFt.depth, 0.2]}
            position={[0, -landscaping.pool.boundsFt.depth / 2, -landscaping.pool.innerBasinFt.length / 2]}
          >
            <meshStandardMaterial color="#0891b2" roughness={0.2} />
          </Box>
          <Box
            args={[landscaping.pool.innerBasinFt.width, landscaping.pool.boundsFt.depth, 0.2]}
            position={[0, -landscaping.pool.boundsFt.depth / 2, landscaping.pool.innerBasinFt.length / 2]}
          >
            <meshStandardMaterial color="#0891b2" roughness={0.2} />
          </Box>
          <Box
            args={[0.2, landscaping.pool.boundsFt.depth, landscaping.pool.innerBasinFt.length]}
            position={[-landscaping.pool.innerBasinFt.width / 2, -landscaping.pool.boundsFt.depth / 2, 0]}
          >
            <meshStandardMaterial color="#0891b2" roughness={0.2} />
          </Box>
          <Box
            args={[0.2, landscaping.pool.boundsFt.depth, landscaping.pool.innerBasinFt.length]}
            position={[landscaping.pool.innerBasinFt.width / 2, -landscaping.pool.boundsFt.depth / 2, 0]}
          >
            <meshStandardMaterial color="#0891b2" roughness={0.2} />
          </Box>

          {/* D. Submerged Steps (shallow end) */}
          {[0, 1, 2].map((sIdx) => {
            const stepH = landscaping.pool!.boundsFt.depth / 4;
            const stepY = -landscaping.pool!.boundsFt.depth + (sIdx + 1) * stepH - stepH / 2;
            const stepZ = -landscaping.pool!.innerBasinFt.length / 2 + (sIdx + 0.5) * 1.2;
            return (
              <Box
                key={sIdx}
                args={[landscaping.pool!.innerBasinFt.width - 0.4, stepH, 1.2]}
                position={[0, stepY, stepZ]}
              >
                <meshStandardMaterial color="#0891b2" roughness={0.25} />
              </Box>
            );
          })}

          {/* E. Water Surface Plane with PBR Shader */}
          <mesh
            position={[0, landscaping.pool.waterSurfaceYFt, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[landscaping.pool.innerBasinFt.width - 0.05, landscaping.pool.innerBasinFt.length - 0.05]} />
            <primitive object={architecturalMaterials.getMaterial('pool_water')} attach="material" />
          </mesh>

          {/* F. Underwater Night Light */}
          {timeOfDay === 'night' && (
            <pointLight
              position={[0, -landscaping.pool.boundsFt.depth / 2, 0]}
              color="#38bdf8"
              intensity={2.8}
              distance={25}
              decay={2}
            />
          )}
        </group>
      )}

      {/* 7. Poolside Teak Loungers */}
      {landscaping.poolsideItems.map((item) => (
        <group
          key={item.id}
          position={[item.positionFt.x, item.positionFt.y, item.positionFt.z]}
          rotation={[0, (item.rotationDeg * Math.PI) / 180, 0]}
        >
          {/* Lounger Teak Base */}
          <Box args={[item.dimensionsFt.width, 0.2, item.dimensionsFt.depth]} position={[0, 0.1, 0]} castShadow>
            <meshStandardMaterial color="#784528" roughness={0.6} />
          </Box>
          {/* White Cushion */}
          <Box args={[item.dimensionsFt.width - 0.2, 0.2, item.dimensionsFt.depth - 0.3]} position={[0, 0.25, 0]} castShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </Box>
          {/* Angled Backrest */}
          <Box
            args={[item.dimensionsFt.width - 0.3, 0.25, 1.6]}
            position={[0, 0.4, -item.dimensionsFt.depth / 2 + 1.0]}
            rotation={[0.35, 0, 0]}
            castShadow
          >
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </Box>
        </group>
      ))}

      {/* 8. Vegetation: Palms, Shade Trees & Hedges */}
      {landscaping.vegetation.map((veg) => {
        if (veg.type === 'boxwood_hedge') {
          return (
            <Box
              key={veg.id}
              args={[veg.scale.width, veg.scale.height, veg.scale.depth]}
              position={[veg.positionFt.x, veg.positionFt.y, veg.positionFt.z]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={veg.color || '#1b4332'} roughness={0.9} />
            </Box>
          );
        }
        if (veg.type === 'palm_tree') {
          const trunkH = 12.0 * veg.scale.height;
          return (
            <group
              key={veg.id}
              position={[veg.positionFt.x, veg.positionFt.y, veg.positionFt.z]}
              rotation={[0, (veg.rotationDeg * Math.PI) / 180, 0]}
            >
              <Cylinder
                args={[0.25 * veg.scale.width, 0.45 * veg.scale.width, trunkH, 8]}
                position={[0, trunkH / 2, 0]}
                castShadow
              >
                <meshStandardMaterial color="#78593a" roughness={0.75} />
              </Cylinder>
              {Array.from({ length: 8 }).map((_, fIdx) => {
                const angle = (fIdx / 8) * Math.PI * 2;
                const frondLen = 5.0 * veg.scale.width;
                return (
                  <group
                    key={fIdx}
                    position={[0, trunkH, 0]}
                    rotation={[0.45, angle, 0]}
                  >
                    <Box
                      args={[0.6 * veg.scale.width, 0.08, frondLen]}
                      position={[0, -0.3, frondLen / 2]}
                      castShadow
                    >
                      <meshStandardMaterial color="#1e532b" roughness={0.65} />
                    </Box>
                  </group>
                );
              })}
            </group>
          );
        }
        // Shade Canopy Tree
        return (
          <group
            key={veg.id}
            position={[veg.positionFt.x, veg.positionFt.y, veg.positionFt.z]}
            rotation={[0, (veg.rotationDeg * Math.PI) / 180, 0]}
          >
            <Cylinder args={[0.35 * veg.scale.width, 0.45 * veg.scale.width, 6.0, 8]} position={[0, 3.0, 0]} castShadow>
              <meshStandardMaterial color="#5c4033" roughness={0.8} />
            </Cylinder>
            <Sphere args={[3.2 * veg.scale.width, 10, 10]} position={[0, 7.5, 0]} castShadow>
              <meshStandardMaterial color="#2d6a4f" roughness={0.85} />
            </Sphere>
          </group>
        );
      })}
    </group>
  );
}

// ── Inner Building 3D Scene (rendered inside Canvas to safely use R3F hooks) ──
interface BuildingSceneProps {
  levels: Generated3DBuilding['levels'];
  bounds: Generated3DBuilding['bounds'];
  landscaping: GeneratedSiteLandscaping3D;
  viewMode: 'all' | 'single' | 'exploded' | 'active';
  localActiveFloor: number;
  isCutaway: boolean;
  selectedFurnitureId: string | null;
  onSelectFurniture?: (id: string | null) => void;
  timeOfDay: TimeOfDay;
  qualityTier: 'high' | 'med' | 'low';
  entryDir: string;
  framing: CameraFramingResult;
  resetTrigger: number;
  vizMode?: 'solid' | 'xray' | 'section' | 'walkthrough' | 'dollhouse';
  sectionPlane?: THREE.Plane | null;
  roomLabelMode?: 'off' | 'subtle' | 'cad';
  xrayOpacity?: number;
  explodedGap?: number;
  isolateGhostMode?: boolean;
  isTurntableActive?: boolean;
}

function BuildingScene({
  levels,
  bounds,
  landscaping,
  viewMode,
  localActiveFloor,
  isCutaway,
  selectedFurnitureId,
  onSelectFurniture,
  timeOfDay,
  qualityTier,
  entryDir,
  framing,
  resetTrigger,
  vizMode = 'dollhouse',
  sectionPlane = null,
  roomLabelMode = 'subtle',
  xrayOpacity = 0.28,
  explodedGap = 14.0,
  isolateGhostMode = true,
  isTurntableActive = false,
}: BuildingSceneProps) {
  // Lighting configuration derived from current framing and environment
  const lightingConfig = useMemo(() => {
    return getArchitecturalLightingConfig(
      timeOfDay,
      entryDir,
      framing.targetLookAt.x,
      framing.targetLookAt.z,
      framing.effectiveDim
    );
  }, [timeOfDay, entryDir, framing.targetLookAt.x, framing.targetLookAt.z, framing.effectiveDim]);

  const clipProps = sectionPlane ? { clippingPlanes: [sectionPlane], clipShadows: true } : {};

  return (
    <>
      <SceneSetup lightingConfig={lightingConfig} />

      {/* Camera Controller with smooth interpolation & turntable */}
      <CameraManager
        framing={framing}
        resetTrigger={resetTrigger}
        isTurntableActive={isTurntableActive}
      />

      {/* Sun & Sky Multi-Light Rig */}
      <SkyAndSun
        config={lightingConfig}
        centerX={framing.targetLookAt.x}
        centerZ={framing.targetLookAt.z}
      />

      {/* Ground Contact Shadow under building */}
      {qualityTier !== 'low' && (
        <ContactShadows
          position={[bounds.centerX, -0.34, bounds.centerZ]}
          opacity={qualityTier === 'high' ? 0.75 : 0.45}
          scale={Math.max(bounds.width, bounds.depth) * 1.55}
          blur={qualityTier === 'high' ? 2.0 : 1.2}
          far={14}
          resolution={qualityTier === 'high' ? 1024 : 512}
          color="#0b1120"
        />
      )}

      {/* Cinematic Architectural Post-processing */}
      {qualityTier !== 'low' ? (
        <EffectComposer multisampling={qualityTier === 'high' ? 4 : 0}>
          <Bloom
            intensity={timeOfDay === 'night' ? 0.55 : 0.22}
            luminanceThreshold={0.82}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.32} darkness={0.48} />
          {qualityTier === 'high' && <SMAA />}
        </EffectComposer>
      ) : null}

      {/* ── Multi-Floor Watertight Geometry Scene Graph ─────────────────── */}
      {levels.map((lvl, fIdx) => {
        const isCurrentActive = fIdx === localActiveFloor;

        // In 'single' mode without ghosting: isolate strictly the selected floor
        if (viewMode === 'single' && !isolateGhostMode && !isCurrentActive) {
          return null;
        }

        const isGhosted = viewMode === 'single' && isolateGhostMode && !isCurrentActive;

        let targetY = 0;
        if (viewMode === 'single') {
          targetY = isGhosted ? lvl.elevationFt : (isolateGhostMode ? lvl.elevationFt : 0);
        } else if (viewMode === 'exploded') {
          targetY = fIdx * (FLOOR_PITCH + explodedGap);
        } else {
          // 'all' (STACKED) and 'active' both render at true architectural elevations
          targetY = lvl.elevationFt;
        }

        return (
          <AnimatedFloorGroup
            key={lvl.levelId || fIdx}
            targetY={targetY}
            levelIndex={fIdx}
            levelName={lvl.name}
            isExploded={viewMode === 'exploded'}
            isActive={isCurrentActive && (viewMode === 'active' || viewMode === 'single')}
            minX={bounds.minX}
            minZ={bounds.minZ}
            maxZ={bounds.maxZ}
          >
            <group>
              {/* Warm Interior Architectural Accent Lights */}
              {lvl.rooms.map((room) => {
                if (room.isVoid || room.isSpecialtyTerrace || room.isStairwell) return null;
                return (
                  <pointLight
                    key={`room_light_${room.id}`}
                    position={[room.centerFt.x, 7.2, room.centerFt.z]}
                    intensity={timeOfDay === 'night' ? 20 : timeOfDay === 'sunset' ? 14 : 7}
                    distance={Math.max(room.bboxFt.width, room.bboxFt.height) * 1.6}
                    color="#fff3d6"
                    decay={2}
                  />
                );
              })}

              {/* Plinth Foundation at Base (Grounds Building on Grade) */}
              {fIdx === 0 && (
                <group position={[bounds.centerX, -0.32, bounds.centerZ]}>
                  <Box
                    args={[bounds.width + 1.2, 0.6, bounds.depth + 1.2]}
                    receiveShadow
                    position={[0, 0, 0]}
                  >
                    <meshStandardMaterial color="#334155" roughness={0.75} {...clipProps} />
                    <Edges color="#0f172a" />
                  </Box>
                  <Box
                    args={[bounds.width + 1.3, 0.08, bounds.depth + 1.3]}
                    position={[0, 0.3, 0]}
                  >
                    <meshStandardMaterial color="#1e293b" roughness={0.55} {...clipProps} />
                  </Box>
                </group>
              )}

              {/* A. Floor Slabs & Specialty Rooms */}
              {lvl.rooms.map((room) => {
                if (room.isVoid) {
                  return (
                    <DuplexVoid3D
                      key={room.id}
                      room={{
                        x: room.bboxFt.x,
                        y: room.bboxFt.y,
                        width: room.bboxFt.width,
                        height: room.bboxFt.height,
                        name: room.name,
                      }}
                    />
                  );
                }

                if (room.isSpecialtyTerrace) {
                  const rn = room.name.toLowerCase();
                  if (rn.includes('gazebo')) return <Gazebo3D key={room.id} room={room} />;
                  if (rn.includes('garden')) return <RooftopGarden3D key={room.id} room={room} />;
                  if (rn.includes('solar')) return <SolarUtility3D key={room.id} room={room} />;
                  if (rn.includes('sundeck')) return <Sundeck3D key={room.id} room={room} />;
                }

                const roomPBRMaterial = architecturalMaterials.getMaterial(
                  room.material.materialKey || 'hardwood_oak',
                  { width: room.bboxFt.width, height: room.bboxFt.height }
                );

                // Upper floor stairwell: Leave open shaft for continuous stairs below with landing platform
                const isUpperStairwell = fIdx > 0 && room.isStairwell;
                const landingDepth = isUpperStairwell ? room.bboxFt.height * 0.35 : room.bboxFt.height;
                const landingCenterZ = isUpperStairwell ? room.bboxFt.y + landingDepth / 2 : room.centerFt.z;

                return (
                  <group key={room.id}>
                    {/* Floor Finish Plane with Dedicated PBR Architectural Material */}
                    <mesh
                      castShadow
                      receiveShadow
                      position={[room.centerFt.x, -0.02, landingCenterZ]}
                      rotation={[-Math.PI / 2, 0, 0]}
                      material={roomPBRMaterial}
                    >
                      <planeGeometry args={[room.bboxFt.width, landingDepth]} />
                    </mesh>

                    {/* Architectural Room Skirting / Baseboards along walls */}
                    {!room.isVoid && (
                      <group position={[0, 0.16, 0]}>
                        <Box args={[room.bboxFt.width - 0.2, 0.32, 0.04]} position={[room.centerFt.x, 0, room.bboxFt.y + 0.02]}>
                          <meshStandardMaterial color="#cbd5e1" roughness={0.4} {...clipProps} />
                        </Box>
                        <Box args={[room.bboxFt.width - 0.2, 0.32, 0.04]} position={[room.centerFt.x, 0, room.bboxFt.y + landingDepth - 0.02]}>
                          <meshStandardMaterial color="#cbd5e1" roughness={0.4} {...clipProps} />
                        </Box>
                        <Box args={[0.04, 0.32, landingDepth - 0.2]} position={[room.bboxFt.x + 0.02, 0, landingCenterZ]}>
                          <meshStandardMaterial color="#cbd5e1" roughness={0.4} {...clipProps} />
                        </Box>
                        <Box args={[0.04, 0.32, landingDepth - 0.2]} position={[room.bboxFt.x + room.bboxFt.width - 0.02, 0, landingCenterZ]}>
                          <meshStandardMaterial color="#cbd5e1" roughness={0.4} {...clipProps} />
                        </Box>
                      </group>
                    )}

                    {/* Structural Concrete Slab with Visible Dark Edge & Smooth Ceiling Underside */}
                    {fIdx > 0 && (
                      <group>
                        <Box
                          castShadow
                          receiveShadow
                          args={[room.bboxFt.width, SLAB_THICKNESS, landingDepth]}
                          position={[room.centerFt.x, -SLAB_THICKNESS / 2 - 0.02, landingCenterZ]}
                        >
                          <meshStandardMaterial color="#18181b" roughness={0.65} metalness={0.1} {...clipProps} />
                          <Edges color="#090a0f" />
                        </Box>
                        <mesh
                          position={[room.centerFt.x, -SLAB_THICKNESS - 0.03, landingCenterZ]}
                          rotation={[Math.PI / 2, 0, 0]}
                          receiveShadow
                        >
                          <planeGeometry args={[room.bboxFt.width, landingDepth]} />
                          <meshStandardMaterial color="#f8fafc" roughness={0.88} {...clipProps} />
                        </mesh>
                      </group>
                    )}

                    {/* Stairwell Safety Railing along open edge of upper floor landing */}
                    {isUpperStairwell && (
                      <BalustradeEdge
                        x1={room.bboxFt.x}
                        z1={room.bboxFt.y + landingDepth}
                        x2={room.bboxFt.x + room.bboxFt.width}
                        z2={room.bboxFt.y + landingDepth}
                        height={3.0}
                      />
                    )}

                    {/* Camera-Facing Architectural Billboard Room Label (Never Mirrored, Never Floor-Painted) */}
                    {roomLabelMode !== 'off' && (
                      <Html
                        position={[room.centerFt.x, isCutaway ? 0.8 : 1.2, room.centerFt.z]}
                        center
                        distanceFactor={32}
                        style={{
                          pointerEvents: 'none',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: roomLabelMode === 'cad' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(24, 24, 27, 0.82)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: roomLabelMode === 'cad' ? '1px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.22)',
                            borderRadius: '5px',
                            padding: '3px 8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#ffffff',
                              letterSpacing: '0.04em',
                              fontFamily: "'JetBrains Mono', monospace",
                              textTransform: 'uppercase',
                            }}
                          >
                            {room.name}
                          </span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 600,
                              color: roomLabelMode === 'cad' ? '#38bdf8' : '#cbd5e1',
                              fontFamily: "'JetBrains Mono', monospace",
                              marginTop: '1px',
                            }}
                          >
                            {roomLabelMode === 'cad'
                              ? `${Math.round(room.bboxFt.width)}'×${Math.round(room.bboxFt.height)}' • ${Math.round(room.areaSqFt)} SQ FT`
                              : `${Math.round(room.areaSqFt)} SQ FT`}
                          </span>
                        </div>
                      </Html>
                    )}
                  </group>
                );
              })}

              {/* B. Wall Junction & Corner Miter Columns (Seamless Corners) */}
              {lvl.wallJunctions?.map((junction) => (
                <WallJunction3D
                  key={junction.id}
                  junction={junction}
                  isCutaway={isCutaway}
                  isXRay={vizMode === 'xray'}
                  xrayOpacity={xrayOpacity}
                  sectionPlane={sectionPlane}
                />
              ))}

              {/* C. Canonical Walls with Physical Openings */}
              {lvl.walls.map((wall) => (
                <CanonicalWall3D
                  key={wall.id}
                  wall={wall}
                  isCutaway={isCutaway}
                  isXRay={vizMode === 'xray'}
                  xrayOpacity={xrayOpacity}
                  sectionPlane={sectionPlane}
                />
              ))}

              {/* C. Inter-Floor Staircases */}
              {lvl.stairs.map((stair) => (
                <Stairs3D key={stair.id} stair={stair} clippingPlane={sectionPlane} />
              ))}

              {/* D. Placed Furniture Items */}
              {lvl.furniture.map((item) => {
                const isSelected = selectedFurnitureId === item.id;
                return (
                  <group
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFurniture?.(item.id);
                    }}
                  >
                    <FurnitureItem3D item={item} timeOfDay={timeOfDay} />

                    {/* Selection Highlight Cage */}
                    {isSelected && (
                      <group
                        position={[item.positionFt.x, item.positionFt.y + item.dimensionsFt.height / 2, item.positionFt.z]}
                        rotation={[0, THREE.MathUtils.degToRad(-item.rotationDeg), 0]}
                      >
                        <Box args={[item.dimensionsFt.width + 0.2, item.dimensionsFt.height + 0.2, item.dimensionsFt.depth + 0.2]}>
                          <meshBasicMaterial color="#0284c7" wireframe wireframeLinewidth={2} transparent opacity={0.85} />
                        </Box>
                        <Text
                          font="/assets/fonts/Roboto.woff"
                          position={[0, item.dimensionsFt.height / 2 + 0.8, 0]}
                          fontSize={0.8}
                          color="#38bdf8"
                          anchorX="center"
                          anchorY="bottom"
                        >
                          {item.name}
                        </Text>
                      </group>
                    )}
                  </group>
                );
              })}
            </group>
          </AnimatedFloorGroup>
        );
      })}

      {/* ── Ground Lawn Plane ───────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bounds.centerX, -0.1, bounds.centerZ]} receiveShadow>
        <planeGeometry args={[bounds.maxDim * 5, bounds.maxDim * 5]} />
        <meshStandardMaterial color="#2d5024" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── Parametric Site Landscaping & Swimming Pool ────────────────── */}
      {landscaping.enabled ? (
        <SiteLandscaping3D
          landscaping={landscaping}
          timeOfDay={timeOfDay}
          isSingleUpperFloor={viewMode === 'single' && localActiveFloor > 0}
        />
      ) : (
        <gridHelper
          args={[
            Math.ceil((bounds.maxDim * 1.8) / 10) * 10,
            Math.ceil((bounds.maxDim * 1.8) / 10),
            '#1e293b',
            '#0f172a',
          ]}
          position={[bounds.centerX, -0.22, bounds.centerZ]}
        />
      )}
    </>
  );
}

// ── Main FloorPlan3D Component ────────────────────────────────────────────────
export default function FloorPlan3D({
  rooms,
  floors,
  canonicalDoc,
  activeFloorIndex = 0,
  entryDir = 'East',
  plotWidth = 30,
  plotHeight = 40,
  onSelectFloor,
  selectedFurnitureId = null,
  onSelectFurniture,
  onRegisterThreeBundle,
}: FloorPlan3DProps) {
  // Stacking & View State
  const [viewMode, setViewMode] = useState<'all' | 'single' | 'exploded' | 'active'>('all');
  const [wallMode, setWallMode] = useState<'4.5ft' | '10ft' | 'full'>('4.5ft');
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'isometric' | 'topdown' | 'front' | 'side' | 'exterior'>('perspective');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
  const [qualityTier, setQualityTier] = useState<'high' | 'med' | 'low'>('high');
  const [localActiveFloor, setLocalActiveFloor] = useState<number>(activeFloorIndex);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Cinematic ArchViz 5-Mode System
  const [vizMode, setVizMode] = useState<'solid' | 'xray' | 'section' | 'walkthrough' | 'dollhouse'>('dollhouse');
  const [sectionCutDirection, setSectionCutDirection] = useState<'front' | 'side' | 'rear'>('front');
  const [sectionOffsetFt, setSectionOffsetFt] = useState<number>(0);
  const [xrayOpacity, setXrayOpacity] = useState<number>(0.28);
  const [explodedGap, setExplodedGap] = useState<number>(14.0);
  const [isolateGhostMode, setIsolateGhostMode] = useState<boolean>(true);
  const [roomLabelMode, setRoomLabelMode] = useState<'off' | 'subtle' | 'cad'>('subtle');
  const [walkthroughRoomIndex, setWalkthroughRoomIndex] = useState<number>(0);

  // Cinematic Presentation Tour & Turntable State
  const [isTurntableActive, setIsTurntableActive] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  // 3D Export State
  const internalBundleRef = useRef<ThreeSceneBundle | null>(null);
  const [isExportingRender, setIsExportingRender] = useState(false);

  const handleQuickExport = async (resolution: ExportResolutionPreset = '1080p') => {
    if (!internalBundleRef.current) {
      toast.error('3D graphics engine not ready');
      return;
    }
    const { gl, scene, camera } = internalBundleRef.current;
    setIsExportingRender(true);
    const toastId = toast.loading(`Synthesizing ${resolution.toUpperCase()} architectural render...`);
    try {
      await export3DSceneImage(gl, scene, camera, resolution);
      toast.success(`${resolution.toUpperCase()} render saved successfully!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Export failed', { id: toastId });
    } finally {
      setIsExportingRender(false);
    }
  };

  // Landscaping & Site Engine State
  const [landscapingEnabled, setLandscapingEnabled] = useState<boolean>(true);
  const [showPool, setShowPool] = useState<boolean>(true);
  const [showBoundaryWalls, setShowBoundaryWalls] = useState<boolean>(true);
  const [showTrees, setShowTrees] = useState<boolean>(true);

  // Sync external activeFloorIndex
  useEffect(() => {
    setLocalActiveFloor(activeFloorIndex);
  }, [activeFloorIndex]);

  // Clean up GPU PBR textures and materials on unmount
  useEffect(() => {
    return () => {
      architecturalMaterials.dispose();
    };
  }, []);

  // 1. Resolve Canonical Building Document (Single authoritative geometry model)
  const activeCanonicalDoc: CanonicalBuildingDocument = useMemo(() => {
    if (canonicalDoc && isCanonicalDocument(canonicalDoc)) {
      return canonicalDoc;
    }
    return migrateLegacyToCanonical(
      {
        floors: floors && floors.length > 0 ? floors : (rooms ? [{ level: 0, name: 'Ground Floor', rooms }] : []),
        plot_width: plotWidth,
        plot_length: plotHeight,
        entry_direction: entryDir,
      },
      plotWidth,
      plotHeight,
      (entryDir?.toLowerCase() as any) || 'east'
    );
  }, [canonicalDoc, floors, rooms, plotWidth, plotHeight, entryDir]);

  // 2. Generate Watertight 3D Building Geometry
  const isCutaway = wallMode !== 'full';
  const activeCutawayHeightFt = wallMode === '4.5ft' ? 4.5 : 10.0;
  const building3D: Generated3DBuilding = useMemo(() => {
    return generate3DBuilding(activeCanonicalDoc, {
      isCutaway,
      cutawayHeightFt: activeCutawayHeightFt,
      defaultWallHeightFt: ROOM_HEIGHT,
      defaultSlabThicknessFt: SLAB_THICKNESS,
    });
  }, [activeCanonicalDoc, isCutaway, activeCutawayHeightFt]);

  const { bounds, levels } = building3D;
  const numFloors = levels.length;

  // Walkthrough interior rooms on active floor
  const activeFloorRooms = useMemo(() => {
    const lvl = levels[localActiveFloor] || levels[0];
    if (!lvl) return [];
    const valid = lvl.rooms.filter(r => !r.isVoid);
    return valid.length > 0 ? valid : lvl.rooms;
  }, [levels, localActiveFloor]);

  const currentWalkthroughRoom = activeFloorRooms.length > 0
    ? activeFloorRooms[walkthroughRoomIndex % activeFloorRooms.length]
    : null;

  // Architectural Section Clipping Plane (Native WebGL fragment clipping)
  const sectionPlane = useMemo(() => {
    if (vizMode !== 'section') return null;
    const offset = sectionOffsetFt;
    if (sectionCutDirection === 'side') {
      return new THREE.Plane(new THREE.Vector3(-1, 0, 0), bounds.centerX + bounds.maxDim * 0.05 + offset);
    } else if (sectionCutDirection === 'rear') {
      return new THREE.Plane(new THREE.Vector3(0, 0, 1), -bounds.centerZ + bounds.maxDim * 0.05 + offset);
    } else {
      // 'front'
      return new THREE.Plane(new THREE.Vector3(0, 0, -1), bounds.centerZ + bounds.maxDim * 0.05 + offset);
    }
  }, [vizMode, sectionCutDirection, sectionOffsetFt, bounds.centerX, bounds.centerZ, bounds.maxDim]);

  // 3. Generate Parametric Landscaping & Swimming Pool
  const landscaping: GeneratedSiteLandscaping3D = useMemo(() => {
    return generateSiteLandscaping(activeCanonicalDoc, bounds, {
      enabled: landscapingEnabled,
      showPool,
      showBoundaryWalls,
      showTrees,
      showLawn: true,
      showPathways: true,
      showPatio: true,
      showDeck: true,
      showPoolLoungers: true,
    });
  }, [activeCanonicalDoc, bounds, landscapingEnabled, showPool, showBoundaryWalls, showTrees]);

  // Selected furniture item metadata for floating HUD
  const activeFurnitureItem = useMemo(() => {
    if (!selectedFurnitureId) return null;
    for (const lvl of levels) {
      const f = lvl.furniture.find(item => item.id === selectedFurnitureId);
      if (f) return f;
    }
    return null;
  }, [levels, selectedFurnitureId]);

  const hasDuplexVoid = useMemo(() => {
    return levels.some(lvl => lvl.rooms.some(r => r.isVoid));
  }, [levels]);

  const handleFloorSelect = (idx: number) => {
    setLocalActiveFloor(idx);
    onSelectFloor?.(idx);
    if (viewMode === 'all') {
      setViewMode('single');
    }
  };

  const handleFitView = () => {
    setResetTrigger(prev => prev + 1);
  };

  // Presentation Tour Steps
  const TOUR_STEPS = useMemo(() => [
    {
      title: 'EXTERIOR FACADE',
      subtitle: 'Completed architectural envelope & materials',
      viewMode: 'all' as const,
      vizMode: 'solid' as const,
      cameraPreset: 'exterior' as const,
      timeOfDay: 'noon' as const,
      floorIndex: 0,
    },
    {
      title: 'GROUND FLOOR LIVING',
      subtitle: 'Dollhouse cutaway with furnished interior spaces',
      viewMode: 'all' as const,
      vizMode: 'dollhouse' as const,
      cameraPreset: 'perspective' as const,
      timeOfDay: 'noon' as const,
      floorIndex: 0,
    },
    {
      title: 'FIRST FLOOR BEDROOMS',
      subtitle: 'Upper floor layout, open stairwell void & suites',
      viewMode: 'active' as const,
      vizMode: 'dollhouse' as const,
      cameraPreset: 'perspective' as const,
      timeOfDay: 'noon' as const,
      floorIndex: Math.min(1, Math.max(0, levels.length - 1)),
    },
    {
      title: 'ROOFTOP TERRACE',
      subtitle: 'Panoramic rooftop sundeck & pergola lounge',
      viewMode: 'active' as const,
      vizMode: 'dollhouse' as const,
      cameraPreset: 'isometric' as const,
      timeOfDay: 'noon' as const,
      floorIndex: Math.max(0, levels.length - 1),
    },
    {
      title: 'EXPLODED AXONOMETRIC',
      subtitle: 'Vertical separation of stacked architectural slabs',
      viewMode: 'exploded' as const,
      vizMode: 'dollhouse' as const,
      cameraPreset: 'isometric' as const,
      timeOfDay: 'noon' as const,
      floorIndex: 0,
    },
    {
      title: 'GOLDEN HOUR FINALE',
      subtitle: '14° amber sun and long evening shadows',
      viewMode: 'all' as const,
      vizMode: 'dollhouse' as const,
      cameraPreset: 'perspective' as const,
      timeOfDay: 'golden_hour' as const,
      floorIndex: 0,
    },
  ], [levels.length]);

  // Auto-advance presentation tour
  useEffect(() => {
    if (!isTourActive) return;
    const interval = setInterval(() => {
      setTourStep(prev => {
        const next = (prev + 1) % TOUR_STEPS.length;
        const s = TOUR_STEPS[next];
        setViewMode(s.viewMode);
        setVizMode(s.vizMode);
        setCameraPreset(s.cameraPreset);
        setTimeOfDay(s.timeOfDay);
        setLocalActiveFloor(s.floorIndex);
        return next;
      });
    }, 5500);
    return () => clearInterval(interval);
  }, [isTourActive, TOUR_STEPS]);

  const handleStartTour = () => {
    setIsTourActive(true);
    setTourStep(0);
    const s = TOUR_STEPS[0];
    setViewMode(s.viewMode);
    setVizMode(s.vizMode);
    setCameraPreset(s.cameraPreset);
    setTimeOfDay(s.timeOfDay);
    setLocalActiveFloor(s.floorIndex);
  };

  const handleStopTour = () => {
    setIsTourActive(false);
  };

  // 4. Calculate Authoritative Camera Framing
  const framing = useMemo(() => {
    if (vizMode === 'walkthrough' && currentWalkthroughRoom) {
      const roomY = (viewMode === 'single' ? 0 : (levels[localActiveFloor]?.elevationFt || 0));
      return {
        targetPosition: {
          x: currentWalkthroughRoom.centerFt.x - 3.2,
          y: roomY + 5.2,
          z: currentWalkthroughRoom.centerFt.z + 4.2,
        },
        targetLookAt: {
          x: currentWalkthroughRoom.centerFt.x,
          y: roomY + 5.0,
          z: currentWalkthroughRoom.centerFt.z,
        },
        near: 0.2,
        far: 600,
        minDistance: 0.5,
        maxDistance: 35,
        effectiveDim: 15,
        fitDistance: 12,
      };
    }

    const activeLevelElev = levels[localActiveFloor]?.elevationFt;
    return calculateCameraFraming({
      bounds,
      plotBounds: landscaping.enabled ? landscaping.plotBoundsFt : undefined,
      isLandscapingEnabled: landscaping.enabled,
      viewMode,
      activeFloorIndex: localActiveFloor,
      activeFloorElevation: activeLevelElev,
      numFloors: levels.length,
      preset: cameraPreset,
    });
  }, [
    bounds,
    landscaping.enabled,
    landscaping.plotBoundsFt,
    viewMode,
    localActiveFloor,
    levels,
    cameraPreset,
    vizMode,
    currentWalkthroughRoom,
  ]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '560px', background: '#1B1D1C', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E7E1D5' }}>
      
      {/* ── 3D Controls Overlay Dock — Refined Atelier Studio Dock ────────────── */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 20,
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {/* Left: 5 ArchViz Modes & View Stacking Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Primary Cinematic ArchViz 5-Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(24, 24, 27, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            padding: '2px',
            pointerEvents: 'auto',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            gap: '2px',
          }}>
            <button
              id="btn-viz-mode-solid"
              onClick={() => {
                setVizMode('solid');
                setWallMode('full');
                setCameraPreset('exterior');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.70rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: vizMode === 'solid' ? '#0ea5e9' : 'transparent',
                color: vizMode === 'solid' ? '#ffffff' : '#a1a1aa',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Cinematic Exterior / Solid completed architectural envelope"
            >
              <Shield size={11} />
              <span>SOLID</span>
            </button>

            <button
              id="btn-viz-mode-xray"
              onClick={() => {
                setVizMode('xray');
                setWallMode('full');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.70rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: vizMode === 'xray' ? '#38bdf8' : 'transparent',
                color: vizMode === 'xray' ? '#09090b' : '#a1a1aa',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Transparent / X-Ray structural ghost shell showing interior spaces"
            >
              <Eye size={11} />
              <span>X-RAY</span>
            </button>

            <button
              id="btn-viz-mode-section"
              onClick={() => {
                setVizMode('section');
                setWallMode('full');
                setCameraPreset('isometric');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.70rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: vizMode === 'section' ? '#f59e0b' : 'transparent',
                color: vizMode === 'section' ? '#09090b' : '#a1a1aa',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Half-Cutaway / Architectural section cut exposing multi-floor interiors"
            >
              <Scissors size={11} />
              <span>SECTION</span>
            </button>

            <button
              id="btn-viz-mode-walkthrough"
              onClick={() => {
                setVizMode('walkthrough');
                setWallMode('full');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.70rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: vizMode === 'walkthrough' ? '#10b981' : 'transparent',
                color: vizMode === 'walkthrough' ? '#ffffff' : '#a1a1aa',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Interior Walkthrough at human eye-level (5.2 ft)"
            >
              <UserCheck size={11} />
              <span>WALKTHROUGH</span>
            </button>

            <button
              id="btn-viz-mode-dollhouse"
              onClick={() => {
                setVizMode('dollhouse');
                setWallMode('4.5ft');
                setCameraPreset('perspective');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.70rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: vizMode === 'dollhouse' ? '#a855f7' : 'transparent',
                color: vizMode === 'dollhouse' ? '#ffffff' : '#a1a1aa',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Individual-Floor Interior / Dollhouse cutaway view"
            >
              <Home size={11} />
              <span>DOLLHOUSE</span>
            </button>
          </div>

          {/* Stacking Mode */}
          <div style={{
            display: 'flex',
            background: 'rgba(250, 248, 242, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid #E7E1D5',
            borderRadius: '6px',
            padding: '2px',
            pointerEvents: 'auto',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            gap: '2px',
          }}>
          <button
            id="btn-3d-mode-stacked"
            onClick={() => setViewMode('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'all' ? '#252622' : 'transparent',
              color: viewMode === 'all' ? '#FAF8F2' : '#777970',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.15s ease',
            }}
            title="Render all building floors stacked"
          >
            <Building2 size={12} />
            <span>STACKED</span>
          </button>

          <button
            id="btn-3d-mode-single"
            onClick={() => setViewMode('single')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'single' ? '#252622' : 'transparent',
              color: viewMode === 'single' ? '#FAF8F2' : '#777970',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.15s ease',
            }}
            title="Isolate and view only the selected single level"
          >
            <Layers size={12} />
            <span>SINGLE FLOOR</span>
          </button>

          {numFloors > 1 && (
            <button
              id="btn-3d-mode-exploded"
              onClick={() => setViewMode('exploded')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'exploded' ? '#252622' : 'transparent',
                color: viewMode === 'exploded' ? '#FAF8F2' : '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Exploded axonometric view separating each floor in the air"
            >
              <Maximize2 size={12} />
              <span>EXPLODED</span>
            </button>
          )}

          <button
            id="btn-3d-mode-active"
            onClick={() => setViewMode('active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'active' ? '#252622' : 'transparent',
              color: viewMode === 'active' ? '#FAF8F2' : '#777970',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.15s ease',
            }}
            title="Focus camera exclusively on the currently selected floor"
          >
            <Eye size={12} />
            <span>ACTIVE</span>
          </button>
        </div>
      </div>

        {/* Center: Floor Level Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(250, 248, 242, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid #E7E1D5',
          borderRadius: '6px',
          padding: '2px',
          pointerEvents: 'auto',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          gap: '2px',
        }}>
          {levels.map((lvl, idx) => {
            const isSelected = localActiveFloor === idx;
            const floorTitle = lvl.name || (idx === 0 ? 'Ground Floor' : idx === 1 ? 'First Floor' : `Level ${idx}`);
            return (
              <button
                key={lvl.levelId || idx}
                id={`btn-3d-floor-${idx}`}
                onClick={() => handleFloorSelect(idx)}
                style={{
                  padding: '5px 9px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isSelected ? '#252622' : 'transparent',
                  color: isSelected ? '#FAF8F2' : '#777970',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'all 0.15s ease',
                }}
                title={`Inspect ${floorTitle} (L${idx})`}
              >
                {`L${idx} // ${floorTitle}`}
              </button>
            );
          })}
        </div>

        {/* Right: Camera Presets & Wall Cutaway & Time of Day */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}>
          {/* Room Label Mode Toggle */}
          <button
            id="btn-labels-mode"
            onClick={() => {
              setRoomLabelMode(m => (m === 'subtle' ? 'cad' : m === 'cad' ? 'off' : 'subtle'));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              fontSize: '0.68rem',
              fontWeight: 600,
              background: 'rgba(250, 248, 242, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #E7E1D5',
              borderRadius: '6px',
              cursor: 'pointer',
              color: roomLabelMode === 'off' ? '#94a3b8' : '#252622',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title="Toggle Room Label Presentation (SUBTLE floor decal / CAD technical / OFF)"
          >
            <Tag size={11} />
            <span>{`LABELS: ${roomLabelMode.toUpperCase()}`}</span>
          </button>

          {/* Camera Presets */}
          <div style={{
            display: 'flex',
            background: 'rgba(250, 248, 242, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid #E7E1D5',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px',
          }}>
            <button
              onClick={() => setCameraPreset('perspective')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: cameraPreset === 'perspective' ? '#252622' : 'transparent',
                color: cameraPreset === 'perspective' ? '#FAF8F2' : '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
              title="Dollhouse 3D Perspective Orbit Camera"
            >
              <Camera size={12} />
              <span>DOLLHOUSE</span>
            </button>
            <button
              onClick={() => setCameraPreset('isometric')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: cameraPreset === 'isometric' ? '#252622' : 'transparent',
                color: cameraPreset === 'isometric' ? '#FAF8F2' : '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
              title="Axonometric 45-degree Camera"
            >
              <BoxIcon size={12} />
              <span>AXO</span>
            </button>
            <button
              onClick={() => setCameraPreset('topdown')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: cameraPreset === 'topdown' ? '#252622' : 'transparent',
                color: cameraPreset === 'topdown' ? '#FAF8F2' : '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
              title="Top-Down Plan View"
            >
              <Layers size={12} />
              <span>TOP-DOWN</span>
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: cameraPreset === 'front' ? '#252622' : 'transparent',
                color: cameraPreset === 'front' ? '#FAF8F2' : '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
              title="Front Elevation View"
            >
              <ArrowUp size={12} />
              <span>FRONT</span>
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: cameraPreset === 'side' ? '#252622' : 'transparent',
                color: cameraPreset === 'side' ? '#FAF8F2' : '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
              title="Side Elevation View"
            >
              <ArrowRight size={12} />
              <span>SIDE</span>
            </button>
            <button
              onClick={handleFitView}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
              title="Fit Model to Viewport"
            >
              <Compass size={12} />
              <span>FIT</span>
            </button>
            <button
              id="btn-camera-turntable"
              onClick={() => setIsTurntableActive(t => !t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: isTurntableActive ? '#0284c7' : 'transparent',
                color: isTurntableActive ? '#ffffff' : '#777970',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
              title="360° Architectural Turntable Orbit"
            >
              <RotateCw size={12} />
              <span>360°</span>
            </button>
            <button
              id="btn-presentation-tour"
              onClick={() => (isTourActive ? handleStopTour() : handleStartTour())}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: isTourActive ? '#dc2626' : 'rgba(14, 165, 233, 0.15)',
                color: isTourActive ? '#ffffff' : '#0284c7',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
              }}
              title="Start Cinematic Presentation Tour (Exterior -> Floors -> Terrace -> Dollhouse)"
            >
              {isTourActive ? <Square size={11} /> : <Play size={11} />}
              <span>{isTourActive ? 'STOP TOUR' : 'TOUR'}</span>
            </button>
          </div>

          {/* Wall Cutaway Height Selector (4.5 FT / 10 FT / FULL) */}
          <div
            id="cutaway-height-control"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(250, 248, 242, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #E7E1D5',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              id="cutaway-45ft-btn"
              onClick={() => setWallMode('4.5ft')}
              style={{
                padding: '4px 8px',
                fontSize: '0.68rem',
                fontWeight: wallMode === '4.5ft' ? 700 : 500,
                background: wallMode === '4.5ft' ? 'rgba(216, 87, 64, 0.15)' : 'transparent',
                border: wallMode === '4.5ft' ? '1px solid #D85740' : 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: wallMode === '4.5ft' ? '#D85740' : '#474943',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Cutaway 4.5ft — NBC sill level for viewing furniture and room interiors"
            >
              4.5 FT
            </button>

            <button
              id="cutaway-10ft-btn"
              onClick={() => setWallMode('10ft')}
              style={{
                padding: '4px 8px',
                fontSize: '0.68rem',
                fontWeight: wallMode === '10ft' ? 700 : 500,
                background: wallMode === '10ft' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                border: wallMode === '10ft' ? '1px solid #0284C7' : 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: wallMode === '10ft' ? '#0369A1' : '#474943',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Cutaway 10ft — High cutaway for inspecting full building walls and tall elements"
            >
              10 FT
            </button>

            <button
              id="cutaway-full-btn"
              onClick={() => setWallMode('full')}
              style={{
                padding: '4px 8px',
                fontSize: '0.68rem',
                fontWeight: wallMode === 'full' ? 700 : 500,
                background: wallMode === 'full' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                border: wallMode === 'full' ? '1px solid #16a34a' : 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: wallMode === 'full' ? '#15803d' : '#474943',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              title="Full Enclosed — Full 10ft enclosed architectural walls with door leaves & lintels"
            >
              FULL
            </button>
          </div>

          {/* Landscaping Master & Feature Toggles */}
          <button
            onClick={() => setLandscapingEnabled(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: landscapingEnabled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(250, 248, 242, 0.95)',
              backdropFilter: 'blur(12px)',
              border: landscapingEnabled ? '1px solid #16a34a' : '1px solid #E7E1D5',
              borderRadius: '6px',
              cursor: 'pointer',
              color: landscapingEnabled ? '#15803d' : '#777970',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title={landscapingEnabled ? "Disable 3D site landscaping presentation" : "Enable 3D site landscaping (lawn, pool, boundary walls, trees)"}
          >
            <Trees size={12} />
            <span>{landscapingEnabled ? 'SITE: ON' : 'SITE: OFF'}</span>
          </button>

          {landscapingEnabled && (
            <div style={{
              display: 'flex',
              background: 'rgba(250, 248, 242, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #E7E1D5',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px',
            }}>
              <button
                onClick={() => setShowPool(p => !p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '5px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: showPool ? '#0284c7' : 'transparent',
                  color: showPool ? '#ffffff' : '#777970',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                title="Toggle Swimming Pool & Sun Deck"
              >
                <Waves size={11} />
                <span>POOL</span>
              </button>
              <button
                onClick={() => setShowBoundaryWalls(w => !w)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '5px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: showBoundaryWalls ? '#252622' : 'transparent',
                  color: showBoundaryWalls ? '#ffffff' : '#777970',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                title="Toggle Perimeter Boundary Walls"
              >
                <span>WALLS</span>
              </button>
              <button
                onClick={() => setShowTrees(t => !t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '5px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: showTrees ? '#15803d' : 'transparent',
                  color: showTrees ? '#ffffff' : '#777970',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                title="Toggle Trees & Palms"
              >
                <Palmtree size={11} />
                <span>TREES</span>
              </button>
            </div>
          )}

          {/* Time of Day Presets (Morning / Noon / Golden Hour / Night) */}
          <div style={{
            display: 'flex',
            background: 'rgba(250, 248, 242, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #E7E1D5',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px',
          }}>
            <button
              onClick={() => setTimeOfDay('morning')}
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: timeOfDay === 'morning' ? '#F59E0B' : 'transparent',
                color: timeOfDay === 'morning' ? '#FFFFFF' : '#777970',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Morning Sunlight (32° soft warm light)"
            >
              <Sun size={12} />
              <span>AM</span>
            </button>
            <button
              onClick={() => setTimeOfDay('noon')}
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: (timeOfDay === 'noon' || timeOfDay === 'day') ? '#252622' : 'transparent',
                color: (timeOfDay === 'noon' || timeOfDay === 'day') ? '#FAF8F2' : '#777970',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Noon Direct Sun (High elevation architectural daylight)"
            >
              <Sun size={12} />
              <span>NOON</span>
            </button>
            <button
              onClick={() => setTimeOfDay('golden_hour')}
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: (timeOfDay === 'golden_hour' || timeOfDay === 'sunset') ? '#EA580C' : 'transparent',
                color: (timeOfDay === 'golden_hour' || timeOfDay === 'sunset') ? '#FAF8F2' : '#777970',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Golden Hour (Low angle honey amber sun & long shadows)"
            >
              <Sunset size={12} />
              <span>GOLDEN</span>
            </button>
            <button
              onClick={() => setTimeOfDay('night')}
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: timeOfDay === 'night' ? '#1E3A8A' : 'transparent',
                color: timeOfDay === 'night' ? '#93C5FD' : '#777970',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Night Moonlight & Interior 2700K Architectural Glow"
            >
              <Moon size={12} />
              <span>NIGHT</span>
            </button>
          </div>

          {/* Render Quality Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(250, 248, 242, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #E7E1D5',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px',
          }}>
            <button
              id="quality-high-btn"
              onClick={() => setQualityTier('high')}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: qualityTier === 'high' ? '#047857' : 'transparent',
                color: qualityTier === 'high' ? '#ffffff' : '#777970',
                fontSize: '0.66rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              title="High Quality (Bloom, Contact Shadows 1024, SMAA Antialiasing)"
            >
              HQ
            </button>
            <button
              id="quality-med-btn"
              onClick={() => setQualityTier('med')}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: qualityTier === 'med' ? '#0369a1' : 'transparent',
                color: qualityTier === 'med' ? '#ffffff' : '#777970',
                fontSize: '0.66rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              title="Medium Quality (Bloom, Contact Shadows 512)"
            >
              MED
            </button>
            <button
              id="quality-low-btn"
              onClick={() => setQualityTier('low')}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: qualityTier === 'low' ? '#475569' : 'transparent',
                color: qualityTier === 'low' ? '#ffffff' : '#777970',
                fontSize: '0.66rem',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              title="Performance Mode (Ultra-smooth 60 FPS on low-power devices)"
            >
              PERF
            </button>
          </div>

          <div style={{ width: '1px', height: '16px', background: '#E7E1D5', margin: '0 2px' }} />

          {/* Quick 3D Render Export Actions (1080P & 4K UHD) */}
          <div style={{ display: 'flex', gap: '3px' }}>
            <button
              id="dock-export-render-btn"
              onClick={() => handleQuickExport('1080p')}
              disabled={isExportingRender}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #365FA8',
                background: '#FAF8F2',
                color: '#365FA8',
                fontSize: '0.70rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: isExportingRender ? 'not-allowed' : 'pointer',
                opacity: isExportingRender ? 0.6 : 1,
                transition: 'all 0.15s ease',
              }}
              title="Export High-Resolution 1080p Architectural Render (PNG)"
            >
              <Download size={11} />
              <span>{isExportingRender ? 'RENDERING...' : '1080P'}</span>
            </button>
            <button
              id="dock-export-4k-btn"
              onClick={() => handleQuickExport('4k')}
              disabled={isExportingRender}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 7px',
                borderRadius: '4px',
                border: '1px solid #7c3aed',
                background: '#FAF8F2',
                color: '#7c3aed',
                fontSize: '0.70rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: isExportingRender ? 'not-allowed' : 'pointer',
                opacity: isExportingRender ? 0.6 : 1,
                transition: 'all 0.15s ease',
              }}
              title="Export Ultra-HD 4K Architectural Render (PNG)"
            >
              <span>4K</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Contextual Secondary Toolbars ────────────────────────────────────── */}
      {/* A. Presentation Tour Floating Header */}
      {isTourActive && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid #38bdf8',
          borderRadius: '8px',
          padding: '6px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          fontSize: '0.74rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#f8fafc',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>TOUR {tourStep + 1}/{TOUR_STEPS.length}:</span>
              <strong>{TOUR_STEPS[tourStep].title}</strong>
            </div>
            <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
              {TOUR_STEPS[tourStep].subtitle}
            </div>
          </div>
          <button
            onClick={handleStopTour}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              border: 'none',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Square size={10} />
            <span>EXIT</span>
          </button>
        </div>
      )}

      {/* B. Section Mode Controls: Front / Side / Rear Cut Direction + Depth Slider */}
      {vizMode === 'section' && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(24, 24, 27, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '3px 10px',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)',
          fontSize: '0.70rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#fef3c7',
        }}>
          <Scissors size={12} color="#f59e0b" />
          <strong style={{ marginRight: '2px' }}>SECTION:</strong>
          <button
            id="btn-section-cut-front"
            onClick={() => setSectionCutDirection('front')}
            style={{
              padding: '3px 7px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: sectionCutDirection === 'front' ? '#f59e0b' : '#27272a',
              color: sectionCutDirection === 'front' ? '#09090b' : '#d4d4d8',
              fontWeight: 600,
            }}
          >
            FRONT
          </button>
          <button
            id="btn-section-cut-side"
            onClick={() => setSectionCutDirection('side')}
            style={{
              padding: '3px 7px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: sectionCutDirection === 'side' ? '#f59e0b' : '#27272a',
              color: sectionCutDirection === 'side' ? '#09090b' : '#d4d4d8',
              fontWeight: 600,
            }}
          >
            SIDE
          </button>
          <button
            id="btn-section-cut-rear"
            onClick={() => setSectionCutDirection('rear')}
            style={{
              padding: '3px 7px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: sectionCutDirection === 'rear' ? '#f59e0b' : '#27272a',
              color: sectionCutDirection === 'rear' ? '#09090b' : '#d4d4d8',
              fontWeight: 600,
            }}
          >
            REAR
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
            <span style={{ fontSize: '0.66rem', color: '#fcd34d' }}>CUT DEPTH:</span>
            <input
              type="range"
              min={-18}
              max={18}
              step={0.5}
              value={sectionOffsetFt}
              onChange={e => setSectionOffsetFt(Number(e.target.value))}
              style={{ width: '80px', accentColor: '#f59e0b', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.66rem', minWidth: '32px' }}>{sectionOffsetFt.toFixed(1)}′</span>
            {sectionOffsetFt !== 0 && (
              <button
                onClick={() => setSectionOffsetFt(0)}
                style={{
                  padding: '2px 5px',
                  borderRadius: '3px',
                  border: 'none',
                  background: '#3f3f46',
                  color: '#e4e4e7',
                  fontSize: '0.62rem',
                  cursor: 'pointer',
                }}
              >
                RESET
              </button>
            )}
          </div>
        </div>
      )}

      {/* C. X-Ray Opacity Control */}
      {vizMode === 'xray' && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(24, 24, 27, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #38bdf8',
          borderRadius: '6px',
          padding: '4px 10px',
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.2)',
          fontSize: '0.70rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#e0f2fe',
        }}>
          <strong style={{ color: '#38bdf8' }}>X-RAY WALL OPACITY:</strong>
          <input
            id="xray-opacity-slider"
            type="range"
            min={0.10}
            max={0.80}
            step={0.05}
            value={xrayOpacity}
            onChange={e => setXrayOpacity(Number(e.target.value))}
            style={{ width: '90px', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 700, minWidth: '36px' }}>{Math.round(xrayOpacity * 100)}%</span>
        </div>
      )}

      {/* D. Exploded Separation Distance Control */}
      {viewMode === 'exploded' && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(24, 24, 27, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #a855f7',
          borderRadius: '6px',
          padding: '4px 10px',
          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.2)',
          fontSize: '0.70rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#f3e8ff',
        }}>
          <Maximize2 size={12} color="#c084fc" />
          <strong style={{ color: '#c084fc' }}>STACK SEPARATION:</strong>
          <input
            id="exploded-gap-slider"
            type="range"
            min={4}
            max={26}
            step={1}
            value={explodedGap}
            onChange={e => setExplodedGap(Number(e.target.value))}
            style={{ width: '90px', accentColor: '#a855f7', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 700, minWidth: '36px' }}>{explodedGap} FT</span>
        </div>
      )}

      {/* E. Single Floor Isolate Ghosting Switcher */}
      {viewMode === 'single' && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(24, 24, 27, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #38bdf8',
          borderRadius: '6px',
          padding: '4px 10px',
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.2)',
          fontSize: '0.70rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#e0f2fe',
        }}>
          <Layers size={12} color="#38bdf8" />
          <strong style={{ color: '#38bdf8' }}>FLOOR ISOLATION:</strong>
          <button
            onClick={() => setIsolateGhostMode(g => !g)}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: isolateGhostMode ? '1px solid #38bdf8' : '1px solid #64748b',
              background: isolateGhostMode ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: isolateGhostMode ? '#38bdf8' : '#94a3b8',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isolateGhostMode ? 'GHOST STACK: ON' : 'HIDE OTHERS'}
          </button>
        </div>
      )}

      {/* B. Walkthrough Mode Controls: Room Tour Switcher */}
      {vizMode === 'walkthrough' && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(24, 24, 27, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #10b981',
          borderRadius: '6px',
          padding: '3px 8px',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
          fontSize: '0.70rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#d1fae5',
        }}>
          <UserCheck size={12} color="#10b981" />
          <strong style={{ marginRight: '4px' }}>WALKTHROUGH:</strong>
          <button
            id="btn-walkthrough-prev"
            onClick={() => setWalkthroughRoomIndex(i => (i - 1 + activeFloorRooms.length) % Math.max(1, activeFloorRooms.length))}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: '4px',
              border: 'none',
              background: '#27272a',
              color: '#f4f4f5',
              cursor: 'pointer',
            }}
            title="Previous Room"
          >
            <ChevronLeft size={12} />
            <span>PREV</span>
          </button>
          <span style={{ color: '#34d399', fontWeight: 700 }}>
            {currentWalkthroughRoom ? `${currentWalkthroughRoom.name} (L${localActiveFloor})` : 'Room Interior'}
          </span>
          <button
            id="btn-walkthrough-next"
            onClick={() => setWalkthroughRoomIndex(i => (i + 1) % Math.max(1, activeFloorRooms.length))}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: '4px',
              border: 'none',
              background: '#27272a',
              color: '#f4f4f5',
              cursor: 'pointer',
            }}
            title="Next Room"
          >
            <span>NEXT</span>
            <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* ── Active Object Selection HUD ────────────────────────────────────────── */}
      {activeFurnitureItem && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #0284c7',
          borderRadius: '6px',
          padding: '6px 14px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#f8fafc',
          fontSize: '0.74rem',
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: '0 4px 16px rgba(0, 132, 199, 0.25)',
        }}>
          <span>
            <strong style={{ color: '#38bdf8' }}>SELECTED:</strong> {activeFurnitureItem.name} ({activeFurnitureItem.dimensionsFt.width}×{activeFurnitureItem.dimensionsFt.depth} ft)
          </span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span>ROTATION: {activeFurnitureItem.rotationDeg}°</span>
          <button
            onClick={() => onSelectFurniture?.(null)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              cursor: 'pointer',
            }}
          >
            DESELECT
          </button>
        </div>
      )}

      {/* ── Bottom-Left Architectural Info Badge ──────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(250, 248, 242, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #E7E1D5',
        borderRadius: '6px',
        padding: '5px 12px',
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.72rem',
        color: '#474943',
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}>
        <Info size={12} color="#365FA8" />
        <span>
          <strong style={{ color: '#252622' }}>
            {viewMode === 'single'
              ? `ISOLATED LEVEL L${localActiveFloor}: ${levels[localActiveFloor]?.name || 'FLOOR'}`
              : viewMode === 'active'
              ? `ACTIVE LEVEL L${localActiveFloor}: ${levels[localActiveFloor]?.name || 'FLOOR'}`
              : viewMode === 'exploded'
              ? `${numFloors} LEVELS EXPLODED`
              : `${numFloors} ${numFloors === 1 ? 'LEVEL' : 'LEVELS STACKED'}`}
          </strong>
          {' • '}
          <span style={{ color: '#0ea5e9', fontWeight: 700 }}>{vizMode.toUpperCase()} MODE</span>
          {' • '}
          {hasDuplexVoid && <span style={{ color: '#365FA8', fontWeight: 600 }}>DUPLEX VOID ACTIVE • </span>}
          <span>{wallMode === '4.5ft' ? 'CUTAWAY 4.5FT' : wallMode === '10ft' ? 'CUTAWAY 10FT' : 'ENCLOSED 10FT'}</span>
          {' • '}
          <span style={{ color: landscapingEnabled ? '#15803d' : '#777970', fontWeight: 600 }}>
            {landscapingEnabled ? (landscaping.pool?.isValid ? 'SITE & POOL ACTIVE' : 'SITE ACTIVE') : 'SITE OFF'}
          </span>
          {' • '}
          <span>AZIMUTH {entryDir.toUpperCase()}</span>
          {' • '}
          <span>CINEMATIC ARCHVIZ V2</span>
        </span>
      </div>

      {/* ── 3D Canvas ─────────────────────────────────────────────────────────── */}
      <ErrorBoundary>
        <Canvas
          camera={{
            position: [framing.targetPosition.x, framing.targetPosition.y, framing.targetPosition.z],
            fov: vizMode === 'walkthrough' ? 62 : 45,
            near: framing.near,
            far: framing.far,
          }}
          shadows={{ type: THREE.PCFSoftShadowMap }}
          gl={{
            antialias: true,
            localClippingEnabled: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onClick={() => onSelectFurniture?.(null)}
        >
          <ThreeBundleRegistrar
            onRegisterThreeBundle={(b) => {
              internalBundleRef.current = b;
              onRegisterThreeBundle?.(b);
            }}
          />
          <React.Suspense fallback={null}>
            <BuildingScene
              levels={levels}
              bounds={bounds}
              landscaping={landscaping}
              viewMode={viewMode}
              localActiveFloor={localActiveFloor}
              isCutaway={isCutaway}
              selectedFurnitureId={selectedFurnitureId}
              onSelectFurniture={onSelectFurniture}
              timeOfDay={timeOfDay}
              qualityTier={qualityTier}
              entryDir={entryDir}
              framing={framing}
              resetTrigger={resetTrigger}
              vizMode={vizMode}
              sectionPlane={sectionPlane}
              roomLabelMode={roomLabelMode}
              xrayOpacity={xrayOpacity}
              explodedGap={explodedGap}
              isolateGhostMode={isolateGhostMode}
              isTurntableActive={isTurntableActive}
            />
          </React.Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
