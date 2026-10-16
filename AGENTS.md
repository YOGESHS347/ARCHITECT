# AGENTS.md — AI Architect

Persistent rules for every agent session in this repository. Read before changing code.

## Product invariant
AI Architect generates a building the user can actually work with, not an image of one. A feature counts only if it works through the real running UI.

## Core invariants
1. **One canonical building document.** Versioned, single source of truth for plot, levels, wall graph, openings, rooms, stairs, items, materials. 2D, 3D, presentation, analysis and exports are projections. Never add a second authoritative geometry representation.
2. **All edits are commands.** Candidate document → validators → commit or reject with an actionable message → inverse patch for undo/redo. UI handles, numeric fields, shortcuts and the Copilot all use the same commands.
3. **Dimensional accuracy.** One unit system (decided in `docs/architecture-decision.md`). Convert only at the UI/export boundary. No magic scale factors. Tests cover conversions.
4. **No fake controls.** Never ship a handle, button, toggle or "active" option that does not change real geometry or state. If an operation is not yet valid, omit it and list it under limitations.
5. **Structural vs. furniture edits.** Furniture transforms never alter walls. Structural edits propagate to connected walls, openings, rooms and items per the documented rules, and never silently delete items (flag them).
6. **Derived data stays derived.** Areas, adjacency, door connectivity, schedules and Vastu inputs are computed from the document, never stored as truth.
7. **Persistence safety.** Every schema change bumps `schemaVersion`, ships a pure migration with fixture tests, and leaves legacy payloads intact until migration is confirmed.
8. **Honest claims.** Analyses are advisory, never code-compliance certification. Catalog counts are true. AI-generated images are labeled and never authoritative.
9. **Assets.** Every bundled asset has recorded license, source and attribution in the registry. Verify the license on the source page. Never copy proprietary models, code or brand assets.
10. **No hidden dependencies.** Never assume API keys or paid services exist; document each one. No mock data in place of real backend integration.

## Working rules
- Audit before changing. Verify versions and APIs in the repo; do not trust old READMEs or prompts.
- Replace a subsystem only with evidence and a migration plan. Never leave the app broken between phases.
- Keep UI, geometry operations, business logic and rendering separated.
- Dispose GPU resources (geometries, materials, textures, render targets) on unmount and scene change.
- Explicit loading, error and fallback states for assets and generation.
- New dependencies need a one-line justification in the PR/progress notes.

## Verification (required before saying "done")
- Build, typecheck/lint and tests run; results reported as they are.
- Exercise the affected flow in the running app with real mouse/keyboard input; capture a screenshot.
- Check console errors, failed network requests and backend logs.
- Run the geometry unit tests (propagation, validators, undo/redo, migrations) after any model or command change.
- Report separately: passed, failed, regressions, limitations, not tested. Never mark a test passed unless it was performed.

## Docs to maintain
`docs/baseline.md`, `docs/architecture-decision.md`, `docs/progress.md` (phase status, tests, limitations), asset registry with licenses.

## Motion and UX
Architecture-first layout: the canvas stays dominant. Motion communicates construction, selection, transformation or state; respect `prefers-reduced-motion`; never block the primary action.
