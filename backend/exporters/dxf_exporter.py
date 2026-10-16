"""
dxf_exporter.py
===============
Exports single-floor and multi-floor architectural layouts to AutoCAD R2010-compatible DXF.

CAD Layer Conventions (AIA / ACI Standards):
  - A-WALL : Wall perimeters and partitions (White / ACI Index 7)
  - A-DOOR : Door openings, frames, and inward swing arcs (Yellow / ACI Index 2)
  - A-GLAZ : Windows, sills, and glazing double lines (Cyan / ACI Index 4)
  - A-STAIR: Staircase tread steps and directional path arrows (Magenta / ACI Index 6)
  - A-FURN : Furniture boundaries and catalog fixture blocks (Green / ACI Index 3)
  - A-DIMS : Linear room and plot dimension annotations (Red / ACI Index 1)
  - A-ANNO : Room name tags, area schedules, and floor title blocks (White / ACI Index 7)
  - PLOT_BOUNDARY : Plot boundary perimeters (Red / ACI Index 1)

Units:
  1 JSON unit = 1 foot = 304.8 mm in AutoCAD modelspace.
"""

from __future__ import annotations

import os
import tempfile
from typing import Any, Dict, List, Optional, Union
import ezdxf
from ezdxf import units

SCALE = 304.8  # 1 ft in mm


def _setup_cad_layers(doc: Any) -> None:
    """Configures AIA-compliant CAD layers with standard ACI color codes."""
    layers_config = [
        ("A-WALL", 7, 50),       # White, 0.50mm lineweight
        ("A-DOOR", 2, 25),       # Yellow, 0.25mm lineweight
        ("A-GLAZ", 4, 25),       # Cyan, 0.25mm lineweight
        ("A-STAIR", 6, 35),      # Magenta, 0.35mm lineweight
        ("A-FURN", 3, 18),       # Green, 0.18mm lineweight
        ("A-DIMS", 1, 15),       # Red, 0.15mm lineweight
        ("A-ANNO", 7, 20),       # White, 0.20mm lineweight
        ("PLOT_BOUNDARY", 1, 70),# Red, 0.70mm lineweight
        # Backward compatibility aliases
        ("WALLS", 7, 50),
        ("DOORS", 2, 25),
        ("WINDOW", 4, 25),
        ("WALLOPENING", 7, 13),
        ("FURNITURE", 3, 18),
        ("DIMENSIONS", 1, 15),
        ("LABELS", 7, 20),
    ]

    for name, color, lineweight in layers_config:
        if name not in doc.layers:
            layer = doc.layers.add(name, color=color)
            layer.dxf.lineweight = lineweight


def _setup_dimension_styles(doc: Any) -> None:
    """Configures architectural dimension style."""
    if "EZ_ARCH" not in doc.dimstyles:
        doc.dimstyles.add("EZ_ARCH")
    dimstyle = doc.dimstyles.get("EZ_ARCH")
    dimstyle.dxf.dimtxt = 0.45 * SCALE   # Text height ~137 mm (~5.4 in)
    dimstyle.dxf.dimasz = 0.25 * SCALE   # Arrow size
    dimstyle.dxf.dimexe = 0.20 * SCALE   # Extension line extension
    dimstyle.dxf.dimexo = 0.15 * SCALE   # Extension line offset

    # Also keep legacy dimstyle name
    if "EZ_INSIDE" not in doc.dimstyles:
        doc.dimstyles.add("EZ_INSIDE")
    d_inside = doc.dimstyles.get("EZ_INSIDE")
    d_inside.dxf.dimtxt = 0.45 * SCALE
    d_inside.dxf.dimasz = 0.25 * SCALE
    d_inside.dxf.dimexe = 0.20 * SCALE
    d_inside.dxf.dimexo = 0.15 * SCALE


def _draw_door_inward(
    msp: Any,
    room_x: float,
    room_y: float,
    room_w: float,
    room_h: float,
    wall: str,
    pos: float,
    door_w: float,
    layer: str = "A-DOOR",
) -> None:
    """Draws an inward-swinging door leaf and arc in model space."""
    attribs = {"layer": layer, "lineweight": 25}
    wall_attribs = {"layer": layer, "lineweight": 18}

    x, y, w, h = room_x, room_y, room_w, room_h

    if wall == "bottom":
        hx = x + pos
        hy = y + h
        leaf_x = hx
        leaf_y = hy - door_w
        msp.add_arc(
            center=(hx, hy),
            radius=door_w,
            start_angle=270,
            end_angle=0,
            dxfattribs=attribs,
        )
        msp.add_line((hx, hy), (leaf_x, leaf_y), dxfattribs=wall_attribs)
        msp.add_line(
            (hx, hy),
            (hx + door_w, hy),
            dxfattribs={"layer": "WALLOPENING", "lineweight": 13},
        )

    elif wall == "top":
        hx = x + pos
        hy = y
        leaf_x = hx
        leaf_y = hy + door_w
        msp.add_arc(
            center=(hx, hy),
            radius=door_w,
            start_angle=0,
            end_angle=90,
            dxfattribs=attribs,
        )
        msp.add_line((hx, hy), (leaf_x, leaf_y), dxfattribs=wall_attribs)
        msp.add_line(
            (hx, hy),
            (hx + door_w, hy),
            dxfattribs={"layer": "WALLOPENING", "lineweight": 13},
        )

    elif wall == "left":
        hx = x
        hy = y + pos
        leaf_x = hx + door_w
        leaf_y = hy
        msp.add_arc(
            center=(hx, hy),
            radius=door_w,
            start_angle=0,
            end_angle=90,
            dxfattribs=attribs,
        )
        msp.add_line((hx, hy), (leaf_x, leaf_y), dxfattribs=wall_attribs)
        msp.add_line(
            (hx, hy),
            (hx, hy + door_w),
            dxfattribs={"layer": "WALLOPENING", "lineweight": 13},
        )

    elif wall == "right":
        hx = x + w
        hy = y + pos
        leaf_x = hx - door_w
        leaf_y = hy
        msp.add_arc(
            center=(hx, hy),
            radius=door_w,
            start_angle=90,
            end_angle=180,
            dxfattribs=attribs,
        )
        msp.add_line((hx, hy), (leaf_x, leaf_y), dxfattribs=wall_attribs)
        msp.add_line(
            (hx, hy),
            (hx, hy + door_w),
            dxfattribs={"layer": "WALLOPENING", "lineweight": 13},
        )


def _draw_staircase(
    msp: Any,
    rx: float,
    ry: float,
    rw: float,
    rh: float,
    layer: str = "A-STAIR",
) -> None:
    """Renders architectural staircase treads and a directional UP/DOWN arrow."""
    # Determine primary direction: longest axis
    if rw >= rh:
        num_treads = max(4, int((rw / SCALE) / 1.0))
        tread_w = rw / num_treads
        for i in range(1, num_treads):
            tx = rx + i * tread_w
            msp.add_line((tx, ry), (tx, ry + rh), dxfattribs={"layer": layer, "lineweight": 25})

        # Directional center line & arrow
        mid_y = ry + rh / 2.0
        start_x = rx + tread_w * 0.5
        end_x = rx + rw - tread_w * 0.5
        msp.add_line((start_x, mid_y), (end_x, mid_y), dxfattribs={"layer": layer, "lineweight": 35})
        # Arrowhead
        arrow_sz = 0.35 * SCALE
        msp.add_line((end_x, mid_y), (end_x - arrow_sz, mid_y + arrow_sz * 0.6), dxfattribs={"layer": layer, "lineweight": 35})
        msp.add_line((end_x, mid_y), (end_x - arrow_sz, mid_y - arrow_sz * 0.6), dxfattribs={"layer": layer, "lineweight": 35})
        # UP label
        up_text = msp.add_mtext("UP", dxfattribs={"layer": layer})
        up_text.set_location((end_x - arrow_sz * 2.0, mid_y + arrow_sz * 0.8), attachment_point=5)
        up_text.dxf.char_height = 0.35 * SCALE
    else:
        num_treads = max(4, int((rh / SCALE) / 1.0))
        tread_h = rh / num_treads
        for i in range(1, num_treads):
            ty = ry + i * tread_h
            msp.add_line((rx, ty), (rx + rw, ty), dxfattribs={"layer": layer, "lineweight": 25})

        mid_x = rx + rw / 2.0
        start_y = ry + tread_h * 0.5
        end_y = ry + rh - tread_h * 0.5
        msp.add_line((mid_x, start_y), (mid_x, end_y), dxfattribs={"layer": layer, "lineweight": 35})
        arrow_sz = 0.35 * SCALE
        msp.add_line((mid_x, end_y), (mid_x - arrow_sz * 0.6, end_y - arrow_sz), dxfattribs={"layer": layer, "lineweight": 35})
        msp.add_line((mid_x, end_y), (mid_x + arrow_sz * 0.6, end_y - arrow_sz), dxfattribs={"layer": layer, "lineweight": 35})
        up_text = msp.add_mtext("UP", dxfattribs={"layer": layer})
        up_text.set_location((mid_x + arrow_sz * 0.8, end_y - arrow_sz * 2.0), attachment_point=5)
        up_text.dxf.char_height = 0.35 * SCALE


def _draw_duplex_void(
    msp: Any,
    rx: float,
    ry: float,
    rw: float,
    rh: float,
    layer: str = "A-ANNO",
) -> None:
    """Draws crossing diagonal lines (X) representing a double-height ceiling void."""
    # Crossing diagonals
    msp.add_line((rx, ry), (rx + rw, ry + rh), dxfattribs={"layer": layer, "lineweight": 18})
    msp.add_line((rx, ry + rh), (rx + rw, ry), dxfattribs={"layer": layer, "lineweight": 18})


def _render_single_floor(
    msp: Any,
    rooms: List[Dict[str, Any]],
    plot_w: float,
    plot_h: float,
    x_offset: float,
    floor_title: str,
    floor_level: int,
) -> None:
    """Renders one floor plate at x_offset in modelspace."""
    pw = plot_w * SCALE
    ph = plot_h * SCALE
    max_y_ft = plot_h

    # 1. Plot boundary for this floor
    msp.add_lwpolyline(
        [
            (x_offset, 0),
            (x_offset + pw, 0),
            (x_offset + pw, ph),
            (x_offset, ph),
        ],
        close=True,
        dxfattribs={"layer": "PLOT_BOUNDARY", "lineweight": 70},
    )

    # 2. Floor title text block below the floor plate
    title_y = -3.5 * SCALE
    title_x = x_offset + pw / 2.0
    title_mtext = msp.add_mtext(
        f"{floor_title.upper()}\nSCALE 1:100 · LEVEL {floor_level}",
        dxfattribs={"layer": "A-ANNO"},
    )
    title_mtext.set_location((title_x, title_y), attachment_point=5)
    title_mtext.dxf.char_height = 0.7 * SCALE
    title_mtext.dxf.width = pw * 0.9

    # 3. Rooms
    for room in rooms:
        raw_x = float(room.get("x", 0.0))
        raw_y = float(room.get("y", 0.0))
        raw_w = float(room.get("width", 10.0))
        raw_h = float(room.get("height", 10.0))

        rx = x_offset + (raw_x * SCALE)
        rw = raw_w * SCALE
        rh = raw_h * SCALE
        # SVG y-down to DXF y-up
        ry = (max_y_ft - (raw_y + raw_h)) * SCALE

        room_name = room.get("name", "Room")
        is_void = (
            room.get("is_void", False)
            or "void" in room_name.lower()
            or room.get("type") == "void"
        )
        is_stair = (
            "stair" in room_name.lower()
            or room.get("type") in ("staircase", "stairs")
            or room.get("is_stair", False)
        )

        # ── Walls ───────────────────────────────────────────────────────────
        wall_pts = [(rx, ry), (rx + rw, ry), (rx + rw, ry + rh), (rx, ry + rh)]
        msp.add_lwpolyline(
            wall_pts,
            close=True,
            dxfattribs={"layer": "A-WALL", "lineweight": 50},
        )

        # ── Duplex Void or Staircase or Standard Room ───────────────────────
        if is_void:
            _draw_duplex_void(msp, rx, ry, rw, rh, layer="A-ANNO")
        elif is_stair:
            _draw_staircase(msp, rx, ry, rw, rh, layer="A-STAIR")

        # ── Room Label & Area Schedule ──────────────────────────────────────
        cx = rx + rw / 2.0
        cy = ry + rh / 2.0
        area_sqft = raw_w * raw_h
        area_sqm = area_sqft * 0.092903

        if is_void:
            label = f"{room_name.upper()}\n(DOUBLE-HEIGHT VOID)\n{raw_w:.1f}' × {raw_h:.1f}'"
        else:
            label = f"{room_name.upper()}\n{raw_w:.1f}' × {raw_h:.1f}'\n{area_sqft:.0f} SQ FT ({area_sqm:.1f} m²)"

        mtext = msp.add_mtext(label, dxfattribs={"layer": "A-ANNO"})
        mtext.set_location((cx, cy), attachment_point=5)
        mtext.dxf.char_height = 0.45 * SCALE
        mtext.dxf.width = rw * 0.85

        # ── Doors ───────────────────────────────────────────────────────────
        for door in room.get("doors", []):
            door_w_ft = float(door.get("width", 3.0))
            wall = door.get("wall", "bottom")
            # Invert wall for y-flip
            if wall == "top":
                wall = "bottom"
            elif wall == "bottom":
                wall = "top"
            pos_ft = float(door.get("position", 0.0))

            door_w_mm = door_w_ft * SCALE
            pos_mm = pos_ft * SCALE

            if wall in ("bottom", "top"):
                max_dw = rw - pos_mm - SCALE * 0.3
            else:
                max_dw = rh - pos_mm - SCALE * 0.3
            door_w_mm = max(SCALE * 1.0, min(door_w_mm, max_dw))

            _draw_door_inward(
                msp,
                room_x=rx,
                room_y=ry,
                room_w=rw,
                room_h=rh,
                wall=wall,
                pos=pos_mm,
                door_w=door_w_mm,
                layer="A-DOOR",
            )

        # ── Windows ─────────────────────────────────────────────────────────
        for window in room.get("windows", []):
            wall = window.get("wall", "")
            if wall == "top":
                wall = "bottom"
            elif wall == "bottom":
                wall = "top"
            w_pos = float(window.get("position", 0.0)) * SCALE
            w_width = float(window.get("width", 3.0)) * SCALE
            gap = SCALE * 0.15
            w_attribs = {"layer": "A-GLAZ", "lineweight": 25}

            if wall == "top":
                x1, x2, y_pos = rx + w_pos, rx + w_pos + w_width, ry
                msp.add_line((x1, y_pos), (x2, y_pos), dxfattribs=w_attribs)
                msp.add_line((x1, y_pos - gap), (x2, y_pos - gap), dxfattribs=w_attribs)
                for tx in [x1, x2]:
                    msp.add_line((tx, y_pos - gap * 2), (tx, y_pos + gap), dxfattribs=w_attribs)
            elif wall == "bottom":
                x1, x2, y_pos = rx + w_pos, rx + w_pos + w_width, ry + rh
                msp.add_line((x1, y_pos), (x2, y_pos), dxfattribs=w_attribs)
                msp.add_line((x1, y_pos + gap), (x2, y_pos + gap), dxfattribs=w_attribs)
                for tx in [x1, x2]:
                    msp.add_line((tx, y_pos - gap), (tx, y_pos + gap * 2), dxfattribs=w_attribs)
            elif wall == "left":
                y1, y2, x_pos = ry + w_pos, ry + w_pos + w_width, rx
                msp.add_line((x_pos, y1), (x_pos, y2), dxfattribs=w_attribs)
                msp.add_line((x_pos - gap, y1), (x_pos - gap, y2), dxfattribs=w_attribs)
                for ty in [y1, y2]:
                    msp.add_line((x_pos - gap * 2, ty), (x_pos + gap, ty), dxfattribs=w_attribs)
            elif wall == "right":
                y1, y2, x_pos = ry + w_pos, ry + w_pos + w_width, rx + rw
                msp.add_line((x_pos, y1), (x_pos, y2), dxfattribs=w_attribs)
                msp.add_line((x_pos + gap, y1), (x_pos + gap, y2), dxfattribs=w_attribs)
                for ty in [y1, y2]:
                    msp.add_line((x_pos - gap, ty), (x_pos + gap * 2, ty), dxfattribs=w_attribs)

        # ── Furniture ─────────────────────────────────────────────────────────
        for furn in room.get("furniture", []):
            fx = rx + (float(furn.get("x", 0.0)) * SCALE)
            # Invert inside room
            fy = ry + (float(furn.get("y", 0.0)) * SCALE)
            fw = float(furn.get("width", 2.0)) * SCALE
            fh = float(furn.get("height", 2.0)) * SCALE

            pts = [(fx, fy), (fx + fw, fy), (fx + fw, fy + fh), (fx, fy + fh)]
            msp.add_lwpolyline(
                pts,
                close=True,
                dxfattribs={"layer": "A-FURN", "lineweight": 18},
            )

            fcx, fcy = fx + fw / 2.0, fy + fh / 2.0
            f_name = furn.get("name", "Item")
            f_label = msp.add_mtext(f_name, dxfattribs={"layer": "A-FURN"})
            f_label.set_location((fcx, fcy), attachment_point=5)
            f_label.dxf.char_height = 0.28 * SCALE
            f_label.dxf.width = fw * 0.9

        # ── Room Dimension Line ───────────────────────────────────────────────
        try:
            dim = msp.add_linear_dim(
                base=(rx, ry - SCALE * 1.2),
                p1=(rx, ry),
                p2=(rx + rw, ry),
                dimstyle="EZ_ARCH",
                dxfattribs={"layer": "A-DIMS"},
            )
            dim.render()
        except Exception as e:
            # Dimension rendering fallback
            pass


def export_multi_floor_dxf(
    layout_data: Union[Dict[str, Any], List[Any]],
    output_path: Optional[str] = None,
    plot_w: Optional[float] = None,
    plot_h: Optional[float] = None,
) -> Union[bytes, str]:
    """
    Exports a complete multi-floor layout or single-floor room list into an AutoCAD R2010 DXF.
    Each floor level is arranged side-by-side along the X-axis with standard CAD layers.

    Returns raw DXF bytes, or file path if output_path is provided.
    """
    doc = ezdxf.new(dxfversion="R2010", setup=True)
    doc.units = units.MM
    msp = doc.modelspace()

    _setup_cad_layers(doc)
    _setup_dimension_styles(doc)

    # Extract floors
    floors: List[Dict[str, Any]] = []
    if isinstance(layout_data, list):
        # Passed direct list of rooms
        floors = [{"level": 0, "name": "Ground Floor", "rooms": layout_data}]
    elif isinstance(layout_data, dict):
        if "floors" in layout_data and isinstance(layout_data["floors"], list) and len(layout_data["floors"]) > 0:
            floors = layout_data["floors"]
        elif "rooms" in layout_data:
            floors = [{"level": 0, "name": "Ground Floor", "rooms": layout_data["rooms"]}]
        else:
            floors = [{"level": 0, "name": "Ground Floor", "rooms": []}]

    # Determine plot dimensions
    pw = plot_w
    ph = plot_h
    if pw is None or ph is None:
        if isinstance(layout_data, dict) and "form" in layout_data:
            form = layout_data["form"]
            pw = float(form.get("width", 30.0))
            ph = float(form.get("length", 40.0))
        elif isinstance(layout_data, dict) and "plot_width" in layout_data:
            pw = float(layout_data.get("plot_width", 30.0))
            ph = float(layout_data.get("plot_height", 40.0))

    if pw is None or ph is None:
        # Calculate from room boundaries
        all_rooms = [r for fl in floors for r in fl.get("rooms", [])]
        if all_rooms:
            max_x = max(float(r.get("x", 0.0)) + float(r.get("width", 10.0)) for r in all_rooms)
            max_y = max(float(r.get("y", 0.0)) + float(r.get("height", 10.0)) for r in all_rooms)
            pw = max(30.0, max_x)
            ph = max(40.0, max_y)
        else:
            pw, ph = 30.0, 40.0

    # Arrange floors side-by-side: x_offset = idx * (plot_w + 20 ft) * SCALE
    offset_spacing_ft = pw + 20.0
    for idx, floor in enumerate(floors):
        floor_level = floor.get("level", idx)
        if isinstance(floor_level, str) and floor_level.isdigit():
            floor_level = int(floor_level)
        elif not isinstance(floor_level, int):
            floor_level = idx

        floor_name = floor.get("name") or (f"Level {floor_level}" if floor_level > 0 else "Ground Floor")
        rooms = floor.get("rooms", [])
        x_offset = idx * offset_spacing_ft * SCALE

        _render_single_floor(
            msp=msp,
            rooms=rooms,
            plot_w=pw,
            plot_h=ph,
            x_offset=x_offset,
            floor_title=floor_name,
            floor_level=floor_level,
        )

    # Save to path or return bytes
    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        doc.saveas(output_path)
        return output_path

    with tempfile.NamedTemporaryFile(suffix=".dxf", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        doc.saveas(tmp_path)
        with open(tmp_path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def export_to_dxf(
    rooms: Union[List[Dict[str, Any]], Dict[str, Any]],
    plot_w: Optional[float] = None,
    plot_h: Optional[float] = None,
) -> bytes:
    """
    Backward-compatible entry point for exporting room list or layout dict to DXF bytes.
    """
    res = export_multi_floor_dxf(layout_data=rooms, plot_w=plot_w, plot_h=plot_h)
    if isinstance(res, str):
        with open(res, "rb") as f:
            return f.read()
    return res
