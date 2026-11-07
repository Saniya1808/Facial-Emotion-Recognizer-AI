import io
from pathlib import Path
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

TEST_DATA_DIR = Path(__file__).resolve().parent.parent / "test_data"
SAMPLE_FACE_PATH = TEST_DATA_DIR / "sample_face.jpg"
MULTI_FACE_PATH = TEST_DATA_DIR / "multi_face.jpg"


def create_blank_image_bytes(width=200, height=200, color="gray", fmt="JPEG") -> bytes:
    """Helper to generate in-memory synthetic image bytes with no faces."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_model_status_reports_trained_when_weights_present():
    """Verify that when emotion_cnn.keras is present, status is 'trained'."""
    response = client.get("/api/v1/model/status")
    assert response.status_code == 200
    data = response.json()
    assert data["model_status"] == "trained"
    assert data["inference_available"] is True
    assert data["accuracy_benchmark"] == 0.4524
    assert len(data["target_classes"]) == 7
    assert data["target_classes"] == ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]


def test_predict_image_single_face():
    """Verify inference on an actual facial photograph with a single detectable face."""
    assert SAMPLE_FACE_PATH.exists(), f"Missing test artifact: {SAMPLE_FACE_PATH}"
    with open(SAMPLE_FACE_PATH, "rb") as f:
        face_bytes = f.read()

    response = client.post(
        "/api/v1/predict/image",
        files={"file": ("single_face.jpg", face_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["faces_detected"] >= 1
    assert data["primary_prediction"] is not None

    primary = data["primary_prediction"]
    assert primary["primary_expression"] in ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
    assert 0.0 <= primary["confidence"] <= 1.0
    assert len(primary["probabilities"]) == 7

    # Check that all 7 probabilities sum to ~1.0
    prob_sum = sum(primary["probabilities"].values())
    assert prob_sum == pytest.approx(1.0, abs=0.01)

    # Check bounding box
    assert primary["box"] is not None
    assert primary["box"]["width"] > 0
    assert primary["box"]["height"] > 0


def test_predict_image_multiple_faces():
    """Verify inference on an image with multiple detected faces."""
    assert MULTI_FACE_PATH.exists(), f"Missing test artifact: {MULTI_FACE_PATH}"
    with open(MULTI_FACE_PATH, "rb") as f:
        multi_face_bytes = f.read()

    response = client.post(
        "/api/v1/predict/image",
        files={"file": ("multi_face.jpg", multi_face_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["faces_detected"] >= 2
    assert len(data["predictions"]) >= 2

    # Each detected face must have valid expression and probabilities
    for face in data["predictions"]:
        assert face["primary_expression"] in ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
        assert 0.0 <= face["confidence"] <= 1.0
        assert len(face["probabilities"]) == 7
        assert sum(face["probabilities"].values()) == pytest.approx(1.0, abs=0.01)


def test_predict_image_with_no_detected_face():
    """Verify clean handling when an image has no detectable face."""
    image_bytes = create_blank_image_bytes(width=200, height=200, color="gray")

    response = client.post(
        "/api/v1/predict/image",
        files={"file": ("blank_test.jpg", image_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["faces_detected"] == 0
    assert "No human face was detected" in data["message"]
    assert len(data["predictions"]) == 0
    assert data["primary_prediction"] is None


def test_predict_image_small_avatar_fallback():
    """
    Verify that an already-cropped small portrait avatar (e.g. 48x48)
    is evaluated cleanly through the CNN.
    """
    image_bytes = create_blank_image_bytes(width=48, height=48, color="white")

    response = client.post(
        "/api/v1/predict/image",
        files={"file": ("avatar_test.jpg", image_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["faces_detected"] == 1
    assert data["primary_prediction"] is not None
    assert data["primary_prediction"]["primary_expression"] in [
        "angry",
        "disgust",
        "fear",
        "happy",
        "neutral",
        "sad",
        "surprise",
    ]
    assert 0.0 <= data["primary_prediction"]["confidence"] <= 1.0
    assert len(data["primary_prediction"]["probabilities"]) == 7


def test_predict_image_invalid_extension():
    """Verify rejection of unpermitted file types."""
    response = client.post(
        "/api/v1/predict/image",
        files={"file": ("malicious.txt", b"plain text content", "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]


def test_predict_image_exceeding_size_limit():
    """Verify rejection of files exceeding the 25MB limit."""
    oversize_bytes = b"0" * (26 * 1024 * 1024)
    response = client.post(
        "/api/v1/predict/image",
        files={"file": ("huge_image.jpg", oversize_bytes, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "exceeds limit" in response.json()["detail"]
