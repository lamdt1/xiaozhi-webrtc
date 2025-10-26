/**
 * Performance Benchmark Tests for WebRTC Implementation
 * Measures connection time, latency, and resource usage
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            benchmarks: []
        };
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        this.browser = await puppeteer.launch({
            headless: false,
            args: [
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--allow-running-insecure-content',
                '--disable-web-security',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Enable performance monitoring
        await this.page.setCacheEnabled(false);
        await this.page.setJavaScriptEnabled(true);
        
        // Set viewport
        await this.page.setViewport({ width: 1280, height: 720 });
    }

    async runBenchmarks() {
        console.log('Starting performance benchmarks...');
        
        try {
            await this.initialize();
            
            // Benchmark 1: Page Load Time
            await this.benchmarkPageLoad();
            
            // Benchmark 2: WebRTCManager Initialization
            await this.benchmarkWebRTCManagerInit();
            
            // Benchmark 3: ICE Configuration Loading
            await this.benchmarkICEConfiguration();
            
            // Benchmark 4: Connection Establishment Time
            await this.benchmarkConnectionTime();
            
            // Benchmark 5: Memory Usage
            await this.benchmarkMemoryUsage();
            
            // Benchmark 6: CPU Usage
            await this.benchmarkCPUUsage();
            
            // Benchmark 7: Audio/Video Quality
            await this.benchmarkMediaQuality();
            
            // Benchmark 8: Data Channel Performance
            await this.benchmarkDataChannel();
            
            // Generate report
            await this.generateReport();
            
        } catch (error) {
            console.error('Benchmark execution failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    async benchmarkPageLoad() {
        console.log('Benchmarking page load time...');
        
        const startTime = Date.now();
        
        await this.page.goto('http://localhost:51000/chatv2', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        const loadTime = Date.now() - startTime;
        
        // Measure DOM content loaded
        const domContentLoaded = await this.page.evaluate(() => {
            return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        });
        
        this.results.benchmarks.push({
            name: 'Page Load Time',
            metrics: {
                totalLoadTime: loadTime,
                domContentLoaded: domContentLoaded,
                target: 3000, // 3 seconds target
                passed: loadTime < 3000
            }
        });
        
        console.log(`Page load time: ${loadTime}ms (DOM: ${domContentLoaded}ms)`);
    }

    async benchmarkWebRTCManagerInit() {
        console.log('Benchmarking WebRTCManager initialization...');
        
        const initTime = await this.page.evaluate(async () => {
            const startTime = performance.now();
            
            try {
                const manager = new WebRTCManager({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });
                await manager.initialize();
                
                return {
                    initTime: performance.now() - startTime,
                    success: true
                };
            } catch (error) {
                return {
                    initTime: performance.now() - startTime,
                    success: false,
                    error: error.message
                };
            }
        });
        
        this.results.benchmarks.push({
            name: 'WebRTCManager Initialization',
            metrics: {
                initTime: initTime.initTime,
                success: initTime.success,
                target: 1000, // 1 second target
                passed: initTime.success && initTime.initTime < 1000
            }
        });
        
        console.log(`WebRTCManager init time: ${initTime.initTime}ms (Success: ${initTime.success})`);
    }

    async benchmarkICEConfiguration() {
        console.log('Benchmarking ICE configuration loading...');
        
        const iceTime = await this.page.evaluate(async () => {
            const startTime = performance.now();
            
            try {
                const response = await fetch('/api/ice');
                const data = await response.json();
                
                return {
                    loadTime: performance.now() - startTime,
                    success: true,
                    serverCount: data.iceServers ? data.iceServers.length : 0
                };
            } catch (error) {
                return {
                    loadTime: performance.now() - startTime,
                    success: false,
                    error: error.message
                };
            }
        });
        
        this.results.benchmarks.push({
            name: 'ICE Configuration Loading',
            metrics: {
                loadTime: iceTime.loadTime,
                success: iceTime.success,
                serverCount: iceTime.serverCount || 0,
                target: 500, // 500ms target
                passed: iceTime.success && iceTime.loadTime < 500
            }
        });
        
        console.log(`ICE config load time: ${iceTime.loadTime}ms (Servers: ${iceTime.serverCount})`);
    }

    async benchmarkConnectionTime() {
        console.log('Benchmarking connection establishment time...');
        
        const connectionTime = await this.page.evaluate(async () => {
            const startTime = performance.now();
            
            try {
                // Create WebRTCManager
                const manager = new WebRTCManager({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });
                
                // Initialize
                await manager.initialize();
                
                // Create offer
                const offer = await manager.createOffer();
                
                return {
                    connectionTime: performance.now() - startTime,
                    success: true,
                    offerCreated: true
                };
            } catch (error) {
                return {
                    connectionTime: performance.now() - startTime,
                    success: false,
                    error: error.message
                };
            }
        });
        
        this.results.benchmarks.push({
            name: 'Connection Establishment',
            metrics: {
                connectionTime: connectionTime.connectionTime,
                success: connectionTime.success,
                target: 2000, // 2 seconds target
                passed: connectionTime.success && connectionTime.connectionTime < 2000
            }
        });
        
        console.log(`Connection time: ${connectionTime.connectionTime}ms`);
    }

    async benchmarkMemoryUsage() {
        console.log('Benchmarking memory usage...');
        
        const memoryUsage = await this.page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    available: true
                };
            }
            return { available: false };
        });
        
        this.results.benchmarks.push({
            name: 'Memory Usage',
            metrics: {
                usedJSHeapSize: memoryUsage.usedJSHeapSize || 0,
                totalJSHeapSize: memoryUsage.totalJSHeapSize || 0,
                jsHeapSizeLimit: memoryUsage.jsHeapSizeLimit || 0,
                available: memoryUsage.available,
                target: 50 * 1024 * 1024, // 50MB target
                passed: memoryUsage.available && (memoryUsage.usedJSHeapSize || 0) < 50 * 1024 * 1024
            }
        });
        
        console.log(`Memory usage: ${memoryUsage.usedJSHeapSize ? (memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`);
    }

    async benchmarkCPUUsage() {
        console.log('Benchmarking CPU usage...');
        
        const cpuUsage = await this.page.evaluate(() => {
            const startTime = performance.now();
            const startMark = performance.mark('cpu-start');
            
            // Simulate some CPU-intensive work
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += Math.random();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            return {
                duration: duration,
                operationsPerSecond: 1000000 / (duration / 1000),
                performance: duration < 100 ? 'excellent' : duration < 500 ? 'good' : 'poor'
            };
        });
        
        this.results.benchmarks.push({
            name: 'CPU Performance',
            metrics: {
                duration: cpuUsage.duration,
                operationsPerSecond: cpuUsage.operationsPerSecond,
                performance: cpuUsage.performance,
                target: 500, // 500ms target
                passed: cpuUsage.duration < 500
            }
        });
        
        console.log(`CPU performance: ${cpuUsage.duration}ms (${cpuUsage.performance})`);
    }

    async benchmarkMediaQuality() {
        console.log('Benchmarking media quality...');
        
        const mediaQuality = await this.page.evaluate(async () => {
            try {
                // Test media device access
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioDevices = devices.filter(device => device.kind === 'audioinput');
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                
                // Test getUserMedia
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                });
                
                const audioTracks = stream.getAudioTracks();
                const videoTracks = stream.getVideoTracks();
                
                // Get track settings
                const audioSettings = audioTracks.length > 0 ? audioTracks[0].getSettings() : null;
                const videoSettings = videoTracks.length > 0 ? videoTracks[0].getSettings() : null;
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
                
                return {
                    success: true,
                    audioDevices: audioDevices.length,
                    videoDevices: videoDevices.length,
                    audioTracks: audioTracks.length,
                    videoTracks: videoTracks.length,
                    audioSettings: audioSettings,
                    videoSettings: videoSettings
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });
        
        this.results.benchmarks.push({
            name: 'Media Quality',
            metrics: {
                success: mediaQuality.success,
                audioDevices: mediaQuality.audioDevices || 0,
                videoDevices: mediaQuality.videoDevices || 0,
                audioTracks: mediaQuality.audioTracks || 0,
                videoTracks: mediaQuality.videoTracks || 0,
                passed: mediaQuality.success && (mediaQuality.audioTracks || 0) > 0
            }
        });
        
        console.log(`Media quality: Audio tracks: ${mediaQuality.audioTracks || 0}, Video tracks: ${mediaQuality.videoTracks || 0}`);
    }

    async benchmarkDataChannel() {
        console.log('Benchmarking data channel performance...');
        
        const dataChannelPerformance = await this.page.evaluate(async () => {
            const startTime = performance.now();
            
            try {
                const pc = new RTCPeerConnection();
                const channel = pc.createDataChannel('test');
                
                let messagesReceived = 0;
                let messagesSent = 0;
                
                channel.onmessage = () => {
                    messagesReceived++;
                };
                
                // Send test messages
                const testMessages = Array.from({ length: 100 }, (_, i) => `message-${i}`);
                
                for (const message of testMessages) {
                    if (channel.readyState === 'open') {
                        channel.send(message);
                        messagesSent++;
                    }
                }
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                pc.close();
                
                return {
                    success: true,
                    duration: duration,
                    messagesSent: messagesSent,
                    messagesPerSecond: messagesSent / (duration / 1000),
                    throughput: (messagesSent * 10) / (duration / 1000) // Approximate bytes per second
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });
        
        this.results.benchmarks.push({
            name: 'Data Channel Performance',
            metrics: {
                success: dataChannelPerformance.success,
                duration: dataChannelPerformance.duration || 0,
                messagesSent: dataChannelPerformance.messagesSent || 0,
                messagesPerSecond: dataChannelPerformance.messagesPerSecond || 0,
                throughput: dataChannelPerformance.throughput || 0,
                target: 1000, // 1000 messages per second target
                passed: dataChannelPerformance.success && (dataChannelPerformance.messagesPerSecond || 0) > 1000
            }
        });
        
        console.log(`Data channel: ${dataChannelPerformance.messagesPerSecond || 0} messages/sec`);
    }

    async generateReport() {
        const summary = this.generateSummary();
        this.results.summary = summary;
        
        const reportPath = '/test-results/performance-benchmark-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        console.log('\n=== Performance Benchmark Summary ===');
        console.log(`Total benchmarks: ${this.results.benchmarks.length}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Success rate: ${summary.successRate}%`);
        console.log(`Report saved to: ${reportPath}`);
        
        // Print individual benchmark results
        this.results.benchmarks.forEach(benchmark => {
            const status = benchmark.metrics.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${benchmark.name}: ${benchmark.metrics[Object.keys(benchmark.metrics)[0]]}ms`);
        });
    }

    generateSummary() {
        let passed = 0;
        let failed = 0;
        
        this.results.benchmarks.forEach(benchmark => {
            if (benchmark.metrics.passed) {
                passed++;
            } else {
                failed++;
            }
        });
        
        const total = passed + failed;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        return {
            total,
            passed,
            failed,
            successRate
        };
    }

    async cleanup() {
        if (this.page) {
            await this.page.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Run benchmarks
async function main() {
    const benchmark = new PerformanceBenchmark();
    
    try {
        await benchmark.runBenchmarks();
    } catch (error) {
        console.error('Benchmark execution failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = PerformanceBenchmark;
