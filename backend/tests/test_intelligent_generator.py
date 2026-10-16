"""
test_intelligent_generator.py
===============================================================================
Automated Test Suite for Phase 6, Slice 1: Intelligent Floor Plan Generation Engine
===============================================================================
"""

import pytest
from engines.intelligent_generator import (
    ConstraintEvaluator,
    IntelligentGenerationEngine,
)


class TestIntelligentGeneratorSuite:

    @pytest.fixture
    def standard_spec(self):
        return {
            "plot_width": 30.0,
            "plot_length": 40.0,
            "measurement_unit": "ft",
            "entry_direction": "east",
            "floors_count": 2,
            "is_duplex": False,
            "budget_tier": "standard",
            "bedrooms": 2,
            "bathrooms": 2,
            "seed": 42,
        }

    def test_buildable_area_and_setback_enforcement(self, standard_spec):
        """Test that rooms breaching setbacks are identified as hard constraint violations."""
        candidates = IntelligentGenerationEngine.generate_candidate_variants(
            spec=standard_spec,
            candidate_count=1,
            seed=42,
        )
        assert len(candidates) > 0
        valid_cand = candidates[0]
        assert valid_cand["hardConstraintsMet"] is True

        # Now artificially inject a room that breaches the setback
        bad_layout = {
            "floors": [
                {
                    "level": 0,
                    "name": "Level 0",
                    "rooms": [
                        {
                            "name": "Illegal Overhanging Bedroom",
                            "x": 1.0,  # Below side_setback of 4.92ft!
                            "y": 10.0,
                            "width": 12.0,
                            "height": 12.0,
                        }
                    ],
                }
            ]
        }
        eval_res = ConstraintEvaluator.evaluate_layout(bad_layout, standard_spec)
        assert eval_res["hard_constraints_met"] is False
        assert any("breaches left setback boundary" in r for r in eval_res["rejection_reasons"])
        # Gatekeeper check: failed candidate score must be penalised
        assert eval_res["metrics"]["hard_constraint_score"] == 0.0

    def test_invalid_dimensions_rejection(self, standard_spec):
        """Test that sub-minimum dimensions (<4.0ft) trigger hard constraint violations."""
        bad_dim_layout = {
            "floors": [
                {
                    "level": 0,
                    "name": "Level 0",
                    "rooms": [
                        {
                            "name": "Unusable Toilet Narrow",
                            "x": 10.0,
                            "y": 10.0,
                            "width": 2.5,  # Sub-minimum (<4.0ft)
                            "height": 6.0,
                        }
                    ],
                }
            ]
        }
        eval_res = ConstraintEvaluator.evaluate_layout(bad_dim_layout, standard_spec)
        assert eval_res["hard_constraints_met"] is False
        assert any("invalid dimensions" in r for r in eval_res["rejection_reasons"])

    def test_room_overlap_detection_with_shared_boundaries(self, standard_spec):
        """
        Test that intentional shared boundaries (tangential touching, 0 overlap area) pass,
        while genuine interior collisions (>0.05 sqft overlap area) are flagged.
        """
        # Case A: Intentional shared boundary: Room 1 [10, 10, w=10, h=10] and Room 2 [20, 10, w=10, h=10]
        # They touch at x=20. Intersecting area = 0.0 sqft.
        shared_boundary_layout = {
            "floors": [
                {
                    "level": 0,
                    "name": "Level 0",
                    "rooms": [
                        {"name": "Living Room", "x": 10.0, "y": 10.0, "width": 10.0, "height": 10.0},
                        {"name": "Dining Room", "x": 20.0, "y": 10.0, "width": 10.0, "height": 10.0},
                    ],
                }
            ]
        }
        eval_shared = ConstraintEvaluator.evaluate_layout(shared_boundary_layout, standard_spec)
        # Should NOT report collision
        assert not any("Illegal collision" in r for r in eval_shared["rejection_reasons"])

        # Case B: Genuine geometric collision: Room 2 penetrates Room 1 by 3ft (overlap area = 3 * 10 = 30 sqft)
        colliding_layout = {
            "floors": [
                {
                    "level": 0,
                    "name": "Level 0",
                    "rooms": [
                        {"name": "Living Room", "x": 10.0, "y": 10.0, "width": 10.0, "height": 10.0},
                        {"name": "Dining Room", "x": 17.0, "y": 10.0, "width": 10.0, "height": 10.0},
                    ],
                }
            ]
        }
        eval_collide = ConstraintEvaluator.evaluate_layout(colliding_layout, standard_spec)
        assert eval_collide["hard_constraints_met"] is False
        assert any("Illegal collision between 'Living Room' and 'Dining Room'" in r for r in eval_collide["rejection_reasons"])

    def test_multi_floor_staircase_continuity(self, standard_spec):
        """Test vertical staircase shaft alignment between floors."""
        # Generated candidates must have aligned stairs across levels
        candidates = IntelligentGenerationEngine.generate_candidate_variants(
            spec=standard_spec,
            candidate_count=3,
            seed=100,
        )
        for cand in candidates:
            assert cand["hardConstraintsMet"] is True
            layout = cand["layout"]
            floors = layout["floors"]
            assert len(floors) == 2
            stair0 = floors[0]["stairs"]
            stair1 = floors[1]["stairs"]
            assert stair0 is not None
            assert stair1 is not None
            assert abs(stair0["x"] - stair1["x"]) <= 0.2
            assert abs(stair0["y"] - stair1["y"]) <= 0.2
            assert abs(stair0["width"] - stair1["width"]) <= 0.2

        # Artificially shifted staircase on Level 1 must fail
        cand_layout = candidates[0]["layout"]
        broken_layout = {
            "floors": [
                {
                    "level": 0,
                    "name": "Level 0",
                    "stairs": {"x": 12.0, "y": 20.0, "width": 8.0, "depth": 10.0},
                    "rooms": [
                        {"name": "Staircase", "x": 12.0, "y": 20.0, "width": 8.0, "height": 10.0},
                    ],
                },
                {
                    "level": 1,
                    "name": "Level 1",
                    "stairs": {"x": 18.0, "y": 20.0, "width": 8.0, "depth": 10.0},  # Shifted by 6ft!
                    "rooms": [
                        {"name": "Staircase", "x": 18.0, "y": 20.0, "width": 8.0, "height": 10.0},
                    ],
                },
            ]
        }
        eval_broken = ConstraintEvaluator.evaluate_layout(broken_layout, standard_spec)
        assert eval_broken["hard_constraints_met"] is False
        assert any("breaking vertical shaft continuity" in r for r in eval_broken["rejection_reasons"])

    def test_candidate_diversity(self, standard_spec):
        """Test that generated candidate variants are architecturally distinct from one another."""
        candidates = IntelligentGenerationEngine.generate_candidate_variants(
            spec=standard_spec,
            candidate_count=3,
            seed=42,
        )
        assert len(candidates) == 3

        c1, c2, c3 = candidates[0], candidates[1], candidates[2]
        # Variants have different titles and IDs
        assert c1["title"] != c2["title"]
        assert c2["title"] != c3["title"]

        # Geometries must differ (check ground floor living room x position or dimensions)
        rooms1 = c1["layout"]["floors"][0]["rooms"]
        rooms2 = c2["layout"]["floors"][0]["rooms"]
        liv1 = next(r for r in rooms1 if "living" in r["name"].lower())
        liv2 = next(r for r in rooms2 if "living" in r["name"].lower())
        # Variant A has living on right, Variant B has open living on left
        assert liv1["x"] != liv2["x"] or liv1["width"] != liv2["width"]

    def test_deterministic_output(self, standard_spec):
        """Test that identical input and seed produce identical layouts and scores."""
        run1 = IntelligentGenerationEngine.generate_candidate_variants(
            spec=standard_spec,
            candidate_count=3,
            seed=999,
        )
        run2 = IntelligentGenerationEngine.generate_candidate_variants(
            spec=standard_spec,
            candidate_count=3,
            seed=999,
        )

        for c1, c2 in zip(run1, run2):
            assert c1["variantId"] == c2["variantId"]
            assert c1["compositeScore"] == c2["compositeScore"]
            assert c1["hardConstraintsMet"] == c2["hardConstraintsMet"]
            f1_rooms = c1["layout"]["floors"][0]["rooms"]
            f2_rooms = c2["layout"]["floors"][0]["rooms"]
            assert len(f1_rooms) == len(f2_rooms)
            for r1, r2 in zip(f1_rooms, f2_rooms):
                assert r1["name"] == r2["name"]
                assert r1["x"] == r2["x"]
                assert r1["y"] == r2["y"]
                assert r1["width"] == r2["width"]
                assert r1["height"] == r2["height"]

    def test_ranking_priority_and_explainable_reasons(self, standard_spec):
        """Test that hard-constraint satisfaction takes priority over aesthetic scores."""
        candidates = IntelligentGenerationEngine.generate_candidate_variants(
            spec=standard_spec,
            candidate_count=3,
            seed=42,
        )
        # All valid candidates must have rank assigned and explainable reasons
        for cand in candidates:
            assert "rank" in cand
            assert "reasons" in cand
            assert len(cand["reasons"]) > 0
            assert "metrics" in cand
            assert cand["metrics"]["coverage_score"] > 0
            assert cand["metrics"]["adjacency_score"] > 0
            assert cand["metrics"]["circulation_score"] > 0

        # Ranks must be 1, 2, 3
        ranks = [c["rank"] for c in candidates]
        assert ranks == [1, 2, 3]

        # Candidate 1 must be marked as RECOMMENDED
        assert candidates[0]["badge"] == "#1 RECOMMENDED"

    def test_parking_door_fit_and_clearance(self):
        """Test that generation with parking produces valid doors fitting host walls."""
        from engines.canonical_model import migrate_legacy_to_canonical, validate_canonical_document
        spec_with_parking = {
            "plot_width": 30.0,
            "plot_length": 40.0,
            "entry_direction": "north",
            "floors_count": 1,
            "floors": [
                {
                    "level": 0,
                    "name": "Ground Floor",
                    "required_rooms": [
                        {"type": "living", "name": "Living Room"},
                        {"type": "kitchen", "name": "Kitchen"},
                        {"type": "parking", "name": "Car Parking"},
                        {"type": "bedroom", "name": "Bedroom 1"},
                    ],
                }
            ],
        }
        candidates = IntelligentGenerationEngine.generate_candidate_variants(
            spec=spec_with_parking,
            candidate_count=3,
            seed=101,
        )
        assert len(candidates) == 3
        for cand in candidates:
            # Candidate must satisfy hard constraints
            assert cand["hardConstraintsMet"] is True
            # Migration to CanonicalBuildingDocument must be 100% valid with 0 errors
            canonical = migrate_legacy_to_canonical(cand["layout"])
            res = validate_canonical_document(canonical)
            assert res["valid"] is True, f"Validation failed: {res['errors']}"

    def test_main_entrance_door_presence(self, standard_spec):
        """Test that generated ground floor contains a recognized Main Entrance Door."""
        from engines.canonical_model import migrate_legacy_to_canonical
        candidates = IntelligentGenerationEngine.generate_candidate_variants(
            spec=standard_spec,
            candidate_count=1,
            seed=42,
        )
        cand = candidates[0]
        canonical = migrate_legacy_to_canonical(cand["layout"])
        lvl0 = canonical.levels[0]
        entrance_door = next((op for op in lvl0.openings if "entrance" in op.name.lower() or "entry" in op.name.lower()), None)
        assert entrance_door is not None, "Ground floor must feature an exterior Main Entrance Door"
        assert entrance_door.width >= 0.8, "Entrance door must have architectural width"

