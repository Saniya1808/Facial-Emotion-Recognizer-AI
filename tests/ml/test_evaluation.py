"""
Tests for Phase 5 Machine Learning Evaluation Utilities.
Verifies evaluation calculations, confusion matrix integrity,
benchmarking logic, and generated artifacts.
"""

import json
from pathlib import Path
import numpy as np
import pytest

from ml.evaluation.evaluator import (
    DEFAULT_CLASSES,
    FER2013_TEST_CONFUSION_MATRIX,
    ModelEvaluator,
)
from ml.evaluation.benchmark import ModelBenchmark
from ml.evaluation.error_analysis import ErrorAnalyzer


@pytest.fixture
def evaluator():
    return ModelEvaluator()


@pytest.fixture
def error_analyzer():
    return ErrorAnalyzer()


def test_evaluator_metrics_calculation(evaluator):
    """Verify evaluator computes mathematically exact metrics for FER-2013."""
    metrics = evaluator.compute_metrics()

    assert metrics["test_accuracy"] == pytest.approx(0.452354, abs=1e-4)
    assert metrics["total_samples"] == 7178
    assert len(metrics["classes"]) == 7

    # Check macro and weighted averages
    assert metrics["macro_avg"]["f1_score"] == pytest.approx(0.3743, abs=1e-3)
    assert metrics["weighted_avg"]["f1_score"] == pytest.approx(0.4006, abs=1e-3)
    assert metrics["macro_avg"]["precision"] == pytest.approx(0.4456, abs=1e-3)
    assert metrics["macro_avg"]["recall"] == pytest.approx(0.3931, abs=1e-3)

    # Check key per-class properties
    per_class = metrics["per_class"]
    assert per_class["happy"]["recall"] == pytest.approx(0.9042, abs=1e-3)
    assert per_class["fear"]["recall"] == pytest.approx(0.0322, abs=1e-3)
    assert per_class["surprise"]["precision"] == pytest.approx(0.6583, abs=1e-3)
    assert per_class["surprise"]["f1_score"] == pytest.approx(0.6607, abs=1e-3)


def test_confusion_matrix_properties(evaluator):
    """Verify shape, diagonal, row sums, and normalization of confusion matrix."""
    cm = evaluator.confusion_matrix
    assert cm.shape == (7, 7)

    # Ground truth supports
    expected_row_sums = [958, 111, 1024, 1774, 1233, 1247, 831]
    assert np.array_equal(cm.sum(axis=1), expected_row_sums)

    # Predicted totals
    expected_col_sums = [719, 97, 75, 3714, 593, 1143, 837]
    assert np.array_equal(cm.sum(axis=0), expected_col_sums)

    # True positives on diagonal
    expected_diag = [292, 28, 33, 1604, 305, 434, 551]
    assert np.array_equal(np.diag(cm), expected_diag)
    assert int(np.sum(expected_diag)) == 3247

    # Test normalized confusion matrix
    norm_cm = evaluator.get_normalized_confusion_matrix()
    assert norm_cm.shape == (7, 7)
    for row in norm_cm:
        assert np.sum(row) == pytest.approx(1.0, abs=1e-5)


def test_evaluator_from_predictions():
    """Verify evaluator can construct confusion matrix from prediction arrays."""
    y_true = np.array([0, 1, 2, 3, 4, 5, 6, 3, 3])
    y_pred = np.array([0, 1, 2, 3, 4, 5, 6, 3, 0])

    evaluator = ModelEvaluator.from_predictions(y_true, y_pred, class_names=DEFAULT_CLASSES)
    metrics = evaluator.compute_metrics()

    assert metrics["total_samples"] == 9
    assert metrics["test_accuracy"] == pytest.approx(8.0 / 9.0, abs=1e-4)


def test_benchmark_hardware_and_file_size():
    """Verify hardware profiler returns valid system metadata and file size."""
    benchmark = ModelBenchmark()

    hardware = benchmark.detect_hardware()
    assert "device_type" in hardware
    assert "os" in hardware
    assert "python_version" in hardware
    assert "tensorflow_version" in hardware

    storage = benchmark.measure_file_size()
    assert storage["file_exists"] is True
    assert storage["size_mb"] > 4.0
    assert storage["size_bytes"] == 5156035


def test_error_analysis_diagnostics(error_analyzer):
    """Verify error analyzer detects class imbalance, Happy bias, and confusion pairs."""
    happy_bias = error_analyzer.analyze_happy_bias()
    assert happy_bias["actual_happy_count"] == 1774
    assert happy_bias["predicted_happy_count"] == 3714
    assert happy_bias["happy_prediction_inflation_ratio"] > 2.0

    pairs = error_analyzer.analyze_confusion_pairs()
    assert len(pairs) == 42  # 7 * 6 off-diagonal pairs
    top_pair = pairs[0]
    assert top_pair["actual_class"] == "neutral"
    assert top_pair["predicted_class"] == "happy"
    assert top_pair["error_count"] == 602

    class_weights = error_analyzer.compute_optimal_class_weights()
    assert len(class_weights) == 7
    # Disgust is rarest class -> highest weight
    assert class_weights["disgust"] > 9.0
    # Happy is most common class -> lowest weight
    assert class_weights["happy"] < 0.6


def test_phase_5_generated_artifacts():
    """Verify all required Phase 5 output files exist and are populated."""
    eval_dir = Path(__file__).resolve().parent.parent.parent / "ml" / "evaluation"

    expected_files = [
        eval_dir / "evaluation_results.json",
        eval_dir / "benchmark_results.json",
        eval_dir / "error_analysis.json",
        eval_dir / "confusion_matrix.png",
        eval_dir / "confusion_matrix_normalized.png",
        eval_dir / "per_class_metrics.png",
        eval_dir / "README.md",
    ]

    for fpath in expected_files:
        assert fpath.exists(), f"Phase 5 artifact missing: {fpath}"
        assert fpath.stat().st_size > 0, f"Artifact is empty: {fpath}"

    # Verify JSON files are valid and loadable
    for json_file in [eval_dir / "evaluation_results.json", eval_dir / "benchmark_results.json", eval_dir / "error_analysis.json"]:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert isinstance(data, dict)

