from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class AnalysisRecordItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique record identifier")
    session_id: str = Field(..., description="Session identifier or filename")
    input_mode: str = Field(..., description="Input source: 'image', 'webcam', or 'video'")
    faces_detected: int = Field(default=0, description="Number of detected faces")
    primary_expression: Optional[str] = Field(None, description="Dominant classified visible expression")
    confidence: Optional[float] = Field(None, description="Softmax confidence score for primary class")
    probabilities: Optional[Dict[str, float]] = Field(None, description="All 7 softmax probabilities")
    processing_time_ms: Optional[float] = Field(None, description="Inference pipeline latency in ms")
    created_at: datetime = Field(..., description="UTC timestamp of the analysis")


class HistoryListResponse(BaseModel):
    total: int = Field(..., description="Total records matching query")
    records: List[AnalysisRecordItem] = Field(default_factory=list, description="List of analysis records")
    limit: int = Field(default=50, description="Pagination page limit")
    offset: int = Field(default=0, description="Pagination offset")


class ClearHistoryResponse(BaseModel):
    success: bool = Field(default=True)
    deleted_count: int = Field(..., description="Number of purged records")
    message: str = Field(..., description="Status message")

