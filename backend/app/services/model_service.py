import json
import os
import tempfile
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from backend.app.core.config import settings
from backend.app.schemas.model import ModelStatusResponse
from backend.app.schemas.prediction import (
    FaceBoundingBox,
    FacePrediction,
    ImagePredictionResponse,
    TemporalFrameResult,
    VideoPredictionResponse,
)
from backend.app.utils.logger import logger


def _patch_keras_deserialization():
    """
    Patches Keras 3 layer deserialization to maintain compatibility between
    Keras 3.13+ (used in Kaggle) and Keras 3.12 (standard on Python 3.10),
    stripping 'quantization_config' if present in serialized layer configurations.
    """
    try:
        import keras

        if hasattr(keras.layers.Dense, "from_config"):
            orig_dense = keras.layers.Dense.from_config

            def dense_from_config(cls, config):
                config.pop("quantization_config", None)
                return orig_dense(config)

            keras.layers.Dense.from_config = classmethod(dense_from_config)

        if hasattr(keras.layers.Conv2D, "from_config"):
            orig_conv = keras.layers.Conv2D.from_config

            def conv_from_config(cls, config):
                config.pop("quantization_config", None)
                return orig_conv(config)

            keras.layers.Conv2D.from_config = classmethod(conv_from_config)
    except Exception as exc:
        logger.debug(f"Keras deserialization compatibility patch note: {exc}")


class ModelService:
    """
    Production Model Service for Facial Emotion Recognizer AI.
    - Loads trained Keras model ('emotion_cnn.keras')
    - Reads exact class taxonomy from 'class_names.json'
    - Detects faces with OpenCV Haar Cascade
    - Normalizes 48x48 grayscale inputs matching training preprocessing
    - Supports static image, live webcam frames, and temporal video inference
    - Guarantees thread safety and strict resource cleanup
    """

    def __init__(self):
        self.weights_path = Path(settings.MODEL_WEIGHTS_PATH)
        self.class_names_path = Path(settings.CLASS_NAMES_PATH)
        self.model = None
        self.is_loaded = False
        self.class_names: List[str] = []
        self.face_cascade = None
        self._lock = threading.Lock()

        # Load taxonomy and model on startup
        self.load_class_names()
        self.load_model()
        self.init_face_detector()

    def load_class_names(self) -> List[str]:
        """Loads target class names from class_names.json."""
        if self.class_names_path.exists():
            try:
                with open(self.class_names_path, "r", encoding="utf-8") as f:
                    self.class_names = json.load(f)
                logger.info(f"Loaded class names from {self.class_names_path}: {self.class_names}")
                return self.class_names
            except Exception as exc:
                logger.error(f"Error reading class names from {self.class_names_path}: {exc}")

        # Fallback to default setting if file is not found
        self.class_names = settings.TARGET_CLASSES
        return self.class_names

    def init_face_detector(self):
        """Initializes OpenCV Haar Cascade classifier for frontal faces."""
        try:
            import cv2

            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            if os.path.exists(cascade_path):
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                logger.info("OpenCV Haar cascade face detector initialized.")
            else:
                logger.warning(f"Haar cascade xml not found at {cascade_path}")
        except Exception as exc:
            logger.warning(f"Could not initialize OpenCV face cascade detector: {exc}")

    def load_model(self) -> bool:
        """Loads Keras model weights from disk."""
        if not self.weights_path.exists():
            logger.warning(f"Model weights file not found at: {self.weights_path}")
            self.is_loaded = False
            self.model = None
            return False

        try:
            _patch_keras_deserialization()
            logger.info(f"Loading Keras model from {self.weights_path}...")
            import keras

            self.model = keras.models.load_model(str(self.weights_path), compile=False)
            self.is_loaded = True
            logger.info("Custom CNN model loaded successfully into memory.")
            return True
        except Exception as exc:
            logger.error(f"Failed to load Keras model from {self.weights_path}: {exc}")
            self.is_loaded = False
            self.model = None
            return False

    def get_status(self) -> ModelStatusResponse:
        """Returns truthful model status and architectural metadata."""
        if self.is_loaded and self.model is not None:
            return ModelStatusResponse(
                model_name=settings.MODEL_NAME,
                model_status="trained",
                framework=settings.FRAMEWORK,
                architecture=settings.MODEL_ARCHITECTURE,
                target_classes=self.class_names,
                phase=3,
                inference_available=True,
                input_shape=[None, 48, 48, 1],
                message=(
                    f"Model weights loaded from {self.weights_path.name}. "
                    f"Empirical test accuracy on FER-2013 benchmark: {settings.MODEL_ACCURACY_BENCHMARK * 100:.2f}%. "
                    "Inference engine active."
                ),
                weights_path=str(self.weights_path),
                accuracy_benchmark=settings.MODEL_ACCURACY_BENCHMARK,
            )
        else:
            return ModelStatusResponse(
                model_name=settings.MODEL_NAME,
                model_status="not_trained" if not self.weights_path.exists() else "failed_to_load",
                framework=settings.FRAMEWORK,
                architecture=settings.MODEL_ARCHITECTURE,
                target_classes=self.class_names or settings.TARGET_CLASSES,
                phase=3,
                inference_available=False,
                input_shape=[None, 48, 48, 1],
                message=(
                    f"Model weights file '{self.weights_path.name}' is missing or offline. "
                    "Inference engine is currently unavailable."
                ),
                weights_path=str(self.weights_path) if self.weights_path.exists() else None,
                accuracy_benchmark=settings.MODEL_ACCURACY_BENCHMARK,
            )

    def detect_faces(self, image_bytes: bytes) -> Tuple[any, List[Tuple[int, int, int, int]]]:
        """
        Decodes image bytes and detects faces using OpenCV.
        Returns:
            (gray_image, list_of_boxes)
        """
        import cv2
        import numpy as np

        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or corrupted image format. Could not decode bytes.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        if self.face_cascade is None or self.face_cascade.empty():
            self.init_face_detector()

        if self.face_cascade and not self.face_cascade.empty():
            detected = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE,
            )
            boxes = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in detected]
        else:
            boxes = []

        return gray, boxes

    def preprocess_face_roi(self, gray_face_roi) -> any:
        """
        Matches training preprocessing exactly:
        - Grayscale (1 channel)
        - 48x48 resize
        - Pixel normalization to [0.0, 1.0] (handled natively by the model's Rescaling(1/255) layer)
        - Input dimensions: (1, 48, 48, 1)
        """
        import cv2
        import numpy as np

        # Resize to 48x48
        resized = cv2.resize(gray_face_roi, (48, 48), interpolation=cv2.INTER_AREA)

        # Convert to float32
        tensor_data = resized.astype("float32")

        # Note: The model's first layer is `Rescaling(scale=1./255.0)`, which divides raw pixel values by 255.
        if tensor_data.max() <= 1.0 and tensor_data.max() > 0:
            tensor_data = tensor_data * 255.0

        # Reshape to (1, 48, 48, 1)
        tensor = np.expand_dims(tensor_data, axis=(0, -1))
        return tensor

    def predict_image(self, image_bytes: bytes, filename: str) -> ImagePredictionResponse:
        """
        Runs actual facial expression prediction on image bytes.
        Handles images with 0 or multiple faces.
        Never returns mock or hardcoded predictions.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded into memory. Cannot perform inference.")

        start_time = time.time()
        import numpy as np

        gray_img, boxes = self.detect_faces(image_bytes)

        predictions: List[FacePrediction] = []

        # Case A: No faces detected by Haar cascade
        if len(boxes) == 0:
            # Check if image is an already-cropped small face avatar (<= 128x128)
            h, w = gray_img.shape
            if h <= 128 and w <= 128 and abs(h - w) <= 20:
                logger.info("Small portrait avatar detected; evaluating entire image as face ROI.")
                input_tensor = self.preprocess_face_roi(gray_img)
                with self._lock:
                    raw_preds = self.model.predict(input_tensor, verbose=0)[0]

                probs = {
                    self.class_names[i]: round(float(raw_preds[i]), 4)
                    for i in range(len(self.class_names))
                }
                top_idx = int(np.argmax(raw_preds))
                pred = FacePrediction(
                    face_id=1,
                    box=FaceBoundingBox(x=0, y=0, width=w, height=h),
                    primary_expression=self.class_names[top_idx],
                    confidence=round(float(raw_preds[top_idx]), 4),
                    probabilities=probs,
                )
                predictions.append(pred)
            else:
                elapsed_ms = (time.time() - start_time) * 1000.0
                return ImagePredictionResponse(
                    success=True,
                    message="No human face was detected in the uploaded image. Please ensure the face is visible, facing forward, and well-illuminated.",
                    filename=filename,
                    faces_detected=0,
                    processing_time_ms=round(elapsed_ms, 2),
                    predictions=[],
                    primary_prediction=None,
                )

        # Case B: One or more faces detected
        for idx, (x, y, w, h) in enumerate(boxes, start=1):
            face_roi = gray_img[y : y + h, x : x + w]
            input_tensor = self.preprocess_face_roi(face_roi)

            # Actual TensorFlow / Keras forward pass with thread safety
            with self._lock:
                raw_preds = self.model.predict(input_tensor, verbose=0)[0]

            probs = {
                self.class_names[i]: round(float(raw_preds[i]), 4)
                for i in range(len(self.class_names))
            }
            top_idx = int(np.argmax(raw_preds))

            predictions.append(
                FacePrediction(
                    face_id=idx,
                    box=FaceBoundingBox(x=x, y=y, width=w, height=h),
                    primary_expression=self.class_names[top_idx],
                    confidence=round(float(raw_preds[top_idx]), 4),
                    probabilities=probs,
                )
            )

        elapsed_ms = (time.time() - start_time) * 1000.0

        # Primary prediction is the face with the highest confidence
        primary = max(predictions, key=lambda p: p.confidence) if predictions else None

        return ImagePredictionResponse(
            success=True,
            message=f"Successfully analyzed {len(predictions)} face(s) in {round(elapsed_ms, 1)}ms.",
            filename=filename,
            faces_detected=len(predictions),
            processing_time_ms=round(elapsed_ms, 2),
            predictions=predictions,
            primary_prediction=primary,
        )

    def predict_video(
        self,
        video_bytes: bytes,
        filename: str,
        interval_sec: float = 1.0,
    ) -> VideoPredictionResponse:
        """
        Processes video stream by extracting keyframes temporally,
        running CNN expression evaluation on detected faces,
        and aggregating the temporal trajectory over time.
        Enforces strict resource limits and cleanup.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded into memory. Cannot perform inference.")

        start_time = time.time()
        import cv2
        import numpy as np

        ext = Path(filename).suffix.lower() or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        cap = None
        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                raise ValueError("Could not open video stream. The file may be corrupted or use an unsupported codec.")

            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            if fps <= 0 or np.isnan(fps):
                fps = 25.0

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if total_frames <= 0:
                # Some webm/streaming containers report 0 frame count; attempt to read a test frame
                ret_test, _ = cap.read()
                if not ret_test:
                    raise ValueError("Video contains zero readable frames.")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                total_frames = 1

            duration_sec = total_frames / fps if fps > 0 else 0.0
            if duration_sec > settings.MAX_VIDEO_DURATION_SEC:
                raise ValueError(
                    f"Video duration ({duration_sec:.1f}s) exceeds maximum allowed limit of {settings.MAX_VIDEO_DURATION_SEC}s."
                )

            # Sample keyframes at interval_sec (e.g. 1 frame per second)
            step = max(1, int(round(fps * interval_sec)))
            max_samples = 120

            timeline: List[TemporalFrameResult] = []
            expression_counts: Dict[str, int] = {cls_name: 0 for cls_name in self.class_names}
            confidences: List[float] = []
            total_faces_seen = 0
            frames_with_faces = 0

            frame_idx = 0
            samples_taken = 0

            while cap.isOpened() and samples_taken < max_samples:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % step == 0:
                    samples_taken += 1
                    timestamp_sec = round(frame_idx / fps, 2)
                    mins = int(timestamp_sec // 60)
                    secs = int(timestamp_sec % 60)
                    timestamp_formatted = f"{mins:02d}:{secs:02d}"

                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    boxes = []
                    if self.face_cascade and not self.face_cascade.empty():
                        detected = self.face_cascade.detectMultiScale(
                            gray,
                            scaleFactor=1.1,
                            minNeighbors=4,
                            minSize=(30, 30),
                        )
                        boxes = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in detected]

                    faces_detected = len(boxes)
                    total_faces_seen += faces_detected
                    if faces_detected > 0:
                        frames_with_faces += 1

                    frame_predictions: List[FacePrediction] = []
                    primary_expr = None
                    primary_conf = None
                    primary_probs = None
                    primary_box = None

                    for f_idx, (x, y, w, h) in enumerate(boxes, start=1):
                        face_roi = gray[y : y + h, x : x + w]
                        input_tensor = self.preprocess_face_roi(face_roi)

                        with self._lock:
                            raw_preds = self.model.predict(input_tensor, verbose=0)[0]

                        probs = {
                            self.class_names[i]: round(float(raw_preds[i]), 4)
                            for i in range(len(self.class_names))
                        }
                        top_idx = int(np.argmax(raw_preds))
                        face_expr = self.class_names[top_idx]
                        face_conf = round(float(raw_preds[top_idx]), 4)

                        pred = FacePrediction(
                            face_id=f_idx,
                            box=FaceBoundingBox(x=x, y=y, width=w, height=h),
                            primary_expression=face_expr,
                            confidence=face_conf,
                            probabilities=probs,
                        )
                        frame_predictions.append(pred)

                    if frame_predictions:
                        # Select face with highest confidence as primary
                        best_face = max(frame_predictions, key=lambda p: p.confidence)
                        primary_expr = best_face.primary_expression
                        primary_conf = best_face.confidence
                        primary_probs = best_face.probabilities
                        primary_box = best_face.box

                        expression_counts[primary_expr] = expression_counts.get(primary_expr, 0) + 1
                        confidences.append(primary_conf)

                    timeline.append(
                        TemporalFrameResult(
                            timestamp_sec=timestamp_sec,
                            timestamp_formatted=timestamp_formatted,
                            frame_index=samples_taken,
                            faces_detected=faces_detected,
                            primary_expression=primary_expr,
                            confidence=primary_conf,
                            probabilities=primary_probs,
                            box=primary_box,
                            predictions=frame_predictions,
                        )
                    )

                frame_idx += 1

            if samples_taken == 0:
                raise ValueError("Could not extract any valid keyframes from the video.")

            # Compute aggregate metrics
            dominant = None
            if frames_with_faces > 0:
                dominant = max(expression_counts, key=expression_counts.get)

            avg_conf = (
                round(sum(confidences) / len(confidences), 4) if confidences else None
            )

            total_valid_counts = sum(expression_counts.values())
            distribution = {
                cls_name: round(
                    (count / total_valid_counts * 100.0) if total_valid_counts > 0 else 0.0, 1
                )
                for cls_name, count in expression_counts.items()
            }

            elapsed_ms = (time.time() - start_time) * 1000.0

            return VideoPredictionResponse(
                success=True,
                message=(
                    f"Temporal analysis completed across {samples_taken} keyframes "
                    f"({frames_with_faces} with detected faces) in {round(elapsed_ms, 1)}ms."
                ),
                filename=filename,
                duration_sec=round(duration_sec, 2),
                total_frames_sampled=samples_taken,
                frames_with_faces=frames_with_faces,
                total_faces_detected=total_faces_seen,
                average_faces_detected=round(
                    total_faces_seen / samples_taken if samples_taken > 0 else 0, 2
                ),
                dominant_expression=dominant,
                average_confidence=avg_conf,
                expression_distribution=distribution,
                timeline=timeline,
                processing_time_ms=round(elapsed_ms, 2),
            )
        finally:
            if cap is not None:
                try:
                    cap.release()
                except Exception:
                    pass
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception as exc:
                    logger.debug(f"Could not remove temporary video file {tmp_path}: {exc}")


model_service = ModelService()
