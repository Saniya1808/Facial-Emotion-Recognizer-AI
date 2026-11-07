from datetime import datetime
from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.services.history_service import history_service

router = APIRouter()


@router.get(
    "/excel",
    summary="Download Excel Analytics Report (.xlsx)",
    description="Generates and streams a professional two-sheet Excel report with detailed analysis logs and executive summary.",
)
def download_excel_report(db: Session = Depends(get_db)):
    buffer = history_service.generate_excel_report(db)
    filename = f"facial_emotion_ai_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get(
    "/csv",
    summary="Download CSV Analytics Report (.csv)",
    description="Streams a comma-separated historical record export compatible with data science tools.",
)
def download_csv_report(db: Session = Depends(get_db)):
    csv_text = history_service.generate_csv_report(db)
    filename = f"facial_emotion_ai_history_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
