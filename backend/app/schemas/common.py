from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str
    data: Optional[T] = None


class RootResponse(BaseModel):
    name: str
    version: str
    tagline: str
    brand_identity: str
    status: str
    docs_url: str
    api_v1_url: str
