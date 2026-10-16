from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProjectCreate(BaseModel):
    name: str
    layout_data: dict
    image_url: Optional[str] = None
    plot_width: Optional[float] = None
    plot_length: Optional[float] = None
    budget_target: Optional[float] = None
    measurement_unit: Optional[str] = "ft"
    entry_direction: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    layout_data: dict
    image_url: Optional[str] = None
    plot_width: Optional[float] = None
    plot_length: Optional[float] = None
    budget_target: Optional[float] = None
    measurement_unit: Optional[str] = "ft"
    entry_direction: Optional[str] = None
    created_at: Any
    updated_at: Optional[Any] = None

class ProjectVersionResponse(BaseModel):
    id: Optional[str] = None
    project_id: str
    version_number: int
    commit_message: Optional[str] = None
    snapshot: dict
    created_by: Optional[str] = None
    created_at: Optional[Any] = None

class FurniturePlacement(BaseModel):
    id: Optional[str] = None
    project_id: str
    floor_level: int = 0
    room_name: Optional[str] = None
    catalog_id: Optional[str] = None
    name: str
    x: float
    y: float
    width: float
    height: float
    rotation: float = 0.0
    color: Optional[str] = None
    properties: Optional[dict] = None

class LightingFixture(BaseModel):
    id: Optional[str] = None
    project_id: str
    floor_level: int = 0
    room_name: Optional[str] = None
    name: str
    x: float
    y: float
    intensity: float = 1.0
    color: str = "#fff5cc"
    radius: float = 8.0
    type: str = "point"
    properties: Optional[dict] = None

class DesignConversation(BaseModel):
    id: Optional[str] = None
    project_id: str
    user_id: str
    title: str = "Design Assistant"
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None

class ConversationMessage(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    sender: str  # 'user' | 'agent' | 'system'
    content: str
    operation: Optional[dict] = None
    created_at: Optional[Any] = None
