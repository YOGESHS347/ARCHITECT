# Phase 5: Signature Architectural Visualization — Architecture & Implementation Plan

*Document Version: 1.0*  
*Target: AI Architect Platform*  
*Date: October 11, 2026*  
*Status: Ready for Architecture Review*

---

## 1. Executive Summary & Design Direction

The objective of **Phase 5** is to elevate AI Architect's 3D rendering engine from a technical CAD massing viewer into a **Signature Architectural Visualization System**. 

The target visual quality is established by the user's reference designs:
1. **Top-Down Furnished Plan & Landscaped Plot (Reference 1)**:
   - A photorealistic, top-down architectural cutaway presenting a fully furnished single-story luxury villa.
   - Clean white structural walls with crisp wall-top caps.
   - Tactile room-specific flooring: warm wide-plank oak timber in living/bedrooms, large-format polished porcelain/marble in bathrooms, rich teak decking around the pool.
   - Distinctive furnished rooms: beds with duvets, pillows, and area rugs; bathrooms with freestanding soaking tubs and walk-in glass showers; central kitchen island with waterfall marble counter; deep sectional sofa with throw pillows and fireplace; walk-in wardrobes with organized shelving.
   - Fully developed landscaped site: turquoise swimming pool with water refraction, poolside sun loungers, outdoor dining, barbecue station, perimeter boundary walls, manicured hedges, and palm trees.
   - Natural directional sun shadows and soft contact ambient occlusion (AO) that reveal wall heights and structural depth.

2. **Isometric Dollhouse Cutaway (Reference 2)**:
   - A two-story architectural dollhouse slice showing Ground Floor living spaces and Upper Floor bedroom suites simultaneously.
   - Cantilevered balconies with tempered glass balustrades and slim handrails.
   - Floating open-riser timber staircase with glass/steel railings.
   - Warm interior ambient downlights casting warm glows ($2700\text{K} - 3000\text{K}$) through large floor-to-ceiling glass openings.

---

## 2. Architecture & Codebase Audit

### 2.1 Reusable Existing Assets & Systems
The project already contains a robust foundation that **must be preserved and reused**:
1. **Canonical Building Document (`CanonicalBuildingDocument` v1)**:
   - Contains exact wall graphs, node coordinates (in SI meters), wall thickness (9" exterior vs 4.5" interior), volumetric openings (doors & windows with offsets and dimensions), and room boundary polygons.
   - Single authoritative source of truth. **No parallel data models will be created.**
2. **CommandEngine & Transactional State**:
   - Reversible undo/redo, wall and furniture mutations, and multi-floor synchronization.
3. **Procedural Building Extrusion (`building3DGenerator.ts`)**:
   - Generates deduplicated watertight walls with physical cutouts for doors and windows (lintels, sills, glass panes, door leaves), multi-floor elevations, floor slabs, stairs, and duplex voids.
4. **Three.js & React Three Fiber Ecosystem (`package.json`)**:
   - `three`: `^0.185.1`
   - `@react-three/fiber`: `^9.7.0`
   - `@react-three/drei`: `^10.7.8`
   - `@react-three/postprocessing`: `^3.1.1`
   - Hardware-accelerated WebGL with ACES Filmic tone mapping, shadow maps, and OrbitControls.
5. **Authoritative 32-Asset Furniture Registry (`furnitureRegistry.ts`)**:
   - Maps each item to stable asset IDs, dual Imperial/Metric dimensions, rotation, default elevation, and light properties.

### 2.2 Critical Gaps to Solve in Phase 5
1. **Material Quality**: Existing floors and walls use flat colors or low-res texture repeats. Needs a dedicated PBR shader material palette (Oak, Porcelain, Marble, Travertine, Teak, Plaster, Glass, Water).
2. **Site Development & Landscaping**: The house currently sits on an empty infinite green lawn. Needs a parametric landscaped plot generator creating perimeter boundary walls, swimming pools, sun decks, patio pavers, and 3D greenery.
3. **Furniture Mesh Fidelity**: The 32 catalog items currently render as basic box assemblies. Needs procedural architectural meshes featuring cushions, duvets, pillows, marble waterfall counters, soaking tubs, vanities, and pool loungers.
4. **Presentation Camera & Lighting Rig**: Needs calibrated **`PRESENTATION PLAN`** (orthographic top-down cutaway) and **`DOLLHOUSE CUTAWAY`** camera presets, paired with soft directional sun shadows and screen-space ambient occlusion (SSAO/N8AO).
5. **High-Resolution Presentation Export**: Needs one-click 2K/4K presentation snapshot export with title block, North arrow, and scale bar.

---

## 3. Detailed Technical Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │      CanonicalBuildingDocument (v1)         │
                    │   (Walls, Rooms, Openings, Items, Site)      │
                    └──────────────────────┬───────────────────────┘
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 ▼                                                   ▼
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     building3DGenerator.ts      │                 │  siteLandscapingGenerator.ts    │
│  - Watertight walls & openings  │                 │  - Perimeter boundary walls     │
│  - Multi-floor slabs & stairs   │                 │  - Sunken pool & water shader   │
│  - Duplex voids & balconies     │                 │  - Teak sundeck & patio pavers  │
│  - Wall-top caps & trim         │                 │  - Palm trees, hedges & turf    │
└────────────────┬────────────────┘                 └────────────────┬────────────────┘
                 │                                                   │
                 └─────────────────────────┬─────────────────────────┘
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            FloorPlan3D.tsx Scene Graph                              │
│                                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │ architecturalMaterials  │  │  furniture3DMeshBuilder │  │ Camera & Lighting   │  │
│  │ - PBR Oak, Teak, Marble │  │  - 32 Architectural     │  │ - Top-down Plan Cut │  │
│  │ - Calacatta, Porcelain  │  │    Meshes (Beds, Sofas, │  │ - Dollhouse Cutaway │  │
│  │ - Physical Water Shader │  │    Tubs, Islands, etc.) │  │ - Soft Sun & SSAO   │  │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────┘  │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ High-Res Presentation Exporter (4K/2K WebGL Canvas Capture + Title Block)     │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 PBR Architectural Materials (`architecturalMaterials.ts`)
We will create a self-contained, high-performance PBR material system with zero external network dependencies:
- **White Oak Hardwood**: Semi-gloss satin finish with procedural plank joints and wood grain normal map for living rooms and bedrooms.
- **Calacatta Marble & Granite**: High-reflectivity polished stone with subtle veining for kitchen countertops, island waterfall edges, and bathroom vanities.
- **Polished / Matte Porcelain Tile**: Large-format ($60 \times 60\text{cm}$) tile grid with grout lines for en-suites and powder rooms.
- **Teak Timber Decking**: Warm golden-brown oiled timber with longitudinal plank grooves for the pool terrace.
- **Travertine / Limestone Pavers**: Textured outdoor stone tiles for walkways and patios.
- **Architectural Plaster**: Clean off-white (`#F8FAFC`) drywall with fine stipple bump and crisp top-cap trim.
- **Architectural Glass**: `MeshPhysicalMaterial` with `transmission: 0.95`, `roughness: 0.04`, `ior: 1.52`, and `thickness: 0.08` for sliding doors, windows, and balcony balustrades.
- **Physical Water Shader**: Refractive turquoise pool water with procedural normal wave motion, depth absorption, and caustic highlights.

### 3.2 Parametric Landscaped Plot Engine (`siteLandscapingGenerator.ts`)
Generates realistic outdoor environments anchored to canonical plot bounds:
1. **Perimeter Boundary Walls**: 6.5ft high smooth white masonry boundary walls with coping caps matching Reference 1.
2. **Sunken Swimming Pool**:
   - 4.0ft sunken basin with light cyan mosaic tile floor and walls.
   - Stepped shallow end with submerged entry stairs.
   - Coping perimeter border flush with patio.
   - Animated water surface plane with refractive turquoise shader.
3. **Teak Sun Deck & Patio**:
   - Elevated teak timber deck beside the pool accommodating sun loungers and outdoor dining.
   - Smooth light stone pavers connecting building thresholds to the garden.
4. **3D Greenery & Trees**:
   - Tall tropical Palm Trees (tapered textured trunks with arching feather fronds) positioned at corners and poolside.
   - Manicured boxwood privacy hedges lining the perimeter wall.
   - Potted decorative plants (fiddle-leaf figs, snake plants) on balconies and patio corners.

### 3.3 Enhanced 3D Furniture Procedural Engine (`furniture3DMeshBuilder.tsx`)
Upgrade the 32 catalog items into authentic architectural representations:
- **Beds (Master Bed, King, Queen, Single)**:
  - Upholstered fabric headboard with tufted/panelled details.
  - Wooden base frame with tapered legs.
  - Multi-layer mattress with folded duvet, contrast runner throw, and 4-6 angled pillows.
  - Floating woven area rug underneath extending into the bedroom.
  - Bedside nightstands with accent reading lamps.
- **Living Seating (3-Seater Sofa, L-Sectional, Armchair, Coffee Table)**:
  - Deep upholstered cushions, padded armrests, and decorative throw pillows.
  - Coffee table with marble/oak top and slim dark steel legs.
  - Media console / linear fireplace built into the feature wall.
- **Kitchen & Dining (Kitchen Island, Dining Table, Refrigerator, Counter)**:
  - Kitchen island with thick waterfall marble slab countertop, integrated undermount sink, gooseneck faucet, cooktop, and contemporary barstools.
  - 8-seater dining table with Scandinavian upholstered chairs and table centerpiece.
- **Bathrooms (Freestanding Tub, Glass Shower, Vanity, Toilet)**:
  - Sculptural oval freestanding soaking tub with chrome floor-mounted tap.
  - Frameless glass walk-in shower with chrome fixtures.
  - Floating vanity with dual white basins, wood drawers, and backlit mirrors.
- **Outdoor Fixtures (Pool Loungers, Dining Set, Barbecue)**:
  - Reclining teak sun loungers with white weather-resistant cushions.
  - Outdoor dining table with parasol umbrella.
  - Stainless steel barbecue cooking station.
- **Walk-in Wardrobe**:
  - Open closet system with upper shelving, hanging garment rails, and shoe compartments.

### 3.4 Camera Modes & Visual Atmosphere
1. **Presentation Plan Cut (`topdown`)**:
   - Orthographic top-down projection centered on the active floor.
   - Slices through walls at 4.5ft height, displaying crisp white caps.
   - Directional sunlight positioned at a 45° azimuth/elevation angle casting soft contact shadows that delineate room depth.
   - Soft screen-space ambient occlusion (SSAO) to ground furniture onto rugs and floors.
2. **Dollhouse Cutaway (`isometric` / `perspective`)**:
   - Axonometric 45° angle with interactive orbit and smooth zoom.
   - Multi-floor cutaway showing Ground Floor and sliced Upper Floor.
   - Glass balustrades and open-tread timber stairs connecting stories.
3. **Daylight & Night Atmosphere**:
   - **Daylight**: Crisp sun illumination, soft blue sky ambient fill, high contrast.
   - **Sunset / Golden Hour**: Warm $3200\text{K}$ low-angle sunlight with lengthened shadows.
   - **Night Architectural Glow**: Deep navy ambient sky with warm interior spotlights, chandeliers, and pool underwater illumination ($2700\text{K}$).

### 3.5 High-Resolution Presentation Exporter
- High-res snapshot capture directly from Three.js WebGL canvas (`preserveDrawingBuffer: true`).
- Supports downloading:
  - **Clean Presentation Render** (2K / 4K PNG).
  - **Architectural Sheet Presentation**: Render framed with title block, project name, date, level name, North arrow compass, and graphic scale bar.

---

## 4. Proposed Implementation Sequence

| Step | Milestone | Scope & Deliverables | Verification Strategy |
| :--- | :--- | :--- | :--- |
| **Step 1** | **PBR Material System** | Create `architecturalMaterials.ts` with PBR shaders (Oak, Teak, Porcelain, Calacatta Marble, Plaster, Glass, Water) and procedural texture generators. | Unit test texture generation, verify material parameters in Three.js test harness. |
| **Step 2** | **Parametric Landscaping & Pool Engine** | Create `siteLandscapingGenerator.ts` generating boundary walls, swimming pool with water shader, sun deck, pavers, palm trees, and hedges. | Verify geometry bounds, site integration, and zero memory leaks. |
| **Step 3** | **Enhanced 3D Furniture Meshes** | Create `furniture3DMeshBuilder.tsx` upgrading the 32 catalog items into authentic architectural representations (beds, sofas, tubs, islands, loungers). | Test all 32 assets in 3D scene; verify bounding box and rotation accuracy. |
| **Step 4** | **Presentation Camera & Lighting Pipeline** | Calibrate `FloorPlan3D.tsx` with Presentation Plan Cut mode, soft sun shadows, wall-top caps, and SSAO. | Capture live browser screenshots of both Presentation Plan Cut and Dollhouse Cutaway. |
| **Step 5** | **Presentation Export & Atelier UI** | Add high-res snapshot export with title block overlay and integrate controls into 3D toolbar. | Test 2K/4K PNG download in browser session; verify layout. |
| **Step 6** | **Regression Testing & Validation** | Run full test suite (`test_stabilization_suite.ts`, `test_furniture_suite.ts`, `test_geometry_suite.ts`, `pytest`, `npm run build`). | Ensure 100% test pass rate, 0 build errors, 0 runtime console errors. |

---

## 5. Expected Changed and New Files

### New Files to Create:
1. `frontend/src/modules/editor/geometry/architecturalMaterials.ts` — PBR materials & procedural textures.
2. `frontend/src/modules/editor/geometry/siteLandscapingGenerator.ts` — Parametric site, pool, deck, walls, and landscaping.
3. `frontend/src/modules/editor/components/furniture3DMeshBuilder.tsx` — Rich 3D architectural furniture components.
4. `frontend/src/modules/editor/geometry/test_visualization_suite.ts` — Automated visualization regression test suite.

### Existing Files to Enhance:
1. `frontend/src/modules/editor/components/FloorPlan3D.tsx` — Integrate new PBR materials, landscaping, furniture mesh builder, presentation plan mode, and snapshot export.
2. `frontend/src/modules/editor/geometry/building3DGenerator.ts` — Add wall-top caps, parapet details, and material assignment metadata.
3. `frontend/src/modules/editor/geometry/index.ts` — Re-export new visualization modules.
4. `docs/progress.md` — Document Phase 5 architecture, verification evidence, and benchmarks.

---

## 6. Risks & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Performance / GPU Frame Drop** | Heavy geometry from trees and furniture could drop FPS below 60fps on integrated GPUs. | Use instanced meshes (`<instancedMesh>`) for repetitive foliage/hedges; keep procedural furniture polycounts optimized ($< 800$ triangles per item); disable expensive post-processing during active orbit/pan navigation. |
| **External Asset Breakage** | External 3D GLTF downloads or CDN textures can fail, lag, or break offline. | **Zero external network dependencies.** All PBR textures and architectural furniture meshes are procedurally generated in code using SVG/Canvas data textures and Three.js primitives. |
| **Drift from Canonical Document** | 3D visual enhancements might diverge from 2D drafting coordinates. | All positions, rotations, and dimensions strictly derive from `CanonicalBuildingDocument.levels[].items[]` and `walls[]`. Any furniture moved in 2D instantly synchronizes in 3D. |
| **Shadow Artifacts / Acne** | Directional sun shadows might show jagged edges or surface banding on walls. | Configure high-resolution shadow map ($2048\text{px}$), tuned shadow camera frustum tightly bound to plot limits, `shadow.bias = -0.0005`, and PCFSoftShadowMap. |

---

## 7. Acceptance Criteria (Definition of Done)

1. **Visual Quality**:
   - Renders a top-down furnished architectural presentation closely matching Reference 1 (crisp white walls, oak/porcelain/teak floors, furnished beds/sofas/tubs/islands, swimming pool with water shader, sun deck, boundary walls, and tropical landscaping).
   - Renders an isometric two-story dollhouse cutaway closely matching Reference 2 (multi-floor slice, cantilevered balconies with glass railings, timber stairs, warm interior lighting).
2. **Architectural Accuracy**:
   - Single source of truth: 3D model reflects the exact walls, rooms, doors, windows, and placed furniture from the 2D plan and canonical document.
   - Dual Imperial & Metric dimensional fidelity preserved.
3. **Editing & Persistence Continuity**:
   - Moving, resizing, or deleting furniture in 2D or 3D updates both views in real time.
   - Saving and reloading projects preserves all design data without corruption.
   - Supabase authentication, PostgreSQL persistence, and project records remain untouched.
4. **Performance & Stability**:
   - Stable 60 FPS viewport rendering during orbit, pan, and zoom.
   - `npm run build` (`tsc -b && vite build`) passes with 0 errors.
   - All regression test suites pass with 100% success rate.
5. **Presentation Export**:
   - One-click high-resolution presentation snapshot download produces a publication-quality image with title block and scale elements.
