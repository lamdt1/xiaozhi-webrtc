# ICE Server Configuration

This document describes how to configure and use the ICE server configuration system in XiaoZhi WebRTC.

## Overview

The ICE configuration system provides:
- Hardcoded Cloudflare TURN server configuration
- Environment variable-based configuration for additional servers
- Support for multiple TURN servers
- Comprehensive validation

## Quick Start

### 1. Default Configuration

The Cloudflare TURN server is now hardcoded in the application with the following configuration:

```json
{
  "urls": [
    "turn:turn.cloudflare.com:3478?transport=udp",
    "turn:turn.cloudflare.com:3478?transport=tcp",
    "turns:turn.cloudflare.com:5349?transport=tcp"
  ],
  "username": "c682c16159f88382fcee1dfc6161bca4",
  "credential": "813b143a66f601f9e651920617c7cd2188437ab3172c12bdc146e4ad004a5fca"
}
```

### 2. Add Additional TURN Servers (Optional)

If you need additional TURN servers, you can configure them using environment variables:

```bash
# Copy the example file
cp env.example .env

# Edit with your values
nano .env
```

Example `.env` file for additional TURN servers:
```bash
TURN_SERVER_COUNT=1
TURN_SERVER_1_URLS=turn:your-server.com:3478?transport=udp,turn:your-server.com:3478?transport=tcp
TURN_SERVER_1_USERNAME=your_username
TURN_SERVER_1_CREDENTIAL=your_password
```

### 3. Test the Configuration

Test the ICE configuration:

```bash
# Test the configuration
python scripts/test_ice_config.py

# Run the demo
python scripts/demo_ice_config.py
```

## Configuration Options

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TURN_SERVER_COUNT` | Number of additional TURN servers | No | `2` |
| `TURN_SERVER_N_URLS` | URLs for TURN server N | No | `turn:server.com:3478?transport=udp` |
| `TURN_SERVER_N_USERNAME` | Username for TURN server N | No | `your_username` |
| `TURN_SERVER_N_CREDENTIAL` | Password for TURN server N | No | `your_password` |

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

### ICE Configuration Usage

```python
from src.config.ice_config import ice_config

# Get ICE configuration for frontend
config = ice_config.get_ice_config()

# Get ICE servers for server-side use
servers = ice_config.get_server_ice_servers()

# Validate configuration
validation = ice_config.validate_configuration()
```

### Client-side JavaScript

```javascript
// Get ICE configuration from server
const resp = await fetch('/api/ice');
const iceConfig = await resp.json();

// Create RTCPeerConnection with ICE configuration
const pc = new RTCPeerConnection(iceConfig);
```

## Management Script

The `scripts/manage_ice_credentials.py` script provides utilities for managing credentials:

### Commands

```bash
# Generate Cloudflare TURN configuration
python scripts/manage_ice_credentials.py cloudflare username password

# Generate custom TURN server configuration
python scripts/manage_ice_credentials.py custom username password --urls "turn:server.com:3478" --server-name "My Server"
```

## Troubleshooting

### Common Issues

1. **TURN servers not working**:
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
