# FER-2013 Model Evaluation & Performance Benchmark
**Project:** Facial Emotion Recognizer AI  
**Brand Identity:** Powered by Saniya  
**Phase:** Phase 5 — Final ML Evaluation & Optimization  
**Dataset:** Official FER-2013 Test Set (7,178 Grayscale 48×48 Samples)  
**Evaluated Architecture:** Custom 4-Block Convolutional Neural Network (`emotion_cnn.keras`)  

---

## 1. Executive Summary

This directory contains the reproducible evaluation suite, benchmarking scripts, and diagnostic error reports for the trained FER-2013 Custom CNN. All metrics are derived from empirical evaluation on the official 7,178 test samples without synthetic or fabricated data.

### Primary Benchmark Results

| Metric | Empirical Result | Notes |
|---|---|---|
| **Test Accuracy** | **45.24%** (0.452354) | 3,247 correct classifications out of 7,178 test images |
| **Test Loss** | **1.4515** | Sparse Categorical Cross-Entropy |
| **Macro Average F1** | **0.3743** (37.43%) | Unweighted mean across all 7 classes |
| **Weighted Average F1** | **0.4006** (40.06%) | Support-weighted mean across all 7 classes |
| **Macro Average Precision** | **0.4456** (44.56%) | Unweighted mean precision |
| **Macro Average Recall** | **0.3931** (39.31%) | Unweighted mean sensitivity |
| **Model Size on Disk** | **4.92 MB** (5,156,035 bytes) | Saved in `.keras` container format |
| **Single-Sample Latency (Mean)** | **77.08 ms** | CPU inference with AVX2/oneDNN acceleration |
| **Single-Sample Latency (Median)** | **76.04 ms** | 100 timed iterations |
| **Single-Sample Latency (P95)** | **84.52 ms** | 95th percentile wall-clock latency |
| **Single-Sample Throughput** | **12.97 FPS** | Ample headroom for 2 FPS webcam & 1 FPS video streams |
| **Batch-32 Throughput** | **412.97 FPS** | 2.42 ms per sample under batched evaluation |

---

## 2. Directory Layout & Artifacts

```
ml/evaluation/
├── README.md                          # This documentation file
├── evaluator.py                       # Core evaluation script & metric calculator
├── benchmark.py                       # Latency, throughput, and hardware profiler
├── visualize.py                       # Publication-grade chart & heatmap generator
├── error_analysis.py                  # Error diagnostics & class imbalance analysis
├── evaluation_results.json            # Structured classification report & metrics
├── benchmark_results.json             # Hardware profiling & latency distributions
├── error_analysis.json                # Complete confusion pairs & failure mode diagnostics
├── confusion_matrix.png               # High-resolution (300 DPI) confusion matrix heatmap
├── confusion_matrix_normalized.png    # Row-normalized (percentage) confusion matrix
└── per_class_metrics.png              # Precision, Recall & F1-score grouped bar chart
```

---

## 3. Detailed Per-Class Classification Report

| Emotion Class | Precision | Recall | F1-Score | Support (Actual) | Predicted Total | True Positives |
|---|---|---|---|---|---|---|
| **Angry** | 40.61% | 30.48% | 34.82% | 958 | 719 | 292 |
| **Disgust** | 28.87% | 25.23% | 26.92% | 111 | 97 | 28 |
| **Fear** | 44.00% | 3.22% | 6.01% | 1,024 | 75 | 33 |
| **Happy** | 43.19% | 90.42% | 58.45% | 1,774 | 3,714 | 1,604 |
| **Neutral** | 51.43% | 24.74% | 33.41% | 1,233 | 593 | 305 |
| **Sad** | 37.97% | 34.80% | 36.32% | 1,247 | 1,143 | 434 |
| **Surprise** | 65.83% | 66.31% | 66.07% | 831 | 837 | 551 |
| **Macro Average** | **44.56%** | **39.31%** | **37.43%** | **7,178** | **7,178** | **3,247** |
| **Weighted Average** | **45.87%** | **45.24%** | **40.06%** | **7,178** | **7,178** | **3,247** |

---

## 4. Confusion Matrix Analysis

The official 7×7 confusion matrix evaluated on 7,178 test samples is documented below.  
*Rows represent Actual Ground Truth labels; Columns represent Model Predictions.*

```
               Predicted Labels
Actual        Angry   Disgust    Fear    Happy  Neutral     Sad  Surprise | Total
Angry           292        25       7      363       54     179        38 |   958
Disgust          19        28       0       49        2      10         3 |   111
Fear            116        12      33      424       70     213       156 |  1024
Happy            37         4       2     1604       30      67        30 |  1774
Neutral          89        16       9      602      305     184        28 |  1233
Sad             128        11      12      517      114     434        31 |  1247
Surprise         38         1      12      155       18      56       551 |   831
--------------------------------------------------------------------------------
Total           719        97      75     3714      593    1143       837 |  7178
```

Visualizations:
* [Standard Confusion Matrix Heatmap](confusion_matrix.png)
* [Normalized Confusion Matrix (Recall %)](confusion_matrix_normalized.png)
* [Per-Class Metrics Bar Chart](per_class_metrics.png)

---

## 5. Diagnostic Error Analysis & Failure Modes

### 5.1 The "Happy Bias" (Majority Class Collapse)
* **Actual Happy frequency:** 1,774 / 7,178 (**24.71%**)
* **Predicted Happy frequency:** 3,714 / 7,178 (**51.74%**)
* **Inflation Ratio:** **2.094×** (The model predicted Happy more than twice as often as it actually appeared).
* **Root Cause:** In FER-2013, Happy is the dominant training class (~7,215 images) with high visual saliency (wide smile, exposed teeth). Because the model was trained with unweighted cross-entropy loss, gradients disproportionately penalized misclassifying Happy, leading the model to default to Happy whenever visual features were ambiguous.

### 5.2 Fear Class Breakdown
* **Recall:** Only **3.22%** (33 out of 1,024 test samples classified correctly).
* **Primary Failure Modes:**
  - 424 Fear samples (41.4%) were misclassified as Happy.
  - 213 Fear samples (20.8%) were misclassified as Sad.
  - 156 Fear samples (15.2%) were misclassified as Surprise.
* **Root Cause:** Fear expressions (wide eyes, parted lips) share morphological Action Units with Surprise (AU 1+2+5+26) and open-mouthed laughter (Happy). In low-resolution 48×48 grayscale patches lacking color or motion, these subtle boundaries blur significantly.

### 5.3 Neutral & Sad Confusion
* 602 Neutral samples (48.8%) were classified as Happy; 184 (14.9%) were classified as Sad.
* 517 Sad samples (41.5%) were classified as Happy; 128 (10.3%) were classified as Angry.
* Relaxed, non-expressive faces lack strong geometric deformations, making them susceptible to being pulled toward dominant gradient attractors.

---

## 6. Optimization Experiment & Future Work

### 6.1 Class Imbalance Analysis & Optimal Weighting
To prevent the majority class from dominating loss updates, theoretical balanced class weights $w_j = \frac{N}{K \cdot N_j}$ were calculated:

$$w_j = \frac{7178}{7 \times N_j}$$

| Class | Test Support ($N_j$) | Percentage | Recommended Weight ($w_j$) |
|---|---|---|---|
| **Angry** | 958 | 13.35% | **1.0704** |
| **Disgust** | 111 | 1.55% | **9.2382** |
| **Fear** | 1,024 | 14.27% | **1.0014** |
| **Happy** | 1,774 | 24.71% | **0.5780** |
| **Neutral** | 1,233 | 17.18% | **0.8317** |
| **Sad** | 1,247 | 17.37% | **0.8223** |
| **Surprise** | 831 | 11.58% | **1.2340** |

### 6.2 Key Recommendations for Next Model Iteration
1. **Cost-Sensitive Learning:** Train with `class_weight` parameters above to penalize minority misclassifications (Disgust: 9.24× penalty; Happy: 0.58× penalty).
2. **Focal Loss:** Replace standard categorical cross-entropy with Focal Loss ($\gamma = 2.0$) to dynamically down-weight well-classified easy examples (Happy) and focus gradient updates on hard examples (Fear, Disgust).
3. **Targeted Data Augmentation:** Apply affine rotations ($\pm 12^\circ$), horizontal flipping, and brightness perturbations specifically on Disgust and Fear samples to increase representation.
4. **Higher Resolution & Transfer Learning:** Transition from 48×48 grayscale custom CNN to 224×224 RGB models (e.g. MobileNetV3-Small or EfficientNet-B0 pretrained on VGGFace2), capturing fine-grained facial action units.

---

## 7. How to Reproduce All Metrics Locally

From the project root:

```powershell
# 1. Run Classification Evaluation (generates evaluation_results.json)
python ml/evaluation/evaluator.py

# 2. Generate Publication-Quality Visualizations (generates PNG charts)
python ml/evaluation/visualize.py

# 3. Run Hardware & Latency Benchmarks (generates benchmark_results.json)
python ml/evaluation/benchmark.py

# 4. Run Error & Imbalance Analysis (generates error_analysis.json)
python ml/evaluation/error_analysis.py
```

