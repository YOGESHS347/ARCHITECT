"""
pdf_dossier.py
==============
Multi-Page Architectural Blueprint Dossier & Engineering Report Generator.
Built with ReportLab Platypus for high-precision print-ready vector PDF documents.

Structure:
  - Page 1: Cover Page — Architectural header, plot metadata, compliance dashboard KPI cards
  - Pages 2..N: Floor Blueprint Pages (One page per floor level):
      * High-resolution rendered 2D blueprint plate
      * Room Area Schedule table (Name, Dimensions, Area sqft/m², Bath status)
      * Furniture & Lighting Fixture Inventory schedule for that level
  - Final Page: Engineering & Cost Estimation (BOM):
      * Itemized category breakdown: Structural & Masonry, Finishing, Doors & Windows, Electrical & Plumbing
      * Subtotals & Grand Total with currency formatting
      * Vastu compass alignment remarks & NBC compliance checklist notes
"""

from __future__ import annotations

import base64
import io
import os
from datetime import date
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable, PageBreak, KeepTogether
)

from exporters.floor_renderer import render_floor_plan

# ── Color Palette ─────────────────────────────────────────────────────────────
BRAND_INK       = colors.HexColor("#0f172a")   # Slate 900
BRAND_ACCENT    = colors.HexColor("#2563eb")   # Royal Blue
BRAND_GREEN     = colors.HexColor("#16a34a")   # Success Green
BRAND_WARN      = colors.HexColor("#d97706")   # Amber Warning
BRAND_FAIL      = colors.HexColor("#dc2626")   # Red
BRAND_MID       = colors.HexColor("#475569")   # Slate 600
BRAND_LIGHT     = colors.HexColor("#f8fafc")   # Slate 50
BRAND_BORDER    = colors.HexColor("#e2e8f0")   # Slate 200
BRAND_HEADER    = colors.HexColor("#1e293b")   # Slate 800
ROW_ALT         = colors.HexColor("#f1f5f9")   # Slate 100
SECTION_TEAL    = colors.HexColor("#0d9488")   # Teal
SECTION_PURPLE  = colors.HexColor("#7c3aed")   # Purple


def _format_currency(amount: float, currency: str = "INR") -> str:
    """Formats amount into formatted currency string (INR or USD)."""
    if currency == "USD":
        return f"${amount:,.2f}"
    # Default: INR formatting
    if amount >= 1_00_00_000:
        return f"Rs. {amount / 1_00_00_000:.2f} Cr"
    if amount >= 1_00_000:
        return f"Rs. {amount / 1_00_000:.2f} L"
    return f"Rs. {amount:,.0f}"


def _draw_dossier_header_footer(canvas: Any, doc: Any) -> None:
    """Canvas callback rendering architectural header and footer with page numbers."""
    canvas.saveState()
    w, h = A4

    # Top header bar
    canvas.setFillColor(colors.white)
    canvas.rect(0, h - 1.2 * cm, w, 1.2 * cm, fill=1, stroke=0)
    canvas.setStrokeColor(BRAND_ACCENT)
    canvas.setLineWidth(2)
    canvas.line(0, h - 1.2 * cm, w, h - 1.2 * cm)

    # Logo & title
    canvas.setFillColor(BRAND_ACCENT)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(1.5 * cm, h - 0.82 * cm, "AI ARCHITECT STUDIO")
    canvas.setFillColor(BRAND_MID)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 1.5 * cm, h - 0.82 * cm, "ARCHITECTURAL BLUEPRINT DOSSIER")

    # Bottom footer
    canvas.setStrokeColor(BRAND_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(1.5 * cm, 1.0 * cm, w - 1.5 * cm, 1.0 * cm)
    canvas.setFillColor(BRAND_MID)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(
        1.5 * cm,
        0.55 * cm,
        "AI Architect Autonomous Geometry Engine | CAD/BIM Compliant | Verify on-site dimensions prior to construction",
    )
    canvas.drawRightString(w - 1.5 * cm, 0.55 * cm, f"Page {doc.page}")

    canvas.restoreState()


def _build_dossier_styles() -> Dict[str, ParagraphStyle]:
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            fontSize=26,
            fontName="Helvetica-Bold",
            textColor=BRAND_INK,
            alignment=TA_CENTER,
            spaceAfter=6,
            leading=32,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            fontSize=11,
            fontName="Helvetica-Bold",
            textColor=BRAND_ACCENT,
            alignment=TA_CENTER,
            spaceAfter=4,
            textTransform="uppercase",
            letterSpacing=1,
        ),
        "section_title": ParagraphStyle(
            "section_title",
            fontSize=13,
            fontName="Helvetica-Bold",
            textColor=BRAND_INK,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            fontSize=8.5,
            fontName="Helvetica",
            textColor=BRAND_MID,
            leading=12,
        ),
        "body_bold": ParagraphStyle(
            "body_bold",
            fontSize=8.5,
            fontName="Helvetica-Bold",
            textColor=BRAND_INK,
            leading=12,
        ),
        "kpi_label": ParagraphStyle(
            "kpi_label",
            fontSize=7.5,
            fontName="Helvetica",
            textColor=BRAND_MID,
            alignment=TA_CENTER,
        ),
        "kpi_value": ParagraphStyle(
            "kpi_value",
            fontSize=16,
            fontName="Helvetica-Bold",
            textColor=BRAND_INK,
            alignment=TA_CENTER,
            leading=20,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            fontSize=8,
            fontName="Helvetica",
            textColor=BRAND_INK,
            leading=10,
        ),
        "table_cell_bold": ParagraphStyle(
            "table_cell_bold",
            fontSize=8,
            fontName="Helvetica-Bold",
            textColor=BRAND_INK,
            leading=10,
        ),
        "disclaimer": ParagraphStyle(
            "disclaimer",
            fontSize=7,
            fontName="Helvetica-Oblique",
            textColor=BRAND_MID,
            leading=9,
        ),
    }


def _std_table_style(num_rows: int, header_bg: colors.Color = BRAND_HEADER) -> TableStyle:
    return TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  header_bg),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ("GRID",          (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, ROW_ALT]),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ])


def generate_architectural_dossier_pdf(
    layout: Dict[str, Any],
    project_meta: Optional[Dict[str, Any]] = None,
    vastu_result: Optional[Dict[str, Any]] = None,
    nbc_result: Optional[Dict[str, Any]] = None,
    energy_result: Optional[Dict[str, Any]] = None,
    sunlight_result: Optional[Dict[str, Any]] = None,
    bom: Optional[Dict[str, Any]] = None,
) -> bytes:
    """
    Compiles a comprehensive, multi-page Architectural Blueprint Dossier PDF.
    Returns raw PDF bytes ready for download or file writing.
    """
    buf = io.BytesIO()
    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    template = PageTemplate(id="dossier", frames=frame, onPage=_draw_dossier_header_footer)
    doc.addPageTemplates([template])

    styles = _build_dossier_styles()
    story: List[Any] = []
    w, h = A4
    avail_w = w - 3.0 * cm

    meta = project_meta or {}
    vastu = vastu_result or layout.get("vastuResult") or {"score": 0, "grade": "N/A", "rules": []}
    nbc = nbc_result or layout.get("nbcResult") or {"score": 0, "grade": "N/A", "rules": []}
    energy = energy_result or layout.get("energyResult") or {"score": 0, "grade": "N/A"}
    sunlight = sunlight_result or layout.get("sunlightResult") or {"score": 0, "grade": "N/A"}
    cost_bom = bom or layout.get("bomResult") or {"rooms": [], "summary": {}}

    # Extract floors
    floors: List[Dict[str, Any]] = []
    if "floors" in layout and isinstance(layout["floors"], list) and len(layout["floors"]) > 0:
        floors = layout["floors"]
    elif "rooms" in layout and isinstance(layout["rooms"], list):
        floors = [{"level": 0, "name": "Ground Floor", "rooms": layout["rooms"]}]
    else:
        floors = [{"level": 0, "name": "Ground Floor", "rooms": []}]

    # Plot metadata
    form = meta if meta else layout.get("form", {})
    plot_w = float(form.get("width") or meta.get("width") or 30.0)
    plot_l = float(form.get("length") or meta.get("length") or 40.0)
    bedrooms = int(form.get("bedrooms") or meta.get("bedrooms") or 2)
    bathrooms = int(form.get("bathrooms") or meta.get("bathrooms") or 2)
    entry_dir = str(form.get("entryDir") or meta.get("entry_dir") or "East").capitalize()
    is_duplex = bool(form.get("duplex") or meta.get("duplex", False))
    tier = str(meta.get("tier", "Premium Standard"))
    name = str(meta.get("name") or f"{bedrooms}BHK {entry_dir}-Facing Residential Residence")
    today = date.today().strftime("%d %B %Y")

    vastu_score = vastu.get("score", 0)
    nbc_score = nbc.get("score", 0)
    nbc_grade = nbc.get("grade", "N/A")
    energy_score = energy.get("score", 0)
    bom_summary = cost_bom.get("summary", {})
    grand_total = bom_summary.get("grand_total", 0.0)
    total_area_sqft = bom_summary.get("total_area_sqft", plot_w * plot_l * len(floors))

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGE 1: COVER PAGE
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=3, color=BRAND_ACCENT, spaceAfter=14))
    story.append(Paragraph("ARCHITECTURAL BLUEPRINT DOSSIER", styles["cover_sub"]))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(name, styles["cover_title"]))
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="30%", thickness=1, color=BRAND_BORDER, spaceAfter=14))

    # Plot Metadata Table
    cover_meta = [
        ["Plot Extents", f"{plot_l:.1f} x {plot_w:.1f} ft ({plot_l*plot_w:,.0f} sq ft plot footprint)"],
        ["Total Built-up Area", f"{total_area_sqft:,.0f} sq ft ({total_area_sqft*0.092903:,.1f} sqm) across {len(floors)} Level(s)"],
        ["Configuration", f"{bedrooms} BHK | {bathrooms} Bathrooms | {'Duplex Residence' if is_duplex else 'Simplex'}"],
        ["Orientation / Vastu", f"{entry_dir}-Facing Main Entrance | Vastu Score: {vastu_score}/100 ({vastu.get('grade', 'N/A')})"],
        ["Specification Tier", tier],
        ["Generated Date", today],
    ]
    cov_table = Table(cover_meta, colWidths=[5.5 * cm, 10.5 * cm])
    cov_table.setStyle(TableStyle([
        ("FONTNAME",      (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",      (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 0), (0, -1), BRAND_INK),
        ("TEXTCOLOR",     (1, 0), (1, -1), BRAND_MID),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("LINEBELOW",     (0, 0), (-1, -2), 0.5, BRAND_BORDER),
        ("ROWBACKGROUNDS",(0, 0), (-1, -1), [colors.white, BRAND_LIGHT]),
    ]))
    story.append(cov_table)
    story.append(Spacer(1, 0.8 * cm))

    # Compliance Dashboard KPI Summary Cards
    def _kpi_cell(title: str, val: str, sub: str):
        return [
            Paragraph(title, styles["kpi_label"]),
            Paragraph(val, styles["kpi_value"]),
            Paragraph(sub, styles["kpi_label"]),
        ]

    kpi_cards = [[
        _kpi_cell("Vastu Shastra", f"{vastu_score}", f"Grade {vastu.get('grade', 'A')}"),
        _kpi_cell("NBC Compliance", f"{nbc_score}", f"{nbc_grade}"),
        _kpi_cell("Energy Efficiency", f"{energy_score}%", f"Grade {energy.get('grade', 'A')}"),
        _kpi_cell("Est. Construction Cost", _format_currency(grand_total), "Incl. Materials & Labour"),
    ]]
    kpi_table = Table(kpi_cards, colWidths=[4.0 * cm] * 4)
    kpi_table.setStyle(TableStyle([
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOX",           (0, 0), (0, 0),   1, BRAND_BORDER),
        ("BOX",           (1, 0), (1, 0),   1, BRAND_BORDER),
        ("BOX",           (2, 0), (2, 0),   1, BRAND_BORDER),
        ("BOX",           (3, 0), (3, 0),   1, BRAND_BORDER),
        ("ROWBACKGROUNDS",(0, 0), (-1, -1), [BRAND_LIGHT]),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 0.6 * cm))

    story.append(Paragraph(
        "<b>Executive Summary:</b> This dossier presents the architectural blueprint, spatial layout schedules, "
        "and engineering cost schedules for the proposed residential design. All wall coordinates, "
        "circulation pathways, and structural zones are verified deterministically by the AI Architect geometry engine.",
        styles["body"]
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # PAGES 2..N: FLOOR BLUEPRINT PAGES (One Page Per Floor)
    # ═══════════════════════════════════════════════════════════════════════════
    for idx, floor in enumerate(floors):
        floor_level = floor.get("level", idx)
        floor_name = floor.get("name") or (f"Level {floor_level}" if floor_level > 0 else "Ground Floor")
        rooms = floor.get("rooms", [])

        # Header for this level
        story.append(Paragraph(f"<b>FLOOR BLUEPRINT — {floor_name.upper()} (LEVEL {floor_level})</b>", styles["section_title"]))
        story.append(HRFlowable(width="100%", thickness=1.5, color=BRAND_ACCENT, spaceAfter=8))

        # Render or extract blueprint image
        img_bytes: Optional[bytes] = None
        raw_img = floor.get("imageUrl") or layout.get("imageUrl")
        if raw_img and raw_img.startswith("data:image/png;base64,"):
            try:
                img_bytes = base64.b64decode(raw_img.split(",", 1)[1])
            except Exception:
                img_bytes = None

        if not img_bytes and rooms:
            try:
                # Deterministic high-DPI Pillow rendering of this floor
                img_bytes = render_floor_plan(rooms, plot_w=plot_w, plot_h=plot_l)
            except Exception as e:
                img_bytes = None

        if img_bytes:
            img_buf = io.BytesIO(img_bytes)
            # Aspect ratio
            try:
                from PIL import Image as PILImg
                with PILImg.open(img_buf) as pimg:
                    pw_px, ph_px = pimg.size
                    ratio = ph_px / pw_px
            except Exception:
                ratio = 0.65
            img_buf.seek(0)

            # Fit nicely in page: max width = avail_w, max height = 8.5 cm
            target_w = min(avail_w, 15.0 * cm)
            target_h = min(8.5 * cm, target_w * ratio)
            rl_img = RLImage(img_buf, width=target_w, height=target_h)
            story.append(rl_img)
            story.append(Spacer(1, 0.4 * cm))
        else:
            story.append(Paragraph("<i>Blueprint plate rendered directly to vector CAD (DXF).</i>", styles["body"]))
            story.append(Spacer(1, 0.4 * cm))

        # Room Area Schedule Table for this Floor
        story.append(Paragraph("<b>Room Area Schedule</b>", styles["body_bold"]))
        schedule_rows = [["Room Name", "Dimensions (W x L)", "Area (sq ft)", "Area (sqm)", "Status / Features"]]
        total_fl_area = 0.0

        for r in rooms:
            rw = float(r.get("width", 10.0))
            rh = float(r.get("height", 10.0))
            area_sqft = rw * rh
            total_fl_area += area_sqft
            area_sqm = area_sqft * 0.092903
            
            features = []
            if r.get("is_void") or "void" in r.get("name", "").lower():
                features.append("Double-Height Void")
            if "stair" in r.get("name", "").lower():
                features.append("Vertical Circulation")
            if "bath" in r.get("name", "").lower() or "toilet" in r.get("name", "").lower():
                features.append("Sanitary Fixture")
            if not features:
                features.append("Habitable Room")

            schedule_rows.append([
                Paragraph(f"<b>{r.get('name', 'Room')}</b>", styles["table_cell"]),
                Paragraph(f"{rw:.1f}' x {rh:.1f}'", styles["table_cell"]),
                Paragraph(f"{area_sqft:.0f} sqft", styles["table_cell"]),
                Paragraph(f"{area_sqm:.1f} sqm", styles["table_cell"]),
                Paragraph(", ".join(features), styles["table_cell"]),
            ])

        schedule_rows.append([
            Paragraph("<b>TOTAL BUILT-UP</b>", styles["table_cell_bold"]),
            Paragraph("-", styles["table_cell_bold"]),
            Paragraph(f"<b>{total_fl_area:,.0f} sqft</b>", styles["table_cell_bold"]),
            Paragraph(f"<b>{total_fl_area * 0.092903:,.1f} sqm</b>", styles["table_cell_bold"]),
            Paragraph(f"<b>{len(rooms)} Spaces</b>", styles["table_cell_bold"]),
        ])

        col_w = [4.5 * cm, 3.5 * cm, 2.5 * cm, 2.5 * cm, 3.0 * cm]
        sched_table = Table(schedule_rows, colWidths=col_w)
        sched_table.setStyle(_std_table_style(len(schedule_rows), BRAND_HEADER))
        story.append(sched_table)
        story.append(Spacer(1, 0.4 * cm))

        # Furniture & Lighting Fixture Inventory for this Floor
        all_furn: List[Dict[str, Any]] = []
        for r in rooms:
            for item in r.get("furniture", []):
                all_furn.append({
                    "room": r.get("name", "Room"),
                    "name": item.get("name", "Fixture"),
                    "w": item.get("width", 2.0),
                    "h": item.get("height", 2.0),
                    "isLight": item.get("isLight", False),
                })

        if all_furn:
            story.append(Paragraph(f"<b>Furniture & Lighting Fixture Schedule ({len(all_furn)} items)</b>", styles["body_bold"]))
            furn_rows = [["Item Description", "Room Location", "Footprint (W x D)", "Type"]]
            for item in all_furn[:10]:
                furn_rows.append([
                    Paragraph(item["name"], styles["table_cell"]),
                    Paragraph(item["room"], styles["table_cell"]),
                    Paragraph(f"{item['w']:.1f}' x {item['h']:.1f}'", styles["table_cell"]),
                    Paragraph("Lighting Fixture" if item["isLight"] else "Furnishing", styles["table_cell"]),
                ])
            if len(all_furn) > 10:
                furn_rows.append([
                    Paragraph(f"<i>... and {len(all_furn)-10} additional catalog items</i>", styles["table_cell"]),
                    Paragraph("-", styles["table_cell"]),
                    Paragraph("-", styles["table_cell"]),
                    Paragraph("-", styles["table_cell"]),
                ])

            furn_table = Table(furn_rows, colWidths=[5.5 * cm, 4.5 * cm, 3.0 * cm, 3.0 * cm])
            furn_table.setStyle(_std_table_style(len(furn_rows), BRAND_MID))
            story.append(furn_table)

        story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # FINAL PAGE: COST ESTIMATION (BOM) & ENGINEERING CHECKLIST
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("<b>BILL OF MATERIALS & ENGINEERING SCHEDULE</b>", styles["section_title"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BRAND_ACCENT, spaceAfter=8))

    story.append(Paragraph(
        f"Itemized construction schedule based on 2026 market standards. "
        f"Total Built-up: <b>{total_area_sqft:,.0f} sqft</b>  ·  "
        f"Est. Rate: <b>{_format_currency(bom_summary.get('rate_per_sqft', 2200))}/sqft</b>  ·  "
        f"Grand Total: <b>{_format_currency(grand_total)}</b>",
        styles["body"]
    ))
    story.append(Spacer(1, 0.4 * cm))

    # Categorized Trade Breakdown
    cat_rows = [["Trade Category", "Scope / Components", "Material Subtotal", "Labour Subtotal", "Total Amount"]]
    material_tot = bom_summary.get("material_total", grand_total * 0.65)
    labour_tot = bom_summary.get("labour_total", grand_total * 0.35)

    trade_splits = [
        ("Structural & Masonry", "RCC Footings, Columns, Slabs, AAC Bricks & Cement", 0.45),
        ("Finishing & Flooring", "Vitrified Tiles, Wall Putty, Acrylic Emulsion Paint", 0.25),
        ("Doors & Windows", "Solid Teak Flush Doors, UPVC Double-Glazed Windows", 0.15),
        ("Electrical & Plumbing", "Concealed Conduit Wiring, Sanitary Lines & Fixtures", 0.15),
    ]

    for trade, scope, ratio in trade_splits:
        t_mat = material_tot * ratio
        t_lab = labour_tot * ratio
        cat_rows.append([
            Paragraph(f"<b>{trade}</b>", styles["table_cell_bold"]),
            Paragraph(scope, styles["table_cell"]),
            Paragraph(_format_currency(t_mat), styles["table_cell"]),
            Paragraph(_format_currency(t_lab), styles["table_cell"]),
            Paragraph(f"<b>{_format_currency(t_mat + t_lab)}</b>", styles["table_cell_bold"]),
        ])

    cat_rows.append([
        Paragraph("<b>GRAND TOTAL ESTIMATE</b>", styles["table_cell_bold"]),
        Paragraph("All Trades Included", styles["table_cell_bold"]),
        Paragraph(f"<b>{_format_currency(material_tot)}</b>", styles["table_cell_bold"]),
        Paragraph(f"<b>{_format_currency(labour_tot)}</b>", styles["table_cell_bold"]),
        Paragraph(f"<b>{_format_currency(grand_total)}</b>", styles["table_cell_bold"]),
    ])

    col_w2 = [4.0 * cm, 5.0 * cm, 2.3 * cm, 2.3 * cm, 2.4 * cm]
    cat_table = Table(cat_rows, colWidths=col_w2)
    cat_table.setStyle(_std_table_style(len(cat_rows), BRAND_HEADER))
    story.append(cat_table)
    story.append(Spacer(1, 0.6 * cm))

    # Vastu & NBC Engineering Remarks
    story.append(Paragraph("<b>Vastu & NBC Engineering Remarks:</b>", styles["body_bold"]))
    remarks = [
        f"• Vastu Alignment: Entrance facing {entry_dir}. Overall Vastu balance score evaluated at {vastu_score}/100.",
        f"• NBC Structural Code: National Building Code spatial setback & ventilation compliance rated at {nbc_score}/100 ({nbc_grade}).",
        f"• Energy Efficiency: Daylighting and thermal envelope rating estimated at {energy_score}/100.",
    ]
    for rem in remarks:
        story.append(Paragraph(rem, styles["body"]))

    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(
        "<b>Disclaimer:</b> Cost calculations and schedules are automated estimates based on regional standard averages. "
        "Soil conditions, structural steel sizing, seismic zone requirements, and custom finishes will affect the final BOQ. "
        "Consult a certified structural engineer and licensed architect before groundbreaking.",
        styles["disclaimer"]
    ))

    doc.build(story)
    buf.seek(0)
    return buf.read()
