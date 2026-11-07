from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field


class SimpleHealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Basic health indicator")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Current UTC timestamp")


class ServiceComponentHealth(BaseModel):
    status: str
    details: Optional[str] = None


class StructuredHealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Overall system health status")
    app_name: str
    version: str
    environment: str
    brand_identity: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    database: str = Field(default="connected")
    services: Dict[str, ServiceComponentHealth]

