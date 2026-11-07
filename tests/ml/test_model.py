import json
from pathlib import Path
import pytest
import numpy as np
from backend.app.core.config import settings
from backend.app.services.model_service import model_service


def test_artifacts_exist():
    weights_path = Path(settings.MODEL_WEIGHTS_PATH)
    classes_path = Path(settings.CLASS_NAMES_PATH)
    metrics_path = Path(settings.EVALUATION_METRICS_PATH)

    assert weights_path.exists(), f"Model weights not found at {weights_path}"
    assert classes_path.exists(), f"Class names not found at {classes_path}"
    assert metrics_path.exists(), f"Evaluation metrics not found at {metrics_path}"


def test_class_names_content():
    classes_path = Path(settings.CLASS_NAMES_PATH)
    with open(classes_path, "r", encoding="utf-8") as f:
        classes = json.load(f)

    assert len(classes) == 7
    expected = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
    assert classes == expected


def test_evaluation_metrics_accuracy():
    metrics_path = Path(settings.EVALUATION_METRICS_PATH)
    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    accuracy = metrics.get("test_accuracy")
    assert accuracy is not None
    assert round(accuracy, 4) == pytest.approx(0.4524, abs=0.001)


def test_model_loading_and_inference():
    """Verify model forward pass produces valid probability distribution."""
    assert model_service.is_loaded is True
    assert model_service.model is not None

    # Dummy 48x48 grayscale face patch
    dummy_patch = np.random.randint(0, 256, (48, 48), dtype=np.uint8)
    tensor = model_service.preprocess_face_roi(dummy_patch)

    assert tensor.shape == (1, 48, 48, 1)

    preds = model_service.model.predict(tensor, verbose=0)[0]
    assert len(preds) == 7
    # Softmax probabilities should sum to approximately 1.0
    assert sum(preds) == pytest.approx(1.0, abs=1e-4)
    for p in preds:
        assert 0.0 <= p <= 1.0


def test_preprocessing_range_and_dimensions():
    """Verify preprocessing correctly normalizes and formats tensor."""
    # Test with uint8 image patch
    patch = np.full((64, 64), 128, dtype=np.uint8)
    tensor = model_service.preprocess_face_roi(patch)

    assert tensor.shape == (1, 48, 48, 1)
    assert tensor.dtype == np.float32
    assert tensor.min() >= 0.0
    assert tensor.max() <= 255.0
