"""
agent_routes.py
===============
FastAPI endpoints for the Conversational AI Architectural Agent.
Provides chat interactions, structured operational responses, and message persistence.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from core.auth import get_current_user
from services.agent_service import process_agent_request
from db.repositories import (
    get_or_create_conversation,
    get_conversation_messages,
    add_conversation_message,
)

router = APIRouter(prefix="/api/agent", tags=["Agent"])


class AgentChatRequest(BaseModel):
    project_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=1000)
    current_layout: Dict[str, Any]
    active_floor_level: int = 0
    plot_width: float = 30.0
    plot_height: float = 40.0
    entry_dir: str = "east"
    conversation_id: Optional[str] = None


@router.post("/chat")
async def agent_chat(
    req: AgentChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Translates a natural language architectural request into an operation,
    executes deterministic geometric validation, and records the turn in chat history.
    """
    user_id = str(current_user.get("id") or current_user.get("_id") or "anon_user")

    # 1. Resolve conversation session
    conv_id = req.conversation_id
    if not conv_id and req.project_id:
        conv_record = await get_or_create_conversation(req.project_id, user_id)
        conv_id = conv_record.get("id")
    elif not conv_id:
        conv_id = f"session_{user_id[:8]}"

    # 2. Retrieve history for LLM context
    history: List[Dict[str, Any]] = []
    if conv_id:
        history = await get_conversation_messages(conv_id)

    # 3. Record user message
    if conv_id:
        await add_conversation_message(
            conversation_id=conv_id,
            sender="user",
            content=req.message,
        )

    # 4. Process agent request with deterministic validation
    result = process_agent_request(
        instruction=req.message,
        layout_data=req.current_layout,
        active_floor_level=req.active_floor_level,
        plot_width=req.plot_width,
        plot_height=req.plot_height,
        entry_dir=req.entry_dir,
        conversation_history=history,
    )

    # 5. Record agent response & operation in chat history
    if conv_id:
        await add_conversation_message(
            conversation_id=conv_id,
            sender="agent",
            content=result["reply"],
            operation=result.get("operation"),
        )

    return {
        "conversation_id": conv_id,
        "reply": result["reply"],
        "operation": result["operation"],
        "success": result["success"],
        "updated_layout": result["updated_layout"],
        "imageUrl": result.get("imageUrl"),
        "warnings": result.get("warnings", []),
        "compliance": result.get("compliance", {}),
    }


@router.get("/history")
async def get_agent_history(
    project_id: Optional[str] = Query(None),
    conversation_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns the message history for the active design conversation.
    """
    user_id = str(current_user.get("id") or current_user.get("_id") or "anon_user")
    target_conv_id = conversation_id

    if not target_conv_id and project_id:
        conv = await get_or_create_conversation(project_id, user_id)
        target_conv_id = conv.get("id")

    if not target_conv_id:
        return {"conversation_id": None, "messages": []}

    messages = await get_conversation_messages(target_conv_id)
    return {
        "conversation_id": target_conv_id,
        "messages": messages,
    }
