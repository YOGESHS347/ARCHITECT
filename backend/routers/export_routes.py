"""
export_routes.py
================
Endpoints for exporting multi-floor architectural designs to:
  1. AutoCAD R2010 DXF CAD format (application/dxf)
  2. Multi-page Architectural Blueprint Dossier PDF (application/pdf)

Also records asset generation metadata into public.generated_assets in Supabase mode.
"""

from __future__ import annotations

import os
import traceback
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from core.auth import get_current_user
from exporters.dxf_exporter import export_multi_floor_dxf, export_to_dxf
from exporters.pdf_dossier import generate_architectural_dossier_pdf
from engines.bom_engine import compute_bom
from db.supabase_client import get_database_provider, get_supabase_client
from db.database import db

router = APIRouter(tags=["Export"])


class MultiFloorDxfRequest(BaseModel):
    rooms: Optional[List[Any]] = None
    layout: Optional[Dict[str, Any]] = None
    plan_id: Optional[str] = "unnamed"
    project_id: Optional[str] = None
    plot_width: float = Field(30.0, gt=0, le=500)
    plot_height: float = Field(40.0, gt=0, le=500)


class MultiPagePdfRequest(BaseModel):
    layout: Dict[str, Any]
    vastu_result: Optional[Dict[str, Any]] = None
    nbc_result: Optional[Dict[str, Any]] = None
    energy_result: Optional[Dict[str, Any]] = None
    sunlight_result: Optional[Dict[str, Any]] = None
    plan_id: Optional[str] = "unnamed"
    project_id: Optional[str] = None
    project_meta: Optional[Dict[str, Any]] = None


async def _record_asset_metadata(
    project_id: Optional[str],
    asset_type: str,
    file_name: str,
    file_size: int,
    user_id: Optional[str] = None,
) -> None:
    """Records asset creation metadata in public.generated_assets (Supabase) or MongoDB."""
    if not project_id:
        return

    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "project_id": str(project_id),
        "asset_type": asset_type,
        "file_name": file_name,
        "file_size": file_size,
        "created_at": now_iso,
    }
    if user_id:
        record["user_id"] = str(user_id)

    db_provider = get_database_provider()
    if db_provider == "supabase":
        try:
            sb = get_supabase_client()
            await sb.insert("generated_assets", record)
        except Exception as e:
            # Table might not exist yet or project_id isn't a foreign key UUID
            print(f"[export_routes] Note: could not insert to generated_assets: {e}")
    else:
        try:
            if db is not None:
                await db["generated_assets"].insert_one(record)
        except Exception as e:
            print(f"[export_routes] Note: MongoDB asset recording skipped: {e}")


# ── DXF Export Endpoints ──────────────────────────────────────────────────────

@router.post("/api/export/dxf")
@router.post("/export/dxf")
async def export_cad_dxf(
    req: MultiFloorDxfRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Exports a single- or multi-floor floor plan to AutoCAD-compatible DXF format.
    Arranges multiple floor plates side-by-side with standard CAD layers.
    """
    try:
        # Determine layout payload
        payload: Any = req.layout if req.layout else req.rooms
        if not payload:
            payload = []

        dxf_bytes = export_multi_floor_dxf(
            layout_data=payload,
            plot_w=req.plot_width,
            plot_h=req.plot_height,
        )

        if isinstance(dxf_bytes, str):
            with open(dxf_bytes, "rb") as f:
                dxf_bytes = f.read()

        file_id = req.project_id or req.plan_id or "plan"
        filename = f"floorplan_{file_id}.dxf"

        # Record metadata
        await _record_asset_metadata(
            project_id=req.project_id or req.plan_id,
            asset_type="dxf_cad",
            file_name=filename,
            file_size=len(dxf_bytes),
            user_id=current_user.get("id"),
        )

        return Response(
            content=dxf_bytes,
            media_type="application/dxf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            },
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate DXF drawing: {str(e)}"
        )


# ── PDF Dossier Endpoints ─────────────────────────────────────────────────────

@router.post("/api/export/pdf")
@router.post("/export/pdf")
async def export_dossier_pdf(
    req: MultiPagePdfRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Compiles a comprehensive multi-page Architectural Blueprint Dossier PDF.
    Includes Cover Page, Floor Plates, Room Schedules, and Itemized BOM.
    """
    try:
        meta = req.project_meta or {}
        length = float(meta.get("length", 40.0))
        width = float(meta.get("width", 30.0))
        sqft = round(length * width)

        cost_bom = compute_bom(req.layout, sqft)

        pdf_bytes = generate_architectural_dossier_pdf(
            layout=req.layout,
            project_meta=meta,
            vastu_result=req.vastu_result,
            nbc_result=req.nbc_result,
            energy_result=req.energy_result,
            sunlight_result=req.sunlight_result,
            bom=cost_bom,
        )

        file_id = req.project_id or req.plan_id or "plan"
        filename = f"dossier_{file_id}.pdf"

        # Record metadata
        await _record_asset_metadata(
            project_id=req.project_id or req.plan_id,
            asset_type="dossier_pdf",
            file_name=filename,
            file_size=len(pdf_bytes),
            user_id=current_user.get("id"),
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            },
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF Dossier: {str(e)}"
        )


class SaveAuditFileRequest(BaseModel):
    filename: str
    data_url: str


@router.post("/api/export/save-audit-file")
@router.post("/export/save-audit-file")
@router.post("/save-audit-file")
async def save_audit_file(req: SaveAuditFileRequest):
    """
    Saves an exported file from browser E2E session directly into scratch/exports.
    Decodes base64 data URLs or writes raw text for SVGs.
    """
    import base64
    import urllib.parse
    safe_name = os.path.basename(req.filename)
    dest_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scratch", "exports"))
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, safe_name)

    if req.data_url.startswith("data:"):
        header, raw_payload = req.data_url.split(",", 1)
        if ";base64" in header:
            file_bytes = base64.b64decode(raw_payload)
        else:
            file_bytes = urllib.parse.unquote(raw_payload).encode("utf-8")
        with open(dest_path, "wb") as f:
            f.write(file_bytes)
    else:
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(req.data_url)

    file_size = os.path.getsize(dest_path)
    return {"saved": True, "path": dest_path, "size": file_size}
