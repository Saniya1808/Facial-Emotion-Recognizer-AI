import axios from 'axios';
import {
  StructuredHealthResponse,
  ModelStatusResponse,
  ImagePredictionResponse,
  VideoPredictionResponse,
  AnalyticsSummaryResponse,
  HistoryListResponse,
  ClearHistoryResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async getRoot() {
    const response = await apiClient.get('/');
    return response.data;
  },

  async getHealth(): Promise<{ status: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  async getApiHealth(): Promise<StructuredHealthResponse> {
    const response = await apiClient.get<StructuredHealthResponse>('/api/v1/health');
    return response.data;
  },

  async getModelStatus(): Promise<ModelStatusResponse> {
    const response = await apiClient.get<ModelStatusResponse>('/api/v1/model/status');
    return response.data;
  },

  async predictImage(file: File): Promise<ImagePredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ImagePredictionResponse>(
      '/api/v1/predict/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async predictVideo(
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<VideoPredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<VideoPredictionResponse>(
      '/api/v1/predict/video',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3-minute timeout for temporal video processing
        onUploadProgress,
      }
    );
    return response.data;
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummaryResponse> {
    const response = await apiClient.get<AnalyticsSummaryResponse>('/api/v1/analytics/summary');
    return response.data;
  },

  async getHistory(params?: {
    limit?: number;
    offset?: number;
    input_mode?: string;
  }): Promise<HistoryListResponse> {
    const response = await apiClient.get<HistoryListResponse>('/api/v1/history', {
      params,
    });
    return response.data;
  },

  async clearHistory(): Promise<ClearHistoryResponse> {
    const response = await apiClient.delete<ClearHistoryResponse>('/api/v1/history');
    return response.data;
  },

  async deleteHistoryRecord(recordId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/v1/history/${recordId}`
    );
    return response.data;
  },

  getExcelReportUrl(): string {
    return `${API_BASE_URL}/api/v1/reports/excel`;
  },

  getCsvReportUrl(): string {
    return `${API_BASE_URL}/api/v1/reports/csv`;
  },
};
