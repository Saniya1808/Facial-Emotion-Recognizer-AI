import os
import tempfile
from pathlib import Path
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

TEST_DATA_DIR = Path(__file__).resolve().parent.parent / "test_data"
SAMPLE_FACE_PATH = TEST_DATA_DIR / "sample_face.jpg"
MULTI_FACE_PATH = TEST_DATA_DIR / "multi_face.jpg"


def create_synthetic_video_bytes(
    source_img_path: Path = None,
    num_frames: int = 25,
    fps: int = 10,
    blank_color: int = 128,
) -> bytes:
    """
    Helper that creates an in-memory MP4 video stream using OpenCV VideoWriter.
    If source_img_path is provided, frames use that image.
    Otherwise, solid-color blank frames are written (no faces).
    """
    if source_img_path and source_img_path.exists():
        img = cv2.imread(str(source_img_path))
        h, w = img.shape[:2]
    else:
        w, h = 240, 180
        img = np.full((h, w, 3), blank_color, dtype=np.uint8)

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        out = cv2.VideoWriter(tmp_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
        for _ in range(num_frames):
            out.write(img)
        out.release()

        with open(tmp_path, "rb") as f:
            data = f.read()
        return data
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_video_invalid_extension():
    """Verify rejection of files with unpermitted extensions."""
    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("malicious.txt", b"plain text content", "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]


def test_video_empty_file():
    """Verify rejection of 0-byte video uploads."""
    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("empty.mp4", b"", "video/mp4")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_video_corrupted_disguised_file():
    """Verify rejection of text/garbage disguised as .mp4."""
    fake_video = b"This is plain text with an MP4 extension but no video header"
    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("fake.mp4", fake_video, "video/mp4")},
    )
    assert response.status_code == 400
    assert "Invalid or corrupted video container" in response.json()["detail"]


def test_video_oversized_file():
    """Verify rejection of videos exceeding maximum size (50MB)."""
    oversize = b"0" * (51 * 1024 * 1024)
    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("big.mp4", oversize, "video/mp4")},
    )
    assert response.status_code == 400
    assert "exceeds limit" in response.json()["detail"]


def test_video_no_face_trajectory():
    """Verify processing of a video containing no human faces."""
    video_bytes = create_synthetic_video_bytes(source_img_path=None, num_frames=20, fps=10)

    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("noface_video.mp4", video_bytes, "video/mp4")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_frames_sampled"] >= 1
    assert data["frames_with_faces"] == 0
    assert data["total_faces_detected"] == 0
    assert data["dominant_expression"] is None
    assert len(data["timeline"]) >= 1

    # In every sampled frame, faces_detected should be 0
    for frame in data["timeline"]:
        assert frame["faces_detected"] == 0
        assert frame["primary_expression"] is None
        assert frame["confidence"] is None


def test_video_single_face_trajectory():
    """Verify temporal frame sampling and CNN inference on a video with a single face."""
    assert SAMPLE_FACE_PATH.exists(), f"Missing artifact: {SAMPLE_FACE_PATH}"
    video_bytes = create_synthetic_video_bytes(source_img_path=SAMPLE_FACE_PATH, num_frames=25, fps=10)

    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("single_face_video.mp4", video_bytes, "video/mp4")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["duration_sec"] > 0
    assert data["total_frames_sampled"] >= 2
    assert data["frames_with_faces"] >= 2
    assert data["total_faces_detected"] >= 2
    assert data["dominant_expression"] in ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
    assert 0.0 <= data["average_confidence"] <= 1.0
    assert len(data["timeline"]) == data["total_frames_sampled"]

    # Verify timeline structure and timestamp monotonicity
    prev_time = -1.0
    for frame in data["timeline"]:
        assert frame["timestamp_sec"] >= prev_time
        prev_time = frame["timestamp_sec"]
        assert ":" in frame["timestamp_formatted"]
        assert frame["faces_detected"] >= 1
        assert frame["primary_expression"] in ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
        assert 0.0 <= frame["confidence"] <= 1.0
        assert frame["probabilities"] is not None
        assert len(frame["probabilities"]) == 7
        assert sum(frame["probabilities"].values()) == pytest.approx(1.0, abs=0.02)


def test_video_multiple_faces_trajectory():
    """Verify temporal analysis on a video featuring multiple detected faces."""
    assert MULTI_FACE_PATH.exists(), f"Missing artifact: {MULTI_FACE_PATH}"
    video_bytes = create_synthetic_video_bytes(source_img_path=MULTI_FACE_PATH, num_frames=20, fps=10)

    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("multi_face_video.mp4", video_bytes, "video/mp4")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_frames_sampled"] >= 2
    assert data["frames_with_faces"] >= 2
    assert data["average_faces_detected"] >= 2.0

    # Ensure individual face predictions are present in the frame
    first_face_frame = next(f for f in data["timeline"] if f["faces_detected"] >= 2)
    assert len(first_face_frame["predictions"]) >= 2
    for p in first_face_frame["predictions"]:
        assert p["primary_expression"] in ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
        assert 0.0 <= p["confidence"] <= 1.0
        assert len(p["probabilities"]) == 7


def test_video_temporary_file_cleanup():
    """Verify that temporary files written during video processing are cleaned up."""
    import tempfile
    video_bytes = create_synthetic_video_bytes(source_img_path=None, num_frames=10, fps=10)

    # Count existing .mp4 files in temp directory
    temp_dir = tempfile.gettempdir()
    before_files = set(os.listdir(temp_dir))

    response = client.post(
        "/api/v1/predict/video",
        files={"file": ("cleanup_test.mp4", video_bytes, "video/mp4")},
    )
    assert response.status_code == 200

    after_files = set(os.listdir(temp_dir))
    new_mp4s = [f for f in (after_files - before_files) if f.endswith(".mp4")]
    assert len(new_mp4s) == 0, f"Leaked temporary video files: {new_mp4s}"

