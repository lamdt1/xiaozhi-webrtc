/**
 * Client-side ICE server credential decryption utility
 * Provides secure decryption of TURN server credentials on the client side
 */

class ICECrypto {
    constructor() {
        this.masterKey = null;
        this.fernet = null;
    }

    /**
     * Initialize the crypto utility with master key
     * @param {string} masterKey - The master encryption key
     */
    async init(masterKey) {
        this.masterKey = masterKey;
        this.fernet = await this._createFernet();
    }

    /**
     * Create Fernet instance for encryption/decryption
     * @private
     */
    async _createFernet() {
        // Import crypto-js for client-side encryption
        if (typeof CryptoJS === 'undefined') {
            throw new Error('CryptoJS library not loaded. Please include crypto-js library.');
        }

        // Use the same salt as server-side for consistency
        const salt = CryptoJS.enc.Utf8.parse('xiaozhi_ice_salt_2024');
        
        // Derive key using PBKDF2 (same as server-side)
        const key = CryptoJS.PBKDF2(this.masterKey, salt, {
            keySize: 256/32,
            iterations: 100000,
            hasher: CryptoJS.algo.SHA256
        });

        // Convert to base64 for Fernet compatibility
        const keyBase64 = CryptoJS.enc.Base64.stringify(key);
        
        // For client-side, we'll use a simplified approach
        // In production, consider using Web Crypto API or a proper Fernet implementation
        return {
            decrypt: (encryptedData) => {
                try {
                    const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
                    return decrypted;
                } catch (e) {
                    throw new Error('Failed to decrypt credential: ' + e.message);
                }
            }
        };
    }

    /**
     * Decrypt a credential string
     * @param {string} encryptedCredential - Base64 encoded encrypted credential
     * @returns {string} Decrypted credential
     */
    decryptCredential(encryptedCredential) {
        if (!encryptedCredential) {
            return '';
        }

        if (!this.fernet) {
            throw new Error('ICECrypto not initialized. Call init() first.');
        }

        try {
            return this.fernet.decrypt(encryptedCredential);
        } catch (e) {
            throw new Error('Failed to decrypt credential: ' + e.message);
        }
    }

    /**
     * Process ICE servers configuration and decrypt credentials
     * @param {Array} iceServers - Array of ICE server configurations
     * @returns {Array} Processed ICE servers with decrypted credentials
     */
    processIceServers(iceServers) {
        if (!this.fernet) {
            console.warn('ICECrypto not initialized. Returning original configuration.');
            return iceServers;
        }

        return iceServers.map(server => {
            const processedServer = { ...server };

            // Decrypt username if encrypted
            if (server.username && server.username.startsWith('encrypted:')) {
                try {
                    processedServer.username = this.decryptCredential(server.username.substring(10));
                } catch (e) {
                    console.error('Failed to decrypt username:', e);
                    // Fallback to original value
                    processedServer.username = server.username;
                }
            }

            // Decrypt credential if encrypted
            if (server.credential && server.credential.startsWith('encrypted:')) {
                try {
                    processedServer.credential = this.decryptCredential(server.credential.substring(10));
                } catch (e) {
                    console.error('Failed to decrypt credential:', e);
                    // Fallback to original value
                    processedServer.credential = server.credential;
                }
            }

            return processedServer;
        });
    }
}

// Global instance
window.iceCrypto = new ICECrypto();

/**
 * Utility function to get ICE configuration with decrypted credentials
 * @param {string} masterKey - The master encryption key
 * @returns {Promise<Object>} ICE configuration with decrypted credentials
 */
async function getDecryptedIceConfig(masterKey) {
    try {
        await window.iceCrypto.init(masterKey);
        
        // Fetch ICE configuration from server
        const response = await fetch('/api/ice');
        const config = await response.json();
        
        // Process and decrypt credentials
        config.iceServers = window.iceCrypto.processIceServers(config.iceServers);
        
        return config;
    } catch (error) {
        console.error('Failed to get decrypted ICE configuration:', error);
        throw error;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ICECrypto, getDecryptedIceConfig };
}
