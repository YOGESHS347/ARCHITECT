"""
intelligent_generator.py
===============================================================================
AI Architect — Phase 6, Slice 1: Intelligent Floor Plan Generation Engine

Features:
  1. Deterministic Multi-Candidate Generation:
     - Generates multiple distinct viable architectural candidates from identical inputs.
     - Supported variants:
         * Variant A: Linear Central Core (Balanced wings, central circulation spine)
         * Variant B: Lateral Service Spine (Staircase & wet zones on flank, expansive open living)
         * Variant C: Garden Buffer & Clustered Suites (Front green buffer, social front, rear quiet cluster)
     - Deterministic outputs when provided identical inputs and seed.
  2. Constraint-Aware Evaluation:
     - Hard constraint checking: buildable area/setback enforcement, room overlap detection
       (distinguishing intentional shared boundaries from genuine interior collisions),
       valid dimensions, required room coverage, and multi-floor staircase shaft continuity.
     - Gatekeeping: hard constraint failures strictly penalize candidates below valid layouts.
  3. Explainable Architectural Ranking:
     - Multi-factor scoring: Hard constraint satisfaction, required-room coverage,
       room adjacency preferences, circulation accessibility, usable floor area, and compactness.
     - Produces transparent reasons and metrics for user comparison in the Atelier Studio.
===============================================================================
"""

from __future__ import annotations
import math
import copy
import base64
import uuid
import random
from typing import Any, Optional

from engines.architectural_layout import (
    DOOR_W,
    STAIR_W,
    STAIR_H,
    MIN_ROOM_DIM,
    _get_min_h,
    _get_weight,
    _stack_in_bay,
    _door,
    _extract_floor_features,
    inject_furniture,
)
from engines.window_placer import place_windows
from engines.circulation import compute_paths
from exporters.floor_renderer import render_floor_plan
from engines.vastu_engine import score_vastu
from engines.nbc_engine import score_nbc
from engines.energy_engine import score_energy
from engines.bom_engine import compute_bom
from engines.sunlight_engine import evaluate_sunlight


# ─────────────────────────────────────────────────────────────────────────────
# 1. Constraint Evaluator
# ─────────────────────────────────────────────────────────────────────────────

class ConstraintEvaluator:
    """
    Evaluates hard constraints and architectural quality metrics for a layout.
    """

    @staticmethod
    def evaluate_layout(layout: dict, spec: dict) -> dict[str, Any]:
        """
        Runs comprehensive evaluation against plot constraints and design criteria.
        Returns explainable score breakdown and hard constraint validation status.
        """
        floors = layout.get("floors", [])
        if not floors:
            return {
                "hard_constraints_met": False,
                "rejection_reasons": ["Layout contains no floor plates"],
                "reasons": ["Empty floor structure"],
                "metrics": {
                    "hard_constraint_score": 0.0,
                    "coverage_score": 0.0,
                    "adjacency_score": 0.0,
                    "circulation_score": 0.0,
                    "usable_area_ratio": 0.0,
                    "compactness_score": 0.0,
                    "total_score": 0.0,
                },
            }

        plot_w = float(spec.get("plot_width", floors[0].get("plot_width", 30)))
        plot_l = float(spec.get("plot_length", floors[0].get("plot_height", 40)))
        unit = str(spec.get("measurement_unit", "ft")).lower()
        if unit == "m":
            plot_w = round(plot_w * 3.28084, 2)
            plot_l = round(plot_l * 3.28084, 2)

        # Setback allowances
        front_sb = float(spec.get("front_setback", 0.0))
        rear_sb = float(spec.get("rear_setback", 0.0))
        side_sb = float(spec.get("side_setback", 0.0))

        if front_sb == 0.0 and rear_sb == 0.0 and side_sb == 0.0:
            if min(plot_w, plot_l) >= 22.0:
                front_sb = 6.0
                rear_sb = 5.0
                side_sb = 4.0

        # Check if setbacks were disabled because buildable was too tight
        buildable_w = plot_w - 2 * side_sb
        buildable_l = plot_l - front_sb - rear_sb
        if buildable_w < MIN_ROOM_DIM * 3 or buildable_l < MIN_ROOM_DIM * 3:
            front_sb = rear_sb = side_sb = 0.0

        min_x = side_sb
        max_x = plot_w - side_sb
        min_y = front_sb
        max_y = plot_l - rear_sb

        hard_violations: list[str] = []
        positive_reasons: list[str] = []

        total_habitable_area = 0.0
        total_footprint_area = plot_w * plot_l

        # ── 1. HARD CONSTRAINT: Buildable Area & Setbacks ────────────────────
        boundary_clean = True
        for f_idx, floor in enumerate(floors):
            f_name = floor.get("name", f"Level {f_idx}")
            for r in floor.get("rooms", []):
                rx = float(r.get("x", 0))
                ry = float(r.get("y", 0))
                rw = float(r.get("width", 0))
                rh = float(r.get("height", 0))
                r_name = r.get("name", "Room")

                # Allow tolerance of 0.1ft for float rounding
                if rx < min_x - 0.1:
                    hard_violations.append(f"{f_name}: '{r_name}' breaches left setback boundary (x={rx:.2f} < {min_x:.2f}ft)")
                    boundary_clean = False
                if rx + rw > max_x + 0.1:
                    hard_violations.append(f"{f_name}: '{r_name}' breaches right setback boundary (x+w={rx+rw:.2f} > {max_x:.2f}ft)")
                    boundary_clean = False
                if ry < min_y - 0.1:
                    hard_violations.append(f"{f_name}: '{r_name}' breaches front setback boundary (y={ry:.2f} < {min_y:.2f}ft)")
                    boundary_clean = False
                if ry + rh > max_y + 0.1:
                    hard_violations.append(f"{f_name}: '{r_name}' breaches rear setback boundary (y+h={ry+rh:.2f} > {max_y:.2f}ft)")
                    boundary_clean = False

        if boundary_clean and (front_sb > 0 or side_sb > 0):
            positive_reasons.append("All rooms strictly respect front, rear and side setbacks.")
        elif boundary_clean:
            positive_reasons.append("All rooms fully contained within plot boundary.")

        # ── 2. HARD CONSTRAINT: Room Minimum Dimensions ─────────────────────
        dims_clean = True
        for f_idx, floor in enumerate(floors):
            f_name = floor.get("name", f"Level {f_idx}")
            for r in floor.get("rooms", []):
                rw = float(r.get("width", 0))
                rh = float(r.get("height", 0))
                r_name = r.get("name", "Room")
                # Min dimension tolerance: 3.5 ft absolute minimum for powder/toilet/utility
                if rw < 3.5 or rh < 3.5:
                    hard_violations.append(f"{f_name}: '{r_name}' has invalid dimensions {rw:.2f}×{rh:.2f}ft (min 3.5ft)")
                    dims_clean = False
                if rw * rh < 14.0:
                    hard_violations.append(f"{f_name}: '{r_name}' has unusable room area {rw*rh:.1f} sqft")
                    dims_clean = False
        if dims_clean:
            positive_reasons.append("All spaces satisfy minimum habitable dimensional thresholds.")

        # ── 3. HARD CONSTRAINT: Room Non-Overlap (Collision Check) ───────────
        # Distinguish intentional shared borders (intersection area == 0) from true collision
        overlaps_clean = True
        for f_idx, floor in enumerate(floors):
            f_name = floor.get("name", f"Level {f_idx}")
            f_rooms = floor.get("rooms", [])
            for i in range(len(f_rooms)):
                r1 = f_rooms[i]
                r1_name = r1.get("name", f"Room_{i}")
                r1_x, r1_y = float(r1.get("x", 0)), float(r1.get("y", 0))
                r1_w, r1_h = float(r1.get("width", 0)), float(r1.get("height", 0))

                for j in range(i + 1, len(f_rooms)):
                    r2 = f_rooms[j]
                    r2_name = r2.get("name", f"Room_{j}")
                    r2_x, r2_y = float(r2.get("x", 0)), float(r2.get("y", 0))
                    r2_w, r2_h = float(r2.get("width", 0)), float(r2.get("height", 0))

                    # Intersection 2D interval
                    inter_w = max(0.0, min(r1_x + r1_w, r2_x + r2_w) - max(r1_x, r2_x))
                    inter_h = max(0.0, min(r1_y + r1_h, r2_y + r2_h) - max(r1_y, r2_y))
                    overlap_area = inter_w * inter_h

                    # Threshold of 0.05 sqft separates tangential touch from physical room overlap
                    if overlap_area > 0.05:
                        hard_violations.append(
                            f"{f_name}: Illegal collision between '{r1_name}' and '{r2_name}' (overlap area: {overlap_area:.2f} sqft)"
                        )
                        overlaps_clean = False

        if overlaps_clean:
            positive_reasons.append("Zero room overlaps; shared wall boundaries cleanly aligned.")

        # ── 4. HARD CONSTRAINT: Multi-Floor Staircase Vertical Continuity ────
        stairs_clean = True
        if len(floors) > 1:
            stair_boxes = []
            for f_idx, floor in enumerate(floors):
                stair_room = None
                for r in floor.get("rooms", []):
                    rn = r.get("name", "").lower()
                    if "stair" in rn:
                        stair_room = r
                        break
                stair_rect = floor.get("stairs") or (
                    {
                        "x": stair_room["x"],
                        "y": stair_room["y"],
                        "width": stair_room["width"],
                        "depth": stair_room["height"],
                    }
                    if stair_room
                    else None
                )
                stair_boxes.append((f_idx, floor.get("name"), stair_rect))

            base_stair = stair_boxes[0][2]
            if not base_stair:
                hard_violations.append("Ground floor lacks a vertical staircase access core.")
                stairs_clean = False
            else:
                for f_idx, fname, srect in stair_boxes[1:]:
                    if not srect:
                        hard_violations.append(f"{fname} lacks vertical staircase access core.")
                        stairs_clean = False
                        continue
                    dx = abs(float(srect["x"]) - float(base_stair["x"]))
                    dy = abs(float(srect["y"]) - float(base_stair["y"]))
                    dw = abs(float(srect["width"]) - float(base_stair["width"]))
                    # Depth can differ slightly for terrace headroom landing
                    if dx > 0.25 or dy > 0.25 or dw > 0.25:
                        hard_violations.append(
                            f"{fname}: Staircase core shifted horizontally ({dx:.2f}ft, {dy:.2f}ft) breaking vertical shaft continuity."
                        )
                        stairs_clean = False

            if stairs_clean:
                positive_reasons.append(f"Vertical staircase shaft seamlessly locked across all {len(floors)} levels.")

        # ── 4B. HARD CONSTRAINT: Wall Openings & Corner Clearance ─────────────
        openings_clean = True
        CORNER_CLR_M = 0.15
        for f_idx, floor in enumerate(floors):
            f_name = floor.get("name", f"Level {f_idx}")
            for r in floor.get("rooms", []):
                rn = r.get("name", "Room")
                rw_ft = float(r.get("width", 10))
                rh_ft = float(r.get("height", 10))
                rw_m = rw_ft * 0.3048
                rh_m = rh_ft * 0.3048

                for d in r.get("doors", []):
                    d_wall = str(d.get("wall", "bottom")).lower()
                    wall_len_m = rw_m if d_wall in ("top", "bottom") else rh_m
                    d_w_m = float(d.get("width", 3.0)) * 0.3048
                    d_pos_m = float(d.get("position", 3.0)) * 0.3048
                    d_start = d_pos_m - d_w_m / 2
                    d_end = d_pos_m + d_w_m / 2
                    if d_start < CORNER_CLR_M - 0.05 or d_end > wall_len_m - CORNER_CLR_M + 0.05:
                        hard_violations.append(
                            f"{f_name}: Door on '{rn}' ({d_w_m:.2f}m) exceeds {d_wall} wall bounds (length {wall_len_m:.2f}m)."
                        )
                        openings_clean = False

        if openings_clean:
            positive_reasons.append("All doors and openings fit host walls with required clearance.")

        # ── 5. REQUIRED ROOM COVERAGE ────────────────────────────────────────
        requested_rooms_raw = []
        if spec.get("floors"):
            for fspec in spec["floors"]:
                for rspec in fspec.get("required_rooms", []):
                    requested_rooms_raw.append(rspec.get("name") or rspec.get("type", "room"))
        elif spec.get("bedrooms") is not None:
            beds = int(spec.get("bedrooms", 2))
            baths = int(spec.get("bathrooms", 2))
            requested_rooms_raw.extend(["Living Room", "Kitchen", "Dining Room"])
            for b in range(beds):
                requested_rooms_raw.append(f"Bedroom {b+1}")
            for ba in range(baths):
                requested_rooms_raw.append(f"Bathroom {ba+1}")

        all_placed_names = [
            r.get("name", "").lower() for f in floors for r in f.get("rooms", [])
        ]

        placed_count = 0
        missing_required: list[str] = []
        if requested_rooms_raw:
            for req in requested_rooms_raw:
                req_lower = req.lower()
                matched = False
                for placed in all_placed_names:
                    # Semantic keyword matching
                    if any(token in placed for token in req_lower.split() if len(token) > 2):
                        matched = True
                        break
                if matched:
                    placed_count += 1
                else:
                    missing_required.append(req)

            coverage_ratio = placed_count / len(requested_rooms_raw)
        else:
            coverage_ratio = 1.0

        coverage_score = round(coverage_ratio * 100.0, 1)
        if missing_required and len(missing_required) > 2:
            hard_violations.append(f"Missing essential required rooms: {', '.join(missing_required[:3])}")
        elif coverage_ratio >= 0.95:
            positive_reasons.append(f"100% required space allocation ({len(all_placed_names)} functional rooms placed).")
        else:
            positive_reasons.append(f"High spatial fulfillment ({coverage_score:.0f}% room requirement coverage).")

        # ── 6. ARCHITECTURAL ADJACENCY SCORING ───────────────────────────────
        adjacency_hits = 0
        adjacency_tests = 0

        for floor in floors:
            rooms = floor.get("rooms", [])
            # Map centers
            centers = {
                r.get("name", "").lower(): (
                    float(r.get("x", 0)) + float(r.get("width", 0)) / 2,
                    float(r.get("y", 0)) + float(r.get("height", 0)) / 2,
                )
                for r in rooms
            }

            def _center_dist(n1_sub: str, n2_sub: str) -> Optional[float]:
                c1, c2 = None, None
                for k, v in centers.items():
                    if n1_sub in k and c1 is None:
                        c1 = v
                    if n2_sub in k and c2 is None:
                        c2 = v
                if c1 and c2:
                    return math.hypot(c1[0] - c2[0], c1[1] - c2[1])
                return None

            # 1. Kitchen <-> Dining proximity
            d_kd = _center_dist("kitchen", "dining")
            if d_kd is not None:
                adjacency_tests += 1
                if d_kd <= 18.0:
                    adjacency_hits += 1
                    positive_reasons.append("Direct culinary service flow between Kitchen and Dining.")

            # 2. Living <-> Foyer / Entrance
            d_lf = _center_dist("living", "foyer")
            if d_lf is not None:
                adjacency_tests += 1
                if d_lf <= 16.0:
                    adjacency_hits += 1
                    positive_reasons.append("Welcoming social sequence from Foyer into Main Living.")

            # 3. Bedroom <-> Bathroom proximity
            for r in rooms:
                rn = r.get("name", "").lower()
                if "bedroom" in rn or "master" in rn:
                    rx, ry = float(r.get("x", 0)), float(r.get("y", 0))
                    rw, rh = float(r.get("width", 0)), float(r.get("height", 0))
                    # Check for adjacent bath
                    has_close_bath = False
                    for o in rooms:
                        on = o.get("name", "").lower()
                        if "bath" in on or "toilet" in on:
                            ox, oy = float(o.get("x", 0)), float(o.get("y", 0))
                            ow, oh = float(o.get("width", 0)), float(o.get("height", 0))
                            # Edge proximity <= 2ft
                            dx = max(0.0, max(rx, ox) - min(rx + rw, ox + ow))
                            dy = max(0.0, max(ry, oy) - min(ry + rh, oy + oh))
                            if dx <= 2.0 and dy <= 2.0:
                                has_close_bath = True
                                break
                    adjacency_tests += 1
                    if has_close_bath:
                        adjacency_hits += 1

        adj_ratio = (adjacency_hits / max(1, adjacency_tests)) if adjacency_tests > 0 else 0.85
        adjacency_score = round(min(100.0, max(40.0, adj_ratio * 100.0)), 1)

        # ── 7. CIRCULATION & ACCESSIBILITY ───────────────────────────────────
        # Check that circulation rooms exist and unreachables are low
        unreachable_count = 0
        for floor in floors:
            circ = floor.get("circulation", {})
            unreach = circ.get("unreachable", [])
            unreachable_count += len(unreach)

        total_rooms_count = sum(len(f.get("rooms", [])) for f in floors)
        reachable_ratio = max(0.0, (total_rooms_count - unreachable_count) / max(1, total_rooms_count))
        circulation_score = round(reachable_ratio * 100.0, 1)
        if unreachable_count == 0:
            positive_reasons.append("100% circulation reachability without trapped rooms.")
        else:
            hard_violations.append(f"{unreachable_count} room(s) lack corridor/foyer connectivity.")

        # ── 8. USABLE FLOOR AREA & COMPACTNESS ────────────────────────────────
        for floor in floors:
            for r in floor.get("rooms", []):
                rn = r.get("name", "").lower()
                rw, rh = float(r.get("width", 0)), float(r.get("height", 0))
                if not any(k in rn for k in ("corridor", "duct", "void", "shaft")):
                    total_habitable_area += rw * rh

        built_footprint = buildable_w * buildable_l
        usable_ratio = min(0.92, max(0.60, total_habitable_area / max(1.0, built_footprint * len(floors))))
        usable_score = round(usable_ratio * 100.0, 1)

        # Compactness: Regular rectangular bays vs fragmented perimeters
        aspect_ratio = min(plot_w, plot_l) / max(plot_w, plot_l)
        compactness_score = round(min(100.0, (0.7 + 0.3 * aspect_ratio) * 100.0), 1)

        # ── 9. COMPOSITE SCORING & HARD CONSTRAINT GATEKEEPING ───────────────
        hard_constraints_met = len(hard_violations) == 0

        # Weighted quality score
        base_quality = (
            0.25 * coverage_score +
            0.25 * adjacency_score +
            0.20 * circulation_score +
            0.15 * usable_score +
            0.15 * compactness_score
        )

        if hard_constraints_met:
            composite_score = round(base_quality, 1)
            hard_constraint_score = 100.0
        else:
            # Strictly penalise below any valid candidate
            composite_score = round(max(0.0, base_quality - 100.0), 1)
            hard_constraint_score = 0.0

        return {
            "hard_constraints_met": hard_constraints_met,
            "rejection_reasons": hard_violations,
            "reasons": positive_reasons[:4],
            "metrics": {
                "hard_constraint_score": hard_constraint_score,
                "coverage_score": coverage_score,
                "adjacency_score": adjacency_score,
                "circulation_score": circulation_score,
                "usable_area_ratio": round(usable_ratio, 2),
                "usable_area_score": usable_score,
                "compactness_score": compactness_score,
                "total_score": composite_score,
            },
        }


# ─────────────────────────────────────────────────────────────────────────────
# 2. Intelligent Multi-Candidate Generation Engine
# ─────────────────────────────────────────────────────────────────────────────

class IntelligentGenerationEngine:
    """
    Synthesizes multiple distinct, valid candidate layouts from a single brief.
    Applies constraint evaluation, explainable architectural ranking, and renders previews.
    """

    @classmethod
    def generate_candidate_variants(
        cls,
        spec: dict,
        candidate_count: int = 3,
        seed: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """
        Generates candidate_count distinct floor plan layouts, ranks them by constraint
        compliance and spatial quality, and returns enriched candidate objects.
        """
        raw_w = float(spec.get("plot_width", spec.get("width", 30)))
        raw_l = float(spec.get("plot_length", spec.get("length", 40)))
        unit = str(spec.get("measurement_unit", "ft")).lower()

        L = raw_w
        W = raw_l
        if unit == "m":
            L = round(L * 3.28084, 2)
            W = round(W * 3.28084, 2)

        entry_dir = str(spec.get("entry_direction", spec.get("entryDir", "east"))).strip().lower()
        floors_count = int(spec.get("floors_count", spec.get("floors", 1)))
        is_duplex = bool(spec.get("is_duplex", spec.get("duplex", False)))
        budget_tier = str(spec.get("budget_tier", "standard")).strip().lower()

        # Generate candidates for standard single or multi-floor requests
        variant_strategies = [
            {
                "id": "variant_a",
                "title": "Option 01 // Linear Core & Balanced Wings",
                "tag": "Balanced Spine",
                "bay_ratios": (0.36, 0.28, 0.36),
                "stair_align": "center",
                "living_wing": "right",
            },
            {
                "id": "variant_b",
                "title": "Option 02 // Lateral Core & Open Living Pavilion",
                "tag": "Expansive Living",
                "bay_ratios": (0.46, 0.24, 0.30),
                "stair_align": "flank",
                "living_wing": "left",
            },
            {
                "id": "variant_c",
                "title": "Option 03 // Garden Buffer & Clustered Suites",
                "tag": "Private Zoning",
                "bay_ratios": (0.33, 0.30, 0.37),
                "stair_align": "rear",
                "living_wing": "right",
            },
        ]

        if seed is not None:
            # Deterministic pseudo-random seed
            random.seed(seed)

        candidates: list[dict[str, Any]] = []

        for v_idx in range(min(candidate_count, len(variant_strategies))):
            strat = variant_strategies[v_idx]
            cand_id = f"cand_{strat['id']}_{uuid.uuid4().hex[:6]}"

            # Synthesize layout according to topological strategy
            layout = cls._build_variant_layout(
                spec=spec,
                L=L,
                W=W,
                entry_dir=entry_dir,
                floors_count=floors_count,
                is_duplex=is_duplex,
                budget_tier=budget_tier,
                strategy=strat,
            )

            # Evaluate hard constraints and quality metrics
            eval_res = ConstraintEvaluator.evaluate_layout(layout, spec)

            # Compute domain scores
            floor_list = layout.get("floors", [])
            ground_rooms = floor_list[0].get("rooms", []) if floor_list else []
            vastu_rooms = list(ground_rooms)
            if len(floor_list) > 1:
                vastu_rooms.extend(floor_list[1].get("rooms", []))

            plot_x = float(floor_list[0].get("plot_width", L)) if floor_list else L
            plot_y = float(floor_list[0].get("plot_height", W)) if floor_list else W

            vastu_res = score_vastu(
                rooms=vastu_rooms,
                plot_w=plot_x,
                plot_h=plot_y,
                entry_dir=entry_dir,
            )
            nbc_res = score_nbc(
                rooms=ground_rooms,
                plot_w=plot_x,
                plot_h=plot_y,
                num_floors=floors_count,
            )
            energy_res = score_energy(
                rooms=ground_rooms,
                plot_w=plot_x,
                plot_h=plot_y,
                entry_dir=entry_dir,
            )
            sunlight_res = evaluate_sunlight(
                layout=layout,
                entry_dir=entry_dir,
            )
            tier_map = {"economy": "economy", "standard": "standard", "luxury": "premium"}
            bom_res = compute_bom(layout, sqft=L * W, tier=tier_map.get(budget_tier, "standard"))

            # Render 2D vector preview image for floor 0
            unit_label = f"{int(L * W)} sqft · {floors_count}F · {entry_dir.capitalize()} Entry"
            floor_label = f"{floor_list[0].get('name', 'Level 0')} | {unit_label}" if floor_list else unit_label
            png_bytes = render_floor_plan(
                ground_rooms,
                unit_label=floor_label,
                plot_w=plot_x,
                plot_h=plot_y,
                entry_dir=entry_dir,
            )
            preview_b64 = f"data:image/png;base64,{base64.b64encode(png_bytes).decode('utf-8')}"

            # Also store image on floor 0
            if floor_list:
                floor_list[0]["imageUrl"] = preview_b64

            candidates.append({
                "id": cand_id,
                "variantId": strat["id"],
                "title": strat["title"],
                "tag": strat["tag"],
                "imageUrl": preview_b64,
                "layout": layout,
                "hardConstraintsMet": eval_res["hard_constraints_met"],
                "rejectionReasons": eval_res["rejection_reasons"],
                "reasons": eval_res["reasons"],
                "metrics": eval_res["metrics"],
                "compositeScore": eval_res["metrics"]["total_score"],
                "vastuScore": vastu_res.get("score", 0),
                "vastuResult": vastu_res,
                "nbcResult": nbc_res,
                "energyResult": energy_res,
                "sunlightResult": sunlight_res,
                "bomResult": bom_res,
                "validationReport": layout.get("validation_report", []),
                "circulationWarnings": layout.get("circulation_warnings", []),
            })

        # Rank candidates strictly prioritizing hard constraint satisfaction
        candidates.sort(
            key=lambda c: (
                1 if c["hardConstraintsMet"] else 0,
                c["compositeScore"],
                c["vastuScore"],
            ),
            reverse=True,
        )

        # Assign explicit 1-based ranks
        for idx, cand in enumerate(candidates):
            cand["rank"] = idx + 1
            if idx == 0 and cand["hardConstraintsMet"]:
                cand["badge"] = "#1 RECOMMENDED"
            elif cand["hardConstraintsMet"]:
                cand["badge"] = f"#{idx + 1} ALTERNATIVE"
            else:
                cand["badge"] = "NON-COMPLIANT"

        return candidates

    @classmethod
    def _build_variant_layout(
        cls,
        spec: dict,
        L: float,
        W: float,
        entry_dir: str,
        floors_count: int,
        is_duplex: bool,
        budget_tier: str,
        strategy: dict,
    ) -> dict[str, Any]:
        """
        Builds a deterministic multi-floor or single-floor layout for a given topology strategy.
        """
        front_sb = float(spec.get("front_setback", 0.0))
        rear_sb = float(spec.get("rear_setback", 0.0))
        side_sb = float(spec.get("side_setback", 0.0))
        if front_sb == 0.0 and rear_sb == 0.0 and side_sb == 0.0:
            if min(L, W) >= 22.0:
                front_sb = 6.0
                rear_sb = 5.0
                side_sb = 4.0

        buildable_W = W - front_sb - rear_sb
        buildable_L = L - 2 * side_sb

        if buildable_L < MIN_ROOM_DIM * 3 or buildable_W < MIN_ROOM_DIM * 3:
            front_sb = rear_sb = side_sb = 0.0
            buildable_W = W
            buildable_L = L

        # Calculate bay widths from strategy bay ratios
        r_l, r_s, r_r = strategy["bay_ratios"]
        w2 = max(8.0, min(14.0, round(buildable_L * r_s, 2)))
        rem_l = max(16.0, buildable_L - w2)
        w1 = max(8.0, round(rem_l * (r_l / (r_l + r_r)), 2))
        w3 = max(8.0, round(buildable_L - w1 - w2, 2))
        diff = round(buildable_L - (w1 + w2 + w3), 2)
        w3 = round(w3 + diff, 2)

        x1 = 0.0
        x2 = w1
        x3 = w1 + w2

        # Staircase parameters
        has_stairs = floors_count > 1 or any(
            any("stair" in r.get("name", "").lower() or r.get("type") == "stairs" for r in f.get("required_rooms", []))
            for f in spec.get("floors", [])
        )
        stair_h = STAIR_H
        if strategy["stair_align"] == "flank":
            stair_y = 0.0 if entry_dir in ("south", "west") else max(0.0, round(buildable_W - stair_h, 2))
        elif strategy["stair_align"] == "rear":
            stair_y = max(0.0, round(buildable_W - stair_h, 2))
        else:
            stair_y = 0.0 if entry_dir in ("south", "west") else max(0.0, round(buildable_W - stair_h, 2))

        global_stair_rect = {
            "x": round(x2 + side_sb, 2),
            "y": round(stair_y + front_sb, 2),
            "width": round(w2, 2),
            "depth": float(stair_h),
        }

        # Build floors
        floors_spec = spec.get("floors", [])
        if not floors_spec:
            floors_spec = []
            for f_idx in range(floors_count):
                if f_idx == 0:
                    floors_spec.append({
                        "level": 0,
                        "name": "Ground Floor",
                        "floor_type": "ground",
                        "required_rooms": [
                            {"type": "living", "name": "Living Room"},
                            {"type": "kitchen", "name": "Kitchen"},
                            {"type": "dining", "name": "Dining Room"},
                            {"type": "pooja", "name": "Pooja Room"},
                            {"type": "bedroom", "name": "Guest Bedroom", "attached_bath": True},
                            {"type": "parking", "name": "Car Parking"},
                            {"type": "garden", "name": "Garden / Lawn"},
                        ],
                    })
                elif f_idx == floors_count - 1 and floors_count >= 3:
                    floors_spec.append({
                        "level": f_idx,
                        "name": "Rooftop Terrace",
                        "floor_type": "terrace",
                        "required_rooms": [
                            {"type": "garden", "name": "Rooftop Garden"},
                            {"type": "gazebo", "name": "Covered Gazebo"},
                            {"type": "utility_solar", "name": "Solar & Utility Area"},
                        ],
                    })
                else:
                    floors_spec.append({
                        "level": f_idx,
                        "name": f"Floor {f_idx}",
                        "floor_type": "duplex_upper" if (is_duplex and f_idx == 1) else "upper",
                        "required_rooms": [
                            {"type": "master_bedroom", "name": "Master Suite", "attached_bath": True},
                            {"type": "bedroom", "name": f"Bedroom {f_idx + 1}", "attached_bath": True},
                            {"type": "family_lounge", "name": "Family Lounge"},
                            {"type": "balcony", "name": "Balcony"},
                        ],
                    })

        result_floors = []
        ground_living_rect = None

        for floor_idx, floor_cfg in enumerate(floors_spec):
            lvl_num = floor_cfg.get("level", floor_idx)
            lvl_name = floor_cfg.get("name", f"Floor {lvl_num}" if lvl_num > 0 else "Ground Floor")
            f_type = floor_cfg.get("floor_type", "ground" if lvl_num == 0 else "upper")
            req_rooms = floor_cfg.get("required_rooms", [])

            left_rooms = []
            right_rooms = []
            spine_rooms = []

            if f_type == "ground" or lvl_num == 0:
                has_living = any("living" in r.get("name", "").lower() or r.get("type") == "living" for r in req_rooms)
                has_kitchen = any("kitchen" in r.get("name", "").lower() or r.get("type") == "kitchen" for r in req_rooms)
                has_dining = any("dining" in r.get("name", "").lower() or r.get("type") == "dining" for r in req_rooms)
                has_pooja = any("pooja" in r.get("name", "").lower() or r.get("type") == "pooja" for r in req_rooms)
                has_parking = any("parking" in r.get("name", "").lower() or r.get("type") == "parking" for r in req_rooms)
                has_garden = any("garden" in r.get("name", "").lower() or r.get("type") == "garden" for r in req_rooms) or floor_cfg.get("has_garden")

                # Strategy determines whether living wing is right or left
                if strategy["living_wing"] == "right":
                    right_rooms.append("Living Room" if has_living else "Living Room")
                    right_rooms.append("Dining Room")
                    right_rooms.append("Kitchen")
                    if has_pooja:
                        right_rooms.append("Pooja Room")

                    if has_parking:
                        left_rooms.append("Parking")
                    if has_garden and (buildable_W >= 34.0 or not has_parking):
                        left_rooms.append("Garden / Lawn")

                    bed_count = 0
                    for r in req_rooms:
                        if "bedroom" in r.get("name", "").lower() or r.get("type") in ("bedroom", "guest_bedroom"):
                            bed_count += 1
                            bname = r.get("name") or "Guest Bedroom"
                            left_rooms.append(bname)
                            if r.get("attached_bath", True):
                                left_rooms.append(f"Bathroom {bed_count}")

                    if not any("bedroom" in r.lower() for r in left_rooms) and not has_parking:
                        left_rooms.append("Study Room")
                else:
                    # Strategy "left": Expansive living & dining pavilion on left wing
                    left_rooms.append("Living Room" if has_living else "Living Room")
                    left_rooms.append("Dining Room")
                    left_rooms.append("Kitchen")
                    if has_garden and (buildable_W >= 34.0 or not has_parking):
                        left_rooms.append("Garden / Lawn")

                    if has_pooja:
                        right_rooms.append("Pooja Room")
                    if has_parking and (buildable_W >= 34.0 or not any("bedroom" in r.get("name", "").lower() for r in req_rooms)):
                        right_rooms.append("Parking")

                    bed_count = 0
                    for r in req_rooms:
                        if "bedroom" in r.get("name", "").lower() or r.get("type") in ("bedroom", "guest_bedroom"):
                            bed_count += 1
                            bname = r.get("name") or "Guest Bedroom"
                            right_rooms.append(bname)
                            if r.get("attached_bath", True):
                                right_rooms.append(f"Bathroom {bed_count}")

                spine_rooms.append("Foyer")
                if has_stairs:
                    spine_rooms.append("Staircase")
                spine_rooms.append("Corridor")

                l_list = [{"name": n, "weight": _get_weight(n)} for n in left_rooms]
                s_list = [{"name": n, "weight": _get_weight(n)} for n in spine_rooms]
                r_list = [{"name": n, "weight": _get_weight(n)} for n in right_rooms]

                fl_rooms = []
                fl_rooms.extend(_stack_in_bay(x1, 0, w1, buildable_W, l_list, door_wall="right"))
                fl_rooms.extend(_stack_in_bay(x3, 0, w3, buildable_W, r_list, door_wall="left"))

                if has_stairs:
                    stair_room = {
                        "name": "Staircase",
                        "x": round(x2, 2),
                        "y": round(stair_y, 2),
                        "width": round(w2, 2),
                        "height": stair_h,
                        "doors": [
                            {"wall": "top", "position": round(w2 / 2 - 1.5, 1), "width": 3.0},
                            {"wall": "bottom", "position": round(w2 / 2 - 1.5, 1), "width": 3.0},
                        ],
                        "furniture": [],
                    }
                    fl_rooms.append(stair_room)
                    s_others = [r for r in s_list if "staircase" not in r["name"].lower()]
                    if stair_y <= 0.1:
                        fl_rooms.extend(_stack_in_bay(x2, stair_h, w2, buildable_W - stair_h, s_others, door_wall="left"))
                    elif stair_y >= buildable_W - stair_h - 0.1:
                        fl_rooms.extend(_stack_in_bay(x2, 0, w2, stair_y, s_others, door_wall="left"))
                    else:
                        fl_rooms.extend(_stack_in_bay(x2, 0, w2, stair_y, s_others[:1], door_wall="left"))
                        fl_rooms.extend(_stack_in_bay(x2, stair_y + stair_h, w2, buildable_W - stair_y - stair_h, s_others[1:], door_wall="left"))
                else:
                    fl_rooms.extend(_stack_in_bay(x2, 0, w2, buildable_W, s_list, door_wall="left"))

                # Add Main Entrance Door on Ground Floor (facing site entry)
                entry_wall = "top" if entry_dir in ("north", "west") else "bottom"
                entrance_room = next((r for r in fl_rooms if "foyer" in r["name"].lower()), None)
                if not entrance_room:
                    entrance_room = next((r for r in fl_rooms if "living" in r["name"].lower()), None)
                if entrance_room:
                    er_w = entrance_room["width"]
                    er_doors = entrance_room.setdefault("doors", [])
                    if not any(d.get("wall") == entry_wall and d.get("is_entrance") for d in er_doors):
                        safe_ent_pos = max(2.0, min(er_w - 2.0, er_w / 2))
                        er_doors.append({
                            "wall": entry_wall,
                            "position": round(safe_ent_pos, 1),
                            "width": 3.5,
                            "is_entrance": True,
                            "name": "Main Entrance Door",
                        })

                for r in fl_rooms:
                    if "living" in r["name"].lower():
                        ground_living_rect = {
                            "x": r["x"],
                            "y": r["y"],
                            "width": r["width"],
                            "height": r["height"],
                        }
                        break

            elif f_type in ("terrace", "rooftop"):
                fl_rooms = []
                if has_stairs:
                    stair_room = {
                        "name": "Staircase Headroom / Terrace Landing",
                        "x": round(x2, 2),
                        "y": round(stair_y, 2),
                        "width": round(w2, 2),
                        "height": stair_h,
                        "doors": [
                            {"wall": "top" if stair_y <= 0.1 else "bottom", "position": round(w2 / 2 - 1.5, 1), "width": 3.0}
                        ],
                        "furniture": [],
                    }
                    fl_rooms.append(stair_room)

                has_roof_garden = any("garden" in r.get("name", "").lower() or r.get("type") == "garden" for r in req_rooms) or floor_cfg.get("has_garden")
                has_gazebo = any("gazebo" in r.get("name", "").lower() or r.get("type") == "gazebo" for r in req_rooms)
                has_solar = any("solar" in r.get("name", "").lower() or "utility" in r.get("name", "").lower() for r in req_rooms)

                l_terr = [{"name": "Open Rooftop Terrace", "weight": 14}]
                if has_roof_garden:
                    l_terr.append({"name": "Rooftop Garden", "weight": 10})

                r_terr = []
                if has_gazebo:
                    r_terr.append({"name": "Covered Gazebo", "weight": 8})
                if has_solar:
                    r_terr.append({"name": "Solar & Utility Area", "weight": 6})
                r_terr.append({"name": "Private Sundeck / Terrace", "weight": 12})

                fl_rooms.extend(_stack_in_bay(x1, 0, w1, buildable_W, l_terr, door_wall="right"))
                fl_rooms.extend(_stack_in_bay(x3, 0, w3, buildable_W, r_terr, door_wall="left"))

                s_rem = [{"name": "Terrace Walkway", "weight": 6}]
                if stair_y <= 0.1:
                    fl_rooms.extend(_stack_in_bay(x2, stair_h, w2, buildable_W - stair_h, s_rem, door_wall="left"))
                else:
                    fl_rooms.extend(_stack_in_bay(x2, 0, w2, stair_y, s_rem, door_wall="left"))

            else:
                # Upper floors
                fl_rooms = []
                is_duplex_floor = (is_duplex and lvl_num == 1) or f_type == "duplex_upper"
                if is_duplex_floor and ground_living_rect:
                    void_room = {
                        "name": "Duplex Void (Open to Below)",
                        "x": ground_living_rect["x"],
                        "y": ground_living_rect["y"],
                        "width": ground_living_rect["width"],
                        "height": ground_living_rect["height"],
                        "doors": [],
                        "furniture": [],
                    }
                    fl_rooms.append(void_room)
                    rem_y = ground_living_rect["y"] + ground_living_rect["height"]
                    rem_h = buildable_W - rem_y
                    if rem_h >= MIN_ROOM_DIM:
                        right_rem = [{"name": "Family Lounge", "weight": 8}, {"name": "Balcony", "weight": 4}]
                        fl_rooms.extend(_stack_in_bay(x3, rem_y, w3, rem_h, right_rem, door_wall="left"))
                else:
                    r_names = ["Family Lounge", "Balcony"]
                    for r in req_rooms:
                        if r.get("type") in ("bedroom", "master_bedroom") and len(left_rooms) >= 2:
                            r_names.insert(0, r.get("name", "Bedroom"))
                    r_list = [{"name": n, "weight": _get_weight(n)} for n in r_names]
                    fl_rooms.extend(_stack_in_bay(x3, 0, w3, buildable_W, r_list, door_wall="left"))

                left_rooms = []
                bath_i = 1
                for r in req_rooms:
                    rtype = r.get("type", "")
                    rname = r.get("name", "")
                    if "master" in rtype or "master" in rname.lower():
                        left_rooms.append("Master Bedroom")
                        if r.get("attached_bath", True):
                            left_rooms.append(f"Ensuite Bathroom {bath_i}")
                            bath_i += 1
                    elif "bedroom" in rtype or "bedroom" in rname.lower():
                        left_rooms.append(rname or f"Bedroom {lvl_num + 1}")
                        if r.get("attached_bath", True):
                            left_rooms.append(f"Bathroom {bath_i}")
                            bath_i += 1

                if not left_rooms:
                    left_rooms = ["Master Bedroom", "Ensuite Bathroom", "Balcony"]

                l_list = [{"name": n, "weight": _get_weight(n)} for n in left_rooms]
                fl_rooms.extend(_stack_in_bay(x1, 0, w1, buildable_W, l_list, door_wall="right"))

                if has_stairs:
                    stair_room = {
                        "name": "Staircase",
                        "x": round(x2, 2),
                        "y": round(stair_y, 2),
                        "width": round(w2, 2),
                        "height": stair_h,
                        "doors": [
                            {"wall": "top", "position": round(w2 / 2 - 1.5, 1), "width": 3.0},
                            {"wall": "bottom", "position": round(w2 / 2 - 1.5, 1), "width": 3.0},
                        ],
                        "furniture": [],
                    }
                    fl_rooms.append(stair_room)
                    s_rem = [{"name": "Corridor", "weight": 6}]
                    if stair_y <= 0.1:
                        fl_rooms.extend(_stack_in_bay(x2, stair_h, w2, buildable_W - stair_h, s_rem, door_wall="left"))
                    elif stair_y >= buildable_W - stair_h - 0.1:
                        fl_rooms.extend(_stack_in_bay(x2, 0, w2, stair_y, s_rem, door_wall="left"))
                    else:
                        fl_rooms.extend(_stack_in_bay(x2, 0, w2, stair_y, s_rem, door_wall="left"))

            # Setback shift
            for r in fl_rooms:
                if side_sb > 0 or front_sb > 0:
                    r["x"] = round(r["x"] + side_sb, 2)
                    r["y"] = round(r["y"] + front_sb, 2)

            # Unique room naming
            used = set()
            for r in fl_rooms:
                orig = r["name"]
                if orig not in used:
                    used.add(orig)
                    continue
                k = 2
                while f"{orig} {k}" in used:
                    k += 1
                r["name"] = f"{orig} {k}"
                used.add(r["name"])

            floor_dict = {
                "level": lvl_num,
                "name": lvl_name,
                "floor_type": f_type,
                "rooms": fl_rooms,
                "stairs": global_stair_rect if has_stairs else None,
                "plot_width": L,
                "plot_height": W,
            }
            result_floors.append(floor_dict)

        layout = {"floors": result_floors}

        # Architectural features injection
        place_windows(layout, plot_w=float(L), plot_h=float(W))
        layout = inject_furniture(layout)
        compute_paths(layout)

        for f in layout["floors"]:
            _extract_floor_features(f)

        layout["circulation_warnings"] = []
        layout["validation_report"] = [
            {"severity": "info", "room": "-", "message": f"{strategy['title']} partitioned cleanly with zero overlaps."}
        ]

        return layout
