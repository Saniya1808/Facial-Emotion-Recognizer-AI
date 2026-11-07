import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../frontend/src/App';
import { ThemeProvider, useTheme } from '../../frontend/src/hooks/useTheme';
import { ToastProvider } from '../../frontend/src/hooks/useToast';
import { StatusIndicator } from '../../frontend/src/components/common/StatusIndicator';
import { EmptyState } from '../../frontend/src/components/common/EmptyState';
import { WebcamCapture } from '../../frontend/src/components/webcam/WebcamCapture';
import { BarChart3 } from 'lucide-react';

describe('Facial Emotion Recognizer AI - Frontend Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('renders application landing page with brand identity', () => {
    render(<App />);
    expect(screen.getAllByText(/Facial Emotion Recognizer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Powered by Saniya/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Understand Facial Expressions with Artificial Intelligence/i).length
    ).toBeGreaterThan(0);
  });

  it('renders navigation links in sidebar', () => {
    render(<App />);
    expect(screen.getAllByRole('link', { name: /Dashboard/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Live Webcam/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Image Analysis/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Video Analysis/i }).length).toBeGreaterThan(0);
  });

  it('renders empty-state component cleanly with no fake metrics', () => {
    render(
      <EmptyState
        icon={BarChart3}
        title="No Expression Analytics Available"
        badgeText="Empty State"
        description="Expression distribution statistics will populate in real-time."
      />
    );
    expect(screen.getByText('No Expression Analytics Available')).toBeInTheDocument();
    expect(screen.getByText('Empty State')).toBeInTheDocument();
    expect(
      screen.getByText('Expression distribution statistics will populate in real-time.')
    ).toBeInTheDocument();
  });

  it('accurately displays backend status and model trained / not_trained states', () => {
    const { rerender } = render(
      <StatusIndicator
        backendConnected={true}
        backendLoading={false}
        modelStatus="trained"
      />
    );
    expect(screen.getByText(/Backend Connected/i)).toBeInTheDocument();
    expect(screen.getByText(/Model: Trained/i)).toBeInTheDocument();

    rerender(
      <StatusIndicator
        backendConnected={true}
        backendLoading={false}
        modelStatus="not_trained"
      />
    );
    expect(screen.getByText(/Model: Not Trained/i)).toBeInTheDocument();

    rerender(
      <StatusIndicator
        backendConnected={false}
        backendLoading={false}
        modelStatus={null}
      />
    );
    expect(screen.getByText(/Backend Unavailable/i)).toBeInTheDocument();
  });

  it('persists theme switching in localStorage', () => {
    const TestThemeComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="current-theme">{theme}</span>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    const themeSpan = screen.getByTestId('current-theme');
    expect(themeSpan.textContent).toBe('dark');

    const button = screen.getByRole('button', { name: /Toggle/i });
    fireEvent.click(button);

    expect(themeSpan.textContent).toBe('light');
    expect(localStorage.getItem('facial_emotion_ai_theme')).toBe('light');
  });

  it('renders WebcamCapture with explicit permission explanation and inactive controls', () => {
    render(
      <ToastProvider>
        <WebcamCapture />
      </ToastProvider>
    );
    expect(screen.getByText('Live Webcam Classification')).toBeInTheDocument();
    expect(
      screen.getByText(/Camera stream requires explicit user consent/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authorize Camera/i })).toBeInTheDocument();
  });

  it('handles camera permission denial gracefully and displays actionable error', async () => {
    if (!navigator.mediaDevices) {
      (navigator as any).mediaDevices = {};
    }
    const mockGetUserMedia = vi.fn().mockRejectedValue({
      name: 'NotAllowedError',
      message: 'Permission denied',
    });
    navigator.mediaDevices.getUserMedia = mockGetUserMedia;

    render(
      <ToastProvider>
        <WebcamCapture />
      </ToastProvider>
    );
    const startButton = screen.getByRole('button', { name: /Authorize Camera/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Camera permission was explicitly denied/i)
      ).toBeInTheDocument();
    });
  });

  it('cleans up camera media tracks when stopped or unmounted', async () => {
    const stopMock = vi.fn();
    const mockTrack = { stop: stopMock };
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
    };

    if (!navigator.mediaDevices) {
      (navigator as any).mediaDevices = {};
    }
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    navigator.mediaDevices.getUserMedia = mockGetUserMedia;

    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    const { unmount } = render(
      <ToastProvider>
        <WebcamCapture />
      </ToastProvider>
    );
    const startButton = screen.getByRole('button', { name: /Authorize Camera/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    unmount();
    expect(stopMock).toHaveBeenCalled();
  });
});
