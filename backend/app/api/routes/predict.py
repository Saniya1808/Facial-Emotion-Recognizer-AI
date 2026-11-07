from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.security import validate_file_upload
from backend.app.database.session import get_db
from backend.app.schemas.prediction import ImagePredictionResponse, VideoPredictionResponse
from backend.app.services.model_service import model_service
from backend.app.services.history_service import history_service
from backend.app.utils.logger import logger

router = APIRouter()


@router.post(
    "/image",
    response_model=ImagePredictionResponse,
    summary="Predict Facial Expressions in Image",
    description="Processes an image, detects face bounding boxes, normalizes to 48x48 grayscale, and runs custom CNN inference.",
)
async def predict_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Receives an image file, verifies dimensions, detects facial regions,
    and classifies visible facial expressions using the trained Custom CNN model.
    """
    # 1. Read file contents
    try:
        contents = await file.read()
    except Exception as exc:
        logger.error(f"Failed to read uploaded file '{file.filename}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file.",
        )

    # 2. Validate file size and extension
    is_valid, validation_msg = validate_file_upload(
        filename=file.filename or "unknown.jpg",
        file_size_bytes=len(contents),
        is_video=False,
        header_bytes=contents[:32] if contents else None,
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_msg,
        )

    # 3. Verify model readiness
    if not model_service.is_loaded:
        loaded = model_service.load_model()
        if not loaded:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "CNN model is not loaded or weights are missing. "
                    "Inference engine is currently offline."
                ),
            )

    # 4. Execute prediction pipeline
    try:
        result = model_service.predict_image(
            image_bytes=contents,
            filename=file.filename or "uploaded_image.jpg",
        )

        # Log analysis record to database (metadata only, zero pixel retention)
        try:
            mode = "webcam" if "webcam" in (file.filename or "").lower() else "image"
            history_service.record_analysis(
                db=db,
                input_mode=mode,
                session_id=file.filename or "image_upload.jpg",
                faces_detected=result.faces_detected,
                primary_expression=result.primary_prediction.primary_expression if result.primary_prediction else None,
                confidence=result.primary_prediction.confidence if result.primary_prediction else None,
                probabilities=result.primary_prediction.probabilities if result.primary_prediction else None,
                processing_time_ms=result.processing_time_ms,
            )
        except Exception as log_exc:
            logger.debug(f"History logging skipped: {log_exc}")

        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.exception(f"Inference error during image analysis: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(exc)}",
        )


@router.post(
    "/video",
    response_model=VideoPredictionResponse,
    summary="Analyze Video Facial Expressions",
    description="Extracts temporal keyframes from uploaded video (MP4/WebM/MOV), detects faces, and computes expression trajectory.",
)
async def predict_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Receives a video file, validates container and size constraints,
    samples keyframes temporally, and runs CNN inference across detected faces.
    """
    # 1. Read video file contents
    try:
        contents = await file.read()
    except Exception as exc:
        logger.error(f"Failed to read uploaded video '{file.filename}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded video file.",
        )

    # 2. Validate size, extension, and container header
    is_valid, validation_msg = validate_file_upload(
        filename=file.filename or "unknown.mp4",
        file_size_bytes=len(contents),
        is_video=True,
        header_bytes=contents[:32] if contents else None,
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_msg,
        )

    # 3. Verify model readiness
    if not model_service.is_loaded:
        loaded = model_service.load_model()
        if not loaded:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "CNN model is not loaded or weights are missing. "
                    "Inference engine is currently offline."
                ),
            )

    # 4. Execute video prediction pipeline
    try:
        result = model_service.predict_video(
            video_bytes=contents,
            filename=file.filename or "uploaded_video.mp4",
        )

        # Log analysis record to database (metadata only, zero video frame retention)
        try:
            history_service.record_analysis(
                db=db,
                input_mode="video",
                session_id=file.filename or "video_upload.mp4",
                faces_detected=result.total_faces_detected,
                primary_expression=result.dominant_expression,
                confidence=result.average_confidence,
                probabilities=None,
                processing_time_ms=result.processing_time_ms,
            )
        except Exception as log_exc:
            logger.debug(f"Video history logging skipped: {log_exc}")

        return result
    except ValueError as val_err:
        logger.warning(f"Video validation rejected: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.exception(f"Video processing error for '{file.filename}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video inference pipeline execution error: {str(exc)}",
        )
