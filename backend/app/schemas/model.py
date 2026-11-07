from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ModelStatusResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_name: str = Field(..., description="Name of the custom CNN architecture")
    model_status: str = Field(
        ...,
        description="Status of the deep learning model ('trained' when weights are loaded, 'not_trained' / 'missing_weights' otherwise)",
    )
    framework: str = Field(..., description="Deep learning framework")
    architecture: str = Field(..., description="CNN architectural design specification")
    target_classes: List[str] = Field(..., description="7 standard facial expression categories")
    phase: int = Field(default=2, description="Current development phase")
    inference_available: bool = Field(
        default=False,
        description="Whether active model inference weights are loaded into memory",
    )
    input_shape: List[Optional[int]] = Field(
        default=[None, 48, 48, 1],
        description="Expected model input tensor shape (Batch, Height, Width, Channels)",
    )
    message: str = Field(
        ...,
        description="Explanatory status message regarding training and availability",
    )
    weights_path: Optional[str] = Field(
        default=None,
        description="Path to stored .keras weights",
    )
    accuracy_benchmark: Optional[float] = Field(
        default=0.4524,
        description="Verified test accuracy on FER-2013 test dataset (45.24%)",
    )
