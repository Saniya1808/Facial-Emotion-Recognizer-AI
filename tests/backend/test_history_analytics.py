from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

TEST_DATA_DIR = Path(__file__).resolve().parent.parent / "test_data"
SAMPLE_FACE_PATH = TEST_DATA_DIR / "sample_face.jpg"


def test_clear_and_empty_history():
    """Verify that clearing history works and history is initially empty."""
    del_res = client.delete("/api/v1/history")
    assert del_res.status_code == 200

    hist_res = client.get("/api/v1/history")
    assert hist_res.status_code == 200
    data = hist_res.json()
    assert data["total"] == 0
    assert len(data["records"]) == 0

    analytics_res = client.get("/api/v1/analytics/summary")
    assert analytics_res.status_code == 200
    adata = analytics_res.json()
    assert adata["total_analyses"] == 0
    assert adata["has_data"] is False
    assert adata["dominant_expression"] is None


def test_prediction_creates_history_record_and_analytics():
    """Verify that performing an image prediction creates a persistent history record."""
    assert SAMPLE_FACE_PATH.exists()
    with open(SAMPLE_FACE_PATH, "rb") as f:
        img_bytes = f.read()

    # Perform prediction
    pred_res = client.post(
        "/api/v1/predict/image",
        files={"file": ("history_test_face.jpg", img_bytes, "image/jpeg")},
    )
    assert pred_res.status_code == 200

    # Verify record in history
    hist_res = client.get("/api/v1/history")
    assert hist_res.status_code == 200
    hdata = hist_res.json()
    assert hdata["total"] >= 1
    assert len(hdata["records"]) >= 1

    first_record = hdata["records"][0]
    assert first_record["input_mode"] == "image"
    assert first_record["faces_detected"] >= 1
    assert first_record["primary_expression"] in ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
    assert 0.0 <= first_record["confidence"] <= 1.0
    assert first_record["probabilities"] is not None
    assert len(first_record["probabilities"]) == 7

    # Verify analytics summary reflects the prediction
    analytics_res = client.get("/api/v1/analytics/summary")
    assert analytics_res.status_code == 200
    adata = analytics_res.json()
    assert adata["total_analyses"] >= 1
    assert adata["has_data"] is True
    assert adata["dominant_expression"] is not None
    assert adata["total_faces_detected"] >= 1
    assert sum(adata["expression_distribution"].values()) >= 1


def test_history_filtering_by_mode():
    """Verify filtering history by input_mode parameter."""
    res_image = client.get("/api/v1/history?input_mode=image")
    assert res_image.status_code == 200
    for r in res_image.json()["records"]:
        assert r["input_mode"] == "image"

    res_video = client.get("/api/v1/history?input_mode=video")
    assert res_video.status_code == 200
    for r in res_video.json()["records"]:
        assert r["input_mode"] == "video"


def test_excel_report_export():
    """Verify that GET /api/v1/reports/excel generates a valid Excel workbook."""
    res = client.get("/api/v1/reports/excel")
    assert res.status_code == 200
    assert "spreadsheetml" in res.headers["content-type"]
    assert "attachment" in res.headers["content-disposition"]
    assert len(res.content) > 1000  # Valid binary Excel file


def test_csv_report_export():
    """Verify that GET /api/v1/reports/csv generates a valid CSV export."""
    res = client.get("/api/v1/reports/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment" in res.headers["content-disposition"]
    text = res.text
    assert "record_id" in text
    assert "primary_expression" in text
    assert "confidence" in text


def test_delete_single_and_clear_history():
    """Verify individual record deletion and full clear."""
    # Fetch a record ID
    hres = client.get("/api/v1/history")
    records = hres.json()["records"]
    if records:
        rec_id = records[0]["id"]
        del_one = client.delete(f"/api/v1/history/{rec_id}")
        assert del_one.status_code == 200
        assert del_one.json()["success"] is True

    # Clear all
    clear_res = client.delete("/api/v1/history")
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True

    # Confirm 0 records remain
    empty_check = client.get("/api/v1/history")
    assert empty_check.json()["total"] == 0

