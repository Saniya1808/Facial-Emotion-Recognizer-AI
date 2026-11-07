from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.history import HistoryListResponse, ClearHistoryResponse
from backend.app.services.history_service import history_service

router = APIRouter()


@router.get(
    "",
    response_model=HistoryListResponse,
    summary="List Analysis History Records",
    description="Returns paginated historical analysis metadata (zero raw images stored).",
)
def get_history(
    limit: int = Query(50, ge=1, le=200, description="Page size limit"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    input_mode: Optional[str] = Query(None, description="Filter by 'image', 'webcam', or 'video'"),
    db: Session = Depends(get_db),
):
    return history_service.get_history(db=db, limit=limit, offset=offset, input_mode=input_mode)


@router.delete(
    "",
    response_model=ClearHistoryResponse,
    summary="Clear All History Records",
    description="Purges all historical records from database for privacy sovereignty.",
)
def clear_all_history(db: Session = Depends(get_db)):
    return history_service.clear_history(db=db)


@router.delete(
    "/{record_id}",
    summary="Delete Single History Record",
    description="Removes a specific analysis record by ID.",
)
def delete_single_record(record_id: int, db: Session = Depends(get_db)):
    success = history_service.delete_record(db=db, record_id=record_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record #{record_id} not found in database.",
        )
    return {"success": True, "message": f"Record #{record_id} deleted."}
