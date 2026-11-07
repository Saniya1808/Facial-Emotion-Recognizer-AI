import csv
import io
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.models.analysis import AnalysisRecord
from backend.app.schemas.history import (
    AnalysisRecordItem,
    HistoryListResponse,
    ClearHistoryResponse,
)
from backend.app.schemas.analytics import AnalyticsSummaryResponse
from backend.app.core.config import settings
from backend.app.utils.logger import logger


class HistoryService:
    """
    Manages persistent analysis records, metrics aggregation,
    and report exports (Excel & CSV).
    Enforces privacy policy: raw pixel frames are never stored.
    """

    def record_analysis(
        self,
        db: Session,
        input_mode: str,
        session_id: str,
        faces_detected: int,
        primary_expression: Optional[str] = None,
        confidence: Optional[float] = None,
        probabilities: Optional[Dict[str, float]] = None,
        processing_time_ms: Optional[float] = None,
    ) -> AnalysisRecord:
        """Saves analysis metadata into database."""
        try:
            record = AnalysisRecord(
                session_id=session_id[:64] if session_id else "unknown",
                input_mode=input_mode[:32],
                faces_detected=faces_detected,
                primary_expression=primary_expression[:32] if primary_expression else None,
                confidence=confidence,
                probabilities=probabilities,
                processing_time_ms=processing_time_ms,
                created_at=datetime.utcnow(),
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to record analysis in database: {exc}")
            raise

    def get_history(
        self,
        db: Session,
        limit: int = 50,
        offset: int = 0,
        input_mode: Optional[str] = None,
    ) -> HistoryListResponse:
        """Retrieves paginated history list."""
        query = db.query(AnalysisRecord)
        if input_mode:
            query = query.filter(AnalysisRecord.input_mode == input_mode)

        total = query.count()
        records = (
            query.order_by(desc(AnalysisRecord.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        items = [AnalysisRecordItem.model_validate(r) for r in records]
        return HistoryListResponse(
            total=total,
            records=items,
            limit=limit,
            offset=offset,
        )

    def get_analytics_summary(self, db: Session) -> AnalyticsSummaryResponse:
        """Computes aggregate KPI metrics and expression distribution from database."""
        total_analyses = db.query(AnalysisRecord).count()
        if total_analyses == 0:
            return AnalyticsSummaryResponse(
                total_analyses=0,
                total_faces_detected=0,
                has_data=False,
                dominant_expression=None,
                average_confidence=None,
                average_processing_time_ms=None,
                expression_distribution={cls_name: 0 for cls_name in settings.TARGET_CLASSES},
                input_mode_distribution={"image": 0, "webcam": 0, "video": 0},
                recent_activity=[],
            )

        # Total faces
        total_faces = (
            db.query(func.sum(AnalysisRecord.faces_detected)).scalar() or 0
        )

        # Average confidence
        avg_conf = db.query(func.avg(AnalysisRecord.confidence)).filter(
            AnalysisRecord.confidence.isnot(None)
        ).scalar()
        if avg_conf is not None:
            avg_conf = round(float(avg_conf), 4)

        # Average latency
        avg_latency = db.query(func.avg(AnalysisRecord.processing_time_ms)).filter(
            AnalysisRecord.processing_time_ms.isnot(None)
        ).scalar()
        if avg_latency is not None:
            avg_latency = round(float(avg_latency), 1)

        # Expression distribution counts
        expr_counts = {cls_name: 0 for cls_name in settings.TARGET_CLASSES}
        db_expr_counts = (
            db.query(AnalysisRecord.primary_expression, func.count(AnalysisRecord.id))
            .filter(AnalysisRecord.primary_expression.isnot(None))
            .group_by(AnalysisRecord.primary_expression)
            .all()
        )
        for expr, cnt in db_expr_counts:
            if expr:
                expr_counts[expr.lower()] = cnt

        # Input mode distribution
        mode_counts = {"image": 0, "webcam": 0, "video": 0}
        db_mode_counts = (
            db.query(AnalysisRecord.input_mode, func.count(AnalysisRecord.id))
            .group_by(AnalysisRecord.input_mode)
            .all()
        )
        for mode, cnt in db_mode_counts:
            if mode:
                mode_counts[mode.lower()] = cnt

        # Dominant expression
        dominant = None
        if sum(expr_counts.values()) > 0:
            dominant = max(expr_counts, key=expr_counts.get)

        # Recent 5 activities
        recent_records = (
            db.query(AnalysisRecord)
            .order_by(desc(AnalysisRecord.created_at))
            .limit(5)
            .all()
        )
        recent_items = [AnalysisRecordItem.model_validate(r) for r in recent_records]

        return AnalyticsSummaryResponse(
            total_analyses=total_analyses,
            total_faces_detected=total_faces,
            has_data=True,
            dominant_expression=dominant,
            average_confidence=avg_conf,
            average_processing_time_ms=avg_latency,
            expression_distribution=expr_counts,
            input_mode_distribution=mode_counts,
            recent_activity=recent_items,
        )

    def clear_history(self, db: Session) -> ClearHistoryResponse:
        """Purges all analysis records for privacy."""
        try:
            deleted_count = db.query(AnalysisRecord).delete()
            db.commit()
            logger.info(f"Purged {deleted_count} analysis records from history.")
            return ClearHistoryResponse(
                success=True,
                deleted_count=deleted_count,
                message=f"Successfully purged {deleted_count} historical record(s).",
            )
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to clear history: {exc}")
            raise

    def delete_record(self, db: Session, record_id: int) -> bool:
        """Deletes a specific record by ID."""
        record = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True

    def generate_excel_report(self, db: Session) -> io.BytesIO:
        """
        Builds a styled multi-sheet Excel workbook using openpyxl.
        Sheet 1: Analysis Records (Detailed rows with 7 probabilities)
        Sheet 2: Executive Summary (KPIs, distribution breakdown, and model benchmarks)
        """
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

        wb = openpyxl.Workbook()

        # Styles
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="0B192C", end_color="0B192C", fill_type="solid")
        title_font = Font(name="Calibri", size=14, bold=True, color="0B192C")
        sub_font = Font(name="Calibri", size=10, italic=True, color="64748B")
        cell_font = Font(name="Calibri", size=10)
        bold_cell_font = Font(name="Calibri", size=10, bold=True)
        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )

        # -------------------------------------------------------------
        # SHEET 1: Detailed Records
        # -------------------------------------------------------------
        ws1 = wb.active
        ws1.title = "Analysis Records"

        # Headers
        headers = [
            "Record ID",
            "Timestamp (UTC)",
            "Input Mode",
            "Session / Filename",
            "Faces Detected",
            "Primary Expression",
            "Confidence (%)",
            "Latency (ms)",
            "Angry (%)",
            "Disgust (%)",
            "Fear (%)",
            "Happy (%)",
            "Neutral (%)",
            "Sad (%)",
            "Surprise (%)",
        ]
        ws1.append(headers)

        # Header Row Styling
        for col_num in range(1, len(headers) + 1):
            cell = ws1.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        records = db.query(AnalysisRecord).order_by(desc(AnalysisRecord.created_at)).all()
        for r in records:
            probs = r.probabilities or {}
            row_data = [
                r.id,
                r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
                (r.input_mode or "").upper(),
                r.session_id or "",
                r.faces_detected,
                (r.primary_expression or "None").capitalize(),
                round(r.confidence * 100, 1) if r.confidence is not None else "",
                round(r.processing_time_ms, 1) if r.processing_time_ms is not None else "",
                round(probs.get("angry", 0) * 100, 1),
                round(probs.get("disgust", 0) * 100, 1),
                round(probs.get("fear", 0) * 100, 1),
                round(probs.get("happy", 0) * 100, 1),
                round(probs.get("neutral", 0) * 100, 1),
                round(probs.get("sad", 0) * 100, 1),
                round(probs.get("surprise", 0) * 100, 1),
            ]
            ws1.append(row_data)

        # Apply cell borders & zebra styling
        for row_idx in range(2, ws1.max_row + 1):
            for col_idx in range(1, len(headers) + 1):
                cell = ws1.cell(row=row_idx, column=col_idx)
                cell.font = cell_font
                cell.border = thin_border
                if row_idx % 2 == 0:
                    cell.fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

        # Auto-fit column widths
        for col in ws1.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws1.column_dimensions[col_letter].width = max(max_len + 3, 12)

        # -------------------------------------------------------------
        # SHEET 2: Executive Summary
        # -------------------------------------------------------------
        ws2 = wb.create_sheet(title="Executive Summary")

        summary = self.get_analytics_summary(db)

        # Title Block
        ws2["A1"] = f"{settings.APP_NAME} – Executive Analytics Report"
        ws2["A1"].font = title_font
        ws2["A2"] = f"Brand: {settings.BRAND_IDENTITY} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
        ws2["A2"].font = sub_font

        # KPIs Table
        ws2["A4"] = "Core Performance Metrics"
        ws2["A4"].font = bold_cell_font

        kpis = [
            ("Total Analyses Recorded", summary.total_analyses),
            ("Total Faces Localized", summary.total_faces_detected),
            ("Dominant Visible Expression", (summary.dominant_expression or "None").capitalize()),
            ("Average Confidence", f"{summary.average_confidence * 100:.1f}%" if summary.average_confidence else "N/A"),
            ("Average Inference Latency", f"{summary.average_processing_time_ms} ms" if summary.average_processing_time_ms else "N/A"),
            ("FER-2013 Model Benchmark", f"{settings.MODEL_ACCURACY_BENCHMARK * 100:.2f}%"),
        ]

        row = 5
        for label, val in kpis:
            ws2.cell(row=row, column=1, value=label).font = cell_font
            c = ws2.cell(row=row, column=2, value=val)
            c.font = bold_cell_font
            c.alignment = Alignment(horizontal="right")
            row += 1

        # Expression Distribution Table
        row += 2
        ws2.cell(row=row, column=1, value="Expression Class Distribution").font = bold_cell_font
        row += 1
        ws2.cell(row=row, column=1, value="Expression Class").font = header_font
        ws2.cell(row=row, column=1).fill = header_fill
        ws2.cell(row=row, column=2, value="Count").font = header_font
        ws2.cell(row=row, column=2).fill = header_fill
        ws2.cell(row=row, column=3, value="Share (%)").font = header_font
        ws2.cell(row=row, column=3).fill = header_fill

        total_expr_count = sum(summary.expression_distribution.values())
        row += 1
        for expr, cnt in sorted(summary.expression_distribution.items(), key=lambda x: x[1], reverse=True):
            pct = round((cnt / total_expr_count * 100.0) if total_expr_count > 0 else 0.0, 1)
            ws2.cell(row=row, column=1, value=expr.capitalize()).font = cell_font
            ws2.cell(row=row, column=2, value=cnt).font = cell_font
            ws2.cell(row=row, column=3, value=f"{pct}%").font = cell_font
            row += 1

        # Ethics Disclaimer
        row += 2
        ws2.cell(row=row, column=1, value="Scientific & Privacy Statement:").font = bold_cell_font
        row += 1
        disc_cell = ws2.cell(
            row=row,
            column=1,
            value=(
                "Visible facial muscle movements are probabilistic action units and do not determine confirmed internal psychological emotional states. "
                "In accordance with our zero frame retention policy, raw pixel buffers and video frames are never permanently stored."
            ),
        )
        disc_cell.font = sub_font

        ws2.column_dimensions["A"].width = 35
        ws2.column_dimensions["B"].width = 25
        ws2.column_dimensions["C"].width = 15

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

    def generate_csv_report(self, db: Session) -> str:
        """Builds a comma-separated text representation of all history records."""
        output = io.StringIO()
        writer = csv.writer(output)

        headers = [
            "record_id",
            "timestamp_utc",
            "input_mode",
            "session_id",
            "faces_detected",
            "primary_expression",
            "confidence",
            "processing_time_ms",
            "angry",
            "disgust",
            "fear",
            "happy",
            "neutral",
            "sad",
            "surprise",
        ]
        writer.writerow(headers)

        records = db.query(AnalysisRecord).order_by(desc(AnalysisRecord.created_at)).all()
        for r in records:
            probs = r.probabilities or {}
            writer.writerow([
                r.id,
                r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
                r.input_mode,
                r.session_id,
                r.faces_detected,
                r.primary_expression or "",
                r.confidence if r.confidence is not None else "",
                r.processing_time_ms if r.processing_time_ms is not None else "",
                probs.get("angry", ""),
                probs.get("disgust", ""),
                probs.get("fear", ""),
                probs.get("happy", ""),
                probs.get("neutral", ""),
                probs.get("sad", ""),
                probs.get("surprise", ""),
            ])

        return output.getvalue()


history_service = HistoryService()

