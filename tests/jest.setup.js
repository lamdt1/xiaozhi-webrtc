// Jest setup file for WebRTC tests

// Mock WebRTC APIs globally
global.RTCPeerConnection = jest.fn(() => ({
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'new',
    localDescription: null,
    remoteDescription: null,
    addEventListener: jest.fn(),
    createDataChannel: jest.fn(() => ({
        close: jest.fn(),
        send: jest.fn(),
        readyState: 'open',
        addEventListener: jest.fn()
    })),
    createOffer: jest.fn(() => Promise.resolve({
        sdp: 'mock-offer-sdp',
        type: 'offer'
    })),
    setLocalDescription: jest.fn(() => Promise.resolve()),
    setRemoteDescription: jest.fn(() => Promise.resolve()),
    addTrack: jest.fn(),
    close: jest.fn(),
    getStats: jest.fn(() => Promise.resolve(new Map()))
}));

global.RTCSessionDescription = jest.fn((desc) => desc);

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    memory: {
        usedJSHeapSize: 10 * 1024 * 1024, // 10MB
        totalJSHeapSize: 20 * 1024 * 1024, // 20MB
        jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
    },
    timing: {
        navigationStart: Date.now() - 1000,
        domContentLoadedEventEnd: Date.now() - 500
    }
};

// Mock fetch API
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        })
    })
);

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};
