from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.analytics import AnalyticsSummaryResponse
from backend.app.services.history_service import history_service

router = APIRouter()


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Get Analytics Summary",
    description="Returns aggregate KPI metrics, total analyses, face counts, and expression distribution.",
)
def get_analytics_summary(db: Session = Depends(get_db)):
    return history_service.get_analytics_summary(db=db)
