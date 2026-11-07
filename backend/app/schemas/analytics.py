from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.history import AnalysisRecordItem


class AnalyticsSummaryResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    total_analyses: int = Field(default=0, description="Total completed analysis operations")
    total_faces_detected: int = Field(default=0, description="Cumulative count of all detected faces")
    has_data: bool = Field(default=False, description="Whether historical data exists in database")
    dominant_expression: Optional[str] = Field(None, description="Most frequent primary expression")
    average_confidence: Optional[float] = Field(None, description="Average confidence score across all records")
    average_processing_time_ms: Optional[float] = Field(None, description="Average pipeline latency in ms")
    expression_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Counts per expression class",
    )
    input_mode_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Counts by input modality (image, webcam, video)",
    )
    recent_activity: List[AnalysisRecordItem] = Field(
        default_factory=list,
        description="Latest analyses for dashboard feed",
    )
