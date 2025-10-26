/**
 * WebRTCManager Test Suite
 * Comprehensive testing for WebRTC functionality
 */

// Mock WebRTC APIs for testing
const mockRTCPeerConnection = () => {
    const mockPC = {
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
    };
    return mockPC;
};

// Mock global WebRTC APIs
global.RTCPeerConnection = jest.fn(mockRTCPeerConnection);
global.RTCSessionDescription = jest.fn((desc) => desc);

// Import the WebRTCManager class
const WebRTCManager = require('../src/webrtc_manager.js');

describe('WebRTCManager', () => {
    let webrtcManager;
    let mockPC;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create new WebRTCManager instance
        webrtcManager = new WebRTCManager({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        });
        
        mockPC = mockRTCPeerConnection();
        webrtcManager.pc = mockPC;
    });

    afterEach(() => {
        if (webrtcManager) {
            webrtcManager.close();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const manager = new WebRTCManager();
            expect(manager.options.iceCandidatePoolSize).toBe(10);
            expect(manager.options.bundlePolicy).toBe('max-bundle');
            expect(manager.options.iceTransportPolicy).toBe('all');
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                iceServers: [{ urls: 'stun:custom.stun.server' }],
                iceCandidatePoolSize: 5,
                bundlePolicy: 'balanced'
            };
            const manager = new WebRTCManager(customOptions);
            expect(manager.options.iceServers).toEqual(customOptions.iceServers);
            expect(manager.options.iceCandidatePoolSize).toBe(5);
            expect(manager.options.bundlePolicy).toBe('balanced');
        });

        test('should initialize connection state correctly', () => {
            expect(webrtcManager.connectionState).toBe('new');
            expect(webrtcManager.isConnected).toBe(false);
            expect(webrtcManager.isConnecting).toBe(false);
        });
    });

    describe('Event Handling', () => {
        test('should register event handlers', () => {
            const handler = jest.fn();
            webrtcManager.on('connectionstatechange', handler);
            expect(webrtcManager.eventHandlers.connectionstatechange).toContain(handler);
        });

        test('should remove event handlers', () => {
            const handler = jest.fn();
            webrtcManager.on('connectionstatechange', handler);
            webrtcManager.off('connectionstatechange', handler);
            expect(webrtcManager.eventHandlers.connectionstatechange).not.toContain(handler);
        });

        test('should emit events to registered handlers', () => {
            const handler = jest.fn();
            webrtcManager.on('connectionstatechange', handler);
            webrtcManager.emit('connectionstatechange', 'connected');
            expect(handler).toHaveBeenCalledWith('connected');
        });

        test('should handle errors in event handlers gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const handler = jest.fn(() => { throw new Error('Handler error'); });
            webrtcManager.on('connectionstatechange', handler);
            
            expect(() => {
                webrtcManager.emit('connectionstatechange', 'connected');
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Connection Management', () => {
        test('should handle connection state changes', () => {
            const handler = jest.fn();
            webrtcManager.on('connectionstatechange', handler);
            
            webrtcManager.handleConnectionStateChange();
            expect(webrtcManager.connectionState).toBe('new');
        });

        test('should start performance monitoring on connection', () => {
            const startMonitoringSpy = jest.spyOn(webrtcManager, 'startPerformanceMonitoring');
            webrtcManager.connectionState = 'connected';
            webrtcManager.handleConnectionStateChange();
            expect(startMonitoringSpy).toHaveBeenCalled();
        });

        test('should handle connection failure with retry logic', () => {
            const reconnectSpy = jest.spyOn(webrtcManager, 'reconnect');
            webrtcManager.connectionState = 'failed';
            webrtcManager.handleConnectionFailure();
            expect(reconnectSpy).toHaveBeenCalled();
        });

        test('should not retry after max retries reached', () => {
            webrtcManager.retryCount = 3;
            const reconnectSpy = jest.spyOn(webrtcManager, 'reconnect');
            webrtcManager.handleConnectionFailure();
            expect(reconnectSpy).not.toHaveBeenCalled();
        });
    });

    describe('Track Management', () => {
        test('should add local tracks', async () => {
            const mockStream = {
                getAudioTracks: () => [{ id: 'audio1' }],
                getVideoTracks: () => [{ id: 'video1' }]
            };
            
            await webrtcManager.addLocalTracks(mockStream);
            expect(mockPC.addTrack).toHaveBeenCalledTimes(2);
            expect(webrtcManager.localStream).toBe(mockStream);
        });

        test('should handle track addition errors', async () => {
            const mockStream = null;
            await expect(webrtcManager.addLocalTracks(mockStream)).rejects.toThrow();
        });
    });

    describe('SDP Negotiation', () => {
        test('should create offer successfully', async () => {
            const offer = await webrtcManager.createOffer();
            expect(offer).toEqual({
                sdp: 'mock-offer-sdp',
                type: 'offer'
            });
            expect(mockPC.createOffer).toHaveBeenCalled();
            expect(mockPC.setLocalDescription).toHaveBeenCalled();
        });

        test('should handle offer creation errors', async () => {
            mockPC.createOffer.mockRejectedValue(new Error('Offer creation failed'));
            await expect(webrtcManager.createOffer()).rejects.toThrow('Offer creation failed');
        });

        test('should handle answer successfully', async () => {
            const answer = { sdp: 'mock-answer-sdp', type: 'answer' };
            await webrtcManager.handleAnswer(answer);
            expect(mockPC.setRemoteDescription).toHaveBeenCalledWith(answer);
        });

        test('should handle answer errors', async () => {
            mockPC.setRemoteDescription.mockRejectedValue(new Error('Answer handling failed'));
            const answer = { sdp: 'mock-answer-sdp', type: 'answer' };
            await expect(webrtcManager.handleAnswer(answer)).rejects.toThrow('Answer handling failed');
        });
    });

    describe('Data Channel', () => {
        test('should send data successfully', () => {
            webrtcManager.dataChannel = {
                readyState: 'open',
                send: jest.fn()
            };
            
            const result = webrtcManager.sendData('test message');
            expect(result).toBe(true);
            expect(webrtcManager.dataChannel.send).toHaveBeenCalledWith('test message');
        });

        test('should handle data channel not available', () => {
            webrtcManager.dataChannel = null;
            const result = webrtcManager.sendData('test message');
            expect(result).toBe(false);
        });

        test('should handle data channel not open', () => {
            webrtcManager.dataChannel = {
                readyState: 'closed',
                send: jest.fn()
            };
            const result = webrtcManager.sendData('test message');
            expect(result).toBe(false);
        });
    });

    describe('Performance Monitoring', () => {
        test('should start performance monitoring', () => {
            webrtcManager.startPerformanceMonitoring();
            expect(webrtcManager.performanceMonitor.statsInterval).toBeDefined();
            expect(webrtcManager.performanceMonitor.connectionStartTime).toBeDefined();
        });

        test('should stop performance monitoring', () => {
            webrtcManager.startPerformanceMonitoring();
            webrtcManager.stopPerformanceMonitoring();
            expect(webrtcManager.performanceMonitor.statsInterval).toBeNull();
        });

        test('should not start monitoring if already running', () => {
            webrtcManager.startPerformanceMonitoring();
            const interval = webrtcManager.performanceMonitor.statsInterval;
            webrtcManager.startPerformanceMonitoring();
            expect(webrtcManager.performanceMonitor.statsInterval).toBe(interval);
        });

        test('should get quality metrics', () => {
            const metrics = webrtcManager.getQualityMetrics();
            expect(metrics).toEqual({
                audioLevel: 0,
                videoBitrate: 0,
                audioBitrate: 0,
                packetLoss: 0,
                roundTripTime: 0
            });
        });

        test('should get performance summary', () => {
            const summary = webrtcManager.getPerformanceSummary();
            expect(summary).toHaveProperty('connectionDuration');
            expect(summary).toHaveProperty('qualityMetrics');
            expect(summary).toHaveProperty('retryCount');
            expect(summary).toHaveProperty('isConnected');
            expect(summary).toHaveProperty('isConnecting');
        });
    });

    describe('Connection Info', () => {
        test('should get connection info', () => {
            const info = webrtcManager.getConnectionInfo();
            expect(info).toHaveProperty('connectionState');
            expect(info).toHaveProperty('iceConnectionState');
            expect(info).toHaveProperty('iceGatheringState');
            expect(info).toHaveProperty('isConnected');
            expect(info).toHaveProperty('isConnecting');
        });
    });

    describe('Cleanup', () => {
        test('should close connection and cleanup', async () => {
            webrtcManager.dataChannel = { close: jest.fn() };
            webrtcManager.startPerformanceMonitoring();
            
            await webrtcManager.close();
            
            expect(webrtcManager.isConnected).toBe(false);
            expect(webrtcManager.isConnecting).toBe(false);
            expect(webrtcManager.dataChannel.close).toHaveBeenCalled();
            expect(mockPC.close).toHaveBeenCalled();
            expect(webrtcManager.performanceMonitor.statsInterval).toBeNull();
        });
    });

    describe('Error Handling', () => {
        test('should handle initialization errors', async () => {
            const originalRTCPeerConnection = global.RTCPeerConnection;
            global.RTCPeerConnection = jest.fn(() => {
                throw new Error('RTCPeerConnection creation failed');
            });
            
            await expect(webrtcManager.initialize()).rejects.toThrow('RTCPeerConnection creation failed');
            
            global.RTCPeerConnection = originalRTCPeerConnection;
        });

        test('should handle stats retrieval errors', async () => {
            mockPC.getStats.mockRejectedValue(new Error('Stats retrieval failed'));
            const stats = await webrtcManager.getStats();
            expect(stats).toBeNull();
        });
    });
});

// Integration tests
describe('WebRTCManager Integration', () => {
    let webrtcManager;

    beforeEach(() => {
        webrtcManager = new WebRTCManager({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
    });

    afterEach(() => {
        if (webrtcManager) {
            webrtcManager.close();
        }
    });

    test('should handle complete connection flow', async () => {
        const mockStream = {
            getAudioTracks: () => [{ id: 'audio1' }],
            getVideoTracks: () => []
        };

        // Mock successful initialization
        webrtcManager.pc = mockRTCPeerConnection();
        
        await webrtcManager.initialize();
        await webrtcManager.addLocalTracks(mockStream);
        
        const offer = await webrtcManager.createOffer();
        expect(offer).toBeDefined();
        
        const answer = { sdp: 'mock-answer', type: 'answer' };
        await webrtcManager.handleAnswer(answer);
        
        expect(webrtcManager.localStream).toBe(mockStream);
    });
});
