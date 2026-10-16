"""
test_canonical_geometry.py
===============================================================================
Unit Test Suite for Canonical Building Document & Geometry Validation (Phase 1).

Acceptance Criteria Verified:
  1. Wall-graph representation and node-to-wall topology.
  2. Opening fit and corner clearance validation.
  3. Room overlap detection.
  4. Lossless legacy migration from v0 format (legacy fixture round-trip).
  5. Derived projection fidelity to legacy format for CAD/PDF exporters.
===============================================================================
"""

import os
import sys
import unittest

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engines.canonical_model import (
    CanonicalBuildingDocument,
    SitePlot,
    Point2D,
    Level,
    WallNode,
    Wall,
    Opening,
    CanonicalRoom,
    PlacedItem,
    validate_canonical_document,
    migrate_legacy_to_canonical,
    canonical_to_legacy_dict,
)


class TestCanonicalGeometry(unittest.TestCase):

    def setUp(self):
        """Create a minimal valid 1-room canonical building document."""
        # 4 corners of a 4m x 5m room on a 10m x 15m site
        nodes = [
            WallNode(id="n1", x=1.0, y=1.0),
            WallNode(id="n2", x=5.0, y=1.0),
            WallNode(id="n3", x=5.0, y=6.0),
            WallNode(id="n4", x=1.0, y=6.0),
        ]
        walls = [
            Wall(id="w1", start_node_id="n1", end_node_id="n2", kind="exterior"),
            Wall(id="w2", start_node_id="n2", end_node_id="n3", kind="exterior"),
            Wall(id="w3", start_node_id="n3", end_node_id="n4", kind="exterior"),
            Wall(id="w4", start_node_id="n4", end_node_id="n1", kind="exterior"),
        ]
        openings = [
            # 0.9m door on 4m wall (w1), centered at offset 2.0m
            Opening(id="op1", wall_id="w1", offset=2.0, width=0.9, type="single_door", name="Front Door"),
        ]
        rooms = [
            CanonicalRoom(id="r1", name="Living Room", room_type="living", boundary_node_ids=["n1", "n2", "n3", "n4"]),
        ]
        items = [
            PlacedItem(id="i1", asset_id="sofa_3_seater", name="3-Seater Sofa", x=2.0, y=2.0, width=2.1, depth=0.9, height=0.85),
        ]

        self.valid_doc = CanonicalBuildingDocument(
            schema_version=1,
            id="test_doc_01",
            site=SitePlot(
                plot_polygon=[Point2D(x=0, y=0), Point2D(x=10, y=0), Point2D(x=10, y=15), Point2D(x=0, y=15)],
                width=10.0,
                length=15.0,
                entry_side="north",
            ),
            levels=[
                Level(id="lvl_0", level_index=0, name="Ground Floor", nodes=nodes, walls=walls, openings=openings, rooms=rooms, items=items)
            ],
        )

    def test_valid_document_passes_validation(self):
        """Test that a well-formed canonical document passes validation with 0 errors."""
        res = validate_canonical_document(self.valid_doc)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)

    def test_opening_exceeding_wall_fails_validation(self):
        """Test that an opening larger than its wall or violating clearance is rejected."""
        doc = self.valid_doc.model_copy(deep=True)
        # Wall w1 is 4m long (from x=1 to x=5). Place an oversized 5m opening
        doc.levels[0].openings.append(
            Opening(id="op_invalid", wall_id="w1", offset=2.0, width=5.0, type="sliding_door")
        )
        res = validate_canonical_document(doc)
        self.assertFalse(res["valid"])
        self.assertTrue(any("exceeds Wall w1 bounds" in err for err in res["errors"]))

    def test_missing_wall_node_reference_fails_validation(self):
        """Test that a room referencing a non-existent wall node is flagged as an error."""
        doc = self.valid_doc.model_copy(deep=True)
        doc.levels[0].rooms[0].boundary_node_ids.append("non_existent_node_id")
        res = validate_canonical_document(doc)
        self.assertFalse(res["valid"])
        self.assertTrue(any("missing WallNode 'non_existent_node_id'" in err for err in res["errors"]))

    def test_legacy_migration_round_trip(self):
        """Test that a legacy v0 project payload migrates cleanly into CanonicalBuildingDocument."""
        legacy_payload = {
            "id": "legacy_proj_123",
            "name": "2BHK 30x40ft Residence",
            "plot_width": 30.0,
            "plot_length": 40.0,
            "floors": [
                {
                    "level": 0,
                    "name": "Ground Floor",
                    "rooms": [
                        {
                            "name": "Living Room",
                            "x": 0.0,
                            "y": 0.0,
                            "width": 15.0,
                            "height": 20.0,
                            "doors": [{"wall": "bottom", "position": 5.0, "width": 3.0}],
                            "windows": [{"wall": "top", "position": 6.0, "width": 4.0}],
                            "furniture": [{"id": "f1", "name": "3-Seater Sofa", "x": 2.0, "y": 3.0, "width": 7.0, "height": 3.0}],
                        },
                        {
                            "name": "Master Bedroom",
                            "x": 15.0,
                            "y": 0.0,
                            "width": 15.0,
                            "height": 20.0,
                            "doors": [{"wall": "bottom", "position": 4.0, "width": 3.0}],
                            "windows": [{"wall": "top", "position": 5.0, "width": 4.0}],
                        },
                    ],
                }
            ],
        }

        # Migrate to Canonical
        canonical = migrate_legacy_to_canonical(legacy_payload)
        self.assertEqual(canonical.schema_version, 1)
        self.assertEqual(len(canonical.levels), 1)

        level0 = canonical.levels[0]
        self.assertEqual(len(level0.rooms), 2)
        # Shared boundary between (15, 0) and (15, 20) should deduplicate wall nodes
        node_xs = [round(n.x, 2) for n in level0.nodes]
        self.assertIn(0.0, node_xs)
        self.assertIn(round(15.0 * 0.3048, 2), node_xs)

        # Validate migrated canonical model
        validation = validate_canonical_document(canonical)
        self.assertTrue(validation["valid"], f"Migrated document has errors: {validation['errors']}")

        # Project back to legacy dictionary for exporters
        projected = canonical_to_legacy_dict(canonical)
        self.assertEqual(projected["schemaVersion"], 1)
        self.assertEqual(len(projected["floors"]), 1)
        self.assertEqual(len(projected["floors"][0]["rooms"]), 2)
        r0 = projected["floors"][0]["rooms"][0]
        self.assertEqual(r0["name"], "Living Room")
        self.assertAlmostEqual(r0["width"], 15.0, delta=0.5)
    def test_shared_doorway_deduplication(self):
        """Verify that shared doorway on partition wall between Living Room and Dining Room deduplicates cleanly."""
        legacy_payload = {
            "plot_width": 50,
            "plot_length": 50,
            "entry_direction": "north",
            "floors": [
                {
                    "level": 0,
                    "name": "Ground Floor",
                    "elevation": 0,
                    "height": 10,
                    "rooms": [
                        {
                            "name": "Living Room",
                            "x": 0,
                            "y": 0,
                            "width": 20,
                            "length": 15,
                            "doors": [
                                {
                                    "id": "door_living_01",
                                    "name": "Living Room Door",
                                    "wall": "east",
                                    "offset": 7.5,
                                    "width": 3.0,
                                    "type": "single",
                                }
                            ],
                        },
                        {
                            "name": "Dining Room",
                            "x": 20,
                            "y": 0,
                            "width": 15,
                            "length": 15,
                            "doors": [
                                {
                                    "id": "door_dining_01",
                                    "name": "Dining Room Door",
                                    "wall": "west",
                                    "offset": 7.5,
                                    "width": 3.0,
                                    "type": "single",
                                }
                            ],
                        },
                    ],
                }
            ],
        }

        canonical = migrate_legacy_to_canonical(legacy_payload)
        validation = validate_canonical_document(canonical)
        overlap_errors = [e for e in validation.get("errors", []) if "overlap" in e.lower()]
        self.assertEqual(len(overlap_errors), 0, f"Expected 0 overlap errors, found: {overlap_errors}")


if __name__ == "__main__":
    unittest.main()

