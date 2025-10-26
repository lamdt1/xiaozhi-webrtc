/**
 * Browser Compatibility Tests for WebRTC Implementation
 * Tests WebRTC functionality across different browsers
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

const SELENIUM_HUB_URL = process.env.SELENIUM_HUB_URL || 'http://localhost:4444';
const TEST_APP_URL = process.env.TEST_APP_URL || 'http://localhost:51000';

class BrowserTestRunner {
    constructor() {
        this.drivers = [];
        this.testResults = [];
    }

    async createDriver(browserName) {
        let driver;
        
        switch (browserName) {
            case 'chrome':
                driver = await new Builder()
                    .forBrowser('chrome')
                    .usingServer(SELENIUM_HUB_URL)
                    .setChromeOptions(new chrome.Options()
                        .addArguments('--use-fake-ui-for-media-stream')
                        .addArguments('--use-fake-device-for-media-stream')
                        .addArguments('--allow-running-insecure-content')
                        .addArguments('--disable-web-security')
                        .addArguments('--disable-features=VizDisplayCompositor')
                    )
                    .build();
                break;
                
            case 'firefox':
                driver = await new Builder()
                    .forBrowser('firefox')
                    .usingServer(SELENIUM_HUB_URL)
                    .setFirefoxOptions(new firefox.Options()
                        .setPreference('media.navigator.streams.fake', true)
                        .setPreference('media.navigator.permission.disabled', true)
                        .setPreference('media.peerconnection.enabled', true)
                    )
                    .build();
                break;
                
            default:
                throw new Error(`Unsupported browser: ${browserName}`);
        }
        
        this.drivers.push(driver);
        return driver;
    }

    async runWebRTCTest(driver, browserName) {
        const testResult = {
            browser: browserName,
            timestamp: new Date().toISOString(),
            tests: []
        };

        try {
            console.log(`Starting WebRTC tests for ${browserName}...`);
            
            // Navigate to the test page
            await driver.get(`${TEST_APP_URL}/chatv2`);
            await driver.wait(until.titleContains('XiaoZhi WebRTC'), 10000);
            
            // Test 1: WebRTC Adapter Loading
            const adapterTest = await this.testWebRTCAdapter(driver);
            testResult.tests.push(adapterTest);
            
            // Test 2: WebRTCManager Class Availability
            const managerTest = await this.testWebRTCManager(driver);
            testResult.tests.push(managerTest);
            
            // Test 3: ICE Configuration Loading
            const iceTest = await this.testICEConfiguration(driver);
            testResult.tests.push(iceTest);
            
            // Test 4: Media Device Access
            const mediaTest = await this.testMediaDevices(driver);
            testResult.tests.push(mediaTest);
            
            // Test 5: RTCPeerConnection Creation
            const peerConnectionTest = await this.testRTCPeerConnection(driver);
            testResult.tests.push(peerConnectionTest);
            
            // Test 6: Connection State Monitoring
            const stateTest = await this.testConnectionState(driver);
            testResult.tests.push(stateTest);
            
            // Test 7: Data Channel Functionality
            const dataChannelTest = await this.testDataChannel(driver);
            testResult.tests.push(dataChannelTest);
            
            // Test 8: Performance Monitoring
            const performanceTest = await this.testPerformanceMonitoring(driver);
            testResult.tests.push(performanceTest);
            
        } catch (error) {
            console.error(`Error running tests for ${browserName}:`, error);
            testResult.error = error.message;
        }
        
        return testResult;
    }

    async testWebRTCAdapter(driver) {
        try {
            const adapterLoaded = await driver.executeScript(`
                return typeof adapter !== 'undefined' && 
                       typeof adapter.browserDetails !== 'undefined';
            `);
            
            return {
                name: 'WebRTC Adapter Loading',
                passed: adapterLoaded,
                message: adapterLoaded ? 'WebRTC adapter loaded successfully' : 'WebRTC adapter not loaded'
            };
        } catch (error) {
            return {
                name: 'WebRTC Adapter Loading',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async testWebRTCManager(driver) {
        try {
            const managerAvailable = await driver.executeScript(`
                return typeof WebRTCManager !== 'undefined';
            `);
            
            return {
                name: 'WebRTCManager Class Availability',
                passed: managerAvailable,
                message: managerAvailable ? 'WebRTCManager class available' : 'WebRTCManager class not found'
            };
        } catch (error) {
            return {
                name: 'WebRTCManager Class Availability',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async testICEConfiguration(driver) {
        try {
            const iceConfig = await driver.executeScript(`
                return fetch('/api/ice')
                    .then(response => response.json())
                    .then(data => data)
                    .catch(error => null);
            `);
            
            const hasIceServers = iceConfig && iceConfig.iceServers && iceConfig.iceServers.length > 0;
            
            return {
                name: 'ICE Configuration Loading',
                passed: hasIceServers,
                message: hasIceServers ? 
                    `ICE configuration loaded with ${iceConfig.iceServers.length} servers` : 
                    'ICE configuration not loaded or empty'
            };
        } catch (error) {
            return {
                name: 'ICE Configuration Loading',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async testMediaDevices(driver) {
        try {
            const mediaDevices = await driver.executeScript(`
                return navigator.mediaDevices && 
                       typeof navigator.mediaDevices.getUserMedia === 'function';
            `);
            
            return {
                name: 'Media Device Access',
                passed: mediaDevices,
                message: mediaDevices ? 'Media devices API available' : 'Media devices API not available'
            };
        } catch (error) {
            return {
                name: 'Media Device Access',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async testRTCPeerConnection(driver) {
        try {
            const peerConnection = await driver.executeScript(`
                try {
                    const pc = new RTCPeerConnection({
                        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                    });
                    return pc !== null;
                } catch (error) {
                    return false;
                }
            `);
            
            return {
                name: 'RTCPeerConnection Creation',
                passed: peerConnection,
                message: peerConnection ? 'RTCPeerConnection created successfully' : 'Failed to create RTCPeerConnection'
            };
        } catch (error) {
            return {
                name: 'RTCPeerConnection Creation',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async testConnectionState(driver) {
        try {
            const stateMonitoring = await driver.executeScript(`
                try {
                    const pc = new RTCPeerConnection();
                    let stateChanged = false;
                    pc.addEventListener('connectionstatechange', () => {
                        stateChanged = true;
                    });
                    return typeof pc.connectionState !== 'undefined';
                } catch (error) {
                    return false;
                }
            `);
            
            return {
                name: 'Connection State Monitoring',
                passed: stateMonitoring,
                message: stateMonitoring ? 'Connection state monitoring available' : 'Connection state monitoring not available'
            };
        } catch (error) {
            return {
                name: 'Connection State Monitoring',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async testDataChannel(driver) {
        try {
            const dataChannel = await driver.executeScript(`
                try {
                    const pc = new RTCPeerConnection();
                    const channel = pc.createDataChannel('test');
                    return channel !== null && typeof channel.send === 'function';
                } catch (error) {
                    return false;
                }
            `);
            
            return {
                name: 'Data Channel Functionality',
                passed: dataChannel,
                message: dataChannel ? 'Data channel created successfully' : 'Failed to create data channel'
            };
        } catch (error) {
            return {
                name: 'Data Channel Functionality',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async testPerformanceMonitoring(driver) {
        try {
            const performanceMonitoring = await driver.executeScript(`
                try {
                    const pc = new RTCPeerConnection();
                    return typeof pc.getStats === 'function';
                } catch (error) {
                    return false;
                }
            `);
            
            return {
                name: 'Performance Monitoring',
                passed: performanceMonitoring,
                message: performanceMonitoring ? 'Performance monitoring available' : 'Performance monitoring not available'
            };
        } catch (error) {
            return {
                name: 'Performance Monitoring',
                passed: false,
                message: `Error: ${error.message}`
            };
        }
    }

    async runAllTests() {
        const browsers = ['chrome', 'firefox'];
        
        console.log('Starting browser compatibility tests...');
        console.log(`Selenium Hub URL: ${SELENIUM_HUB_URL}`);
        console.log(`Test App URL: ${TEST_APP_URL}`);
        
        for (const browser of browsers) {
            let driver;
            try {
                driver = await this.createDriver(browser);
                const result = await this.runWebRTCTest(driver, browser);
                this.testResults.push(result);
                
                // Print test results
                console.log(`\n=== ${browser.toUpperCase()} Test Results ===`);
                result.tests.forEach(test => {
                    const status = test.passed ? '✅ PASS' : '❌ FAIL';
                    console.log(`${status} ${test.name}: ${test.message}`);
                });
                
            } catch (error) {
                console.error(`Failed to run tests for ${browser}:`, error);
                this.testResults.push({
                    browser: browser,
                    error: error.message,
                    tests: []
                });
            } finally {
                if (driver) {
                    await driver.quit();
                }
            }
        }
        
        await this.generateReport();
    }

    async generateReport() {
        const fs = require('fs');
        const path = require('path');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.generateSummary(),
            results: this.testResults
        };
        
        const reportPath = '/test-results/browser-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n=== Test Summary ===');
        console.log(`Total browsers tested: ${this.testResults.length}`);
        console.log(`Total tests passed: ${report.summary.totalPassed}`);
        console.log(`Total tests failed: ${report.summary.totalFailed}`);
        console.log(`Success rate: ${report.summary.successRate}%`);
        console.log(`Report saved to: ${reportPath}`);
    }

    generateSummary() {
        let totalTests = 0;
        let totalPassed = 0;
        
        this.testResults.forEach(result => {
            if (result.tests) {
                result.tests.forEach(test => {
                    totalTests++;
                    if (test.passed) {
                        totalPassed++;
                    }
                });
            }
        });
        
        const totalFailed = totalTests - totalPassed;
        const successRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
        
        return {
            totalTests,
            totalPassed,
            totalFailed,
            successRate
        };
    }

    async cleanup() {
        for (const driver of this.drivers) {
            try {
                await driver.quit();
            } catch (error) {
                console.error('Error closing driver:', error);
            }
        }
    }
}

// Run tests
async function main() {
    const runner = new BrowserTestRunner();
    
    try {
        await runner.runAllTests();
    } catch (error) {
        console.error('Test execution failed:', error);
        process.exit(1);
    } finally {
        await runner.cleanup();
    }
}

if (require.main === module) {
    main();
}

module.exports = BrowserTestRunner;
