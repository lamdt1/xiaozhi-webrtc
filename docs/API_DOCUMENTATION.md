# XiaoZhi WebRTC - API Documentation

## 🌐 API Overview

The XiaoZhi WebRTC API provides endpoints for real-time audio/video communication, AI interaction, and Live2D character control.

**Base URL**: `https://yourdomain.com` (Production) | `http://localhost:51000` (Development)

## 📡 REST API Endpoints

### 1. **GET /** - Main Application
Returns the main application interface.

**Response**: HTML page with WebRTC client interface

**Example**:
```bash
curl -X GET http://localhost:51000/
```

### 2. **GET /chat** - Chat Interface
Returns the basic chat interface.

**Response**: HTML page with chat functionality

**Example**:
```bash
curl -X GET http://localhost:51000/chat
```

### 3. **GET /chatv2** - Enhanced Chat Interface
Returns the enhanced chat interface with advanced features.

**Response**: HTML page with enhanced chat functionality

**Example**:
```bash
curl -X GET http://localhost:51000/chatv2
```

### 4. **GET /api/ice** - ICE Server Configuration
Returns ICE server configuration for WebRTC connection establishment.

**Response**:
```json
{
  "iceServers": [
    {
      "urls": "stun:stun.l.google.com:19302"
    },
    {
      "urls": "turn:your-turn-server.com:3478",
      "username": "user",
      "credential": "pass"
    }
  ]
}
```

**Example**:
```bash
curl -X GET http://localhost:51000/api/ice
```

### 5. **POST /api/offer** - WebRTC Offer Handling
Handles WebRTC offer from client and returns answer.

**Request Body**:
```json
{
  "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\n...",
  "type": "offer",
  "macAddress": "00:00:00:00:00:00"
}
```

**Response**:
```json
{
  "sdp": "v=0\r\no=- 9876543210 2 IN IP4 127.0.0.1\r\n...",
  "type": "answer"
}
```

**Example**:
```bash
curl -X POST http://localhost:51000/api/offer \
  -H "Content-Type: application/json" \
  -d '{
    "sdp": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\n...",
    "type": "offer",
    "macAddress": "00:00:00:00:00:00"
  }'
```

## 🔌 WebSocket API

### XiaoZhi AI Service Connection
**Endpoint**: `wss://api.xiaozhi.dairoot.cn`

**Connection Parameters**:
- `ota_url`: OTA update URL
- `audio_sample_rate`: 48000
- `audio_channels`: 2
- `audio_frame_duration`: 20

**Message Types**:

#### 1. **Connection Initialization**
```json
{
  "type": "init",
  "mac_address": "00:00:00:00:00:00",
  "audio_config": {
    "sample_rate": 48000,
    "channels": 2,
    "frame_duration": 20
  }
}
```

#### 2. **Audio Data**
```json
{
  "type": "audio",
  "data": "base64_encoded_audio_data",
  "timestamp": 1234567890
}
```

#### 3. **Text Message**
```json
{
  "type": "text",
  "content": "Hello, how are you?",
  "timestamp": 1234567890
}
```

#### 4. **Wake Word**
```json
{
  "type": "wake_word",
  "text": "patted your head",
  "timestamp": 1234567890
}
```

#### 5. **LLM Response**
```json
{
  "type": "llm",
  "text": "I'm doing great, thank you for asking!",
  "timestamp": 1234567890
}
```

#### 6. **Tool Execution**
```json
{
  "type": "tool",
  "text": "set_volume",
  "value": 75
}
```

## 📱 Data Channel API

### Message Types

#### 1. **Touch Interaction**
```json
{
  "event": "doublehit",
  "area": "Head"
}
```

**Available Events**:
- `doublehit`: Double tap interaction
- `swipe`: Swipe gesture

**Available Areas**:
- `Head`: Character head area
- `Face`: Character face area
- `Body`: Character body area

#### 2. **Device Control**
```json
{
  "type": "tool",
  "text": "set_volume",
  "value": 75
}
```

**Available Tools**:
- `set_volume`: Set device volume (0-100)
- `open_tab`: Open browser tab with URL
- `stop_music`: Stop currently playing music
- `get_device_status`: Get device status information
- `take_photo`: Capture photo from camera
- `search_custom_music`: Search for music
- `play_custom_music`: Play custom music

#### 3. **Device Status Response**
```json
{
  "audio_speaker": {
    "volume": 100
  },
  "screen": {
    "brightness": 75,
    "theme": "light"
  },
  "network": {
    "type": "wifi",
    "ssid": "wifi_name",
    "signal": "strong"
  }
}
```

## 🎵 Audio Processing API

### Audio Configuration
```python
# Audio parameters
SAMPLE_RATE = 48000
CHANNELS = 2
FRAME_DURATION = 20  # milliseconds
FRAME_SIZE = 960  # samples per frame
```

### Echo Cancellation
```python
# Echo cancellation parameters
ENABLE_ECHO_CANCELLATION = True
MIN_ENERGY_RATIO = 0.1
MIN_ORIGINAL_RMS = 100
MIX_RATIO = 0.3
```

### Audio Format Conversion
- **Input**: 16-bit PCM, 48kHz, Stereo
- **Processing**: Float32, 48kHz, Mono
- **Output**: 16-bit PCM, 48kHz, Stereo

## 🎬 Video Processing API

### Video Configuration
```python
# Video parameters
VIDEO_WIDTH = 640
VIDEO_HEIGHT = 480
VIDEO_FPS = 30
VIDEO_CODEC = "VP8"
```

### Face Swapping
```python
# Face detection parameters
FACE_DETECTION_CONFIDENCE = 0.5
FACE_SWAP_THRESHOLD = 0.7
EMOJI_OVERLAY_ENABLED = True
```

## 🔧 MCP Tools API

### Available MCP Tools

#### 1. **Take Photo**
```python
def take_photo(data):
    """
    Capture photo from camera
    Returns: image_bytes, is_binary
    """
    pass
```

#### 2. **Get Device Status**
```python
def get_device_status(data):
    """
    Get current device status
    Returns: status_json, is_binary
    """
    pass
```

#### 3. **Set Volume**
```python
def set_volume(data):
    """
    Set device volume
    Args: data["volume"] (0-100)
    Returns: response, is_binary
    """
    pass
```

#### 4. **Open Tab**
```python
def open_tab(data):
    """
    Open browser tab
    Args: data["url"] (URL to open)
    Returns: response, is_binary
    """
    pass
```

#### 5. **Stop Music**
```python
def stop_music(data):
    """
    Stop currently playing music
    Returns: response, is_binary
    """
    pass
```

## 📊 Error Handling

### HTTP Status Codes
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Endpoint not found
- `500 Internal Server Error`: Server error

### WebSocket Error Codes
- `1000`: Normal closure
- `1001`: Going away
- `1002`: Protocol error
- `1003`: Unsupported data
- `1006`: Abnormal closure
- `1011`: Server error

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request data",
    "details": "Missing required field: sdp"
  }
}
```

## 🔒 Authentication & Security

### HTTPS Requirements
- All production endpoints require HTTPS
- WebRTC requires secure context for media access
- WebSocket connections use WSS protocol

### CORS Configuration
```python
# CORS headers
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Rate Limiting
- WebRTC connections: 10 per IP per minute
- API requests: 100 per IP per minute
- WebSocket messages: 1000 per connection per minute

## 📈 Performance Metrics

### Connection Metrics
- **Connection Time**: Average time to establish WebRTC connection
- **Audio Latency**: End-to-end audio processing delay
- **Video Latency**: End-to-end video processing delay
- **Connection Stability**: Connection uptime percentage

### Processing Metrics
- **Audio Quality**: Echo cancellation effectiveness
- **Video Quality**: Face detection accuracy
- **AI Response Time**: Average AI processing time
- **Memory Usage**: System memory consumption

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
pytest tests/unit/

# Run with coverage
pytest --cov=src tests/unit/
```

### Integration Tests
```bash
# Run integration tests
pytest tests/integration/

# Run WebRTC tests
pytest tests/webrtc/
```

### Load Tests
```bash
# Run load tests
pytest tests/load/

# Run stress tests
pytest tests/stress/
```

## 📚 SDK Examples

### JavaScript Client
```javascript
// Initialize WebRTC connection
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Handle data channel messages
pc.ondatachannel = (event) => {
  const channel = event.channel;
  channel.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
  };
};
```

### Python Client
```python
import asyncio
import websockets
import json

async def connect_to_xiaozhi():
    uri = "wss://api.xiaozhi.dairoot.cn"
    async with websockets.connect(uri) as websocket:
        # Send initialization message
        init_message = {
            "type": "init",
            "mac_address": "00:00:00:00:00:00"
        }
        await websocket.send(json.dumps(init_message))
        
        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")
```

## 🔄 Webhook Integration

### Event Webhooks
```json
{
  "event": "connection.established",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "client_ip": "192.168.1.100",
    "mac_address": "00:00:00:00:00:00",
    "connection_id": "conn_123456"
  }
}
```

### Available Events
- `connection.established`: WebRTC connection established
- `connection.closed`: WebRTC connection closed
- `audio.processed`: Audio processing completed
- `video.processed`: Video processing completed
- `ai.response`: AI response generated
- `tool.executed`: MCP tool executed
