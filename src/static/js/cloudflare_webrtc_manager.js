/**
 * CloudflareWebRTCManager - Cloudflare Realtime API integration
 * Replaces direct peer-to-peer WebRTC with Cloudflare Realtime API
 */
console.log('CloudflareWebRTCManager script loading...');

class CloudflareWebRTCManager {
    constructor(options = {}) {
        this.options = {
            appId: 'cb015f7379343011a6a0df5346eaf66a',
            appSecret: '766167af0976e9a98f16523f4c38b4abfa7b8d015a810c0dafd16cc68967b202',
            basePath: 'https://rtc.live.cloudflare.com/v1',
            ...options
        };
        
        this.cloudflareClient = null;
        this.localStream = null;
        this.remoteStream = null;
        this.dataChannel = null;
        this.connectionState = 'new';
        this.isConnecting = false;
        this.isConnected = false;
        
        // Event handlers
        this.eventHandlers = {
            connectionstatechange: [],
            iceconnectionstatechange: [],
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
     * Initialize Cloudflare Realtime API connection
     */
    async initialize() {
        try {
            // Initialize Cloudflare Realtime client
            this.cloudflareClient = new CloudflareRealtimeClient(
                this.options.appId,
                this.options.appSecret,
                this.options.basePath
            );

            // Set up event listeners
            this.setupEventListeners();
            
            console.log('CloudflareWebRTCManager initialized with configuration:', {
                appId: this.options.appId,
                basePath: this.options.basePath
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize CloudflareWebRTCManager:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for Cloudflare client
     */
    setupEventListeners() {
        if (!this.cloudflareClient) return;

        this.cloudflareClient.on('connectionstatechange', (state) => {
            this.connectionState = state;
            console.log('Connection state changed:', state);
            this.emit('connectionstatechange', state);
            
            if (state === 'connected') {
                this.isConnected = true;
                this.isConnecting = false;
                this.performanceMonitor.connectionDuration = Date.now() - this.performanceMonitor.connectionStartTime;
                console.log(`Connection established in ${this.performanceMonitor.connectionDuration}ms`);
            } else if (state === 'failed' || state === 'disconnected') {
                this.isConnected = false;
                this.isConnecting = false;
                this.handleConnectionFailure();
            }
        });

        this.cloudflareClient.on('iceconnectionstatechange', (state) => {
            console.log('ICE connection state changed:', state);
            this.emit('iceconnectionstatechange', state);
        });

        this.cloudflareClient.on('track', (event) => {
            console.log('Received track:', event.track.kind);
            this.emit('track', event);
            
            // Create remote stream if not exists
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }
            this.remoteStream.addTrack(event.track);
        });

        this.cloudflareClient.on('datachannelopen', (channel) => {
            console.log('Data channel opened:', channel.label);
            this.dataChannel = channel;
            this.emit('datachannel', { channel });
        });

        this.cloudflareClient.on('datachannelmessage', ({ channel, data }) => {
            console.log('Data channel message received:', data);
            this.emit('datachannelmessage', { channel, data });
        });
    }

    /**
     * Start connection with local media stream
     */
    async start(localStream) {
        if (this.isConnecting || this.isConnected) {
            console.warn('Already connecting or connected');
            return;
        }

        try {
            this.isConnecting = true;
            this.performanceMonitor.connectionStartTime = Date.now();
            this.localStream = localStream;

            console.log('Starting Cloudflare Realtime connection...');

            // Publish local stream to Cloudflare
            const { trackObjects } = await this.cloudflareClient.publishLocalStream(localStream);
            
            // Subscribe to remote tracks (echo back)
            const remoteTracks = await this.cloudflareClient.subscribeToRemoteTracks(trackObjects);
            
            // Create remote stream from received tracks
            this.remoteStream = new MediaStream(remoteTracks);
            
            console.log('Cloudflare Realtime connection established');
            return true;

        } catch (error) {
            console.error('Failed to start Cloudflare connection:', error);
            this.isConnecting = false;
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Create and send offer (for compatibility with existing code)
     */
    async createOffer() {
        if (!this.cloudflareClient) {
            throw new Error('Cloudflare client not initialized');
        }

        try {
            // For Cloudflare Realtime API, we don't create traditional offers
            // Instead, we return a mock offer structure for compatibility
            return {
                sdp: 'cloudflare-realtime-offer',
                type: 'offer'
            };
        } catch (error) {
            console.error('Failed to create offer:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Handle answer (for compatibility with existing code)
     */
    async handleAnswer(answer) {
        if (!this.cloudflareClient) {
            throw new Error('Cloudflare client not initialized');
        }

        try {
            // For Cloudflare Realtime API, answers are handled internally
            console.log('Answer handled by Cloudflare Realtime API');
            return true;
        } catch (error) {
            console.error('Failed to handle answer:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Add local tracks to the connection
     */
    async addLocalTracks(stream) {
        if (!this.cloudflareClient) {
            throw new Error('Cloudflare client not initialized');
        }

        try {
            this.localStream = stream;
            
            // Publish tracks to Cloudflare
            const { trackObjects } = await this.cloudflareClient.publishLocalStream(stream);
            
            console.log('Added local tracks to Cloudflare:', trackObjects.length);
            return trackObjects;
        } catch (error) {
            console.error('Failed to add local tracks:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Create data channel for control messages
     */
    createDataChannel(label, options = {}) {
        if (!this.cloudflareClient) {
            throw new Error('Cloudflare client not initialized');
        }

        try {
            this.dataChannel = this.cloudflareClient.createDataChannel(label, options);
            console.log('Created data channel:', label);
            return this.dataChannel;
        } catch (error) {
            console.error('Failed to create data channel:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Send message through data channel
     */
    sendMessage(message) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            console.warn('Data channel not available for sending message');
            return false;
        }

        try {
            this.dataChannel.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            this.emit('error', error);
            return false;
        }
    }

    /**
     * Get connection statistics
     */
    async getStats() {
        if (!this.cloudflareClient) {
            return null;
        }

        try {
            return await this.cloudflareClient.getStats();
        } catch (error) {
            console.error('Failed to get stats:', error);
            return null;
        }
    }

    /**
     * Handle connection failure with retry logic
     */
    async handleConnectionFailure() {
        if (this.retryCount >= this.retryConfig.maxRetries) {
            console.error('Max retries reached, giving up');
            this.emit('error', new Error('Connection failed after max retries'));
            return;
        }

        this.retryCount++;
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, this.retryCount - 1);
        
        console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.retryConfig.maxRetries})`);
        
        setTimeout(async () => {
            try {
                if (this.localStream) {
                    await this.start(this.localStream);
                }
            } catch (error) {
                console.error('Retry failed:', error);
                this.handleConnectionFailure();
            }
        }, delay);
    }

    /**
     * Stop the connection and cleanup
     */
    async stop() {
        try {
            this.isConnecting = false;
            this.isConnected = false;
            this.retryCount = 0;

            if (this.cloudflareClient) {
                await this.cloudflareClient.close();
                this.cloudflareClient = null;
            }

            this.localStream = null;
            this.remoteStream = null;
            this.dataChannel = null;
            this.connectionState = 'closed';

            console.log('CloudflareWebRTCManager stopped');
        } catch (error) {
            console.error('Error stopping CloudflareWebRTCManager:', error);
        }
    }

    /**
     * Event emitter functionality
     */
    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
    }

    off(event, callback) {
        if (this.eventHandlers[event]) {
            const index = this.eventHandlers[event].indexOf(callback);
            if (index > -1) {
                this.eventHandlers[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event handler error:', error);
                }
            });
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            connectionState: this.connectionState,
            retryCount: this.retryCount,
            hasLocalStream: !!this.localStream,
            hasRemoteStream: !!this.remoteStream,
            hasDataChannel: !!this.dataChannel
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudflareWebRTCManager;
}
