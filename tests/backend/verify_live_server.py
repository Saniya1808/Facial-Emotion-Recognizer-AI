import subprocess
import time
import requests
import sys
import tempfile
import os
from pathlib import Path
import cv2
import numpy as np

BASE_URL = "http://127.0.0.1:8000"
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SAMPLE_FACE = ROOT_DIR / "tests" / "test_data" / "sample_face.jpg"
MULTI_FACE = ROOT_DIR / "tests" / "test_data" / "multi_face.jpg"


def create_test_video_bytes(img_path: Path, frames: int = 20, fps: int = 10) -> bytes:
    img = cv2.imread(str(img_path))
    h, w = img.shape[:2]
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        path = tmp.name
    try:
        out = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
        for _ in range(frames):
            out.write(img)
        out.release()
        with open(path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(path):
            os.remove(path)


def run_live_verification():
    print("=" * 60)
    print("STARTING FASTAPI LIVE SERVER VERIFICATION (PHASE 3)")
    print("=" * 60)

    # 1. Start uvicorn server process
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(ROOT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    try:
        print("Waiting for server startup & model loading into RAM...")
        time.sleep(6)

        # 2. Check Root & Health
        root_res = requests.get(f"{BASE_URL}/")
        print(f"GET / -> HTTP {root_res.status_code}")
        assert root_res.status_code == 200

        health_res = requests.get(f"{BASE_URL}/api/v1/health")
        print(f"GET /api/v1/health -> HTTP {health_res.status_code}: {health_res.json()['status']}")
        assert health_res.status_code == 200

        # 3. Check Model Status
        status_res = requests.get(f"{BASE_URL}/api/v1/model/status")
        status_data = status_res.json()
        print(f"GET /api/v1/model/status -> HTTP {status_res.status_code}, status={status_data.get('model_status')}")
        assert status_res.status_code == 200
        assert status_data["model_status"] == "trained"

        # 4. Predict Single Face Image
        print("\nTesting POST /api/v1/predict/image (Single Face)...")
        with open(SAMPLE_FACE, "rb") as f:
            pred_res = requests.post(
                f"{BASE_URL}/api/v1/predict/image",
                files={"file": ("sample_face.jpg", f, "image/jpeg")}
            )
        print(f"HTTP {pred_res.status_code}: detected {pred_res.json().get('faces_detected')} face(s)")
        assert pred_res.status_code == 200

        # 5. Predict Multiple Faces Image
        print("\nTesting POST /api/v1/predict/image (Multi Face)...")
        with open(MULTI_FACE, "rb") as f:
            multi_res = requests.post(
                f"{BASE_URL}/api/v1/predict/image",
                files={"file": ("multi_face.jpg", f, "image/jpeg")}
            )
        print(f"HTTP {multi_res.status_code}: detected {multi_res.json().get('faces_detected')} face(s)")
        assert multi_res.status_code == 200

        # 6. Predict Video (Phase 3 Endpoint)
        print("\nTesting POST /api/v1/predict/video with generated video stream...")
        video_bytes = create_test_video_bytes(SAMPLE_FACE, frames=20, fps=10)
        vid_res = requests.post(
            f"{BASE_URL}/api/v1/predict/video",
            files={"file": ("test_stream.mp4", video_bytes, "video/mp4")}
        )
        print(f"HTTP {vid_res.status_code}")
        assert vid_res.status_code == 200
        vid_data = vid_res.json()
        print(f"  success: {vid_data.get('success')}")
        print(f"  duration_sec: {vid_data.get('duration_sec')}")
        print(f"  total_frames_sampled: {vid_data.get('total_frames_sampled')}")
        print(f"  frames_with_faces: {vid_data.get('frames_with_faces')}")
        print(f"  dominant_expression: {vid_data.get('dominant_expression')}")
        print(f"  average_confidence: {vid_data.get('average_confidence')}")
        print(f"  timeline points: {len(vid_data.get('timeline', []))}")
        assert vid_data["success"] is True
        assert vid_data["total_frames_sampled"] >= 2
        assert vid_data["frames_with_faces"] >= 2
        assert vid_data["dominant_expression"] in ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]

        # 7. Video Error Handling: Disguised text file
        print("\nTesting POST /api/v1/predict/video with corrupted text file...")
        corrupt_res = requests.post(
            f"{BASE_URL}/api/v1/predict/video",
            files={"file": ("bad.mp4", b"not a real video file", "video/mp4")}
        )
        print(f"HTTP {corrupt_res.status_code}: {corrupt_res.json().get('detail')}")
        assert corrupt_res.status_code == 400

        print("\n" + "=" * 60)
        print("ALL LIVE ENDPOINT VERIFICATIONS PASSED SUCCESSFULLY (PHASE 3)!")
        print("=" * 60)

    finally:
        print("Terminating uvicorn server...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        print("Server stopped cleanly.")


if __name__ == "__main__":
    run_live_verification()
