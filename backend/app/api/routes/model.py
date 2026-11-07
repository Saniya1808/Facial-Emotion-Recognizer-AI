from fastapi import APIRouter
from backend.app.schemas.model import ModelStatusResponse
from backend.app.services.model_service import model_service

router = APIRouter()


@router.get("/status", response_model=ModelStatusResponse, summary="CNN Model Status")
def get_model_status():
    """
    Returns current deep learning model status and architectural specifications.
    Phase 1 truthfully returns 'not_trained' with no mock predictions.
    """
    return model_service.get_status()
