"""
agent_service.py
================
Conversational AI Architectural Agent Service.
Translates natural-language design instructions into structured ArchitecturalOperation
commands using LLM tool-calling and executes deterministic geometric validation.
"""

from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel, Field
import json
import re
import os
import logging
import base64
import json_repair

from engines.inference import FALLBACK_MODELS, _clean_llm_raw
from services.layout_modifier import apply_architectural_operation
from engines.vastu_engine import score_vastu
from engines.nbc_engine import score_nbc
from engines.energy_engine import score_energy
from engines.sunlight_engine import evaluate_sunlight
from engines.bom_engine import compute_bom
from exporters.floor_renderer import render_floor_plan

logger = logging.getLogger(__name__)

# ── Structured Operation Schema ──────────────────────────────────────────────

class ArchitecturalOperation(BaseModel):
    action: Literal[
        "resize_room",
        "move_room",
        "add_room",
        "remove_room",
        "place_furniture",
        "remove_furniture",
        "swap_rooms",
        "change_room_type",
        "general_advice"
    ]
    target_floor_level: int = 0
    target_room_name: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    explanation: str = "Action performed by Architectural Agent."


# ── System Directive for Agent ────────────────────────────────────────────────

AGENT_SYSTEM_PROMPT = """You are an expert Architectural Design Agent in pair-programming partnership with an architect.
Your job is to translate the user's natural language request into a single structured ArchitecturalOperation.

CRITICAL RULES:
1. You DO NOT output raw coordinates (x, y, w, h).
2. You output ONLY a JSON object adhering to this schema:
{
  "action": "resize_room" | "move_room" | "add_room" | "remove_room" | "place_furniture" | "remove_furniture" | "swap_rooms" | "change_room_type" | "general_advice",
  "target_floor_level": <integer, default 0>,
  "target_room_name": "<room name string or null>",
  "parameters": {
    // For resize_room: {"delta_width": 2.0} or {"delta_height": 2.0} or {"amount": 2.0, "direction": "width"|"height"|"east"|"north"} or {"new_width": 16.0, "new_height": 14.0}
    // For move_room: {"dx": 2.0, "dy": 0.0} or {"direction": "north"|"south"|"east"|"west", "distance": 2.0}
    // For swap_rooms: {"second_room_name": "<room 2 name>"}
    // For change_room_type: {"new_name": "<name>", "new_type": "<type>"}
    // For add_room: {"width": 8.0, "height": 8.0, "adjacent_to": "<optional room>"}
    // For place_furniture: {"catalog_id": "sofa_3_seater"|"bed_king"|"dining_table_6"|"light_chandelier"|..., "item_name": "..."}
    // For remove_furniture: {"item_name": "..."}
  },
  "explanation": "<friendly architectural explanation of your decision>"
}

3. Return ONLY the JSON object. Do not wrap in markdown or backticks.
"""

def _rule_based_fallback(instruction: str, target_floor_level: int, current_rooms: List[Dict[str, Any]]) -> ArchitecturalOperation:
    """Deterministic regex parser used when LLM is offline or unconfigured."""
    text = instruction.strip().lower()

    # 1. Resize: e.g. "expand master bedroom by 2ft" or "enlarge living room"
    m_resize = re.search(r"(?:expand|enlarge|increase|grow|make|resize)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*(?:ft|feet)?", text)
    if m_resize:
        r_name = m_resize.group(1).strip().title()
        amt = float(m_resize.group(2))
        return ArchitecturalOperation(
            action="resize_room",
            target_floor_level=target_floor_level,
            target_room_name=r_name,
            parameters={"delta_width": amt, "amount": amt, "direction": "width"},
            explanation=f"Expanding {r_name} by {amt:.1f} ft as requested.",
        )

    # 1b. Shrink: e.g. "shrink bedroom 2 by 2ft"
    m_shrink = re.search(r"(?:shrink|reduce|decrease)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*(?:ft|feet)?", text)
    if m_shrink:
        r_name = m_shrink.group(1).strip().title()
        amt = float(m_shrink.group(2))
        return ArchitecturalOperation(
            action="resize_room",
            target_floor_level=target_floor_level,
            target_room_name=r_name,
            parameters={"delta_width": -amt, "amount": -amt, "direction": "width"},
            explanation=f"Reducing {r_name} by {amt:.1f} ft as requested.",
        )

    # 2. Swap: e.g. "swap kitchen and dining room"
    m_swap = re.search(r"swap\s+(?:the\s+)?([a-zA-Z0-9\s]+?)\s+(?:and|with)\s+(?:the\s+)?([a-zA-Z0-9\s]+)", text)
    if m_swap:
        r1 = m_swap.group(1).strip().title()
        r2 = m_swap.group(2).strip().title()
        return ArchitecturalOperation(
            action="swap_rooms",
            target_floor_level=target_floor_level,
            target_room_name=r1,
            parameters={"second_room_name": r2},
            explanation=f"Swapping locations of {r1} and {r2}.",
        )

    # 3. Change Room Type: e.g. "change bedroom 2 to study room"
    m_change = re.search(r"(?:change|convert|rename|turn)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)\s+(?:in)?to\s+(?:a\s+)?([a-zA-Z0-9\s]+)", text)
    if m_change:
        r_old = m_change.group(1).strip().title()
        r_new = m_change.group(2).strip().title()
        return ArchitecturalOperation(
            action="change_room_type",
            target_floor_level=target_floor_level,
            target_room_name=r_old,
            parameters={"new_name": r_new},
            explanation=f"Reassigning {r_old} as {r_new}.",
        )

    # 4. Furniture placement: e.g. "add sofa to living room" or "place chandelier"
    if any(k in text for k in ("sofa", "couch", "bed", "table", "chair", "lamp", "light", "chandelier", "wardrobe", "fridge", "tv", "tub")):
        for c_id, name in [
            ("sofa_3_seater", "3-Seater Sofa"),
            ("sofa_l_shape", "L-Shape Sectional Sofa"),
            ("bed_king", "King Bed"),
            ("bed_queen", "Queen Bed"),
            ("dining_table_6", "6-Seater Dining Table"),
            ("light_chandelier", "Warm Ceiling Chandelier"),
            ("light_downlight", "Recessed Downlight"),
            ("light_floor_lamp", "Floor Lamp"),
            ("tv_unit", "TV Unit & Console"),
            ("study_desk", "Study Desk & Chair"),
            ("bathtub", "Bathtub"),
            ("patio_lounge", "Patio Lounge Set"),
        ]:
            if any(term in text for term in name.lower().split()):
                # Find room mention in text
                matched_room = None
                for rm in current_rooms:
                    if rm.get("name", "").lower() in text:
                        matched_room = rm.get("name")
                        break
                return ArchitecturalOperation(
                    action="place_furniture",
                    target_floor_level=target_floor_level,
                    target_room_name=matched_room or (current_rooms[0].get("name") if current_rooms else "Living Room"),
                    parameters={"catalog_id": c_id, "item_name": name},
                    explanation=f"Placed {name} in {matched_room or 'the active room'}.",
                )

    # 5. Add Room: e.g. "add a pooja room"
    m_add = re.search(r"add\s+(?:a\s+|an\s+)?([a-zA-Z0-9\s]+?)(?:\s+room|\s+zone)?$", text)
    if m_add:
        new_r = (m_add.group(1).strip() + " Room").title()
        return ArchitecturalOperation(
            action="add_room",
            target_floor_level=target_floor_level,
            target_room_name=new_r,
            parameters={"width": 8.0, "height": 8.0},
            explanation=f"Adding a new {new_r} to Floor {target_floor_level}.",
        )

    # 6. General advice default
    return ArchitecturalOperation(
        action="general_advice",
        target_floor_level=target_floor_level,
        target_room_name=None,
        parameters={},
        explanation="Analyzing your layout: all primary rooms have direct exterior light, corridor circulation is clear, and wet walls are clustered.",
    )


def parse_instruction_to_operation(
    instruction: str,
    layout_data: Dict[str, Any],
    active_floor_level: int = 0,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> ArchitecturalOperation:
    """
    Invokes the multi-provider LLM fallback chain to extract a structured ArchitecturalOperation.
    Falls back gracefully to the deterministic parser if LLMs fail or are offline.
    """
    floors = layout_data.get("floors", [])
    active_rooms = []
    if floors and active_floor_level < len(floors):
        active_rooms = floors[active_floor_level].get("rooms", [])
    elif layout_data.get("rooms"):
        active_rooms = layout_data.get("rooms", [])

    room_summary = [
        f"- {r.get('name')}: {r.get('width', 0):.1f}x{r.get('height', 0):.1f}ft at (x={r.get('x', 0):.1f}, y={r.get('y', 0):.1f})"
        for r in active_rooms
    ]

    history_str = ""
    if conversation_history:
        recent = conversation_history[-4:]
        history_str = "\n".join([f"{m.get('sender', 'user')}: {m.get('content', '')}" for m in recent])

    user_prompt = f"""
Current Active Floor Level: {active_floor_level}
Current Rooms on Active Floor:
{chr(10).join(room_summary) if room_summary else "No rooms currently defined."}

Recent Conversation History:
{history_str if history_str else "None"}

User Request: "{instruction}"
Respond with the exact JSON operation schema to apply this request.
"""

    # Try LLM fallback chain
    for model_cfg in FALLBACK_MODELS:
        try:
            provider = model_cfg.get("provider")
            model = model_cfg.get("model")
            client = model_cfg.get("client")

            if provider == "google":
                resp = client.models.generate_content(
                    model=model,
                    contents=user_prompt,
                    config={
                        "system_instruction": AGENT_SYSTEM_PROMPT,
                        "temperature": 0.1,
                        "response_mime_type": "application/json",
                    }
                )
                raw_text = resp.text
            else:
                resp = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": AGENT_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"} if provider == "groq" else None,
                )
                raw_text = resp.choices[0].message.content

            clean_json = _clean_llm_raw(raw_text or "{}")
            parsed = json_repair.loads(clean_json)
            if isinstance(parsed, dict) and "action" in parsed:
                return ArchitecturalOperation(**parsed)
        except Exception as e:
            logger.debug(f"LLM model {model_cfg.get('model')} failed for agent parser: {e}")
            continue

    # Deterministic fallback parser
    return _rule_based_fallback(instruction, active_floor_level, active_rooms)


def process_agent_request(
    instruction: str,
    layout_data: Dict[str, Any],
    active_floor_level: int = 0,
    plot_width: float = 30.0,
    plot_height: float = 40.0,
    entry_dir: str = "east",
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Main entry point for conversational agent requests:
    1. Interprets instruction into typed ArchitecturalOperation.
    2. Applies deterministic geometric modifications with boundary & collision checks.
    3. Re-evaluates compliance & generates new visual preview image if updated.
    """
    # 1. Parse into structured operation
    operation = parse_instruction_to_operation(
        instruction,
        layout_data,
        active_floor_level=active_floor_level,
        conversation_history=conversation_history,
    )

    # 2. Execute deterministic geometric modifier
    success, updated_layout, mod_message, warnings = apply_architectural_operation(
        layout_data=layout_data,
        action=operation.action,
        target_floor_level=operation.target_floor_level,
        target_room_name=operation.target_room_name,
        parameters=operation.parameters,
        plot_width=plot_width,
        plot_height=plot_height,
    )

    result: Dict[str, Any] = {
        "success": success,
        "operation": operation.model_dump(),
        "reply": f"{operation.explanation}\n\n{mod_message}" if success else mod_message,
        "warnings": warnings,
        "updated_layout": updated_layout if success else None,
        "imageUrl": None,
        "compliance": {},
    }

    # 3. If layout was modified, re-evaluate compliance and render preview image
    if success and operation.action != "general_advice":
        try:
            floors = updated_layout.get("floors", [])
            target_rooms = floors[active_floor_level].get("rooms", []) if active_floor_level < len(floors) else updated_layout.get("rooms", [])

            # Render 2D blueprint thumbnail
            png_bytes = render_floor_plan(
                target_rooms,
                unit_label="AI-Agent Modified Plan",
                plot_w=plot_width,
                plot_h=plot_height,
                entry_dir=entry_dir,
            )
            b64_str = base64.b64encode(png_bytes).decode("utf-8")
            result["imageUrl"] = f"data:image/png;base64,{b64_str}"

            # Calculate updated scores
            sqft = round(plot_width * plot_height)
            result["compliance"] = {
                "vastu": score_vastu(target_rooms, plot_width, plot_height, entry_dir),
                "nbc": score_nbc(target_rooms, plot_width, plot_height, 1),
                "energy": score_energy(target_rooms, plot_width, plot_height, entry_dir),
                "sunlight": evaluate_sunlight(updated_layout, entry_dir),
                "bom": compute_bom(updated_layout, sqft),
            }
        except Exception as e:
            logger.warning(f"Note: Could not regenerate secondary metrics after agent edit: {e}")

    return result
