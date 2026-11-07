from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.schemas.health import SimpleHealthResponse, StructuredHealthResponse, ServiceComponentHealth
from backend.app.services.model_service import model_service
from backend.app.utils.logger import logger

router = APIRouter()


@router.get("/health", response_model=StructuredHealthResponse, summary="API Health Check")
def get_api_health(db: Session = Depends(get_db)):
    """
    Returns structured system health including database status and subsystem checks.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error(f"Database health check failed: {exc}")
        db_status = "disconnected"

    model_status_str = "loaded" if model_service.is_loaded else "unloaded"
    model_details_str = (
        f"Custom CNN model active ({settings.MODEL_ACCURACY_BENCHMARK * 100:.2f}% benchmark)"
        if model_service.is_loaded
        else "Model not loaded"
    )

    return StructuredHealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        brand_identity=settings.BRAND_IDENTITY,
        database=db_status,
        services={
            "api": ServiceComponentHealth(status="operational", details="FastAPI core routing ready"),
            "database": ServiceComponentHealth(status=db_status, details="SQLite connection active"),
            "storage": ServiceComponentHealth(status="ready", details=f"Max upload limit: {settings.MAX_UPLOAD_SIZE_MB}MB"),
            "model_engine": ServiceComponentHealth(status=model_status_str, details=model_details_str),
        },
    )
