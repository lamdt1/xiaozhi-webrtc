/**
 * Live2D Manager
 * Responsible for Live2D model initialization, mouth animation control, etc.
 */
class Live2DManager {
    constructor() {
        this.live2dApp = null;
        this.live2dModel = null;
        this.isTalking = false;
        this.mouthAnimationId = null;
        this.mouthParam = 'ParamMouthOpenY';
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        // Single/double click detection configuration and state
        this._lastClickTime = 0;
        this._lastClickPos = { x: 0, y: 0 };
        this._singleClickTimer = null;
        this._doubleClickMs = 280; // Double click time threshold (ms)
        this._doubleClickDist = 16; // Maximum displacement allowed for double click (px)
        // Swipe detection
        this._pointerDown = false;
        this._downPos = { x: 0, y: 0 };
        this._downTime = 0;
        this._downArea = 'Body';
        this._movedBeyondClick = false;
        this._swipeMinDist = 24; // Minimum distance to trigger swipe
    }

    /**
     * Initialize Live2D
     */
    async initializeLive2D() {
        try {
            const canvas = document.getElementById('live2d-stage');

            // For internal use
            window.PIXI = PIXI;

            this.live2dApp = new PIXI.Application({
                view: canvas,
                height: window.innerHeight,
                width: window.innerWidth,
                resolution: window.devicePixelRatio,
                autoDensity: true,
                antialias: true,
                backgroundAlpha: 0,
            });

            // Load Live2D model
            this.live2dModel = await PIXI.live2d.Live2DModel.from('static/hiyori_pro_zh/runtime/hiyori_pro_t11.model3.json');
            this.live2dApp.stage.addChild(this.live2dModel);
            this.live2dModel.scale.set(0.35);
            this.live2dModel.x = (window.innerWidth - this.live2dModel.width) * 0.5;
            this.live2dModel.y = -50;

            // Enable interaction and listen for click hits (head/body, etc.)

            this.live2dModel.interactive = true;


            this.live2dModel.on('doublehit', (args) => {
                const area = Array.isArray(args) ? args[0] : args;
                console.log('doublehit', area);
                const app = window.chatApp;
                const payload = JSON.stringify({ type: 'live2d', event: 'doublehit', area });
                if (app && app.dataChannel && app.dataChannel.readyState === 'open') {
                    app.dataChannel.send(payload);
                } 

            });

            this.live2dModel.on('singlehit', (args) => {
                const area = Array.isArray(args) ? args[0] : args;
                console.log('singlehit', area);
                const app = window.chatApp;
                const payload = JSON.stringify({ type: 'live2d', event: 'singlehit', area });
                if (app && app.dataChannel && app.dataChannel.readyState === 'open') {
                    app.dataChannel.send(payload);
                }

            });

            this.live2dModel.on('swipe', (args) => {
                const area = Array.isArray(args) ? args[0] : args;
                const dir = Array.isArray(args) ? args[1] : undefined;
                console.log('swipe', area, dir);

                const app = window.chatApp;
                const payload = JSON.stringify({ type: 'live2d', event: 'swipe', area, dir });
                if (app && app.dataChannel && app.dataChannel.readyState === 'open') {
                    app.dataChannel.send(payload);
                } 

            });

            // Fallback: custom "head/body" hit areas + single/double click/swipe distinction
            this.live2dModel.on('pointerdown', (event) => {
                try {
                    const global = event.data.global;
                    const bounds = this.live2dModel.getBounds();
                    // Only judge when click falls within model's visible range
                    if (!bounds || !bounds.contains(global.x, global.y)) return;

                    const relX = (global.x - bounds.x) / (bounds.width || 1);
                    const relY = (global.y - bounds.y) / (bounds.height || 1);
                    let area = '';
                    // Empirical threshold: upper 20% of model's visible rectangle is considered "head" area
                    console.log('relX', relX, 'relY', relY);
                    if (relX >= 0.4 && relX <= 0.6) {
                        if (relY <= 0.15) {
                            area = 'Head';
                        }else if (relY <= 0.23) {
                            area = 'Face';
                        }else {
                            area = 'Body';
                        }
                    } 
                    if (area === '') {
                        return;
                    }
                    
                    // Record press state for swipe detection
                    this._pointerDown = true;
                    this._downPos = { x: global.x, y: global.y };
                    this._downTime = performance.now();
                    this._downArea = area;
                    this._movedBeyondClick = false;

                    const now = performance.now();
                    const dt = now - (this._lastClickTime || 0);
                    const dx = global.x - (this._lastClickPos?.x || 0);
                    const dy = global.y - (this._lastClickPos?.y || 0);
                    const dist = Math.hypot(dx, dy);

                    // Hit confirmation: only do single/double click judgment when clicking on model
                    if (this._lastClickTime && dt <= this._doubleClickMs && dist <= this._doubleClickDist) {
                        // Determined as double click: cancel pending single click event
                        if (this._singleClickTimer) {
                            clearTimeout(this._singleClickTimer);
                            this._singleClickTimer = null;
                        }
                        if (typeof this.live2dModel.emit === 'function') {
                            this.live2dModel.emit('doublehit', [area]);
                        }
                        this._lastClickTime = 0;
                        this._pointerDown = false; // Double click completed, reset state
                        return;
                    }

                    // Might be single click: record and delay confirmation
                    this._lastClickTime = now;
                    this._lastClickPos = { x: global.x, y: global.y };
                    if (this._singleClickTimer) {
                        clearTimeout(this._singleClickTimer);
                        this._singleClickTimer = null;
                    }
                    this._singleClickTimer = setTimeout(() => {
                        // If movement beyond threshold occurred during waiting period, no longer treat as single click
                        if (!this._movedBeyondClick && typeof this.live2dModel.emit === 'function') {
                            this.live2dModel.emit('singlehit', [area]);
                        }
                        this._singleClickTimer = null;
                        this._lastClickTime = 0;
                    }, this._doubleClickMs);
                } catch (e) {
                    // Ignore exceptions in custom hit detection to avoid affecting main flow
                }
            });

            // Pointer movement: used to determine if "click" is upgraded to "swipe"
            this.live2dModel.on('pointermove', (event) => {
                try {
                    if (!this._pointerDown) return;
                    const global = event.data.global;
                    const dx = global.x - this._downPos.x;
                    const dy = global.y - this._downPos.y;
                    const dist = Math.hypot(dx, dy);
                    
                    // Use _doubleClickDist as click/swipe detection threshold
                    if (dist > this._doubleClickDist) {
                        this._movedBeyondClick = true;
                        // If click threshold exceeded, cancel possible single click trigger
                        if (this._singleClickTimer) {
                            clearTimeout(this._singleClickTimer);
                            this._singleClickTimer = null;
                        }
                        this._lastClickTime = 0;
                    }
                } catch (e) {
                    // Ignore exceptions in movement detection
                }
            });

            // Pointer up: confirm if it's a swipe
            const handlePointerUp = (event) => {
                try {
                    if (!this._pointerDown) return;
                    const global = (event && event.data && event.data.global) ? event.data.global : { x: this._downPos.x, y: this._downPos.y };
                    const dx = global.x - this._downPos.x;
                    const dy = global.y - this._downPos.y;
                    const dist = Math.hypot(dx, dy);

                    // Swipe: trigger swipe event if minimum swipe distance exceeded (with direction and area)
                    if (this._movedBeyondClick && dist >= this._swipeMinDist) {
                        if (typeof this.live2dModel.emit === 'function') {
                            const dir = Math.abs(dx) >= Math.abs(dy)
                                ? (dx > 0 ? 'right' : 'left')
                                : (dy > 0 ? 'down' : 'up');
                            this.live2dModel.emit('swipe', [this._downArea, dir]);
                        }
                        // Terminate: no longer let single/double click trigger
                        if (this._singleClickTimer) {
                            clearTimeout(this._singleClickTimer);
                            this._singleClickTimer = null;
                        }
                        this._lastClickTime = 0;
                    }
                } catch (e) {
                    // Ignore exceptions in up detection
                }
                finally {
                    this._pointerDown = false;
                    this._movedBeyondClick = false;
                }
            };

            this.live2dModel.on('pointerup', handlePointerUp);
            this.live2dModel.on('pointerupoutside', handlePointerUp);
            
                
        } catch (err) {
            console.error('Failed to load Live2D model:', err);
        }
    }

    /**
     * Initialize audio analyzer
     * @param {MediaStream} remoteStream - Remote audio stream
     */
    initializeAudioAnalyzer(remoteStream) {
        try {
            // Create audio context and analyzer
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // Get remoteVideo's audio track
            if (remoteStream) {
                const audioTracks = remoteStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const source = this.audioContext.createMediaStreamSource(remoteStream);
                    source.connect(this.analyser);
                    // console.log('Audio analyzer initialized successfully');
                }
            }
        } catch (error) {
            console.error('Failed to initialize audio analyzer:', error);
        }
    }

    /**
     * Mouth animation loop
     */
    animateMouth() {
        if (!this.isTalking) return;
        if (!this.live2dModel) return;
        const internal = this.live2dModel && this.live2dModel.internalModel;
        if (internal && internal.coreModel) {
            const coreModel = internal.coreModel;

            // Get audio decibel value
            let mouthValue = 0;
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);
                const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
                // Convert 0-255 values to 0-1 range and apply some smoothing
                mouthValue = Math.min(1, (average / 255) * 3);
            }
            // console.log("mouthValue", mouthValue)
            coreModel.setParameterValueById(this.mouthParam, mouthValue);
            coreModel.update();
        }
        this.mouthAnimationId = requestAnimationFrame(() => this.animateMouth());
    }

    /**
     * Start talking animation
     * @param {MediaStream} remoteStream - Remote audio stream
     */
    startTalking(remoteStream) {
        if (this.isTalking || !this.live2dModel) return;

        // Ensure audio analyzer is initialized
        if (!this.analyser && remoteStream) {
            this.initializeAudioAnalyzer(remoteStream);
        }

        this.isTalking = true;
        this.animateMouth();
    }

    /**
     * Stop talking animation
     */
    stopTalking() {
        this.isTalking = false;
        if (this.mouthAnimationId) {
            cancelAnimationFrame(this.mouthAnimationId);
            this.mouthAnimationId = null;
        }
        if (!this.live2dModel) return;
        const internal = this.live2dModel && this.live2dModel.internalModel;
        if (internal && internal.coreModel) {
            const coreModel = internal.coreModel;
            coreModel.setParameterValueById(this.mouthParam, 0);
            coreModel.update();
        }
    }

    /**
     * Trigger model motion
     * @param {string} name - Motion group name, such as 'TapBody', 'FlickUp', 'Idle', etc.
     */
    motion(name) {
        try {
            if (!this.live2dModel) return;
            console.log("motion:", name);
            this.live2dModel.motion(name);
        } catch (error) {
            console.error('Failed to trigger motion:', error);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopTalking();
        
        // Clean up audio analyzer
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.dataArray = null;

        // Clean up Live2D application
        if (this.live2dApp) {
            this.live2dApp.destroy(true);
            this.live2dApp = null;
        }
        this.live2dModel = null;
    }
}

// Export global instance
window.Live2DManager = Live2DManager;
