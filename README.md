# Facial Emotion Recognizer AI

> **Tagline:** Understand Facial Expressions with Artificial Intelligence
> **Brand Identity:** Powered by Saniya
> **Development Level:** Professional Production-Grade Full-Stack AI Platform
> **Repository:** [https://github.com/Saniya1808/Facial-Emotion-Recognizer-AI.git](https://github.com/Saniya1808/Facial-Emotion-Recognizer-AI.git)
> **Model Benchmark:** Custom 4-Block CNN on FER-2013 (Empirical Test Accuracy: **45.24%**)

---

## 1. Project Overview

**Facial Emotion Recognizer AI** is a modular, privacy-conscious full-stack computer vision application engineered to classify visible human facial expressions across three distinct input modes:
- **Live Optical Stream (Webcam):** Browser MediaDevices ingestion with non-overlapping frame dispatch (~2 FPS), real-time HTML5 canvas HUD bounding boxes, live 7-class probability graph, configurable confidence threshold, instant snapshot capture, and zero server-side frame retention.
- **Static Image Analysis:** Automated OpenCV Haar cascade face localization, multi-face extraction, 48×48 grayscale normalization, and multi-face expression inference.
- **Temporal Video Analysis:** Processing for MP4, WebM, and MOV containers up to 50 MB, OpenCV keyframe downsampling at 1 FPS, multi-face tracking, chronological trajectory timeline, video player seek synchronization, and structured JSON/CSV data export.
- **Analytics & Persistent Audit (Phase 4):** Non-biometric numerical metadata logging in SQLite via SQLAlchemy ORM, real-time analytics aggregation, multi-modal filtering, single and batch deletion, and downloadable 2-sheet formatted Excel workbooks (`.xlsx`) and CSV reports.
- **ML Evaluation & Hardware Profiling (Phase 5):** Reproducible evaluation suite, 7×7 confusion matrix heatmaps (raw and normalized), per-class classification metrics, CPU/hardware latency profiling (77.08 ms mean latency), and root-cause failure mode analysis.

---

## 2. Problem Statement

Automated facial expression analysis presents severe technical hurdles in real-world environments:
1. **Ambiguity and Subtlety:** Facial configurations often exhibit subtle morphological differences (e.g., distinguishing between fear and surprise, or sadness and neutrality) that are difficult for shallow convolutional filters to disentangle.
2. **Environmental Variability:** Variations in ambient lighting, non-frontal head poses, partial facial occlusions, and image compression degrade localization and classification fidelity.
3. **Dataset Imbalance:** Benchmark datasets like FER-2013 exhibit profound category skews (e.g., Happy represents ~25% of samples while Disgust represents only ~1.5%), biasing deep neural networks toward majority classes.
4. **Scientific & Ethical Misinterpretation:** Commercial software frequently makes unscientific claims of detecting a subject's genuine inner psychological state or emotional truth from momentary surface muscle movements.

---

## 3. Project Objectives

- **Scientific Rigor:** Classify visible morphological facial expressions into 7 discrete categories without making unverified claims regarding a person's actual internal emotional state or psychological feelings.
- **Full-Stack Architecture:** Deliver a decoupled, type-safe architecture using FastAPI (Python 3.10+) and React 18 (TypeScript + Vite + Tailwind CSS).
- **Multi-Modal Computer Vision:** Provide robust pipelines for static images, live camera streams, and temporal video sequences.
- **Enterprise Observability:** Integrate comprehensive audit logging, live analytics dashboards, and professional 2-sheet formatted Excel reports without retaining raw user imagery.
- **Reproducible ML Engineering:** Maintain a transparent, fully reproducible evaluation benchmark on the official 7,178-sample FER-2013 test set, documenting actual empirical capabilities, confusion matrices, and hardware latencies.

---

## 4. Key Features

### 4.1 Live Webcam Ingestion
- **Explicit Permission Gateway:** Dedicated permission card explaining optical access prior to hardware invocation via `navigator.mediaDevices.getUserMedia()`.
- **Media Track Management:** Guaranteed release of hardware camera tracks upon user stop or page unmount.
- **Non-Overlapping Frame Dispatch:** Captures frames via an off-screen HTML5 canvas and streams them to the backend at ~2 FPS using an in-flight asynchronous lock to eliminate network contention.
- **Dynamic Canvas HUD Overlay:** Real-time canvas projection rendering electric cyan bounding boxes, expression tags, and confidence percentages over detected faces.
- **Interactive Confidence Slider:** Configurable threshold (0% to 100%) that tags detections below threshold as low-confidence on the display without mutating underlying raw softmax activations.
- **Instant Snapshot Capture:** One-click frame freezing to inspect high-resolution stills and full 7-class probability distributions.

### 4.2 Temporal Video Analysis
- **Container & Signature Validation:** Strictly validates file extensions (`.mp4`, `.webm`, `.mov`), MIME types, file sizes (<50 MB), and binary container signatures to reject disguised files.
- **Temporal Downsampling:** OpenCV `VideoCapture` samples keyframes at 1 frame per second up to 120 seconds.
- **Interactive Playback Sync:** Clicking any keyframe chip on the chronological trajectory timeline immediately seeks the HTML5 video player to that exact second.
- **Data Export:** Complete analysis export to structured JSON and tabular CSV with per-frame timestamps, primary expression, confidence, and 7 probability columns.
- **Resource Cleanup:** Guaranteed release of video capture handles and unlinking of temporary video files in `finally` blocks.

### 4.3 History, Analytics & Reports
- **Zero Raw Media Retention:** Only numerical metadata (session ID, input mode, face count, primary expression, confidence, latency, timestamp) are stored in SQLite. Raw images, video frames, and optical streams are discarded immediately following inference.
- **Interactive KPI Dashboard:** Real-time metrics aggregated via `GET /api/v1/analytics/summary`, including total analyses, faces detected, active model status, live expression distribution chart, and recent audit activity.
- **Multi-Modal Filtering:** Filter historical analysis records by modality (`all`, `image`, `webcam`, `video`).
- **User Privacy Controls:** Single-record deletion and complete history purge with confirmation dialog.
- **Two-Sheet Formatted Excel Export (`.xlsx`):** Generated via `openpyxl` with styled headers, alternating row fills, KPI summary on Sheet 1, and complete analysis records with all 7 emotion probabilities on Sheet 2.
- **Data Science CSV Export (`.csv`):** Standard comma-separated table export for statistical analysis.

---

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Client** | React 18, TypeScript, Vite 5, Tailwind CSS 3, Framer Motion, Lucide React, Axios, Plotly.js |
| **Backend Service** | Python 3.10 / 3.11, FastAPI 0.115, Uvicorn 0.31, Pydantic v2, Pydantic Settings, SQLAlchemy 2.0, OpenPyXL 3.1 |
| **Deep Learning & CV** | TensorFlow 2.18, Keras 3, OpenCV (`opencv-python-headless` 4.10), NumPy, Pillow, Scikit-learn 1.7, Matplotlib 3.10 |
| **Persistence** | SQLite with SQLAlchemy ORM (zero raw frame retention) |
| **Testing & QA** | Pytest 8.3, HTTPX 0.27, Vitest 2.1, React Testing Library, JSDOM |
| **Deployment Targets**| Frontend: Vercel / Netlify / Static CDN; Backend: Docker / Render / Cloud Run |

---

## 6. System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite + TypeScript)"]
        UI["Application Shell & Theme Provider"]
        ImgView["Image Analysis Page"]
        CamView["Webcam Controller & HUD Overlay (~2 FPS)"]
        VidView["Video Analysis & Playback Sync Page"]
        DashView["Analytics Dashboard & KPI Feed"]
        HistView["History Audit Table & Export Page"]
        ApiClient["Axios API Client (VITE_API_BASE_URL)"]
    end

    subgraph Gateway["Backend Service Layer (FastAPI)"]
        Router["/api/v1 Router"]
        HealthEp["/api/v1/health & /model/status"]
        PredictImgEp["POST /api/v1/predict/image"]
        PredictVidEp["POST /api/v1/predict/video"]
        HistEp["/api/v1/history & /history/{id}"]
        AnalyticsEp["/api/v1/analytics/summary"]
        ReportsEp["/api/v1/reports/excel & /csv"]
        SecGuard["File Size, MIME & Header Validator"]
        CORSGuard["CORS Policy Middleware"]
    end

    subgraph MLSubsystem["Machine Learning Subsystem"]
        FaceDetect["OpenCV Haar Cascade Face Detector"]
        VidSampler["OpenCV VideoCapture Keyframe Downsampler (1 FPS)"]
        Preproc["Grayscale + 48x48 Resize + [0,1] Normalizer"]
        KerasPatch["Keras 3 Layer Deserialization Compatibility Patch"]
        ThreadLock["Python Threading Lock (Concurrency Guard)"]
        CNNModel["Custom 4-Block CNN (emotion_cnn.keras)"]
        Artifacts["ml/artifacts (emotion_cnn.keras, class_names.json)"]
    end

    subgraph Persistence["Persistence & Reporting Layer"]
        DB[("SQLite Database (emotion_recognizer.db)")]
        AnalysisTable["Analysis Metadata Table (Zero Raw Imagery)"]
        ExcelGen["OpenPyXL 2-Sheet Excel Generator"]
    end

    ImgView -->|Multipart Image| ApiClient
    CamView -->|Canvas JPEG Blob Frames| ApiClient
    VidView -->|Multipart Video (MP4/WebM/MOV)| ApiClient
    DashView -->|GET /analytics/summary| ApiClient
    HistView -->|GET/DELETE /history, GET /reports/*| ApiClient

    ApiClient --> CORSGuard
    CORSGuard --> SecGuard
    SecGuard --> Router

    Router --> HealthEp
    Router --> PredictImgEp
    Router --> PredictVidEp
    Router --> HistEp
    Router --> AnalyticsEp
    Router --> ReportsEp

    PredictImgEp --> FaceDetect
    PredictVidEp --> VidSampler
    VidSampler --> FaceDetect
    FaceDetect --> Preproc
    Preproc --> ThreadLock
    ThreadLock --> CNNModel
    CNNModel --> Artifacts

    PredictImgEp --> AnalysisTable
    PredictVidEp --> AnalysisTable
    HistEp --> DB
    AnalyticsEp --> DB
    ReportsEp --> ExcelGen
    ExcelGen --> DB
```

---

## 7. Project Folder Structure

```
FACIAL EMOTION RECOGNIZER AI/
├── .env.example                     # Environment configuration template
├── .gitignore                       # Production gitignore (excludes venv, db, caches, raw datasets)
├── pytest.ini                       # Pytest test execution settings
├── README.md                        # Master repository documentation
├── backend/
│   ├── Dockerfile                   # Production Docker container definition
│   ├── requirements.txt             # Pinned backend dependencies
│   └── app/
│       ├── main.py                  # FastAPI application entrypoint & lifespan
│       ├── api/
│       │   ├── router.py            # API v1 centralized route registration
│       │   └── routes/
│       │       ├── analytics.py     # Aggregated analytics KPI endpoint
│       │       ├── health.py        # Subsystem and database health checks
│       │       ├── history.py       # Analysis history CRUD & pagination
│       │       ├── model.py         # Model status & metadata endpoint
│       │       ├── predict.py       # Image and video prediction endpoints
│       │       └── reports.py       # Formatted Excel and CSV export endpoints
│       ├── core/
│       │   ├── config.py            # Pydantic BaseSettings configuration
│       │   └── security.py          # File upload, size, and MIME validation
│       ├── database/
│       │   └── session.py           # SQLAlchemy SQLite engine & sessionmaker
│       ├── models/
│       │   └── analysis.py          # SQLAlchemy ORM model for analysis metadata
│       ├── schemas/                 # Pydantic request and response schemas
│       │   ├── analytics.py
│       │   ├── common.py
│       │   ├── health.py
│       │   ├── history.py
│       │   ├── model.py
│       │   └── prediction.py
│       ├── services/
│       │   ├── history_service.py   # Business logic for audit logs & analytics
│       │   └── model_service.py     # Keras CNN loading, preprocessing, Haar cascade
│       └── utils/
│           └── logger.py            # Color-coded structured logging
├── docs/
│   ├── PHASE_5_EVALUATION.md        # Comprehensive Phase 5 ML evaluation report
│   └── architecture/
│       └── system_architecture.md   # Architectural design specifications
├── frontend/
│   ├── index.html                   # HTML5 entrypoint
│   ├── package.json                 # Pinned frontend dependencies & scripts
│   ├── package-lock.json            # Deterministic dependency lockfile
│   ├── postcss.config.js            # PostCSS configuration
│   ├── tailwind.config.js           # Tailwind CSS theme and palette configuration
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── vite.config.ts               # Vite bundler and Vitest test configuration
│   └── src/
│       ├── App.tsx                  # Root React routing & layout container
│       ├── index.css                # Global styles, fonts, and dark theme variables
│       ├── main.tsx                 # React DOM mount point
│       ├── components/
│       │   ├── charts/              # Plotly.js & custom SVG charts
│       │   ├── common/              # Buttons, Cards, Badges, EmptyStates, ErrorBoundary
│       │   ├── emotion/             # Emotion badges and 7-class legend
│       │   ├── layout/              # AppLayout, Navbar, Sidebar
│       │   ├── upload/              # Drag-and-drop file dropzone
│       │   └── webcam/              # WebcamCapture controller & canvas HUD
│       ├── hooks/                   # useSystemStatus, useTheme, useToast
│       ├── pages/                   # Landing, Live, Image, Video, Dashboard, History, Settings
│       ├── services/                # Axios API client & typed endpoints
│       └── types/                   # TypeScript interfaces matching backend schemas
├── ml/
│   ├── artifacts/                   # Essential model artifacts (< 100 MB, tracked)
│   │   ├── class_names.json         # Exact class order (7 classes)
│   │   ├── confusion_matrix.png     # Training confusion matrix
│   │   ├── emotion_cnn.keras        # Trained Keras model weights (4.92 MB)
│   │   ├── evaluation_metrics.json  # Raw evaluation metrics JSON
│   │   └── training_history.json    # Loss and accuracy training curves
│   ├── datasets/                    # Local dataset directory (.gitkeep tracked, data ignored)
│   └── evaluation/                  # Phase 5 reproducible evaluation suite
│       ├── benchmark.py             # Hardware latency & batch throughput profiler
│       ├── benchmark_results.json   # Hardware latency profile JSON
│       ├── confusion_matrix.png     # 300 DPI high-resolution confusion matrix
│       ├── confusion_matrix_normalized.png # 300 DPI normalized confusion matrix
│       ├── error_analysis.json      # Error diagnostics & class imbalance calculations
│       ├── error_analysis.py        # Failure mode diagnostics & class weight script
│       ├── evaluation_results.json  # Full 7,178 test evaluation results
│       ├── evaluator.py             # Reproducible evaluation script
│       ├── per_class_metrics.png    # 300 DPI per-class bar chart (Precision/Recall/F1)
│       ├── README.md                # ML evaluation documentation
│       └── visualize.py             # Visualization generation script
└── tests/
    ├── backend/                     # Pytest backend API & pipeline tests
    │   ├── test_api.py              # Core health, status, CORS, and 404 tests
    │   ├── test_history_analytics.py # History CRUD, analytics, and Excel/CSV export tests
    │   ├── test_prediction.py       # Image prediction, multi-face, and edge case tests
    │   └── test_video_prediction.py # Video validation, temporal trajectory, and cleanup tests
    ├── frontend/                    # Vitest frontend tests
    │   └── app.test.tsx             # UI rendering, theme toggle, and webcam lifecycle tests
    ├── ml/                          # Pytest ML verification tests
    │   ├── test_evaluation.py       # Phase 5 evaluation, matrix, and benchmark tests
    │   └── test_model.py            # Model loading, bounds, and inference tests
    └── test_data/                   # Curated test images
        ├── multi_face.jpg           # Multi-person photograph
        └── sample_face.jpg          # Single-person portrait
```

---

## 8. CNN Model Architecture

The core classifier is a custom 4-block Convolutional Neural Network designed for 48×48 single-channel grayscale inputs, featuring Batch Normalization, Dropout regularization, and Global Average Pooling:

```
Input: (48, 48, 1) Grayscale Image Normalized to [0.0, 1.0]
 │
 ├── [Block 1] Conv2D(32, 3×3, same) ➔ BatchNorm ➔ ReLU ➔ MaxPool2D(2×2) ➔ Output: (24, 24, 32)
 │
 ├── [Block 2] Conv2D(64, 3×3, same) ➔ BatchNorm ➔ ReLU ➔ MaxPool2D(2×2) ➔ Output: (12, 12, 64)
 │
 ├── [Block 3] Conv2D(128, 3×3, same) ➔ BatchNorm ➔ ReLU ➔ MaxPool2D(2×2) ➔ Output: (6, 6, 128)
 │
 ├── [Block 4] Conv2D(256, 3×3, same) ➔ BatchNorm ➔ ReLU ➔ Output: (6, 6, 256)
 │
 ├── GlobalAveragePooling2D() ➔ Output: (256)
 ├── Dropout(0.50)
 ├── Dense(128, activation='relu') ➔ BatchNorm ➔ Output: (128)
 ├── Dropout(0.50)
 └── Dense(7, activation='softmax') ➔ Output: (7) [Uncalibrated Class Probabilities]
```

### Parameter Breakdown
- **Total Parameters:** 423,559 (1.62 MB in memory)
- **Trainable Parameters:** 422,599 (1.61 MB)
- **Non-Trainable Parameters:** 960 (Batch Normalization moving statistics)
- **Disk Footprint:** 4.92 MB (`ml/artifacts/emotion_cnn.keras`)

---

## 9. FER-2013 Dataset Description

The model was trained on the benchmark **FER-2013 (Facial Expression Recognition 2013)** dataset:
- **Image Specifications:** 48×48 pixel resolution, single-channel grayscale, tightly cropped human faces.
- **Dataset Composition:**
  - Training Partition: 28,709 images
  - Public Test Partition: 3,589 images
  - Private Test Partition: 3,589 images
  - **Total Evaluated Test Set:** 7,178 images
- **Target Expression Classes:**
  1. `angry`
  2. `disgust`
  3. `fear`
  4. `happy`
  5. `neutral`
  6. `sad`
  7. `surprise`
- **Class Imbalance Distribution (Test Set):**
  - Happy: 1,774 images (24.71%)
  - Sad: 1,247 images (17.37%)
  - Neutral: 1,233 images (17.18%)
  - Fear: 1,024 images (14.27%)
  - Angry: 958 images (13.35%)
  - Surprise: 831 images (11.58%)
  - Disgust: 111 images (1.55% — extreme minority)

---

## 10. Actual Evaluation Results (FER-2013 Test Set)

Evaluated across all **7,178 official FER-2013 test samples**:

| Evaluation Metric | Measured Value |
|---|---|
| **Test Accuracy** | **45.24%** (0.452354) |
| **Test Loss** | 1.45149 |
| **Total Test Samples** | 7,178 |
| **Macro Average Precision** | 44.56% |
| **Macro Average Recall** | 39.31% |
| **Macro Average F1-Score** | 37.43% |
| **Weighted Average Precision** | 45.87% |
| **Weighted Average Recall** | 45.24% |
| **Weighted Average F1-Score** | 40.06% |

---

## 11. Per-Class Classification Report

| Class | Precision | Recall | F1-Score | Support (Actual) | Predicted Count | True Positives |
|---|---|---|---|---|---|---|
| **Angry** | 40.61% | 30.48% | 0.3482 | 958 | 719 | 292 |
| **Disgust** | 28.87% | 25.23% | 0.2692 | 111 | 97 | 28 |
| **Fear** | 44.00% | 3.22% | 0.0601 | 1,024 | 75 | 33 |
| **Happy** | 43.19% | 90.42% | 0.5845 | 1,774 | 3,714 | 1,604 |
| **Neutral** | 51.43% | 24.74% | 0.3341 | 1,233 | 593 | 305 |
| **Sad** | 37.97% | 34.80% | 0.3632 | 1,247 | 1,143 | 434 |
| **Surprise** | 65.83% | 66.31% | 0.6607 | 831 | 837 | 551 |
| **Macro Avg** | **44.56%** | **39.31%** | **0.3743** | **7,178** | **7,178** | **3,247** |
| **Weighted Avg** | **45.87%** | **45.24%** | **0.4006** | **7,178** | **7,178** | **3,247** |

---

## 12. Confusion Matrix Analysis

The diagonal represents true positive predictions ($N = 3,247$ correct out of 7,178, yielding exact 45.2354% accuracy):

```
                     PREDICTED LABELS
             Angry  Disgust  Fear  Happy  Neutral  Sad  Surprise
Actual:
Angry          292       25     7    363       54  179        38
Disgust         19       28     0     49        2   10         3
Fear           116       12    33    424       70  213       156
Happy           37        4     2   1604       30   67        30
Neutral         89       16     9    602      305  184        28
Sad            128       11    12    517      114  434        31
Surprise        38        1    12    155       18   56       551
```

High-resolution visual matrices are generated and tracked in the repository:
- Raw Confusion Matrix: `ml/evaluation/confusion_matrix.png`
- Normalized Confusion Matrix: `ml/evaluation/confusion_matrix_normalized.png`
- Per-Class Metric Comparison: `ml/evaluation/per_class_metrics.png`

---

## 13. Model Benchmarking & Hardware Profiling

Empirical benchmarks measured on AMD64 CPU hardware with TensorFlow 2.18:

| Benchmark Parameter | Measurement | Engineering Significance |
|---|---|---|
| **Model Disk Size** | **4.92 MB** (5,156,035 bytes) | Compact, under GitHub 100 MB limit, fast download |
| **Cold-Start Latency** | **249.5 ms** | One-time graph initialization overhead |
| **Mean Inference Latency** | **77.08 ms** | Consistent per-frame CPU evaluation time |
| **Median Latency** | **76.04 ms** | Minimal tail variance across iterations |
| **95th Percentile (P95)** | **84.52 ms** | Real-time bound for UI rendering pipelines |
| **Single-Sample Throughput** | **12.97 FPS** | Sufficient for 2 FPS optical webcam streaming |
| **Batch-32 Throughput** | **412.97 FPS** (2.42 ms/sample) | Ideal for offline video batch processing |
| **Hardware Used** | CPU (AMD64 Family 25) | No GPU required for production deployment |

---

## 14. Installation & Setup Instructions

### Prerequisites
- Python 3.10 or 3.11
- Node.js 18+ and npm
- Git

### 14.1 Clone Repository
```powershell
git clone https://github.com/Saniya1808/Facial-Emotion-Recognizer-AI.git
cd "Facial-Emotion-Recognizer-AI"
```

### 14.2 Backend Environment Setup
```powershell
# Create Python virtual environment
python -m venv backend\.venv

# Activate virtual environment (Windows PowerShell)
.\backend\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install --upgrade pip
pip install -r backend\requirements.txt
```

### 14.3 Frontend Setup
```powershell
# Install Node dependencies
npm install --prefix frontend
```

---

## 15. Execution Instructions

### 15.1 Start FastAPI Backend
```powershell
# From repository root:
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc Specification: `http://127.0.0.1:8000/redoc`

### 15.2 Start Vite Frontend
```powershell
# In a second terminal (from repository root):
npm run dev --prefix frontend
```
- Web Application: `http://localhost:5173`

---

## 16. Environment Configuration

Copy `.env.example` to `.env` to override default settings:

| Variable | Default Value | Description |
|---|---|---|
| `APP_NAME` | `Facial Emotion Recognizer AI` | Application branding name |
| `APP_VERSION` | `0.2.0` | Semantic version string |
| `ENVIRONMENT` | `development` | Deployment environment (`development` / `production`) |
| `DEBUG` | `False` | Verbose traceback mode |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Primary frontend origin for CORS |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000` | Comma-separated CORS allowed origins |
| `DATABASE_URL` | `sqlite:///./emotion_recognizer.db` | SQLAlchemy database connection URI |
| `MAX_UPLOAD_SIZE_MB`| `25` | Maximum upload size for static images (MB) |
| `MAX_VIDEO_SIZE_MB` | `50` | Maximum upload size for video files (MB) |
| `MAX_VIDEO_DURATION_SEC` | `120` | Maximum allowed video duration (seconds) |
| `VIDEO_SAMPLE_INTERVAL_SEC` | `1.0` | Keyframe downsampling frequency (seconds) |
| `LOG_LEVEL` | `INFO` | Logging threshold (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Frontend API client target URL |

---

## 17. API Endpoint Reference

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/` | Service metadata, tagline, and brand identity | `200 OK` |
| `GET` | `/health` | Simple service availability probe | `200 OK` |
| `GET` | `/api/v1/health` | Structured component status (API, DB, storage, model) | `200 OK` |
| `GET` | `/api/v1/model/status` | Model status (`trained`), framework, classes, 45.24% benchmark | `200 OK` |
| `POST`| `/api/v1/predict/image`| Image face detection, CNN inference, and audit logging | `200 OK` / `400` / `413` |
| `POST`| `/api/v1/predict/video`| Video downsampling, trajectory analysis, and audit logging | `200 OK` / `400` / `413` |
| `GET` | `/api/v1/history` | Paginated analysis records filtered by modality | `200 OK` |
| `DELETE`| `/api/v1/history` | Purge all analysis history records | `200 OK` |
| `DELETE`| `/api/v1/history/{id}`| Delete a specific analysis record | `200 OK` / `404` |
| `GET` | `/api/v1/analytics/summary` | Aggregate analytics metrics and recent session feed | `200 OK` |
| `GET` | `/api/v1/reports/excel` | Download formatted 2-sheet Excel report (`.xlsx`) | `200 OK` |
| `GET` | `/api/v1/reports/csv` | Download comma-separated data table (`.csv`) | `200 OK` |

---

## 18. Automated Testing

### 18.1 Backend & ML Test Suite (Pytest)
```powershell
.\backend\.venv\Scripts\python.exe -m pytest -v
```
**Results:** **38 of 38 passed** (100% pass rate in ~13.9s).
- Core health, status, CORS, and 404 handling (6 tests).
- History persistence, empty states, filtering, deletion, and Excel/CSV export (6 tests).
- Single-face, multi-face, 0-face fallback, size limits, and invalid extensions (7 tests).
- Video format, disguised file rejection, empty file rejection, size limits, trajectories, and cleanup (8 tests).
- Model artifact existence, class order, 45.24% benchmark, loading, and preprocessing bounds (5 tests).
- ML evaluation metrics, confusion matrix properties, latency benchmarks, and artifact validation (6 tests).

### 18.2 Frontend Test Suite (Vitest)
```powershell
npm test --prefix frontend
```
**Results:** **8 of 8 passed** (100% pass rate in ~9.5s).
- Brand identity rendering ("Powered by Saniya") and navigation links.
- Empty states with zero mock metrics.
- Backend status indicators (`trained`, `not_trained`, disconnected).
- Theme toggle with `localStorage` persistence.
- Webcam permission card and inactive state verification.
- Camera permission denial error handling.
- Camera hardware media track release on stop and unmount.

### 18.3 Production Build Verification
```powershell
npm run build --prefix frontend
```
**Results:** Strict TypeScript compilation (`tsc`) and Vite bundling completed with 0 errors in ~7.7s.

---

## 19. Application Screenshots & User Interface

| Interface Module | Route | Key Capabilities |
|---|---|---|
| **Landing Page** | `#/` | Brand overview, system capability cards, real-time backend health badge |
| **Live Webcam HUD** | `#/live` | ~2 FPS optical stream, electric cyan canvas bounding boxes, confidence slider, snapshot capture |
| **Image Analysis** | `#/image` | Drag-and-drop image upload, multi-face selector, 7-class probability graph |
| **Video Timeline** | `#/video` | Video preview, upload progress bar, trajectory timeline with synchronized seeking, JSON/CSV export |
| **Analytics Dashboard**| `#/dashboard`| Live KPI summary, dynamic expression distribution bar chart, recent session audit table |
| **History & Reports** | `#/history` | Modal record filtering, single-item deletion, purge all, 2-sheet Excel (`.xlsx`) and CSV export |

---

## 20. Limitations & Error Analysis

The empirical test accuracy of **45.24%** on FER-2013 highlights several inherent limitations:
1. **Happy Bias:** Due to dataset representation (24.71% of test samples) and distinct mouth morphology, Happy achieved 90.42% recall, causing the network to overpredict Happy for ambiguous neutral or sad configurations (accounting for 51.74% of all predictions).
2. **Fear vs. Surprise/Sadness Confusion:** Fear exhibited the lowest recall (3.22%), with 41.4% of actual Fear samples misclassified as Happy and 20.8% misclassified as Sad. Morphological features of wide eyes and parted lips overlap heavily with Surprise.
3. **Severe Disgust Underrepresentation:** With only 111 samples (1.55% of the test set), the network had insufficient gradient diversity to generalize effectively (25.23% recall).
4. **Resolution Constraints:** 48×48 grayscale resolution discards fine micro-expressions, skin coloration, and high-frequency wrinkle features.

---

## 21. Future Improvements

- **Backbone Architecture:** Upgrade to lightweight modern backbones such as MobileNetV3, EfficientNetV2, or ConvNeXt for richer hierarchical representations.
- **Class-Weighted Loss & Augmentation:** Apply calculated theoretical balanced class weights ($w_{\text{disgust}} = 9.238$, $w_{\text{happy}} = 0.578$) and targeted augmentations (mixup, CutMix) during training to mitigate majority bias.
- **Temporal Video Modeling:** Integrate temporal sequence models (e.g., lightweight GRU, LSTM, or Temporal Convolutional Networks) to capture expression transitions across video frames instead of independent frame-level inference.
- **Multimodal Audio-Visual Emotion Recognition:** Incorporate speech acoustics and prosody for holistic multi-modal expression analysis.

---

## 22. Responsible AI, Privacy & Scientific Disclaimer

1. **Facial Expression Classification vs. Internal Emotion:** This platform performs automated classification of **visible surface facial configurations and muscle movements**. It **does not claim** to determine, measure, or diagnose an individual's genuine internal subjective emotional feelings, mental state, character, or truthfulness.
2. **Absence of Calibrated Posterior Probabilities:** The percentage values displayed by the interface reflect uncalibrated softmax layer activations over the FER-2013 training distribution; they are not Bayesian posterior probabilities of human emotional truth.
3. **No Anatomical Action Unit Detection:** The model is an end-to-end convolutional classifier and does not claim certified anatomical Facial Action Coding System (FACS) Action Unit measurement.
4. **No Clinical or Diagnostic Validity:** The software is intended solely for research, educational, and technical demonstration purposes. It is strictly not validated for clinical, forensic, diagnostic, surveillance, employment, or high-stakes decision-making use.
5. **Privacy Sovereignty & Zero Raw Retention:** Live optical webcam frames, uploaded photographs, and video files are evaluated ephemerally in RAM or temporary OS memory and are completely discarded upon classification. Only anonymous numerical audit metadata (timestamps, face count, primary expression, confidence) are recorded in the database.

---

## 23. Brand Identity & Authorship

- **Project:** Facial Emotion Recognizer AI
- **Tagline:** *Understand Facial Expressions with Artificial Intelligence*
- **Brand Identity:** **Powered by Saniya**
- **Repository:** [https://github.com/Saniya1808/Facial-Emotion-Recognizer-AI.git](https://github.com/Saniya1808/Facial-Emotion-Recognizer-AI.git)
- **License:** MIT License
