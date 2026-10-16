# AI Architect — Baseline Audit Report (Phase 0)

*Date: October 11, 2026*  
*Repository Root: `AI-Architect/`*  
*Auditor: Antigravity Agent*

---

## 1. Executive Summary

This deep repository audit establishes the empirical baseline of the existing AI Architect platform. The audit was conducted strictly against the active codebase, executed processes, live browser interactions, and test suites.

**Core Finding:** The project has an impressive visual shell, working FastAPI and React 19 apps, and rich advisory calculation engines (Vastu, NBC, BOM, Sunlight). However, the **architectural core is currently an illusion of rectangles**:
1. **No Wall Graph:** Walls do not exist as independent entities in the data model. Rooms are isolated axis-aligned bounding boxes (`x, y, width, height`).
2. **Heuristic Editing:** Room resizing does not propagate topologically to incident walls, shared nodes, or openings. Edits either clamp naively, push adjacent room boundaries by bounding-box delta matching, or fail collision checks.
3. **No Real 3D Asset Library:** Furniture in 3D consists of procedural Three.js `<Box>`, `<Cylinder>`, and `<Sphere>` compositions embedded directly in a 2,598-line component (`FloorPlan3D.tsx`). There is not a single `.glb`, `.gltf`, or `.obj` file in the repository.
4. **No True Thumbnails:** The furniture catalog displays text labels with Lucide icon names; there are no rendered thumbnail images.
5. **No Presentation Mode:** There is no dedicated top-down orthographic presentation renderer with parametric landscaping and shadows as envisioned.
6. **Persistence is Untyped & In-Memory Fallback:** Saved projects store an unversioned `layout_data: dict`. Furthermore, `MONGO_URI` in `backend/.env` points to an unresolvable remote Atlas host, silently triggering an in-memory dictionary fallback on every database operation.

---

## 2. Verified Technology Stack & Installed Versions

### 2.1 Runtime Environment
- **Operating System:** Windows 11 (build 10.0.26100)
- **Node.js:** `v24.19.0`
- **npm:** `11.17.0`
- **Python:** `3.12.10`

### 2.2 Frontend Stack (`frontend/package.json`)
| Package | Declared Version | Verified Role |
| :--- | :--- | :--- |
| `react` / `react-dom` | `19.2.5` | Core UI library |
| `typescript` | `6.0.2` | Language tooling |
| `vite` | `8.0.10` | Build tool and dev server |
| `react-router-dom` | `7.15.1` | Client-side routing |
| `three` | `^0.185.1` | WebGL rendering library |
| `@react-three/fiber` | `^9.7.0` | React reconciler for Three.js |
| `@react-three/drei` | `^10.7.8` | Three.js helpers & shader primitives |
| `@react-three/postprocessing`| `^3.1.1` | Post-processing effects (vignette, etc.) |
| `framer-motion` | `^14.0.0` | Micro-animations and drawer transitions |
| `lucide-react` | `1.16.0` | Icons |
| `react-hot-toast` | `2.6.0` | Notifications and toast feedback |
| `@supabase/supabase-js` | `^2.117.3` | Optional Supabase auth/DB client |

### 2.3 Backend Stack (`backend/requirements.txt` & pip environment)
| Package | Version | Verified Role |
| :--- | :--- | :--- |
| `fastapi` | `0.143.0` (req `0.115.6`) | Async REST API framework |
| `uvicorn` | `0.54.0` (req `0.34.0`) | ASGI web server |
| `pydantic` | `2.14.0` (req `2.12.3`) | Schema validation |
| `ezdxf` | `1.4.4` (req `1.4.3`) | AutoCAD DXF export generator |
| `motor` | `3.7.1` | Async MongoDB driver |
| `pymongo` | `4.18.3` | Underlying MongoDB client |
| `passlib` / `bcrypt` | `1.7.4` / `5.0.0` | Password hashing |
| `python-jose` / `cryptography` | `3.5.0` / `50.0.2` | JWT generation & verification |
| `reportlab` | `5.0.1` (req `4.1.0`) | Architectural PDF dossier generation |
| `pillow` | `12.3.0` (req `11.0.0`) | Concept sketch bitmap rendering |
| `pysolar` | `0.13` (req `0.11`) | Solar azimuth & daylight angle math |
| `google-genai` | `2.29.0` (req `0.3.0`) | Google Gemini SDK |
| `openai` | `3.27.0` (req `1.54.0`) | Groq & Hugging Face client |
| `json-repair` | `0.64.0` (req `0.35.0`) | LLM JSON sanitization |

---

## 3. Application Startup & Execution Commands

### 3.1 Backend Service
- **Command:** `python -m uvicorn main:app --port 8000 --host 127.0.0.1` (from `backend/`)
- **Status:** **RUNNING** on `http://127.0.0.1:8000`.
- **Startup Observations:**
  - Lifespan detects `GOOGLE_API_KEY` and initializes Google Gemini client.
  - Startup logs: `[startup] AI Architect live | Database Provider: mongodb | Auth Provider: jwt`.
  - DNS lookup for remote MongoDB Atlas cluster (`cluster.mongodb.net`) fails, triggering safe fallback to in-memory dictionary store (`repositories.py:108`).

### 3.2 Frontend Service
- **Command:** `npm run dev -- --host 127.0.0.1` (from `frontend/`)
- **Status:** **RUNNING** on `http://127.0.0.1:5173`.
- **Startup Observations:**
  - Vite v8.0.10 boots cleanly in 316 ms.

---

## 4. Baseline Build, Lint, and Test Results

### 4.1 Production Build (`npm run build`)
- **Command:** `tsc -b && vite build`
- **Result:** **PASSED** (0 compilation errors, built in 1.21s).
- **Bundle Output:**
  - `dist/index.html`: 1.24 kB
  - `dist/assets/index-BzAuV8Oe.css`: 5.41 kB
  - `dist/assets/index-BH86wxzi.js`: 2,154.56 kB (exceeds recommended 500 kB chunk warning threshold due to bundled Three.js + R3F + postprocessing).

### 4.2 Linter (`npm run lint`)
- **Command:** `eslint .`
- **Result:** **FAILED (21 errors, 2 warnings across 8 files)**.
- **Key Defects Discovered:**
  1. `FloorPlan3D.tsx:1552, 1557, 1565`: `useTexture` and `useMemo` called conditionally after early returns (`isVoid`, `isGazebo`, `isGarden`), violating React's fundamental Rules of Hooks.
  2. `InteractiveBlueprint.tsx:908`: `Date.now()` and `Math.random()` invoked during component render, violating React purity rules.
  3. `Editor.tsx:103, 112, 170`: `setState` called synchronously inside `useEffect` bodies causing cascading renders.
  4. `MultiFloorWizardModal.tsx:115`, `Dashboard.tsx:138`, `AuthContext.tsx:42`, `ArchitecturalInspectorDrawer.tsx:93`, `AtelierWorkspaceHeader.tsx:87`: similar cascading render effect warnings.
  5. `api.ts`, `CopilotAgentPanel.tsx`: `@typescript-eslint/no-explicit-any` errors.

### 4.3 Automated Integration Test (`scratch/test_e2e_full_workflow.py`)
- **Command:** `python scratch/test_e2e_full_workflow.py`
- **Result:** **PASSED (7/7 steps succeeded)**
  - Step 1: User Registration / JWT auth verified.
  - Step 2: 2-Floor generation (35×50 ft, North entry) verified. Ground floor (10 rooms), Upper floor (9 rooms). Staircase vertical alignment pinned at `x=13.5, y=33.44, w=8.0, h=10.0`.
  - Step 3: Persistence (`POST /projects`) verified.
  - Step 4: Furniture placement (`PUT /projects/{id}`) verified (`sofa_3_seater`, `light_chandelier`).
  - Step 5: AI Copilot invocation ("Expand Master Bedroom by 2 ft") verified. Resized from 8.58×12.50 ft to 10.58×12.50 ft.
  - Step 6: AutoCAD DXF export (`POST /api/export/dxf`) produced valid 129,808 byte DXF across 17 CAD layers.
  - Step 7: Blueprint PDF Dossier (`POST /api/export/pdf`) produced valid 131,323 byte vector PDF.

---

## 5. End-to-End User Workflow & Real Interaction Trace

Live browser tracing (`browser_subagent`) was performed on `http://127.0.0.1:5173`.

```
[1. Dashboard] 
       │ ──> Click "Create Design"
       v
[2. Architectural Brief Wizard (/editor?wizard=true)]
       │ ──> Input: 40×30 ft, East-facing, 2 Floors, Duplex, Vastu enabled
       │ ──> Click "Synthesize Layout"
       v
[3. Generation Pipeline]
       │ ──> Backend /generate: Google Gemini creates 3-bay topology
       │ ──> Drafter (architectural_layout.py) partitions canvas into bays
       v
[4. Atelier Editor]
       ├── Mode 1: "2D Drafting" (InteractiveBlueprint SVG)
       ├── Mode 2: "3D Massing" (FloorPlan3D Three.js canvas)
       ├── Mode 3: "Compliance" (Vastu, NBC, Daylight, BOM cost studio)
       └── Mode 4: "Alternatives" (Variant matrix comparison)
       v
[5. Inspect & Edit]
       ├── Click room: Properties drawer opens with dimensions
       ├── Drag room wall: Ad-hoc heuristic shifts adjacent bay boundaries
       ├── Drag furniture: Items move within room rectangle
       └── AI Copilot: Issues Natural Language prompt to backend agent
       v
[6. Export & Save]
       ├── DXF Export: Downloads valid .dxf CAD file
       └── PDF Dossier: Downloads 4-page ReportLab PDF
```

---

## 6. Audit of Architectural Capabilities

### Category A: Geometry and Editing
| Capability | Status | Verified Evidence & Source Files |
| :--- | :--- | :--- |
| **Rooms as structured geometric entities** | `PARTIALLY IMPLEMENTED` | Rooms exist only as `{name, x, y, width, height, doors, windows, furniture}` bounding boxes (`api.ts:40-49`). No polygon loops, no wall references. |
| **Walls have persistent connections & shared endpoints** | `NOT IMPLEMENTED` | Walls do not exist in the data model. There is no wall graph, no wall nodes, and no wall thickness in 2D (`InteractiveBlueprint.tsx:1093` uses a visual stroke constant `WALL = 0.4`). |
| **Doors & windows associated with actual walls** | `BROKEN` / `PARTIALLY IMPLEMENTED` | Openings are stored per-room as `wall: 'top'|'bottom'|'left'|'right'` and `position: number` (`api.ts:28-38`). They have no reference to a physical wall. Resizing a room does not update door offsets or check if doors still fit. |
| **Physical dimension correspondence** | `WORKING` | Dimensions represent feet in float values (`x`, `y`, `width`, `height`). Scaling is consistent across 2D and 3D views. |
| **Select and drag real objects** | `PARTIALLY IMPLEMENTED` | In 2D, clicking a room selects it. Furniture can be dragged within room bounds (`InteractiveBlueprint.tsx:940-959`). Rooms themselves cannot be translated across the canvas. |
| **Resizing a room updates geometry & connected walls** | `BROKEN` | Wall dragging (`InteractiveBlueprint.tsx:972-1048`) is an ad-hoc heuristic that searches for other room rectangles whose edges fall within `EPSILON = 0.5` ft of the dragged edge and modifies their bounding box. It frequently produces crushed rooms (`Math.max(2, ...)`), disconnected openings, or overlaps. |
| **Connected openings and neighboring rooms update** | `NOT IMPLEMENTED` | Resizing a room never shifts or validates door/window positions on adjacent rooms. |
| **Snapping and alignment** | `PARTIALLY IMPLEMENTED` | Hardcoded 0.5 ft grid snapping exists (`Math.round(val * 2) / 2`). No alignment guides, vertex snapping, or wall-face snapping. |
| **Undo and redo** | `PARTIALLY IMPLEMENTED` | `Editor.tsx:78` maintains an in-memory `history: Floor[][]`. However, direct 2D canvas room resizing and furniture dragging do NOT push snapshots to history! Only layout updates from Copilot/Vastu fix trigger undo snapshots. |
| **Invalid geometry detection** | `PARTIALLY IMPLEMENTED` | `validateRooms.ts` only checks for out-of-bounds (`x < 0, y < 0`) and pairwise rectangle overlap. No geometric validation for wall topology, opening clearance, or circulation validity during manual edits. |
| **Structural edits vs furniture edits separated** | `WORKING` | Furniture moves never mutate room boundaries; furniture is clamped to room interior bounds (`InteractiveBlueprint.tsx:952-953`). |

### Category B: 2D and 3D Synchronous Representation
| Capability | Status | Verified Evidence & Source Files |
| :--- | :--- | :--- |
| **Truly interactive 2D plan** | `PARTIALLY IMPLEMENTED` | Canvas renders rooms, door arcs, window lines, and furniture symbols, with room selection, pan/zoom, and furniture drag. Wall editing is brittle. |
| **Actual 3D geometry vs static visual** | `WORKING` | `FloorPlan3D.tsx` renders a real Three.js WebGL scene with extruded walls, floor slabs, cutaway mode (4.5 ft waist height), stairs, materials, and orbit/pan/zoom camera controls. |
| **Shared authoritative building model** | `PARTIALLY IMPLEMENTED` | Both 2D and 3D read from `floors[activeFloorIndex].rooms`. Edits in 2D immediately reflect in 3D when switching modes. However, because the underlying model lacks a wall graph, 3D generates duplicate walls for every room edge (`FloorPlan3D.tsx:1467-1470`). |
| **Multiple floors representation** | `WORKING` | Supports multi-floor stacking, floor switching (`L0`, `L1`), active floor isolation, and exploded-floor view (`EXPLODED_GAP = 14.0 ft`). |
| **State preserved when switching views** | `WORKING` | Switching between `2D Drafting`, `3D Massing`, and `Compliance` preserves state completely. |

### Category C: Furniture Catalog and Placement
| Capability | Status | Verified Evidence & Source Files |
| :--- | :--- | :--- |
| **Real thumbnails in catalog** | `NOT IMPLEMENTED` | `FurnitureCatalogDrawer.tsx:278` renders Lucide icon strings in a `<span>` element. No 2D rendered thumbnails or previews exist. |
| **3D furniture models exist** | `BROKEN` / `PARTIALLY IMPLEMENTED` | Zero `.glb`, `.gltf`, or `.obj` files exist in the repository. Furniture in 3D is procedurally constructed using hardcoded `<Box>`, `<Cylinder>`, and `<Sphere>` Drei primitives (`FloorPlan3D.tsx:500-1400`). |
| **Meaningful names and dimensions** | `WORKING` | `furnitureCatalog.ts` defines 24 items with realistic real-world dimensions in feet (e.g. 3-Seater Sofa: 7.0×3.0×2.8 ft; King Bed: 7.5×6.8×3.5 ft). |
| **Search and category filter** | `WORKING` | `FurnitureCatalogDrawer.tsx:43-54` supports live text search and category tabs ('Living Room', 'Bedroom', 'Kitchen & Dining', etc.). |
| **Insert, move, rotate, delete** | `WORKING` | Drag-and-drop from catalog drawer into rooms works (`InteractiveBlueprint.tsx:875-936`). Selected items can be rotated (`R` key, 45° step), moved, or deleted (`Delete` / `Backspace`). |
| **Persistence of placed furniture** | `WORKING` | Furniture is stored in `room.furniture[]` and persists through save/load and PUT endpoints. |
| **Asset licenses and sources documented** | `NOT IMPLEMENTED` | The asset items in `furnitureCatalog.ts` have no recorded license, attribution, or source tracking. |

### Category D: Generation and Visualization
| Capability | Status | Verified Evidence & Source Files |
| :--- | :--- | :--- |
| **Generator produces structured geometry** | `PARTIALLY IMPLEMENTED` | Generates a 3-bay rectangular partition (`architectural_layout.py`). Zero overlaps are guaranteed by construction via vertical `y`-cursor stacking. However, it cannot generate L-shaped, T-shaped, or non-3-bay floor plans. |
| **Multiple layout variations** | `PARTIALLY IMPLEMENTED` | `ComparePlansStudio.tsx` displays generated alternatives, but variations are limited by the rigid 3-bay template. |
| **Furnished architectural presentation** | `NOT IMPLEMENTED` | No dedicated presentation mode exists. Top-down view in 3D is a simple camera toggle without architectural framing, boundary hedges, entry paths, or soft presentation materials. |
| **Lighting, materials, and shadows** | `WORKING` | `FloorPlan3D.tsx` implements time-of-day lighting (Day, Sunset, Night), PBR materials (`getRoomMaterial`), point lights for fixtures, and ACES Filmic tone mapping. |
| **Construction animations** | `PARTIALLY IMPLEMENTED` | `ArchitecturalGenerationOverlay.tsx` shows animated stages, but stages are driven by a frontend timer rather than genuine backend progress events. |

### Category E: Persistence and Compatibility
| Capability | Status | Verified Evidence & Source Files |
| :--- | :--- | :--- |
| **Save and reload reliability** | `WORKING` (in-memory) | Projects save and reload cleanly via `/projects` REST API. However, due to unconfigured MongoDB DNS, persistence is currently in-memory. |
| **Versioned geometry schema** | `NOT IMPLEMENTED` | Payload is unversioned (`layout_data: dict`). No `schemaVersion` header, no migration functions. |
| **Backward compatibility risk** | `HIGH` | Replacing the room bounding box model with a wall graph requires a bidirectional adapter to prevent breaking existing saved projects and backend exporters (`dxf_exporter.py`, `pdf_report.py`, `floor_renderer.py`). |

---

## 7. Relevant Source Files and API Endpoints

### Key Frontend Components
- `src/modules/editor/pages/Editor.tsx`: Main workspace state orchestrator.
- `src/modules/editor/components/InteractiveBlueprint.tsx`: 2D SVG canvas drafting component (1,547 lines).
- `src/modules/editor/components/FloorPlan3D.tsx`: 3D Three.js WebGL visualization canvas (2,598 lines).
- `src/modules/editor/components/FurnitureCatalogDrawer.tsx`: Furniture asset drawer (387 lines).
- `src/modules/editor/constants/furnitureCatalog.ts`: Furniture catalog data specifications (374 lines).
- `src/modules/editor/components/RoomEditor.tsx`: Numeric dimension editor drawer.
- `src/modules/editor/components/ArchitecturalBriefWizard.tsx`: Plot & requirements brief wizard.
- `src/modules/editor/components/ComplianceSidebar.tsx`: Vastu, NBC, BOM, and Daylight compliance drawer.
- `src/shared/api-client/api.ts`: API client and data type definitions.

### Key Backend Modules
- `backend/main.py`: Application lifespan and router mounting.
- `backend/engines/architectural_layout.py`: Deterministic 3-bay drafter engine (1,643 lines).
- `backend/engines/inference.py`: LLM topological reasoning fallback chain (900 lines).
- `backend/engines/vastu_engine.py`: Vastu Shastra rule evaluation engine.
- `backend/engines/nbc_engine.py`: NBC-2016 building bylaws compliance evaluator.
- `backend/engines/bom_engine.py`: Bill of Materials and Indian cost estimation.
- `backend/services/agent_service.py` & `backend/services/layout_modifier.py`: AI Copilot action executor.
- `backend/exporters/dxf_exporter.py`: AutoCAD DXF file generator via `ezdxf`.
- `backend/exporters/pdf_report.py`: Platypus PDF report generator via ReportLab.
- `backend/db/repositories.py`: Data-access repository layer with in-memory fallback.

### API Endpoints Verified
- `POST /auth/register` & `POST /auth/login` (Auth)
- `POST /generate` (Multi-floor layout generation)
- `GET /projects` & `POST /projects` & `PUT /projects/{id}` (Persistence)
- `POST /api/agent/chat` (Copilot natural language modifications)
- `POST /api/export/dxf` (AutoCAD DXF export)
- `POST /api/export/pdf` (Architectural Blueprint PDF dossier)
- `POST /vastu-fix` (Algorithmic Vastu optimization)
