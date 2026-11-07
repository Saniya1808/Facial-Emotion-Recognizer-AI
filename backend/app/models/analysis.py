from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON
from backend.app.database.session import Base


class AnalysisRecord(Base):
    """
    Persistent record for facial emotion analyses (prepared for Phase 2).
    In Phase 1, the table structure is initialized in SQLite.
    Privacy policy: image frames themselves are never stored permanently.
    """
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), index=True, nullable=False)
    input_mode = Column(String(32), nullable=False)  # 'webcam', 'image', 'video'
    faces_detected = Column(Integer, default=0)
    primary_expression = Column(String(32), nullable=True)
    confidence = Column(Float, nullable=True)
    probabilities = Column(JSON, nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SystemAuditLog(Base):
    """Audit log for system events and health checks."""
    __tablename__ = "system_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(64), nullable=False)
    details = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
