from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class FaceBoundingBox(BaseModel):
    x: int = Field(..., description="X-coordinate of top-left corner")
    y: int = Field(..., description="Y-coordinate of top-left corner")
    width: int = Field(..., description="Width of bounding box in pixels")
    height: int = Field(..., description="Height of bounding box in pixels")


class FacePrediction(BaseModel):
    face_id: int = Field(..., description="Identifier for detected face (1-indexed)")
    box: Optional[FaceBoundingBox] = Field(None, description="Bounding coordinates of the face")
    primary_expression: str = Field(..., description="Predicted visible expression class")
    confidence: float = Field(..., description="Confidence score for top class (0.0 to 1.0)")
    probabilities: Dict[str, float] = Field(
        ...,
        description="Probability distribution across all target classes",
    )


class ImagePredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    success: bool = Field(default=True, description="Whether prediction request was processed")
    message: str = Field(..., description="Informational message regarding detection outcome")
    filename: str = Field(..., description="Name of the analyzed image file")
    faces_detected: int = Field(..., description="Number of human faces detected")
    processing_time_ms: float = Field(..., description="Time taken for inference in milliseconds")
    model_name: str = Field(default="Custom CNN (FER-2013)", description="Model identifier")
    model_accuracy_benchmark: float = Field(
        default=0.4524,
        description="Empirical test accuracy on FER-2013 test split (45.24%)",
    )
    disclaimer: str = Field(
        default=(
            "Describes visible facial expressions and action units. "
            "Does not determine confirmed internal psychological emotional states."
        ),
        description="Scientific affective computing disclaimer",
    )
    predictions: List[FacePrediction] = Field(
        default_factory=list,
        description="List of predictions for each detected face",
    )
    primary_prediction: Optional[FacePrediction] = Field(
        default=None,
        description="Prediction for the primary detected face",
    )


class TemporalFrameResult(BaseModel):
    timestamp_sec: float = Field(..., description="Video timestamp in seconds")
    timestamp_formatted: str = Field(default="00:00", description="Formatted timestamp in mm:ss")
    frame_index: int = Field(..., description="Sampled frame sequence index")
    faces_detected: int = Field(..., description="Number of faces detected in this frame")
    primary_expression: Optional[str] = Field(None, description="Primary detected expression")
    confidence: Optional[float] = Field(None, description="Primary confidence score")
    probabilities: Optional[Dict[str, float]] = Field(
        None,
        description="Seven-class softmax probability distribution for the primary face",
    )
    box: Optional[FaceBoundingBox] = Field(None, description="Bounding box of the primary face")
    predictions: List[FacePrediction] = Field(
        default_factory=list,
        description="All individual face predictions detected in this frame",
    )


class VideoPredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    success: bool = Field(default=True)
    message: str
    filename: str
    duration_sec: float = Field(..., description="Total video duration in seconds")
    total_frames_sampled: int = Field(..., description="Number of keyframes evaluated")
    frames_with_faces: int = Field(default=0, description="Number of sampled frames with >=1 detected face")
    total_faces_detected: int = Field(default=0, description="Sum of all face detections across frames")
    average_faces_detected: float = Field(default=0.0, description="Average faces per evaluated frame")
    dominant_expression: Optional[str] = Field(None, description="Overall dominant expression across video")
    average_confidence: Optional[float] = Field(None, description="Average confidence across detected faces")
    expression_distribution: Dict[str, float] = Field(
        default_factory=dict,
        description="Overall percentage distribution across sampled frames",
    )
    timeline: List[TemporalFrameResult] = Field(
        default_factory=list,
        description="Time-series expression trajectory across video duration",
    )
    processing_time_ms: float
    model_name: str = Field(default="Custom CNN (FER-2013)", description="Model identifier")
    model_accuracy_benchmark: float = Field(
        default=0.4524,
        description="Empirical test accuracy on FER-2013 test split (45.24%)",
    )
    disclaimer: str = Field(
        default=(
            "Temporal evaluation describes sequential visible facial movements and action units. "
            "Does not determine confirmed internal psychological emotional states."
        ),
        description="Scientific affective computing disclaimer",
    )


class AnalyticsSummaryResponse(BaseModel):
    total_analyses: int
    total_faces_detected: int
    has_data: bool
    expression_distribution: Dict[str, int]
    recent_activity: List[Dict] = Field(default_factory=list)
