from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "Facial Emotion Recognizer AI"
    APP_VERSION: str = "0.2.0"
    APP_TAGLINE: str = "Understand Facial Expressions with Artificial Intelligence"
    BRAND_IDENTITY: str = "Powered by Saniya"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # CORS and Host
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    DATABASE_URL: str = "sqlite:///./emotion_recognizer.db"

    # Security & Storage Limits
    MAX_UPLOAD_SIZE_MB: int = 25
    MAX_VIDEO_SIZE_MB: int = 50
    MAX_VIDEO_DURATION_SEC: int = 120
    VIDEO_SAMPLE_INTERVAL_SEC: float = 1.0
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_VIDEO_EXTENSIONS: List[str] = [".mp4", ".webm", ".mov"]

    # Model Parameters & Artifacts
    MODEL_NAME: str = "Custom CNN Facial Expression Classifier"
    MODEL_ARCHITECTURE: str = "Deep Convolutional Neural Network (4-Block Conv2D + BatchNorm + Dropout)"
    FRAMEWORK: str = "TensorFlow / Keras"
    MODEL_WEIGHTS_PATH: str = "ml/artifacts/emotion_cnn.keras"
    CLASS_NAMES_PATH: str = "ml/artifacts/class_names.json"
    EVALUATION_METRICS_PATH: str = "ml/artifacts/evaluation_metrics.json"
    MODEL_ACCURACY_BENCHMARK: float = 0.4524  # Empirically verified test accuracy on FER-2013

    TARGET_CLASSES: List[str] = [
        "angry",
        "disgust",
        "fear",
        "happy",
        "neutral",
        "sad",
        "surprise",
    ]

    # Logging
    LOG_LEVEL: str = "INFO"


settings = Settings()
