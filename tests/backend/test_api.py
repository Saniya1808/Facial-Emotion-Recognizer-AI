from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == settings.APP_NAME
    assert data["version"] == settings.APP_VERSION
    assert data["brand_identity"] == "Powered by Saniya"
    assert data["status"] == "active"
    assert "api_v1_url" in data


def test_simple_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_api_v1_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "services" in data
    assert data["services"]["api"]["status"] == "operational"
    assert data["services"]["database"]["status"] == "connected"


def test_model_status_endpoint():
    response = client.get("/api/v1/model/status")
    assert response.status_code == 200
    data = response.json()
    assert data["model_status"] in ["trained", "not_trained"]
    assert "TensorFlow" in data["framework"]
    assert len(data["target_classes"]) == 7
    expected_classes = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
    assert [c.lower() for c in data["target_classes"]] == expected_classes


def test_not_found_handling():
    response = client.get("/api/v1/unknown-endpoint")
    assert response.status_code == 404


def test_cors_headers():
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
