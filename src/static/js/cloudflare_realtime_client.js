/**
 * Cloudflare Realtime API Client
 * Handles all interactions with Cloudflare's Realtime API service
 * Based on Cloudflare's official example implementation
 */

class CloudflareRealtimeClient {
    constructor(appId, appSecret, basePath = 'https://rtc.live.cloudflare.com/v1') {
        this.appId = appId;
        this.appSecret = appSecret;
        this.basePath = `${basePath}/apps/${appId}`;
        this.sessionId = null;
        this.pc = null;
        this.eventListeners = new Map();
        
        // Initialize RTCPeerConnection with Cloudflare STUN server
        this.initializePeerConnection();
    }

    /**
     * Initialize RTCPeerConnection with Cloudflare configuration
     */
    initializePeerConnection() {
        this.pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.cloudflare.com:3478'
                }
            ],
            bundlePolicy: 'max-bundle'
        });

        // Set up event listeners
        this.setupPeerConnectionEvents();
    }

    /**
     * Set up RTCPeerConnection event listeners
     */
    setupPeerConnectionEvents() {
        this.pc.addEventListener('iceconnectionstatechange', () => {
            console.log('ICE connection state:', this.pc.iceConnectionState);
            this.emit('iceconnectionstatechange', this.pc.iceConnectionState);
        });

        this.pc.addEventListener('connectionstatechange', () => {
            console.log('Connection state:', this.pc.connectionState);
            this.emit('connectionstatechange', this.pc.connectionState);
        });

        this.pc.addEventListener('track', (event) => {
            console.log('Received track:', event.track.kind);
            this.emit('track', event);
        });

        this.pc.addEventListener('datachannel', (event) => {
            console.log('Received data channel:', event.channel.label);
            this.emit('datachannel', event);
        });
    }

    /**
     * Send HTTP request to Cloudflare Realtime API
     */
    async sendRequest(url, body, method = 'POST') {
        const request = {
            method: method,
            mode: 'cors',
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${this.appSecret}`
            },
            body: JSON.stringify(body)
        };

        try {
            const response = await fetch(url, request);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${result.errorDescription || 'Unknown error'}`);
            }
            
            return result;
        } catch (error) {
            console.error('Cloudflare API request failed:', error);
            throw error;
        }
    }

    /**
     * Check for errors in API response
     */
    checkErrors(result, tracksCount = 0) {
        if (result.errorCode) {
            throw new Error(result.errorDescription);
        }
        
        for (let i = 0; i < tracksCount; i++) {
            if (result.tracks && result.tracks[i] && result.tracks[i].errorCode) {
                throw new Error(`tracks[${i}]: ${result.tracks[i].errorDescription}`);
            }
        }
    }

    /**
     * Create a new session with Cloudflare Realtime API
     */
    async newSession(offerSDP) {
        const url = `${this.basePath}/sessions/new`;
        const body = {
            sessionDescription: {
                type: 'offer',
                sdp: offerSDP
            }
        };

        const result = await this.sendRequest(url, body);
        this.checkErrors(result);
        this.sessionId = result.sessionId;
        
        console.log('Created Cloudflare session:', this.sessionId);
        return result;
    }

    /**
     * Publish local tracks to Cloudflare Realtime API
     */
    async newTracks(trackObjects, offerSDP = null) {
        if (!this.sessionId) {
            throw new Error('No active session. Call newSession() first.');
        }

        const url = `${this.basePath}/sessions/${this.sessionId}/tracks/new`;
        const body = {
            tracks: trackObjects
        };

        if (offerSDP) {
            body.sessionDescription = {
                type: 'offer',
                sdp: offerSDP
            };
        }

        const result = await this.sendRequest(url, body);
        this.checkErrors(result, trackObjects.length);
        
        console.log('Published tracks to Cloudflare:', trackObjects.length);
        return result;
    }

    /**
     * Send answer SDP for renegotiation
     */
    async sendAnswerSDP(answer) {
        if (!this.sessionId) {
            throw new Error('No active session. Call newSession() first.');
        }

        const url = `${this.basePath}/sessions/${this.sessionId}/renegotiate`;
        const body = {
            sessionDescription: {
                type: 'answer',
                sdp: answer
            }
        };

        const result = await this.sendRequest(url, body, 'PUT');
        this.checkErrors(result);
        
        console.log('Sent answer SDP to Cloudflare');
        return result;
    }

    /**
     * Publish local media stream to Cloudflare
     */
    async publishLocalStream(stream) {
        if (!stream) {
            throw new Error('No stream provided');
        }

        // Add tracks to peer connection
        const transceivers = stream.getTracks().map(track =>
            this.pc.addTransceiver(track, {
                direction: 'sendonly'
            })
        );

        // Create offer for local tracks
        await this.pc.setLocalDescription(await this.pc.createOffer());
        
        // Create session if not exists
        if (!this.sessionId) {
            await this.newSession(this.pc.localDescription.sdp);
        }

        // Wait for ICE connection
        await this.waitForICEConnection();

        // Prepare track objects for publishing
        const trackObjects = transceivers.map(transceiver => ({
            location: 'local',
            mid: transceiver.mid,
            trackName: transceiver.sender.track.id
        }));

        // Publish tracks
        await this.pc.setLocalDescription(await this.pc.createOffer());
        const result = await this.newTracks(trackObjects, this.pc.localDescription.sdp);
        await this.pc.setRemoteDescription(new RTCSessionDescription(result.sessionDescription));

        console.log('Published local stream to Cloudflare');
        return { trackObjects, transceivers };
    }

    /**
     * Subscribe to remote tracks from Cloudflare
     */
    async subscribeToRemoteTracks(trackObjects) {
        if (!this.sessionId) {
            throw new Error('No active session. Call newSession() first.');
        }

        // Update track objects to reference remote tracks
        const remoteTrackObjects = trackObjects.map(trackObject => ({
            location: 'remote',
            sessionId: this.sessionId,
            trackName: trackObject.trackName
        }));

        // Set up promise to receive tracks
        const remoteTracksPromise = new Promise(resolve => {
            let tracks = [];
            this.pc.ontrack = event => {
                tracks.push(event.track);
                console.log(`Received remote track: ${event.track.kind}, mid=${event.track.mid}`);
                
                // Resolve when we have all expected tracks
                if (tracks.length >= trackObjects.length) {
                    resolve(tracks);
                }
            };
        });

        // Request remote tracks
        const result = await this.newTracks(remoteTrackObjects);
        
        // Handle renegotiation if required
        if (result.requiresImmediateRenegotiation) {
            switch (result.sessionDescription.type) {
                case 'offer':
                    await this.pc.setRemoteDescription(
                        new RTCSessionDescription(result.sessionDescription)
                    );
                    await this.pc.setLocalDescription(await this.pc.createAnswer());
                    await this.sendAnswerSDP(this.pc.localDescription.sdp);
                    break;
                case 'answer':
                    throw new Error('An offer SDP was expected');
            }
        }

        // Wait for tracks to arrive
        const remoteTracks = await remoteTracksPromise;
        console.log('Subscribed to remote tracks:', remoteTracks.length);
        
        return remoteTracks;
    }

    /**
     * Wait for ICE connection to be established
     */
    async waitForICEConnection(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('ICE connection timeout'));
            }, timeout);

            this.pc.addEventListener('iceconnectionstatechange', () => {
                if (this.pc.iceConnectionState === 'connected') {
                    clearTimeout(timeoutId);
                    resolve();
                } else if (this.pc.iceConnectionState === 'failed') {
                    clearTimeout(timeoutId);
                    reject(new Error('ICE connection failed'));
                }
            });

            // Check if already connected
            if (this.pc.iceConnectionState === 'connected') {
                clearTimeout(timeoutId);
                resolve();
            }
        });
    }

    /**
     * Create a data channel for control messages
     */
    createDataChannel(label, options = {}) {
        const channel = this.pc.createDataChannel(label, options);
        
        channel.addEventListener('open', () => {
            console.log(`Data channel '${label}' opened`);
            this.emit('datachannelopen', channel);
        });

        channel.addEventListener('message', (event) => {
            console.log(`Data channel '${label}' message:`, event.data);
            this.emit('datachannelmessage', { channel, data: event.data });
        });

        channel.addEventListener('close', () => {
            console.log(`Data channel '${label}' closed`);
            this.emit('datachannelclose', channel);
        });

        return channel;
    }

    /**
     * Get connection statistics
     */
    async getStats() {
        if (!this.pc) return null;
        
        const stats = await this.pc.getStats();
        const statsArray = Array.from(stats.values());
        
        return {
            connectionState: this.pc.connectionState,
            iceConnectionState: this.pc.iceConnectionState,
            iceGatheringState: this.pc.iceGatheringState,
            signalingState: this.pc.signalingState,
            sessionId: this.sessionId,
            stats: statsArray
        };
    }

    /**
     * Close the connection and cleanup
     */
    async close() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        this.sessionId = null;
        this.eventListeners.clear();
        
        console.log('Cloudflare Realtime client closed');
    }

    /**
     * Event emitter functionality
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudflareRealtimeClient;
}
