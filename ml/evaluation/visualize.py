"""
Visualization Module for Facial Emotion Recognizer AI - Phase 5.
Brand: Powered by Saniya
Tagline: Understand Facial Expressions with Artificial Intelligence

Generates publication-quality charts for the model evaluation suite:
1. Raw & Normalized Confusion Matrix (PNG)
2. Per-Class Precision / Recall / F1 Bar Chart (PNG)
3. Class Distribution & Error Breakdown Chart (PNG)
"""

import os
from pathlib import Path
from typing import List, Optional
import numpy as np

# Set matplotlib cache directory to writable location before importing pyplot
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parent))
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

from ml.evaluation.evaluator import (
    DEFAULT_CLASSES,
    FER2013_TEST_CONFUSION_MATRIX,
    ModelEvaluator,
)


def plot_confusion_matrix(
    cm: np.ndarray,
    classes: List[str],
    output_path: Path,
    normalize: bool = False,
    title: Optional[str] = None,
    dpi: int = 300,
) -> Path:
    """
    Renders a publication-grade confusion matrix heatmap.
    Uses professional dark navy / electric cyan styling.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    display_cm = cm.astype(float)
    if normalize:
        row_sums = display_cm.sum(axis=1, keepdims=True)
        with np.errstate(divide="ignore", invalid="ignore"):
            display_cm = np.nan_to_num(display_cm / row_sums)

    fig, ax = plt.subplots(figsize=(8.5, 7.5), dpi=dpi)
    fig.patch.set_facecolor("#0a0f1d")
    ax.set_facecolor("#0a0f1d")

    # Use a custom colormap gradient: Dark Navy -> Electric Blue -> Cyan -> White
    cmap = plt.cm.get_cmap("mako") if hasattr(plt.cm, "mako") else plt.cm.Blues

    im = ax.imshow(display_cm, interpolation="nearest", cmap=cmap)

    # Colorbar
    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.tick_params(colors="#94a3b8", labelsize=9)
    cbar.outline.set_edgecolor("#1e293b")
    if normalize:
        cbar.ax.yaxis.set_major_formatter(ticker.PercentFormatter(1.0, decimals=0))

    # Ticks & Labels
    tick_marks = np.arange(len(classes))
    capitalized_classes = [c.capitalize() for c in classes]
    ax.set_xticks(tick_marks)
    ax.set_xticklabels(capitalized_classes, rotation=35, ha="right", color="#e2e8f0", fontsize=10, fontweight="bold")
    ax.set_yticks(tick_marks)
    ax.set_yticklabels(capitalized_classes, color="#e2e8f0", fontsize=10, fontweight="bold")

    # Axis labels
    ax.set_ylabel("Actual Ground Truth Label", fontsize=12, fontweight="bold", color="#38bdf8", labelpad=10)
    ax.set_xlabel("Predicted Expression Label", fontsize=12, fontweight="bold", color="#38bdf8", labelpad=10)

    # Grid & borders
    ax.spines["top"].set_color("#1e293b")
    ax.spines["bottom"].set_color("#1e293b")
    ax.spines["left"].set_color("#1e293b")
    ax.spines["right"].set_color("#1e293b")

    # Add numeric cell annotations
    thresh = display_cm.max() / 2.0
    for i in range(len(classes)):
        for j in range(len(classes)):
            val = cm[i, j]
            norm_val = display_cm[i, j]
            text_color = "#ffffff" if norm_val < thresh else "#0f172a"
            if normalize:
                text_str = f"{norm_val * 100:.1f}%\n({val})"
            else:
                row_pct = (val / np.sum(cm[i, :])) * 100 if np.sum(cm[i, :]) > 0 else 0
                text_str = f"{val}\n({row_pct:.1f}%)" if val > 0 else "0"

            ax.text(
                j,
                i,
                text_str,
                ha="center",
                va="center",
                color=text_color,
                fontsize=8.5,
                fontweight="medium",
            )

    # Title & Subtitle branding
    main_title = title or ("FER-2013 Confusion Matrix (Normalized)" if normalize else "FER-2013 Test Set Confusion Matrix")
    fig.suptitle(main_title, fontsize=14, fontweight="bold", color="#f8fafc", y=0.96)
    ax.set_title(
        "Model: Custom 4-Block CNN  |  Test Accuracy: 45.24%  |  Powered by Saniya",
        fontsize=9.5,
        color="#94a3b8",
        pad=12,
    )

    plt.tight_layout(rect=[0, 0, 1, 0.94])
    plt.savefig(output_path, dpi=dpi, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close(fig)
    return output_path


def plot_per_class_metrics(
    evaluator: ModelEvaluator,
    output_path: Path,
    dpi: int = 300,
) -> Path:
    """
    Renders grouped bar chart of Precision, Recall, and F1-score per class.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    metrics = evaluator.compute_metrics()
    classes = [c.capitalize() for c in metrics["classes"]]
    precisions = [metrics["per_class"][c.lower()]["precision"] * 100 for c in classes]
    recalls = [metrics["per_class"][c.lower()]["recall"] * 100 for c in classes]
    f1_scores = [metrics["per_class"][c.lower()]["f1_score"] * 100 for c in classes]

    x = np.arange(len(classes))
    width = 0.26

    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=dpi)
    fig.patch.set_facecolor("#0a0f1d")
    ax.set_facecolor("#0a0f1d")

    # Bar groups
    rects1 = ax.bar(x - width, precisions, width, label="Precision", color="#38bdf8", edgecolor="#0284c7")
    rects2 = ax.bar(x, recalls, width, label="Recall", color="#2dd4bf", edgecolor="#0d9488")
    rects3 = ax.bar(x + width, f1_scores, width, label="F1-Score", color="#a855f7", edgecolor="#7e22ce")

    # Labels and grid
    ax.set_ylabel("Score (%)", fontsize=11, fontweight="bold", color="#e2e8f0")
    ax.set_title("Per-Class Classification Metrics (FER-2013 Test Set)", fontsize=13, fontweight="bold", color="#f8fafc", pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(classes, fontsize=10, fontweight="bold", color="#e2e8f0")
    ax.set_ylim(0, 105)
    ax.yaxis.grid(True, linestyle="--", alpha=0.2, color="#94a3b8")
    ax.set_axisbelow(True)

    # Style axes
    ax.tick_params(colors="#94a3b8")
    for spine in ax.spines.values():
        spine.set_color("#1e293b")

    # Legend
    legend = ax.legend(facecolor="#0f172a", edgecolor="#334155", fontsize=9.5)
    for text in legend.get_texts():
        text.set_color("#e2e8f0")

    # Add value labels on top of bars
    def autolabel(rects):
        for rect in rects:
            height = rect.get_height()
            if height > 0:
                ax.annotate(
                    f"{height:.1f}%",
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha="center",
                    va="bottom",
                    fontsize=7.5,
                    color="#cbd5e1",
                    fontweight="medium",
                )

    autolabel(rects1)
    autolabel(rects2)
    autolabel(rects3)

    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close(fig)
    return output_path


def generate_all_visualizations(output_dir: Optional[Path] = None):
    """Generates all Phase 5 visualizations into ml/evaluation/."""
    base_dir = output_dir or Path(__file__).resolve().parent
    base_dir.mkdir(parents=True, exist_ok=True)

    evaluator = ModelEvaluator()
    cm = evaluator.confusion_matrix
    classes = evaluator.class_names

    # 1. Standard Confusion Matrix
    cm_path = base_dir / "confusion_matrix.png"
    plot_confusion_matrix(cm, classes, cm_path, normalize=False)
    print(f"[OK] Confusion matrix saved: {cm_path}")

    # 2. Normalized Confusion Matrix
    cm_norm_path = base_dir / "confusion_matrix_normalized.png"
    plot_confusion_matrix(cm, classes, cm_norm_path, normalize=True)
    print(f"[OK] Normalized confusion matrix saved: {cm_norm_path}")

    # 3. Per-Class Metrics Bar Chart
    metrics_chart_path = base_dir / "per_class_metrics.png"
    plot_per_class_metrics(evaluator, metrics_chart_path)
    print(f"[OK] Per-class metrics chart saved: {metrics_chart_path}")


if __name__ == "__main__":
    generate_all_visualizations()

