/**
 * WebRTCManager - Enhanced RTCPeerConnection management
 * Based on Cloudflare Realtime API patterns with XiaoZhi-specific optimizations
 */
console.log('WebRTCManager script loading...');

class WebRTCManager {
    constructor(options = {}) {
        this.options = {
            iceServers: [],
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            iceTransportPolicy: 'all',
            ...options
        };
        
        this.pc = null;
        this.localStream = null;
        this.remoteStream = null;
        this.dataChannel = null;
        this.connectionState = 'new';
        this.iceConnectionState = 'new';
        this.iceGatheringState = 'new';
        
        // Event handlers
        this.eventHandlers = {
            connectionstatechange: [],
            iceconnectionstatechange: [],
            icegatheringstatechange: [],
            track: [],
            datachannel: [],
            error: []
        };
        
        // Connection retry configuration
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2
        };
        
        this.retryCount = 0;
        this.isConnecting = false;
        this.isConnected = false;
        
        // Performance monitoring
        this.performanceMonitor = {
            connectionStartTime: null,
            connectionDuration: 0,
            lastStatsTime: 0,
            statsInterval: null,
            qualityMetrics: {
                audioLevel: 0,
                videoBitrate: 0,
                audioBitrate: 0,
                packetLoss: 0,
                roundTripTime: 0
            }
        };
    }

    /**
     * Initialize WebRTC connection with proper configuration
     */
    async initialize() {
        try {
            // Create RTCPeerConnection with optimized configuration
            this.pc = new RTCPeerConnection({
                iceServers: this.options.iceServers,
                iceCandidatePoolSize: this.options.iceCandidatePoolSize,
                bundlePolicy: this.options.bundlePolicy,
                iceTransportPolicy: this.options.iceTransportPolicy
            });

            this.setupEventListeners();
            this.setupDataChannel();
            
            // Pre-gather ICE candidates for faster connection establishment
            await this.preGatherIceCandidates();
            
            console.log('WebRTCManager initialized with configuration:', {
                iceServers: this.options.iceServers.length,
                bundlePolicy: this.options.bundlePolicy,
                iceCandidatePoolSize: this.options.iceCandidatePoolSize
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize WebRTCManager:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Pre-gather ICE candidates for faster connection establishment
     */
    async preGatherIceCandidates() {
        if (!this.pc) return;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.warn('ICE candidate pre-gathering timeout');
                resolve();
            }, 5000);

            this.pc.addEventListener('icegatheringstatechange', () => {
                if (this.pc.iceGatheringState === 'complete') {
                    clearTimeout(timeout);
                    console.log('ICE candidate pre-gathering completed');
                    resolve();
                } else if (this.pc.iceGatheringState === 'failed') {
                    clearTimeout(timeout);
                    console.warn('ICE candidate pre-gathering failed');
                    reject(new Error('ICE candidate gathering failed'));
                }
            });

            // Start gathering by creating a dummy offer
            this.pc.createOffer()
                .then(offer => this.pc.setLocalDescription(offer))
                .catch(error => {
                    clearTimeout(timeout);
                    console.warn('Failed to start ICE candidate gathering:', error);
                    resolve(); // Don't fail initialization for this
                });
        });
    }

    /**
     * Setup comprehensive event listeners
     */
    setupEventListeners() {
        if (!this.pc) return;

        // Connection state monitoring
        this.pc.addEventListener('connectionstatechange', () => {
            this.connectionState = this.pc.connectionState;
            console.log('Connection state changed:', this.connectionState);
            this.emit('connectionstatechange', this.connectionState);
            
            // Handle connection state changes
            this.handleConnectionStateChange();
        });

        // ICE connection state monitoring
        this.pc.addEventListener('iceconnectionstatechange', () => {
            this.iceConnectionState = this.pc.iceConnectionState;
            console.log('ICE connection state changed:', this.iceConnectionState);
            this.emit('iceconnectionstatechange', this.iceConnectionState);
        });

        // ICE gathering state monitoring
        this.pc.addEventListener('icegatheringstatechange', () => {
            this.iceGatheringState = this.pc.iceGatheringState;
            console.log('ICE gathering state changed:', this.iceGatheringState);
            this.emit('icegatheringstatechange', this.iceGatheringState);
        });

        // Track events
        this.pc.addEventListener('track', (event) => {
            console.log('Received remote track:', event.track.kind);
            this.remoteStream = event.streams[0];
            this.emit('track', event);
        });

        // Data channel events
        this.pc.addEventListener('datachannel', (event) => {
            console.log('Received data channel:', event.channel.label);
            this.dataChannel = event.channel;
            this.setupDataChannelEventListeners();
            this.emit('datachannel', event);
        });
    }

    /**
     * Setup data channel for control messages
     */
    setupDataChannel() {
        if (!this.pc) return;

        try {
            this.dataChannel = this.pc.createDataChannel('chat', {
                ordered: true,
                maxRetransmits: 3
            });
            
            this.setupDataChannelEventListeners();
            console.log('Data channel created successfully');
        } catch (error) {
            console.error('Failed to create data channel:', error);
            this.emit('error', error);
        }
    }

    /**
     * Setup data channel event listeners
     */
    setupDataChannelEventListeners() {
        if (!this.dataChannel) return;

        this.dataChannel.addEventListener('open', () => {
            console.log('Data channel opened');
        });

        this.dataChannel.addEventListener('close', () => {
            console.log('Data channel closed');
        });

        this.dataChannel.addEventListener('error', (error) => {
            console.error('Data channel error:', error);
            this.emit('error', error);
        });

        this.dataChannel.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('datachannelmessage', data);
            } catch (error) {
                console.error('Failed to parse data channel message:', error);
            }
        });
    }

    /**
     * Handle connection state changes with retry logic
     */
    handleConnectionStateChange() {
        switch (this.connectionState) {
            case 'connected':
                this.isConnected = true;
                this.isConnecting = false;
                this.retryCount = 0;
                this.startPerformanceMonitoring();
                console.log('WebRTC connection established successfully');
                break;
                
            case 'failed':
                this.isConnected = false;
                this.isConnecting = false;
                console.error('WebRTC connection failed');
                this.handleConnectionFailure();
                break;
                
            case 'disconnected':
                this.isConnected = false;
                console.warn('WebRTC connection disconnected');
                break;
                
            case 'connecting':
                this.isConnecting = true;
                console.log('WebRTC connection in progress...');
                break;
        }
    }

    /**
     * Handle connection failure with retry logic
     */
    async handleConnectionFailure() {
        if (this.retryCount >= this.retryConfig.maxRetries) {
            console.error('Max retry attempts reached, giving up');
            this.emit('error', new Error('Connection failed after maximum retries'));
            return;
        }

        this.retryCount++;
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, this.retryCount - 1);
        
        console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.retryConfig.maxRetries})`);
        
        setTimeout(() => {
            this.reconnect();
        }, delay);
    }

    /**
     * Reconnect with exponential backoff
     */
    async reconnect() {
        try {
            console.log('Attempting to reconnect...');
            await this.close();
            await this.initialize();
            // Trigger reconnection logic in the main application
            this.emit('reconnect');
        } catch (error) {
            console.error('Reconnection failed:', error);
            this.emit('error', error);
        }
    }

    /**
     * Add local media tracks
     */
    async addLocalTracks(stream) {
        if (!this.pc || !stream) {
            throw new Error('PeerConnection or stream not available');
        }

        this.localStream = stream;
        
        // Add audio tracks
        stream.getAudioTracks().forEach(track => {
            console.log('Adding audio track:', track.id);
            this.pc.addTrack(track, stream);
        });

        // Add video tracks
        stream.getVideoTracks().forEach(track => {
            console.log('Adding video track:', track.id);
            this.pc.addTrack(track, stream);
        });

        console.log(`Added ${stream.getTracks().length} tracks to peer connection`);
    }

    /**
     * Create and send offer with proper error handling
     */
    async createOffer() {
        if (!this.pc) {
            throw new Error('PeerConnection not initialized');
        }

        try {
            console.log('Creating offer...');
            const offer = await this.pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                voiceActivityDetection: true
            });
            
            await this.pc.setLocalDescription(offer);
            console.log('Offer created and set as local description');
            
            return {
                sdp: offer.sdp,
                type: offer.type
            };
        } catch (error) {
            console.error('Failed to create offer:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Handle incoming answer
     */
    async handleAnswer(answer) {
        if (!this.pc) {
            throw new Error('PeerConnection not initialized');
        }

        try {
            console.log('Setting remote description (answer)...');
            await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Answer processed successfully');
        } catch (error) {
            console.error('Failed to handle answer:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Send data through data channel
     */
    sendData(data) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            console.warn('Data channel not available for sending data');
            return false;
        }

        try {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.dataChannel.send(message);
            return true;
        } catch (error) {
            console.error('Failed to send data:', error);
            this.emit('error', error);
            return false;
        }
    }

    /**
     * Get connection statistics
     */
    async getStats() {
        if (!this.pc) return null;

        try {
            const stats = await this.pc.getStats();
            const statsData = {};
            
            stats.forEach(report => {
                statsData[report.id] = {
                    type: report.type,
                    timestamp: report.timestamp,
                    ...Object.fromEntries(report)
                };
            });
            
            return statsData;
        } catch (error) {
            console.error('Failed to get stats:', error);
            return null;
        }
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        if (this.performanceMonitor.statsInterval) return;

        this.performanceMonitor.connectionStartTime = Date.now();
        this.performanceMonitor.statsInterval = setInterval(async () => {
            await this.updateQualityMetrics();
        }, 1000); // Update every second

        console.log('Performance monitoring started');
    }

    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
        if (this.performanceMonitor.statsInterval) {
            clearInterval(this.performanceMonitor.statsInterval);
            this.performanceMonitor.statsInterval = null;
        }
        
        if (this.performanceMonitor.connectionStartTime) {
            this.performanceMonitor.connectionDuration = Date.now() - this.performanceMonitor.connectionStartTime;
        }

        console.log('Performance monitoring stopped');
    }

    /**
     * Update quality metrics from WebRTC stats
     */
    async updateQualityMetrics() {
        if (!this.pc) return;

        try {
            const stats = await this.pc.getStats();
            let audioLevel = 0;
            let videoBitrate = 0;
            let audioBitrate = 0;
            let packetLoss = 0;
            let roundTripTime = 0;

            stats.forEach(report => {
                if (report.type === 'media-source' && report.mediaType === 'audio') {
                    audioLevel = report.audioLevel || 0;
                } else if (report.type === 'outbound-rtp') {
                    if (report.mediaType === 'video') {
                        videoBitrate = report.bytesSent || 0;
                    } else if (report.mediaType === 'audio') {
                        audioBitrate = report.bytesSent || 0;
                    }
                } else if (report.type === 'inbound-rtp') {
                    packetLoss = report.packetsLost || 0;
                } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    roundTripTime = report.currentRoundTripTime || 0;
                }
            });

            this.performanceMonitor.qualityMetrics = {
                audioLevel,
                videoBitrate,
                audioBitrate,
                packetLoss,
                roundTripTime
            };

            // Emit quality metrics for external monitoring
            this.emit('qualitymetrics', this.performanceMonitor.qualityMetrics);

        } catch (error) {
            console.error('Failed to update quality metrics:', error);
        }
    }

    /**
     * Get current quality metrics
     */
    getQualityMetrics() {
        return this.performanceMonitor.qualityMetrics;
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        return {
            connectionDuration: this.performanceMonitor.connectionDuration,
            qualityMetrics: this.performanceMonitor.qualityMetrics,
            retryCount: this.retryCount,
            isConnected: this.isConnected,
            isConnecting: this.isConnecting
        };
    }

    /**
     * Get current connection state
     */
    getConnectionInfo() {
        return {
            connectionState: this.connectionState,
            iceConnectionState: this.iceConnectionState,
            iceGatheringState: this.iceGatheringState,
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            retryCount: this.retryCount,
            hasLocalStream: !!this.localStream,
            hasRemoteStream: !!this.remoteStream,
            dataChannelState: this.dataChannel ? this.dataChannel.readyState : 'closed'
        };
    }

    /**
     * Event emitter functionality
     */
    on(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(handler);
        }
    }

    off(event, handler) {
        if (this.eventHandlers[event]) {
            const index = this.eventHandlers[event].indexOf(handler);
            if (index > -1) {
                this.eventHandlers[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Close connection and cleanup
     */
    async close() {
        console.log('Closing WebRTC connection...');
        
        this.isConnected = false;
        this.isConnecting = false;
        
        // Stop performance monitoring
        this.stopPerformanceMonitoring();
        
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        this.localStream = null;
        this.remoteStream = null;
        this.retryCount = 0;
        
        console.log('WebRTC connection closed');
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCManager;
}

console.log('WebRTCManager script loaded successfully');
