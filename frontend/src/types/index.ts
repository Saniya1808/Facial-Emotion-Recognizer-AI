export type ThemeMode = 'dark' | 'light' | 'system';

export type ExpressionClass =
  | 'Angry'
  | 'Disgust'
  | 'Fear'
  | 'Happy'
  | 'Sad'
  | 'Surprise'
  | 'Neutral'
  | 'angry'
  | 'disgust'
  | 'fear'
  | 'happy'
  | 'sad'
  | 'surprise'
  | 'neutral';

export interface ServiceHealthItem {
  status: string;
  details?: string;
}

export interface StructuredHealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  app_name: string;
  version: string;
  environment: string;
  brand_identity: string;
  timestamp: string;
  database: string;
  services: Record<string, ServiceHealthItem>;
}

export interface ModelStatusResponse {
  model_name: string;
  model_status: 'not_trained' | 'trained' | 'training' | 'failed' | 'missing_weights';
  framework: string;
  architecture: string;
  target_classes: string[];
  phase: number;
  inference_available: boolean;
  input_shape: (number | null)[];
  message: string;
  weights_path?: string | null;
  accuracy_benchmark?: number;
}

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FacePrediction {
  face_id: number;
  box?: FaceBoundingBox | null;
  primary_expression: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface ImagePredictionResponse {
  success: boolean;
  message: string;
  filename: string;
  faces_detected: number;
  processing_time_ms: number;
  model_name: string;
  model_accuracy_benchmark: number;
  disclaimer: string;
  predictions: FacePrediction[];
  primary_prediction: FacePrediction | null;
}

export interface TemporalFrameResult {
  timestamp_sec: number;
  timestamp_formatted: string;
  frame_index: number;
  faces_detected: number;
  primary_expression: string | null;
  confidence: number | null;
  probabilities?: Record<string, number> | null;
  box?: FaceBoundingBox | null;
  predictions?: FacePrediction[];
}

export interface VideoPredictionResponse {
  success: boolean;
  message: string;
  filename: string;
  duration_sec: number;
  total_frames_sampled: number;
  frames_with_faces: number;
  total_faces_detected: number;
  average_faces_detected: number;
  dominant_expression: string | null;
  average_confidence: number | null;
  expression_distribution: Record<string, number>;
  timeline: TemporalFrameResult[];
  processing_time_ms: number;
  model_name: string;
  model_accuracy_benchmark: number;
  disclaimer: string;
}

export interface AnalysisSummary {
  totalAnalyses: number;
  totalFacesDetected: number;
  lastAnalysisTimestamp: string | null;
}

export interface AnalysisRecordItem {
  id: number;
  session_id: string;
  input_mode: string;
  faces_detected: number;
  primary_expression: string | null;
  confidence: number | null;
  probabilities?: Record<string, number> | null;
  processing_time_ms?: number | null;
  created_at: string;
}

export interface HistoryListResponse {
  total: number;
  records: AnalysisRecordItem[];
  limit: number;
  offset: number;
}

export interface AnalyticsSummaryResponse {
  total_analyses: number;
  total_faces_detected: number;
  has_data: boolean;
  dominant_expression: string | null;
  average_confidence: number | null;
  average_processing_time_ms: number | null;
  expression_distribution: Record<string, number>;
  input_mode_distribution: Record<string, number>;
  recent_activity: AnalysisRecordItem[];
}

export interface ClearHistoryResponse {
  success: boolean;
  deleted_count: number;
  message: string;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}
