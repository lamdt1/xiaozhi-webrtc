# Secure ICE Server Configuration

This document describes how to configure and use the secure ICE server configuration system in XiaoZhi WebRTC.

## Overview

The secure ICE configuration system provides:
- Environment variable-based configuration
- Encrypted credential storage
- Client-side credential decryption
- Support for multiple TURN servers
- Comprehensive validation

## Quick Start

### 1. Generate Master Key

```bash
python scripts/manage_ice_credentials.py generate-key
```

This will output a master key like:
```
New Master Key: gAAAAABh...
Set this as ICE_MASTER_KEY environment variable
```

### 2. Encrypt Your Credentials

For Cloudflare TURN servers:
```bash
python scripts/manage_ice_credentials.py cloudflare your_username your_password
```

For custom TURN servers:
```bash
python scripts/manage_ice_credentials.py encrypt your_username your_password --server-name "My TURN Server" --urls "turn:your-server.com:3478?transport=udp,turn:your-server.com:3478?transport=tcp"
```

### 3. Configure Environment Variables

Create a `.env` file with your configuration:

```bash
# Copy the example file
cp env.example .env

# Edit with your values
nano .env
```

Example `.env` file:
```bash
ICE_MASTER_KEY=gAAAAABh...
CLOUDFLARE_TURN_USERNAME=encrypted:gAAAAABh...
CLOUDFLARE_TURN_CREDENTIAL=encrypted:gAAAAABh...
```

### 4. Set Client-Side Master Key

In your HTML files, set the master key for client-side decryption:

```javascript
// Option 1: Set as global variable
window.ICE_MASTER_KEY = 'your_master_key_here';

// Option 2: Store in localStorage
localStorage.setItem('ice_master_key', 'your_master_key_here');
```

## Configuration Options

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ICE_MASTER_KEY` | Master encryption key | Yes | `gAAAAABh...` |
| `CLOUDFLARE_TURN_USERNAME` | Cloudflare TURN username (encrypted) | No | `encrypted:gAAAAABh...` |
| `CLOUDFLARE_TURN_CREDENTIAL` | Cloudflare TURN password (encrypted) | No | `encrypted:gAAAAABh...` |
| `TURN_SERVER_COUNT` | Number of additional TURN servers | No | `2` |
| `TURN_SERVER_N_URLS` | URLs for TURN server N | No | `turn:server.com:3478?transport=udp` |
| `TURN_SERVER_N_USERNAME` | Username for TURN server N (encrypted) | No | `encrypted:gAAAAABh...` |
| `TURN_SERVER_N_CREDENTIAL` | Password for TURN server N (encrypted) | No | `encrypted:gAAAAABh...` |

### TURN Server URL Formats

Supported URL formats:
- `turn:server.com:3478?transport=udp`
- `turn:server.com:3478?transport=tcp`
- `turns:server.com:5349?transport=tcp`

## Security Features

### Encryption Algorithm

- **Algorithm**: Fernet (AES 128 in CBC mode with HMAC-SHA256)
- **Key Derivation**: PBKDF2-HMAC-SHA256 with 100,000 iterations
- **Salt**: Fixed salt for consistency (configurable in production)

### Credential Protection

1. **Server-side**: Credentials are encrypted before being sent to clients
2. **Client-side**: Credentials are decrypted only when needed for WebRTC
3. **Storage**: Master key should be stored securely and not committed to version control

### Best Practices

1. **Master Key Security**:
   - Generate a strong, random master key
   - Store it securely (environment variables, secret management systems)
   - Never commit it to version control
   - Rotate regularly

2. **Credential Management**:
   - Use the provided script to encrypt credentials
   - Store encrypted credentials in environment variables
   - Regularly rotate TURN server credentials

3. **Client-side Security**:
   - Set master key at runtime, not in source code
   - Consider using secure key distribution mechanisms
   - Implement proper error handling for decryption failures

## API Reference

### ICEConfig Class

```python
from src.config.ice_config import ice_config

# Get frontend configuration (with encrypted credentials)
config = ice_config.get_ice_config()

# Get server-side configuration (with decrypted credentials)
servers = ice_config.get_server_ice_servers()

# Validate configuration
validation = ice_config.validate_configuration()

# Get configuration summary
summary = ice_config.get_configuration_summary()
```

### CryptoConfig Class

```python
from src.config.crypto_config import crypto_config

# Encrypt credentials
encrypted = crypto_config.encrypt_credential("my_password")

# Decrypt credentials
decrypted = crypto_config.decrypt_credential(encrypted)

# Generate encrypted credentials
username, password = crypto_config.generate_encrypted_credentials("user", "pass")
```

### Client-side JavaScript

```javascript
// Initialize crypto utility
await window.iceCrypto.init(masterKey);

// Decrypt credentials
const decrypted = window.iceCrypto.decryptCredential(encryptedCredential);

// Process ICE servers
const processedServers = window.iceCrypto.processIceServers(iceServers);

// Get decrypted ICE configuration
const config = await getDecryptedIceConfig(masterKey);
```

## Management Script

The `scripts/manage_ice_credentials.py` script provides utilities for managing credentials:

### Commands

```bash
# Generate new master key
python scripts/manage_ice_credentials.py generate-key

# Encrypt credentials
python scripts/manage_ice_credentials.py encrypt username password --server-name "My Server" --urls "turn:server.com:3478"

# Decrypt credentials
python scripts/manage_ice_credentials.py decrypt encrypted_username encrypted_password

# Generate Cloudflare configuration
python scripts/manage_ice_credentials.py cloudflare username password
```

## Troubleshooting

### Common Issues

1. **Decryption fails on client-side**:
   - Verify master key is set correctly
   - Check that CryptoJS library is loaded
   - Ensure encrypted credentials are properly formatted

2. **TURN servers not working**:
   - Verify credentials are correct
   - Check URL formats
   - Test with unencrypted credentials first

3. **Configuration validation fails**:
   - Check URL formats
   - Ensure all required fields are present
   - Verify encrypted credentials can be decrypted

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=1 python main.py
```

### Validation

Check your configuration:

```python
from src.config.ice_config import ice_config

validation = ice_config.validate_configuration()
print(ice_config.get_configuration_summary())
```

## Migration from Basic Configuration

If you're migrating from the basic ICE configuration:

1. Generate a master key
2. Encrypt your existing credentials
3. Update environment variables
4. Add client-side decryption to your HTML files
5. Test the configuration

## Examples

### Complete Cloudflare Setup

```bash
# 1. Generate master key
python scripts/manage_ice_credentials.py generate-key
# Output: New Master Key: gAAAAABh...

# 2. Encrypt Cloudflare credentials
python scripts/manage_ice_credentials.py cloudflare c682c16159f88382fcee1dfc6161bca4 813b143a66f601f9e651920617c7cd2188437ab3172c12bdc146e4ad004a5fca

# 3. Set environment variables
export ICE_MASTER_KEY="gAAAAABh..."
export CLOUDFLARE_TURN_USERNAME="encrypted:gAAAAABh..."
export CLOUDFLARE_TURN_CREDENTIAL="encrypted:gAAAAABh..."

# 4. Set client-side master key in HTML
window.ICE_MASTER_KEY = 'gAAAAABh...';
```

### Multiple TURN Servers

```bash
# Configure multiple TURN servers
export TURN_SERVER_COUNT=2
export TURN_SERVER_1_URLS="turn:server1.com:3478?transport=udp,turn:server1.com:3478?transport=tcp"
export TURN_SERVER_1_USERNAME="encrypted:gAAAAABh..."
export TURN_SERVER_1_CREDENTIAL="encrypted:gAAAAABh..."
export TURN_SERVER_2_URLS="turn:server2.com:3478?transport=udp"
export TURN_SERVER_2_USERNAME="encrypted:gAAAAABh..."
export TURN_SERVER_2_CREDENTIAL="encrypted:gAAAAABh..."
```

This secure ICE configuration system provides enterprise-grade security for your WebRTC application while maintaining ease of use and flexibility.
