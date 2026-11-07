import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveDetectionPage } from './pages/LiveDetectionPage';
import { ImageAnalysisPage } from './pages/ImageAnalysisPage';
import { VideoAnalysisPage } from './pages/VideoAnalysisPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="live" element={<LiveDetectionPage />} />
                <Route path="image" element={<ImageAnalysisPage />} />
                <Route path="video" element={<VideoAnalysisPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

