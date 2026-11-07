# Phase 5 — Final Machine Learning Evaluation & Optimization Report
**Project:** Facial Emotion Recognizer AI  
**Tagline:** *Understand Facial Expressions with Artificial Intelligence*  
**Brand Identity:** *Powered by Saniya*  
**Phase:** Phase 5 — ML Evaluation, Performance Profiling & Optimization  
**Author:** Senior Full-Stack AI Engineer & Computer Vision Architect  
**Submission Status:** Production-Ready & Submission-Verified  

---

## 1. Executive Summary

Phase 5 delivers a rigorous, mathematically verified evaluation of the Custom Convolutional Neural Network trained on the **FER-2013** benchmark dataset. Every metric reported herein is derived directly from empirical evaluation across the **7,178 test samples** of the official test set. In strict compliance with engineering ethics and scientific integrity, no mock, synthetic, or inflated statistics are used.

### Core Headline Metrics

* **Test Accuracy:** **45.24%** (0.452354) &bull; 3,247 correct classifications out of 7,178 test images
* **Test Loss:** **1.4515** (Sparse Categorical Cross-Entropy)
* **Macro Average F1-Score:** **0.3743** (37.43%)
* **Weighted Average F1-Score:** **0.4006** (40.06%)
* **Macro Precision:** **0.4456** | **Macro Recall:** **0.3931**
* **Model Artifact Size:** **4.92 MB** (5,156,035 bytes) on disk
* **Average Single-Sample CPU Latency:** **77.08 ms** (Median: **76.04 ms**, P95: **84.52 ms**)
* **Single-Stream Throughput:** **12.97 FPS** (Exceeds live webcam 2 FPS and video 1 FPS requirements)
* **Batch-32 Throughput:** **412.97 FPS** (2.42 ms per sample)

---

## 2. Evaluation Methodology & Ground Truth Taxonomy

The evaluation pipeline strictly adheres to the preprocessing specifications established during model training:

1. **Input Dimensionality:** `(1, 48, 48, 1)` single-channel 8-bit grayscale.
2. **Pixel Intensity Normalization:** Scaled from $[0, 255]$ to $[0.0, 1.0]$ via the internal Keras `Rescaling(scale=1/255.0)` layer.
3. **Face Localization:** OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`) crops the primary facial region before downscaling with area interpolation.
4. **Target Classes:** Exact 7-class taxonomy loaded from `ml/artifacts/class_names.json`:
   - Index 0: `angry`
   - Index 1: `disgust`
   - Index 2: `fear`
   - Index 3: `happy`
   - Index 4: `neutral`
   - Index 5: `sad`
   - Index 6: `surprise`

---

## 3. Comprehensive Classification Report

The detailed performance metrics across all seven target expressions on the 7,178 test images are detailed below:

| Class Index | Target Class | Precision | Recall (Sensitivity) | F1-Score | Support (Actual Count) | Predicted Total | True Positives ($TP$) |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | **Angry** | 40.61% | 30.48% | 34.82% | 958 | 719 | 292 |
| 1 | **Disgust** | 28.87% | 25.23% | 26.92% | 111 | 97 | 28 |
| 2 | **Fear** | 44.00% | 3.22% | 6.01% | 1,024 | 75 | 33 |
| 3 | **Happy** | 43.19% | 90.42% | 58.45% | 1,774 | 3,714 | 1,604 |
| 4 | **Neutral** | 51.43% | 24.74% | 33.41% | 1,233 | 593 | 305 |
| 5 | **Sad** | 37.97% | 34.80% | 36.32% | 1,247 | 1,143 | 434 |
| 6 | **Surprise** | 65.83% | 66.31% | 66.07% | 831 | 837 | 551 |
| — | **Macro Avg** | **44.56%** | **39.31%** | **37.43%** | **7,178** | **7,178** | **3,247** |
| — | **Weighted Avg** | **45.87%** | **45.24%** | **40.06%** | **7,178** | **7,178** | **3,247** |

---

## 4. Full Confusion Matrix Evaluation

Below is the verified $7 \times 7$ contingency matrix for the complete test set. Rows denote ground-truth actual labels; columns denote the CNN model's predictions.

| Actual \ Predicted | Angry | Disgust | Fear | Happy | Neutral | Sad | Surprise | **Total (Actual)** |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Angry** | **292** | 25 | 7 | 363 | 54 | 179 | 38 | **958** |
| **Disgust** | 19 | **28** | 0 | 49 | 2 | 10 | 3 | **111** |
| **Fear** | 116 | 12 | **33** | 424 | 70 | 213 | 156 | **1,024** |
| **Happy** | 37 | 4 | 2 | **1,604** | 30 | 67 | 30 | **1,774** |
| **Neutral** | 89 | 16 | 9 | 602 | **305** | 184 | 28 | **1,233** |
| **Sad** | 128 | 11 | 12 | 517 | 114 | **434** | 31 | **1,247** |
| **Surprise** | 38 | 1 | 12 | 155 | 18 | 56 | **551** | **831** |
| **Total (Predicted)** | **719** | **97** | **75** | **3,714** | **593** | **1,143** | **837** | **7,178** |

### Output Visualizations
* **High-Resolution Confusion Matrix:** [`ml/evaluation/confusion_matrix.png`](file:///c:/Users/saniy/OneDrive/Desktop/FACIAL%20EMOTION%20RECOGNIZER%20AI/ml/evaluation/confusion_matrix.png) (300 DPI, raw cell counts and row percentages).
* **Normalized Confusion Matrix:** [`ml/evaluation/confusion_matrix_normalized.png`](file:///c:/Users/saniy/OneDrive/Desktop/FACIAL%20EMOTION%20RECOGNIZER%20AI/ml/evaluation/confusion_matrix_normalized.png) (Row recall distribution).
* **Per-Class Metrics Bar Chart:** [`ml/evaluation/per_class_metrics.png`](file:///c:/Users/saniy/OneDrive/Desktop/FACIAL%20EMOTION%20RECOGNIZER%20AI/ml/evaluation/per_class_metrics.png) (Precision, Recall, F1 grouped bars).

---

## 5. Model Performance & Hardware Benchmark

Hardware profiling was executed on the local development environment using Python 3.10 and TensorFlow 2.18 with CPU AVX2 acceleration. In compliance with instructions, no simulated GPU performance is claimed.

### 5.1 Environment Configuration
* **Execution Device:** CPU (Intel/AMD x86_64 with oneDNN & AVX2 optimization)
* **Operating System:** Windows 10/11
* **Memory Footprint:** 4.92 MB on disk (5,156,035 bytes)
* **Test Dataset Size:** 7,178 images evaluated

### 5.2 Latency Distribution (Single-Sample Inference)
* **Cold-Start Latency:** 249.50 ms
* **Warm-Up Iterations:** 10 forward passes
* **Mean Latency:** **77.08 ms**
* **Median Latency:** **76.04 ms**
* **Minimum Latency:** **68.98 ms**
* **Maximum Latency:** **131.74 ms**
* **Standard Deviation:** **6.98 ms**
* **90th Percentile (P90):** **82.68 ms**
* **95th Percentile (P95):** **84.52 ms**
* **99th Percentile (P99):** **88.27 ms**
* **Single-Stream Throughput:** **12.97 FPS**

### 5.3 Batch Scaling & Throughput Profile
Because TensorFlow AVX2 kernel execution parallelizes across batch dimensions, batched evaluation demonstrates near-linear scaling:

| Batch Size | Total Batch Latency | Per-Sample Latency | Throughput | Speedup vs Batch 1 |
|:---:|:---:|:---:|:---:|:---:|
| **1** | 79.89 ms | 79.89 ms | 12.52 FPS | 1.0× (Baseline) |
| **4** | 77.23 ms | 19.31 ms | 51.79 FPS | 4.1× |
| **8** | 79.55 ms | 9.94 ms | 100.57 FPS | 8.0× |
| **16** | 79.77 ms | 4.99 ms | 200.57 FPS | 16.0× |
| **32** | 77.49 ms | **2.42 ms** | **412.97 FPS** | **33.0×** |

This benchmark confirms that the backend can comfortably handle high-throughput video processing or multi-face detection queues without server-side latency degradation.

---

## 6. Deep Diagnostic Error Analysis

### 6.1 Best-Performing Classes
1. **Happy (Recall: 90.42%, F1: 0.5845):**  
   Happy achieves the highest recall by a wide margin (1,604 / 1,774 correct). Morphologically, smiles create prominent raised zygomaticus major muscle action (Action Unit 12) with high contrast visible teeth, which remain easily distinguishable even in heavily compressed 48×48 grayscale patches.
2. **Surprise (Precision: 65.83%, Recall: 66.31%, F1: 0.6607):**  
   Surprise achieves the highest balanced F1-score across all 7 categories. The distinct jaw drop (AU 26/27) and brow raise (AU 1+2) create a prominent vertical elongation of facial geometry that the 4-block CNN easily isolates.

### 6.2 Weakest-Performing Classes
1. **Fear (Recall: 3.22%, F1: 0.0601):**  
   Fear represents the most severe failure mode in the network. Only 33 out of 1,024 test images were correctly classified.  
   - 41.4% (424 images) were misclassified as Happy.
   - 20.8% (213 images) were misclassified as Sad.
   - 15.2% (156 images) were misclassified as Surprise.  
   *Root Cause:* Fear expressions share brow raise and widened eyes with Surprise, and mouth opening with laughter. Without temporal motion cues or color, static 48×48 patches lack sufficient visual bandwidth to separate Fear from other high-arousal expressions.
2. **Disgust (Recall: 25.23%, Precision: 28.87%, F1: 0.2692):**  
   Disgust suffered from severe class underrepresentation in FER-2013: only 111 test samples (1.5% of dataset). The nose wrinkling (AU 9) that defines disgust occupies only 3–5 pixels in 48×48 resolution, preventing the convolutional filters from learning robust discriminative representations.

### 6.3 The "Happy Bias" Analysis
The network exhibits a pronounced bias toward predicting "Happy":
* Ground Truth Happy frequency: **24.71%** (1,774 / 7,178)
* Model Predicted Happy frequency: **51.74%** (3,714 / 7,178)
* **Inflation Ratio:** **2.094×**

Because Happy was the majority class in training data (~7,215 images) and featured the most distinct gradient features, unweighted cross-entropy loss drove the network weights to default to Happy whenever an image was ambiguous or low-contrast.

---

## 7. Optimization Experiment & Recommendations

### 7.1 Class Imbalance & Optimal Weighting Formulation
To prevent the majority class from monopolizing weight gradients, balanced cost-sensitive weights were calculated using the inverse class frequency formula:

$$w_j = \frac{N}{K \cdot N_j}$$

Where $N = 7,178$, $K = 7$, and $N_j$ is the class support:

| Class | Actual Support ($N_j$) | Test Proportion | Recommended Class Weight ($w_j$) | Gradient Multiplier |
|:---|:---:|:---:|:---:|:---:|
| **Angry** | 958 | 13.35% | **1.0704** | 1.07× |
| **Disgust** | 111 | 1.55% | **9.2382** | **9.24× (Highest Penalty)** |
| **Fear** | 1,024 | 14.27% | **1.0014** | 1.00× |
| **Happy** | 1,774 | 24.71% | **0.5780** | **0.58× (Down-weighted)** |
| **Neutral** | 1,233 | 17.18% | **0.8317** | 0.83× |
| **Sad** | 1,247 | 17.37% | **0.8223** | 0.82× |
| **Surprise** | 831 | 11.58% | **1.2340** | 1.23× |

### 7.2 Decision on Model Replacement
In accordance with user requirements:
> *"Do not replace the existing model unless a new experiment demonstrates measurable improvement. If optimization requires significant time, document it as future work instead."*

Because training a new deep neural network from scratch with class weighting and evaluating on 35,000+ samples requires substantial GPU training cycles (several hours on dedicated hardware), the existing verified model artifact (`emotion_cnn.keras`) is strictly retained as the verified baseline. All proposed training enhancements are documented as prioritized future work.

---

## 8. Limitations & Scientific Disclaimers

1. **Morphological Classification vs Internal Emotional States:**  
   The application classifies visible surface muscle movements (Action Units) according to standard computer vision taxonomies. It does not determine, diagnose, or confirm an individual's genuine internal psychological state, intentionality, or emotional experience.
2. **Uncalibrated Softmax Probabilities:**  
   The confidence scores generated by the final 7-way softmax layer represent relative activation strengths over the FER-2013 feature space, not true Bayesian posterior probabilities.
3. **Dataset Inherent Noise:**  
   FER-2013 contains documented labeling noise, low-resolution web scrape artifacts, occlusions, and non-frontal head angles that limit custom CNN test accuracy to roughly 45%–55%.

---

## 9. Submission Readiness Checklist

* [x] **Reproducible Evaluation Script:** [`ml/evaluation/evaluator.py`](file:///c:/Users/saniy/OneDrive/Desktop/FACIAL%20EMOTION%20RECOGNIZER%20AI/ml/evaluation/evaluator.py)
* [x] **Publication-Grade Visualizations:** [`ml/evaluation/visualize.py`](file:///c:/Users/saniy/OneDrive/Desktop/FACIAL%20EMOTION%20RECOGNIZER%20AI/ml/evaluation/visualize.py)
* [x] **Hardware & Latency Profiler:** [`ml/evaluation/benchmark.py`](file:///c:/Users/saniy/OneDrive/Desktop/FACIAL%20EMOTION%20RECOGNIZER%20AI/ml/evaluation/benchmark.py)
* [x] **Failure Mode & Imbalance Diagnostics:** [`ml/evaluation/error_analysis.py`](file:///c:/Users/saniy/OneDrive/Desktop/FACIAL%20EMOTION%20RECOGNIZER%20AI/ml/evaluation/error_analysis.py)
* [x] **Structured Machine-Readable Output:** `evaluation_results.json`, `benchmark_results.json`, `error_analysis.json`
* [x] **Documentation Complete:** `ml/evaluation/README.md` and `docs/PHASE_5_EVALUATION.md`
* [x] **Zero Mock Data Used:** All numbers verified against 7,178 test samples.
* [x] **Existing Backend & Frontend Functionality Preserved.**

