# AI Architect — Research, Architecture and Google Antigravity Prompt Package

Prepared 11 Oct 2026. Contents: (1) research findings, (2) recommended architecture, (3) master prompt, (4) phase prompts, (5) AGENTS.md (separate file), (6) verification checklist.

---

# DELIVERABLE 1 — RESEARCH AND PRODUCT FINDINGS

## 1.0 What was and was not verified (read this first)

**Inspected (page text fetched 11 Oct 2026):**
- https://www.architectgpt.io/ (homepage)
- https://trybuildflow.in/ (homepage)
- https://www.coohom.com/all-in-one-software (landing page)
- https://www.rayon.design/ (homepage)
- https://planner5d.com/use/free-floor-plan-creator (landing page)
- CC0 asset-source pages (Kenney Furniture Kit on OpenGameArt; aggregator pages for Quaternius, KayKit, Poly Haven)

**Not inspected, so nothing below should be read as evidence about them:**
- No live product editor was opened or used. No tutorial video was watched. I verified marketing and documentation text only, not actual drag, resize or snapping behavior.
- Not fetched: planner5d.com/tool, coohom.com/case/floor-planner, open.coohom.com/case/floor-planner, trybuildflow.in/tutorials and /workflows, Rayon documentation.
- **Reference F (`https://www.make`) is incomplete.** I did not guess the intended site. Please send the full URL if it matters.
- Library documentation (Three.js, R3F, Konva, Babylon, etc.) was **not** re-read for this package. Library recommendations below come from general knowledge; Antigravity must verify current versions and APIs.
- I have **not seen your repository**. "Shortcomings of the existing approach" is derived from your brief and must be confirmed by the Phase 0 audit.

Marketing claims (user counts, ratings, testimonials, speed claims) are excluded from findings. Coohom's page is internally inconsistent about catalog size (600K+, 10K+ and 3,000+ all appear), so treat any catalog-size number from competitors as unreliable.

## 1.1 Reference comparison

| Product | Verified from page text | Pattern worth learning | Nature of capability | Application to AI Architect | URL |
|---|---|---|---|---|---|
| **ArchitectGPT** | "Floorplan Visualization": plan image or DWG/DXF to furnished top-down render, walls/doors/fixtures "where it's drawn", labels removed. CADGPT: DWG to 3D model, render a room by chat. Text Edit, Before/After, Day-to-Dusk, 8-second walkthrough video from a still. | Before/after reveal; one-sentence edits; presentation output as a separate product from drafting. | Mostly **generative image/video**. Whether CADGPT's 3D model is editable was not verified. | Presentation render must come from your own geometry. AI image enhancement is an optional, labeled add-on conditioned on a deterministic render. | https://www.architectgpt.io/ |
| **BuildFlow** | Brief/sketch/PDF/CAD to editable plan, IFC model, browser 3D model, renders, walkthrough film (video via Kling AI per page). Floor-plan editor to draw walls, doors, windows; auto room schedules; live cost; Vastu analysis. IFC viewer with per-element properties and model tree. Walkthrough camera paths claimed to be computed from door swings. Same-home flat-plan vs photoreal slider. | Single brief-to-everything pipeline; room schedule beside the plan; per-element property inspection; IFC as interchange. Closest conceptual match to your product (Indian market, Vastu). | Mixed: editable geometry (claimed), algorithmic (Vastu, BOQ), generative (renders, video). Editing depth **not verified**. | Copy the pipeline shape and the schedule/analysis panels. Consider IFC export later as an optional extension, not a core requirement. | https://trybuildflow.in/ |
| **Coohom** | Upload plan to auto-wall-detected 3D project; catalog with brand dimensions; drag-drop; resize and rotate furniture; material swap; 4K cloud render in ~3 min (server-side); live budget widget; AI layout assistant; 360 share link. | Heavy rendering is **off the editing path** (cloud). Catalog filter by style/room. Dimensions on every item. | Geometry + asset catalog + cloud render. | Keep editor real-time and light; make "Render" an explicit, asynchronous action. Catalog needs search + category + dimensions. | https://www.coohom.com/all-in-one-software |
| **Rayon** | CAD/BIM tool set; wall tool with live distance/angle readout; item library (page says 4000+) with dimensions shown in metres; schedules generated from placed items; DWG/PDF import and export; real-time multiplayer; version history; AI asset search/generation; 100+ templates. | Live numeric readouts while drawing; schedules derived from model; version history; compact AI panel. | Precision drafting geometry. | Numeric entry + live dimension readouts; room/furniture schedule derived from the canonical model; snapshot history. | https://www.rayon.design/ |
| **Planner 5D** | Templates or exact measurements; drag to move walls, resize rooms, place furniture; 2D/3D toggle; virtual walkthrough; 8,000+ item catalog on this page (free tier gets about half); automatic furniture placement; photo-to-editable-plan AI; room scan. | Beginner flow: template, then dimensions, then furniture, then 3D. 2D for control, 3D to check. | Geometry editor plus catalog. | Wizard-to-editor flow; automatic furniture placement as a deterministic, rule-based command. | https://planner5d.com/use/free-floor-plan-creator |
| **Reference F** | **Unverified: incomplete URL.** | n/a | n/a | Excluded. | n/a |

**Cross-product conclusion (supported by all five pages):** every product separates (a) an editable geometric model with 2D/3D views and a dimensioned asset catalog from (b) a heavier, usually server-side or AI-driven presentation render. Your requirement that both derive from one model matches this pattern. What these pages do not show is *how* they keep walls, rooms and openings consistent; that must be designed and tested by you.

## 1.2 Asset licensing facts (verified)

- Kenney Furniture Kit: CC0; includes 3D models (page also mentions 2D isometric/top-down sprites). Source: https://opengameart.org/content/furniture-kit
- Kenney, Quaternius, KayKit, Poly Haven, AmbientCG: described as CC0 by aggregator pages; most downloads available as GLB/glTF. **Verify each model's license on its source page before bundling.** Aggregator: https://app.cinevva.com/game-assets/free-3d-furniture-models
- Caveat: these are largely low-poly, stylized game assets. They will give you a **small, honest, consistent catalog**, not 600K items. Poly Haven offers photoreal PBR models in smaller numbers. For Indian residential realism (bed sizes, Indian kitchen/pooja/wardrobe units, Western and Indian toilets) you will likely need custom parametric models for some categories.

## 1.3 Likely shortcomings of the current approach (hypotheses to confirm in audit)

Derived only from your description:
1. **Presentation:** forms, plan preview, analysis and unrelated controls consume the canvas; visual restyling outran functionality.
2. **Interaction:** objects likely selectable but not truly transformable; no real handles, snapping or numeric editing.
3. **Geometry:** generation likely BSP-based room rectangles; walls probably not a connected graph; resizing a room likely does not propagate to neighbors/openings.
4. **Rendering/assets:** furniture likely icons or primitives; 3D possibly a perspective effect or a separate representation.
5. **Data model:** probable duplicate representations (generator output vs. editor vs. 3D) that can diverge.
6. **Persistence:** unknown schema versioning, undo/redo, migration.
7. **Process:** prior agent runs produced UI that was not exercised with real mouse interactions; no geometry tests.

## 1.4 Prioritized recommendations

| # | Recommendation | Impact | Depends on | Risk | Effort |
|---|---|---|---|---|---|
| 1 | Canonical versioned building model + command/undo engine + validators | Very high | none | Medium | Large |
| 2 | 2D editor operating only through commands (wall graph, openings, furniture) | Very high | 1 | Medium-high | Large |
| 3 | Asset registry + GLB pipeline + real thumbnails + honest catalog | High | 1 | Low-medium | Medium |
| 4 | 3D view as pure projection of the model (same renderer for presentation) | High | 1, 3 | Medium | Medium-large |
| 5 | Presentation mode (top-down ortho, shadows, parametric landscaping) | High (visual goal) | 4 | Medium | Medium |
| 6 | Generator rework: seed + constraint search + validation, multiple candidates | High | 1 | High | Large |
| 7 | Dashboard, wizard, motion, Copilot via real commands | Medium | 1-2 | Low | Medium |
| 8 | Optional AI-enhanced render (external service) | Low-medium | 5 | Cost/ops risk | Small-medium |

---

# DELIVERABLE 2 — RECOMMENDED ARCHITECTURE

## 2.1 Data flow

```
Requirements wizard ──> Generator ──┐
                                    v
Legacy saved projects ──migrate──> CANONICAL BUILDING DOCUMENT (versioned JSON, SI units)
                                    │            ^
                  derived selectors │            │ commands only (validated, reversible)
   (areas, adjacency, door graph,   │            │
    schedules, Vastu inputs)        v            │
        ┌───────────┬─────────────┬──────────────┴───┐
        v           v             v                  v
   2D editor    3D editor    Presentation view   Copilot / forms / inspector
   (SVG/Canvas) (Three.js)   (same scene, ortho) (emit commands)
        │
        v
 Persistence (autosave + snapshots) · Export (PNG/PDF/JSON; optional IFC/DXF later)
```

Rule: **nothing renders from, or mutates, anything except the document.** 2D and 3D hold no authoritative geometry.

## 2.2 Canonical model (suggested; Antigravity adapts after audit)

- `schemaVersion`, `units: "m"` (store metres as floats, or integer millimetres if the audit shows float drift; decide once).
- `site`: plot polygon, entry side, north angle, setbacks.
- `levels[]`: id, elevation, height, slab thickness.
- `wallNodes[]` (id, x, y) and `walls[]` (id, levelId, startNode, endNode, thickness, height, kind: exterior/interior/partition, material). Walls form a **graph**; moving a node moves every incident wall.
- `openings[]` (door/window/arch): wallId, offset along wall, width, sill, head, swing/hinge. Positioned relative to a wall, so wall edits carry them along; validator rejects if the opening no longer fits.
- `rooms[]`: id, levelId, type, name, **bounding wall loop (derived from the wall graph) or explicit polygon**; area, adjacency and door connectivity are **derived**, never stored as truth.
- `stairs[]`/`voids[]`: levelId, footprint, connects levelA→levelB; validator checks alignment across floors.
- `items[]` (furniture/fixtures): assetId, levelId, position, rotation, elevation, scale or parametric dimensions, locked flag. Position stored in site coordinates; optional `hostRoomId` is derived.
- `materials`, `finishes` by room/wall face.
- `constraints[]` and `validation` results (derived).
- `meta`: name, created/updated, generator seed and inputs (so a layout can be regenerated).

## 2.3 Editing operations

All edits are **commands** (`moveWallNode`, `moveWall`, `resizeRoom`, `addOpening`, `moveItem`, `rotateItem`, `resizeItem`, `setDimension`, `deleteX`, `duplicateX`). Each command: (1) computes a candidate document, (2) runs validators, (3) commits or rejects with an actionable message, (4) records an inverse patch for undo. Implementation options: immer patches or a small explicit command history; the audit chooses based on the existing state library.

Propagation rules (must be unit-tested):
- Move/resize room boundary = move wall node(s); connected walls stretch; rooms sharing the wall update; openings keep their offset or clamp, and reject if they would not fit; items inside the affected room are kept where valid, flagged where they now collide or fall outside.
- Furniture transforms never alter walls. Structural ops never silently delete items; they flag them.
- Snapping: grid, wall endpoints, wall faces/midlines, room edges, item edges/centers; alignment guides shown during drag.
- Validators: no wall self-crossing, no room polygon overlap, min room dimension, opening fits within wall and clear of corners, items within walkable bounds (warning) and not penetrating walls (error or snap), stair alignment across levels, every habitable room reachable from entry through the door graph, exterior envelope closed.

## 2.4 Technology decision matrix

Decisions below are **defaults**; Phase 0 must confirm or overturn them with evidence from the repo (current stack, bundle size, existing renderer, measured performance).

| Area | Options | Default recommendation | Why / when to deviate |
|---|---|---|---|
| 2D editor | SVG with custom pointer layer; Konva/react-konva; Fabric.js; PixiJS | **SVG + custom interaction controller** if repo is React/DOM and scenes stay under a few thousand nodes; **react-konva** if the repo already uses it or a benchmark shows SVG lagging | Wall-graph handles, snapping and numeric readouts are custom regardless of library. Konva's Transformer suits rectangles/furniture, not wall graphs. SVG gives crisp vectors, free hit-testing, easy export. Fabric is object-centric and a poor fit for a shared graph model. Decide by benchmark, not popularity. |
| 3D engine | Three.js; React Three Fiber + drei; Babylon.js | **Three.js (via R3F + drei if the frontend is React)** | Do not run two 3D engines. Keep Babylon only if already in the repo and working. Walls built as extruded polygons with openings as holes in the wall-elevation shape (avoids CSG); slabs from room polygons. |
| Polygon ops | clipper2 (WASM/JS), polygon-clipping, earcut (bundled with three), Shapely (if Python backend) | Pick one JS library for offsetting wall thickness and room intersection tests; Shapely server-side if a Python backend exists | Robustness over speed. Add fuzz tests. |
| Furniture format | GLB (glTF binary) | GLB, optimized with gltf-transform (meshopt or Draco, KTX2 textures) | Thumbnails generated by a headless render script, not hand-drawn icons. |
| State/undo | immer patches, Zustand/Redux, or custom command stack | Whatever the repo uses + immer-style patches | Do not add a second state library without need. |
| Generation | BSP only; treemap; CP-SAT/constraint solver; simulated annealing; backtracking | **Hybrid**: zoning seed (treemap/BSP) → adjacency/constraint search with scoring → validators; multiple candidates | CP-SAT (OR-Tools) is strong if a Python backend exists; otherwise a custom backtracking/annealing search in TS. Do not add a solver without a measured quality gain over the current algorithm on a fixed benchmark set of plots. |
| Presentation render | Same Three.js scene, orthographic, shadows + AO + tone mapping; optional offline Blender/Cycles; optional AI image | **Three.js real-time first**; AI enhancement optional and labeled | External services need API keys/costs: document, never assume configured. |

## 2.5 Generation algorithm guidance

1. Keep the current algorithm as the baseline; build a **benchmark suite** (e.g. 50 plots across sizes/aspect ratios/entry directions/floor counts) measuring: success rate, validity (all validators pass), time, min room dimension, circulation ratio, adjacency satisfaction, Vastu score.
2. Improve only where the benchmark shows a gap. Candidates: adjacency graph (kitchen–dining, bedroom–bath), zoning by entry side, stair/wet-core alignment across floors, scoring function, N-candidate generation with deterministic seeds.
3. Output must be the **canonical document** (wall graph + openings + rooms), not a separate shape.
4. Validate generated output with the same validators the editor uses.

## 2.6 Persistence, versioning, migration

- Document carries `schemaVersion`; migrations are pure functions `vN → vN+1` with fixture tests.
- Autosave (debounced) to backend if one exists, otherwise IndexedDB; manual save creates a named snapshot. Keep the undo stack in memory; persist snapshots, not every command.
- Existing saved projects: write a legacy→canonical importer first, keep the original payload untouched next to the migrated document until the user confirms.
- Large assets (GLBs, textures) are never stored in the document; only `assetId` references.

## 2.7 Presentation renderer

Top-down orthographic (or slight elevation) camera over the 3D scene; roof hidden; walls with visible thickness; per-room floor materials; PCF-soft or baked shadows; ambient occlusion; tone mapping; outdoor: parametric lawn from the plot polygon minus the footprint, hedges along boundaries, paths from entry, trees/shrubs from a small CC0 plant set, driveway/parking when requested. Export PNG at selectable resolution. Separate from the drafting view so decoration never hurts dimension clarity. Be candid that matching a hand-art reference image will need iteration and that stylized CC0 assets will not be photoreal.

## 2.8 Motion

- Landing/dashboard: restrained SVG/Canvas construction sequence (survey grid → plot → foundation → walls → extrusion); skippable; `prefers-reduced-motion` respected; must not delay "Create new design".
- Generation screen: if generation is one backend call, show a truthful loading state; reveal stages **only** if the engine actually emits them. On completion, animate the *real* result in (walls drawing, then furniture, then extrusion).
- Editor: motion only for selection, transform feedback and view transitions (2D↔3D).
- Presentation: camera easing, optional lighting reveal.

---

# DELIVERABLE 3 — GOOGLE ANTIGRAVITY MASTER PROMPT

> Copy everything between BEGIN and END.

=====BEGIN MASTER PROMPT=====

# ROLE
You are the principal engineer for **AI Architect**, an AI-assisted residential architectural design platform, working inside the existing repository. Your job is to **implement**, not to advise. Plan briefly, then build, run, test, fix and report honestly.

# THE PRODUCT, IN ONE SENTENCE
AI Architect must generate a building the user can actually work with, not merely an image of a building.

Users enter plot dimensions, orientation/entry direction, room requirements, floor count and preferences. The system generates an editable layout. The user edits it directly in 2D and 3D, places real furniture, runs analyses, saves/restores the project, and opens a polished top-down furnished presentation view with landscaping, all derived from one canonical geometry model.

# WHY THIS TASK EXISTS
Earlier redesign attempts produced attractive interfaces with weak underlying functionality (fake handles, icon-only furniture, 2D and 3D not in sync). **Success is measured by working behavior exercised through the real running app, not by how the UI looks.**

# NON-NEGOTIABLE REQUIREMENTS

1. **Real interactive editing.** Select walls, rooms, doors, windows, furniture. Drag/move; resize rooms via boundary/wall handles or numeric input; rotate and resize furniture; add from a library; delete; duplicate; snap to grid/endpoints/walls/other items; undo/redo; contextual dimensions and selection highlights; save and restore; switch 2D/3D without losing state. Structural edits must change the underlying geometry and propagate to connected walls, openings, room areas and affected items. **Do not create handles that only move a rectangle on screen.** If an operation cannot yet be done correctly, do not ship a fake handle; define the geometry operation and tests first, or omit the control and list it as a limitation.
2. **Real furniture library.** Each item has a real thumbnail (generated from its model), name, category, real-world dimensions, and a real 2D footprint and 3D model (GLB or parametric). Search + category filter + variations where they exist. Drag into the plan or click-to-place. The same item appears in 2D and 3D. Do not use unrelated generic icons or empty thumbnail boxes. Do not present a small catalog as a large commercial one: show the true item count.
3. **Two outputs from one model.** (a) Technical: clean, dimensioned, editable plan. (b) Presentation: furnished, top-down/elevated, shadows, materials, landscaping, balanced framing, resembling the owner's reference (a furnished top-down house plan on a landscaped site). Presentation is derived from the model. If an AI image service is used, it may only be an optional supplementary render, conditioned on the model's own render, clearly labeled "AI-enhanced illustration", never the authoritative plan.
4. **Real 3D.** Extruded walls, floor slabs, door/window openings, multiple floors, stairs where supported, furniture models, materials, lighting/shadows, orbit/pan/zoom, top/isometric/perspective cameras, floor isolation and exploded-floor view; first-person walkthrough where practical. The 3D scene reflects every edit.
5. **World-class UX.** Architecture-first layout (canvas dominant; forms and panels never swallow the drawing area), cinematic but functional motion, direct manipulation, fast shortcuts. Visual effects never substitute for working controls.

# RULES OF ENGAGEMENT
- Do not assume any technology, API or file exists because an older prompt or README says so. Verify in the repo.
- You may retain, improve, replace or rebuild subsystems when justified with evidence. No rewrite for its own sake. Any replacement ships with a migration strategy for project data, auth, APIs and features that must remain.
- Never leave the app broken between phases. Do not delete working code until its replacement works.
- No mock data standing in for real backend integration.
- Never claim something works because it renders. Test it by driving the real UI with real mouse/keyboard input.
- Report real outcomes of every check. Separate: passed, failed, regressions, limitations, not tested.
- Never represent Vastu/area/geometry checks as certified building-code compliance.
- No API keys, paid services or external dependencies may be assumed configured; document each one.
- Do not copy competitor interfaces, code, brand assets or copyrighted models. Use only properly licensed assets and record license/source per asset.
- When independent workstreams can run in parallel (e.g., asset pipeline vs. validators), you may use subagents; you remain responsible for integration and verification.

# RESEARCH CONTEXT (verified by the owner's assistant on 11 Oct 2026 from public pages; no live editor or video was inspected)
- ArchitectGPT (https://www.architectgpt.io/): plan image/DWG to furnished top-down render; "true to the drawing" claims; text-based edits; walkthrough video from a still. Largely generative imagery; treat as a model for the *presentation output*, not for editable geometry.
- BuildFlow (https://trybuildflow.in/): brief to editable plan, IFC, browser 3D, renders; wall/door/window drawing; auto room schedules; live cost; Vastu; per-element inspection. Model for pipeline and analysis panels. Editing depth unverified.
- Coohom (https://www.coohom.com/all-in-one-software): plan upload to 3D; drag-drop, resize, rotate furniture with real dimensions; cloud 4K renders kept off the editing path. Lesson: keep editing real-time, make heavy rendering explicit/asynchronous. Its catalog-size claims are inconsistent; ignore the numbers.
- Rayon (https://www.rayon.design/): live distance/angle readout while drawing walls; items library with dimensions; schedules derived from placed items; version history; compact AI panel.
- Planner 5D (https://planner5d.com/use/free-floor-plan-creator): template/exact-dimension start, drag to move walls/resize rooms, 2D↔3D, walkthrough, automatic furniture placement.
- Reference "https://www.make" was incomplete and is excluded.
- Assets: Kenney Furniture Kit is CC0 (https://opengameart.org/content/furniture-kit). Kenney, Quaternius, KayKit, Poly Haven, AmbientCG are reported as CC0 on aggregator pages (https://app.cinevva.com/game-assets/free-3d-furniture-models). **Verify each model's license on its source page.** These are mostly low-poly/stylized; plan custom parametric models for categories they miss (e.g., Indian kitchen units, pooja unit, wardrobes, Western/Indian toilets).
- Library docs (Three.js, R3F, drei, Konva, etc.) were not checked by the author: read current official docs yourself and use the versions the repo's package manager resolves.

# TARGET ARCHITECTURE (adapt after audit; justify deviations)
- **One canonical, versioned building document** (metres or integer mm; decide once). Entities: site/plot, levels, wall nodes, walls (graph), openings (attached to walls by offset/width/sill/head), rooms (derived from wall loops or explicit polygons), stairs/voids, items (assetId + transform), materials, constraints, derived validation. Areas, adjacency, door-connectivity, schedules and Vastu inputs are **derived selectors**, not stored.
- **All edits are commands**: compute candidate document → run validators → commit or reject with an actionable message → record inverse patch for undo/redo. UI, Copilot, keyboard shortcuts and numeric fields all use commands.
- **2D and 3D are projections** of the document; neither holds authoritative geometry.
- **Propagation rules:** moving a wall node moves incident walls; shared rooms update; openings keep offset or clamp, rejecting if they no longer fit; items in affected rooms are retained and flagged if now colliding. Furniture transforms never change walls. Structural ops never silently delete items.
- **Validators:** no wall crossings; no room overlap; min room dimension; opening fits and clears corners; items not penetrating walls; stair alignment across floors; closed exterior envelope; every habitable room reachable from entry via doors.
- **Persistence:** `schemaVersion` + pure migration functions with fixture tests; autosave + named snapshots; legacy-project importer that leaves the original payload intact; assets referenced by id, never embedded.
- **Technology defaults (confirm or overturn in Phase 0 with measurements):** 2D = SVG with a custom interaction controller (or react-konva if already in use or if a benchmark shows SVG lag); 3D = Three.js (R3F + drei if the frontend is React); no second 3D engine; walls as extruded polygons with openings as shape holes (avoid CSG); GLB assets optimized with gltf-transform; one polygon library (clipper2/polygon-clipping/earcut) fuzz-tested; generator = existing algorithm as baseline, improved by zoning seed + adjacency/constraint search + scoring + validators + multiple seeded candidates, only where a benchmark shows improvement.
- **Presentation:** same Three.js scene, orthographic top-down or slight elevation, roof hidden, wall thickness visible, per-room floor materials, soft shadows, AO, tone mapping, parametric landscaping (lawn from plot minus footprint, boundary hedges, entry path, trees/shrubs, driveway/parking), PNG export.

# PHASES (each must end with working, tested features; reorder only if dependencies demand it and say why)

**Phase 0 — Audit and design.** Inspect the full relevant repo. Record real versions of frontend/backend/3D/state libraries. Map pages, components, APIs, models, algorithms, assets. Trace generation → display → edit → save end-to-end. Run the app and existing tests; record the baseline. Classify each feature as working / broken / incomplete. Decide retain vs replace per subsystem with evidence (include a small 2D performance benchmark if choosing between SVG and Canvas). List data-migration needs. Write `docs/architecture-decision.md` and `docs/baseline.md`. Create/update AGENTS.md (provided separately). **Exit:** app still builds and runs; decisions documented.

**Phase 1 — Canonical model, commands, persistence.** Implement the document schema, validators, command engine with undo/redo, derived selectors, legacy importer, migrations. Unit tests for geometry, propagation, validators, migration. Adapter so existing UI still works while migrating. **Exit:** generated and legacy projects load into the canonical model; tests pass.

**Phase 2 — Functional 2D editor.** Selection, drag, wall-node/wall/room-boundary resize, numeric dimension editing, snapping with guides, openings placement/move, delete/duplicate, undo/redo, shortcuts, selection highlights, live dimensions, zoom/pan, floor switching. All through commands. **Exit:** Test 2 and Test 6 pass in the real UI.

**Phase 3 — Furniture system.** Asset registry (id, name, category, dimensions, GLB path, thumbnail path, license, source, attribution, tags, footprint, default elevation). Optimization + thumbnail generation scripts. Library panel with search/filter/dimensions/variations; drag-place and click-place; move/rotate/resize with collision and wall-snap; properties inspector; fallback model when an asset fails. Truthful item count. **Exit:** Test 3 passes.

**Phase 4 — Real 3D.** Walls, slabs, openings, furniture, stairs where supported, multi-floor, floor isolation/exploded view, orbit/pan/zoom, top/iso/perspective cameras, selection and transform in 3D where it maps to a command. Dispose geometries/materials/textures correctly. **Exit:** Test 4 passes; no leaks over repeated 2D↔3D switching.

**Phase 5 — Presentation renderer.** Implement the presentation mode from the model, landscaping, materials, lighting, camera framing, PNG export. Optional AI-enhanced render only if explicitly configured and labeled. **Exit:** Test 7 passes with screenshots.

**Phase 6 — Generation.** Build the benchmark suite first. Improve the generator only where benchmarks show a gap. Multi-floor alignment, multiple candidates, validation. Output = canonical document. **Exit:** benchmark results before/after reported; Test 1 passes with the real generator.

**Phase 7 — Dashboard, wizard, motion, advanced options, Copilot.** Architectural hero (skippable, reduced-motion safe, non-blocking). Wizard preserves state across steps with live plot diagram and summary. Advanced options marked active only if implemented. Compact, dismissible Copilot whose actions are commands; if a request can't be done, it says so honestly. Analysis panels (Vastu, areas, schedules) show real results with affected objects and no compliance claims. Truthful generation loading states. **Exit:** primary workflow completes without dead controls.

**Phase 8 — Integration and polish.** Full regression, responsive pass (desktop and a narrower viewport), console/network/backend-log review, performance measurement, bug fixing, visual polish, docs. **Exit:** all acceptance tests executed and reported.

# EXECUTION BEHAVIOR
- Keep going past planning. Use the terminal, the browser, and screenshots/recordings. Open the dev URL and perform the interactions with real mouse and keyboard input.
- After each meaningful change: build, lint/typecheck, run tests, exercise the affected flow, capture a screenshot, fix what you find.
- Protect existing API contracts and data. Document every changed/added/removed/migrated file.
- Keep a running `docs/progress.md`: phase status, tests run, results, limitations.

# ENGINEERING REQUIREMENTS
Type-safe code consistent with the stack; separation of UI, geometry operations, business logic and rendering; predictable coordinate transforms and unit conversions; validation of user edits and generated geometry; correct disposal of GPU resources; reusable UI components; maintainable asset registry; explicit loading and error states; tests for geometry operations, validators, migrations and key interactions; justified new dependencies; concise documentation.

# MANDATORY ACCEPTANCE TESTS (run in the real app; record evidence)
1. **Create a house:** enter plot dimensions, floors, rooms, entry direction, options; generate with the real generator.
2. **Modify a room:** select a room, resize one boundary; verify dimensions, connected walls, neighboring rooms, openings and items update per the propagation rules.
3. **Move furniture:** find a desk in the library; inspect thumbnail and dimensions; place in a bedroom; drag; rotate; resize; verify the same object changes in 2D and 3D.
4. **Inspect 3D:** switch to 3D; orbit, zoom, isolate a floor; verify furniture and structural edits are reflected.
5. **Save and restore:** save; refresh/reopen; verify geometry, furniture, project details intact. Also load a legacy project through the migration path.
6. **Validate geometry:** attempt overlap, disconnected geometry, invalid dimensions, an opening that no longer fits; verify rejection or actionable feedback and that the document stays valid.
7. **Presentation:** open the presentation view; verify a furnished, landscaped, top-down/elevated view of the actual model; export PNG.
8. **Regression/usability:** authentication, project navigation, analyses, exports, multi-floor, existing verified features; desktop and narrow viewport; console errors; failed requests; backend logs.
Do not mark a test passed unless it was performed. Report failures, regressions, limitations and untested items separately.

# QUALITY BAR (definition of done)
Architecture-first layout; precise, consistent dimensions/units; real manipulation of real objects; recognizable, correctly sized, searchable furniture; presentation with materials/lighting/landscaping; one design system across dashboard, wizard, editor, library, analysis, presentation; motion that communicates state and never blocks work; responsive editing with performance targets **measured from the actual app** (state your measurements, don't invent benchmarks); the project builds and runs; core existing features preserved or with a documented migration. Final report: what changed, what was verified (with evidence), what remains, known limitations, required keys/services.

=====END MASTER PROMPT=====

---

# DELIVERABLE 4 — PHASE EXECUTION PROMPTS

> Each assumes the master prompt and AGENTS.md are already loaded in the workspace. Paste one at a time.

**Phase 0**
```
Phase 0 — Audit only; do not refactor. Depends on: nothing.
Inspect the whole repo. Record real versions and the actual generation→edit→save flow. Run the app and existing tests; capture baseline screenshots and results. Classify features working/broken/incomplete. Decide retain/replace for 2D engine, 3D engine, generator, state, persistence, asset handling, with evidence (benchmark SVG vs Canvas if undecided). List migration needs.
Deliver docs/baseline.md and docs/architecture-decision.md.
Acceptance: app builds/runs unchanged; every decision cites repo evidence.
Regression: none (no behavior changes).
```

**Phase 1**
```
Phase 1 — Canonical model + commands + persistence. Depends on: Phase 0 decisions.
Implement the versioned building document, validators, command engine with undo/redo, derived selectors, legacy importer, migrations, adapter for the current UI.
Acceptance: unit tests for wall-graph propagation, opening fit, room overlap, undo/redo round-trip, migration fixtures; generated + legacy projects load into the canonical model.
Regression: existing flows still run through the adapter; no data loss on existing saved projects.
```

**Phase 2**
```
Phase 2 — Functional 2D editor. Depends on: Phase 1.
Selection, drag, wall-node/room-boundary resize, numeric dimensions, snapping + guides, openings, delete/duplicate, undo/redo, shortcuts, zoom/pan, floor switching — all via commands. No fake handles.
Acceptance: drive the real UI to resize a room and confirm connected walls/openings/areas update; attempt invalid edits and confirm rejection with feedback; screenshots recorded.
Regression: save/restore, generation, auth still work.
```

**Phase 3**
```
Phase 3 — Furniture system. Depends on: Phase 1 (Phase 2 for placement UX).
Asset registry with license/source per asset; optimization + thumbnail scripts; searchable/filterable library with dimensions; drag/click placement; move/rotate/resize with collision and wall snapping; inspector; fallback model; truthful count.
Acceptance: place a desk in a bedroom, drag, rotate, resize; thumbnails are rendered from real models; undo/redo works.
Regression: Phase 2 editing, persistence of placed items.
```

**Phase 4**
```
Phase 4 — Real 3D. Depends on: Phases 1 and 3.
Walls with openings, slabs, multi-floor, stairs where supported, furniture models, cameras, floor isolation/exploded view, selection/transform mapped to commands, proper disposal.
Acceptance: edits in 2D appear in 3D and vice versa; repeated 2D↔3D switching does not leak GPU memory (report measurement).
Regression: 2D editor, save/restore.
```

**Phase 5**
```
Phase 5 — Presentation renderer. Depends on: Phase 4.
Top-down/elevated ortho view from the model: wall thickness, room materials, soft shadows, AO, parametric landscaping, framing, PNG export. Optional AI-enhanced render only if configured and labeled.
Acceptance: screenshots of a furnished landscaped plan generated from the real saved model; drafting view unaffected.
Regression: 3D editing performance.
```

**Phase 6**
```
Phase 6 — Generation. Depends on: Phase 1.
Build a benchmark suite (≈50 plots) and record the baseline. Improve the generator only where benchmarks show gaps (adjacency, zoning by entry, wet-core/stair alignment, scoring, seeded candidates). Output the canonical document and run the shared validators.
Acceptance: before/after table (success rate, validity, time, min room size, circulation, adjacency); Test 1 passes.
Regression: Vastu analysis still consumes the generated plans.
```

**Phase 7**
```
Phase 7 — Dashboard, wizard, motion, Copilot, analysis. Depends on: Phases 1–2 (3–5 for full effect).
Skippable architectural hero (reduced-motion safe); wizard with persisted state, live plot diagram, summary; advanced options active only when implemented; truthful generation loading; compact dismissible Copilot issuing real commands or declining honestly; analysis panels with affected objects and no compliance claims.
Acceptance: complete wizard→generate→edit flow with no dead controls; reduced-motion verified.
Regression: Tests 1–7.
```

**Phase 8**
```
Phase 8 — Integration. Depends on: all.
Run Tests 1–8 end to end on desktop and a narrow viewport; review console, network and backend logs; measure performance; fix defects; polish; update docs/progress.md.
Acceptance: report passed/failed/untested honestly with evidence.
```

---

# DELIVERABLE 5 — AGENTS.md

Provided as a separate file: `AGENTS.md` (place at the repository root).

---

# DELIVERABLE 6 — VERIFICATION CHECKLIST

**Mandatory**
- [ ] Phase 0 docs exist and cite repository evidence for each retain/replace decision.
- [ ] One canonical, versioned document; 2D, 3D, presentation and analyses read from it (no parallel geometry).
- [ ] Every edit goes through a command; undo/redo works for each edit type, including multi-step drags.
- [ ] Resizing a room moves shared wall nodes and updates neighbors, openings and areas correctly (Test 2).
- [ ] Invalid edits are rejected with an actionable message and leave the document valid (Test 6).
- [ ] No handle exists that does not change real geometry.
- [ ] Furniture: real thumbnails from real models, correct dimensions, search + category filter, drag/click placement, move/rotate/resize, same object in 2D and 3D (Test 3).
- [ ] Catalog count shown is true; every asset has license + source recorded; fallback model works.
- [ ] 3D: extruded walls, slabs, openings, multi-floor, orbit/pan/zoom, top/iso/perspective, floor isolation; reflects every edit (Test 4).
- [ ] No GPU/memory growth after repeated 2D↔3D switching (measured).
- [ ] Save/refresh/restore preserves everything; a legacy project migrates without loss (Test 5).
- [ ] Presentation view derived from the model, with landscaping, shadows, materials; PNG export works (Test 7).
- [ ] Generator output is the canonical document and passes the shared validators; benchmark before/after reported (Test 1).
- [ ] Copilot actions are real commands or honest refusals.
- [ ] Analyses show real results, no code-compliance claims.
- [ ] Auth, navigation, exports, multi-floor still work; desktop and narrow viewport checked; no unexplained console errors or failed requests (Test 8).
- [ ] App builds, tests run, and results are reported honestly (including failures and untested items).
- [ ] Reduced motion supported; hero never blocks "Create new design".
- [ ] Every external dependency, API key or paid service is documented.

**Optional / future**
- [ ] IFC or DXF export; DWG import.
- [ ] AI-enhanced illustration render (labeled).
- [ ] Walkthrough video generation.
- [ ] Real-time multi-user collaboration; comments.
- [ ] BOQ/cost estimation; photo/sketch-to-plan import.
- [ ] Larger licensed furniture catalog or custom model pipeline.
