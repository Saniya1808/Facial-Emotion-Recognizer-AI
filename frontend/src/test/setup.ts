import '@testing-library/jest-dom';

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock navigator.mediaDevices for WebcamCapture
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: async () => ({
      getTracks: () => [{ stop: () => {} }],
    }),
  },
});

