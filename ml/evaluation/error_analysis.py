"""
Error Analysis & Optimization Analysis Module - Phase 5.
Brand: Powered by Saniya
Tagline: Understand Facial Expressions with Artificial Intelligence

Analyzes failure modes, confusion pairs, and dataset imbalance:
1. Class-by-class sensitivity & error rates
2. Dominant confusion pairs & the "Happy Bias"
3. Imbalance analysis & optimal class weighting formulation
4. Benchmark comparison and recommendations
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from ml.evaluation.evaluator import (
    DEFAULT_CLASSES,
    FER2013_TEST_CONFUSION_MATRIX,
    ModelEvaluator,
)


class ErrorAnalyzer:
    """
    Detailed error diagnostic suite for FER-2013 emotion recognition.
    """

    def __init__(
        self,
        class_names: Optional[List[str]] = None,
        confusion_matrix: Optional[np.ndarray] = None,
    ):
        self.classes = class_names or DEFAULT_CLASSES
        self.cm = (
            np.array(confusion_matrix, dtype=int)
            if confusion_matrix is not None
            else FER2013_TEST_CONFUSION_MATRIX.copy()
        )
        self.evaluator = ModelEvaluator(
            class_names=self.classes, confusion_matrix=self.cm
        )

    def analyze_confusion_pairs(self) -> List[Dict[str, Any]]:
        """
        Extracts and sorts all off-diagonal misclassification pairs by frequency.
        """
        pairs = []
        for i, actual_cls in enumerate(self.classes):
            actual_total = int(np.sum(self.cm[i, :]))
            for j, pred_cls in enumerate(self.classes):
                if i != j:
                    count = int(self.cm[i, j])
                    pct_of_actual = (count / actual_total * 100) if actual_total > 0 else 0.0
                    pairs.append({
                        "actual_class": actual_cls,
                        "predicted_class": pred_cls,
                        "error_count": count,
                        "percentage_of_actual": round(pct_of_actual, 2),
                    })

        pairs.sort(key=lambda x: x["error_count"], reverse=True)
        return pairs

    def analyze_class_performance(self) -> Dict[str, Any]:
        """
        Identifies highest-performing and lowest-performing classes by F1 and recall.
        """
        metrics = self.evaluator.compute_metrics()
        per_class = metrics["per_class"]

        # Sort classes by F1-score
        f1_sorted = sorted(per_class.items(), key=lambda item: item[1]["f1_score"], reverse=True)
        recall_sorted = sorted(per_class.items(), key=lambda item: item[1]["recall"], reverse=True)
        precision_sorted = sorted(per_class.items(), key=lambda item: item[1]["precision"], reverse=True)

        return {
            "best_f1_classes": [
                {"class": name, "f1_score": data["f1_score"]} for name, data in f1_sorted[:2]
            ],
            "worst_f1_classes": [
                {"class": name, "f1_score": data["f1_score"]} for name, data in f1_sorted[-2:]
            ],
            "highest_recall_class": {
                "class": recall_sorted[0][0],
                "recall": recall_sorted[0][1]["recall"],
                "support": recall_sorted[0][1]["support"],
            },
            "lowest_recall_class": {
                "class": recall_sorted[-1][0],
                "recall": recall_sorted[-1][1]["recall"],
                "support": recall_sorted[-1][1]["support"],
            },
            "highest_precision_class": {
                "class": precision_sorted[0][0],
                "precision": precision_sorted[0][1]["precision"],
            },
            "lowest_precision_class": {
                "class": precision_sorted[-1][0],
                "precision": precision_sorted[-1][1]["precision"],
            },
        }

    def compute_optimal_class_weights(self) -> Dict[str, float]:
        """
        Calculates theoretical inverse-frequency class weights:
        w_j = N / (K * N_j)
        where N is total samples, K is number of classes (7), and N_j is support of class j.
        """
        row_sums = np.sum(self.cm, axis=1)
        total_samples = float(np.sum(row_sums))
        k = float(len(self.classes))

        weights: Dict[str, float] = {}
        for idx, cls_name in enumerate(self.classes):
            n_j = float(row_sums[idx])
            w = total_samples / (k * n_j) if n_j > 0 else 1.0
            weights[cls_name] = round(w, 4)

        return weights

    def analyze_happy_bias(self) -> Dict[str, Any]:
        """
        Quantifies the skew toward predicting 'happy'.
        """
        happy_idx = self.classes.index("happy")
        total_samples = int(np.sum(self.cm))
        actual_happy = int(np.sum(self.cm[happy_idx, :]))
        predicted_happy = int(np.sum(self.cm[:, happy_idx]))

        misclassified_as_happy = {}
        for i, cls_name in enumerate(self.classes):
            if cls_name != "happy":
                count = int(self.cm[i, happy_idx])
                tot = int(np.sum(self.cm[i, :]))
                misclassified_as_happy[cls_name] = {
                    "count": count,
                    "percentage_of_actual": round((count / tot * 100), 2) if tot > 0 else 0.0,
                }

        return {
            "total_test_samples": total_samples,
            "actual_happy_count": actual_happy,
            "actual_happy_percentage": round((actual_happy / total_samples) * 100, 2),
            "predicted_happy_count": predicted_happy,
            "predicted_happy_percentage": round((predicted_happy / total_samples) * 100, 2),
            "happy_prediction_inflation_ratio": round(predicted_happy / actual_happy, 3),
            "misclassifications_into_happy": misclassified_as_happy,
        }

    def generate_full_report(self, output_path: Optional[Path] = None) -> Dict[str, Any]:
        """Consolidates complete diagnostic findings into structured dictionary."""
        confusion_pairs = self.analyze_confusion_pairs()
        performance = self.analyze_class_performance()
        happy_bias = self.analyze_happy_bias()
        class_weights = self.compute_optimal_class_weights()

        report = {
            "report_metadata": {
                "title": "FER-2013 Error Analysis & Optimization Assessment",
                "brand": "Powered by Saniya",
                "evaluated_samples": int(np.sum(self.cm)),
                "baseline_accuracy": "45.24%",
            },
            "class_performance_summary": performance,
            "happy_bias_diagnostic": happy_bias,
            "top_confusion_pairs": confusion_pairs[:10],
            "imbalance_and_class_weights": {
                "rationale": "Mitigates gradient dominance of majority classes (Happy, Sad, Neutral) over minority classes (Disgust, Fear).",
                "formula": "w_j = total_samples / (num_classes * class_support)",
                "recommended_class_weights": class_weights,
            },
            "key_architectural_limitations": [
                {
                    "issue": "Low Input Resolution (48x48 Grayscale)",
                    "impact": "Eliminates high-frequency micro-expression signals (subtle eye squints, minor lip tremors, skin furrows).",
                },
                {
                    "issue": "Class Imbalance in Ground Truth",
                    "impact": "Disgust has only 111 test samples (1.5%) vs Happy with 1,774 test samples (24.7%), skewing unweighted cross-entropy loss.",
                },
                {
                    "issue": "Label Ambiguity & Morphological Overlap",
                    "impact": "Fear and Surprise share widened eyes and parted lips; Neutral, Sad, and Angry share relaxed mouths in static snapshots.",
                },
                {
                    "issue": "Absence of Temporal Sequence Modeling",
                    "impact": "Static CNN treats frames in isolation without facial action unit temporal velocity.",
                },
            ],
            "optimization_recommendations": [
                {
                    "technique": "Cost-Sensitive Training (Class Weighting)",
                    "expected_benefit": "Boosts Fear and Disgust recall from <26% without requiring additional dataset collection.",
                },
                {
                    "technique": "Focal Loss (Lin et al.)",
                    "expected_benefit": "Dynamically scales loss, focusing gradient updates on hard misclassified examples rather than easy Happy samples.",
                },
                {
                    "technique": "Data Augmentation for Minority Classes",
                    "expected_benefit": "Random horizontal flip, minor rotation (+/- 10 deg), and random brightness scaling to enlarge Disgust and Fear diversity.",
                },
            ],
        }

        if output_path is not None:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=4)
            print(f"[OK] Error analysis report saved to: {output_path}")

        return report


def run_error_analysis(output_dir: Optional[Path] = None) -> Dict[str, Any]:
    """Helper to run error analysis and write error_analysis.json."""
    base_dir = output_dir or Path(__file__).resolve().parent
    report_file = base_dir / "error_analysis.json"
    analyzer = ErrorAnalyzer()
    return analyzer.generate_full_report(output_path=report_file)


if __name__ == "__main__":
    run_error_analysis()

