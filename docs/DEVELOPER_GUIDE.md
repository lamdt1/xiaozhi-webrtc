# XiaoZhi WebRTC - Developer Guide

## 🛠️ Development Environment Setup

### Prerequisites
- Python 3.9+
- Node.js 16+ (for frontend development)
- Git
- Docker (optional)
- Modern web browser

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/dairoot/xiaozhi-webrtc.git
cd xiaozhi-webrtc
```

#### 2. Python Environment
```bash
# Install uv (recommended)
pip install uv

# Create virtual environment and install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows
```

#### 3. Frontend Dependencies
```bash
# Install frontend dependencies (if needed)
npm install
```

#### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### Development Server
```bash
# Start development server
uv run main.py

# Or with debug mode
DEBUG=1 uv run main.py
```

## 🏗️ Project Structure

```
xiaozhi-webrtc/
├── src/                    # Source code
│   ├── __init__.py        # Main application entry
│   ├── server.py          # WebRTC server implementation
│   ├── config/            # Configuration modules
│   │   ├── __init__.py
│   │   ├── echo_config.py # Echo cancellation config
│   │   └── ice_config.py  # ICE server config
│   ├── audio/             # Audio processing
│   │   ├── __init__.py
│   │   ├── echo_canceller.py    # Echo cancellation
│   │   ├── echo_manager.py      # Echo management
│   │   └── usage_example.py     # Usage examples
│   ├── track/             # Media track handling
│   │   ├── audio.py       # Audio track processing
│   │   └── video.py       # Video track processing
│   ├── static/            # Static assets
│   │   ├── js/            # JavaScript libraries
│   │   ├── hiyori_pro_zh/ # Live2D character assets
│   │   └── images/        # Images and icons
│   ├── index.html         # Main application page
│   ├── chat.html          # Chat interface
│   └── chatv2.html        # Enhanced chat interface
├── docs/                  # Documentation
├── tests/                 # Test files
├── docker-compose.yml     # Docker configuration
├── Dockerfile            # Docker image
├── pyproject.toml        # Python project config
├── main.py               # Application entry point
└── README.md             # Project documentation
```

## 🔧 Core Components

### 1. WebRTC Server (`src/server.py`)

The main server implementation handling WebRTC connections:

```python
class XiaoZhiServer:
    def __init__(self, pc):
        self.pc = pc
        self.channel = pc.createDataChannel("chat")
        self.server = None
    
    async def start(self):
        # Initialize XiaoZhi AI service
        pass
    
    def mcp_tool_func(self):
        # Define MCP tools
        pass
```

**Key Features**:
- WebRTC peer connection management
- Data channel communication
- MCP tool integration
- Audio/video track handling

### 2. Audio Processing (`src/audio/`)

#### Echo Cancellation (`echo_canceller.py`)
```python
class EchoCanceller:
    def __init__(self):
        self.adaptive_filter = None
        self.reference_buffer = None
    
    def process(self, microphone_signal, reference_signal):
        # Echo cancellation processing
        pass
```

#### Echo Manager (`echo_manager.py`)
```python
class EchoCancellationManager:
    def __init__(self, enable_echo_cancellation=True):
        self.echo_canceller = EchoCanceller()
        self.enable_echo_cancellation = enable_echo_cancellation
    
    def process_microphone_audio(self, pcm_data):
        # Process microphone audio with echo cancellation
        pass
```

### 3. Media Track Processing (`src/track/`)

#### Audio Track (`audio.py`)
```python
class AudioFaceSwapper(AudioStreamTrack):
    def __init__(self, xiaozhi, track):
        super().__init__()
        self.track = track
        self.echo_manager = EchoCancellationManager()
    
    async def recv(self):
        # Process audio frames
        pass
```

#### Video Track (`video.py`)
```python
class VideoFaceSwapper(VideoStreamTrack):
    def __init__(self, xiaozhi, track):
        super().__init__()
        self.track = track
        self.face_detector = None
    
    async def recv(self):
        # Process video frames
        pass
```

### 4. Configuration (`src/config/`)

#### ICE Configuration (`ice_config.py`)
```python
class IceConfig:
    def get_ice_config(self):
        # Return ICE server configuration
        pass
    
    def get_server_ice_servers(self):
        # Return server ICE servers
        pass
```

#### Echo Configuration (`echo_config.py`)
```python
class EchoConfig:
    def __init__(self):
        self.enable_echo_cancellation = True
        self.min_energy_ratio = 0.1
        self.min_original_rms = 100
```

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                  # Unit tests
│   ├── test_audio.py     # Audio processing tests
│   ├── test_video.py     # Video processing tests
│   └── test_server.py    # Server tests
├── integration/           # Integration tests
│   ├── test_webrtc.py    # WebRTC integration tests
│   └── test_ai.py        # AI integration tests
├── load/                  # Load tests
│   └── test_performance.py
└── fixtures/              # Test fixtures
    ├── audio_samples/     # Audio test files
    └── video_samples/     # Video test files
```

### Running Tests
```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/unit/
pytest tests/integration/
pytest tests/load/

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_audio.py

# Run with verbose output
pytest -v

# Run with debug output
pytest -s
```

### Test Examples

#### Unit Test Example
```python
import pytest
from src.audio.echo_canceller import EchoCanceller

class TestEchoCanceller:
    def test_initialization(self):
        canceller = EchoCanceller()
        assert canceller.adaptive_filter is None
        assert canceller.reference_buffer is None
    
    def test_echo_cancellation(self):
        canceller = EchoCanceller()
        # Test echo cancellation logic
        pass
```

#### Integration Test Example
```python
import pytest
import asyncio
from src.server import XiaoZhiServer

class TestWebRTCIntegration:
    @pytest.mark.asyncio
    async def test_connection_establishment(self):
        # Test WebRTC connection establishment
        pass
    
    @pytest.mark.asyncio
    async def test_audio_processing(self):
        # Test audio processing pipeline
        pass
```

## 🔧 Development Tools

### Code Quality Tools

#### Black (Code Formatter)
```bash
# Format code
black src/

# Check formatting
black --check src/
```

#### Flake8 (Linter)
```bash
# Lint code
flake8 src/

# Lint with specific rules
flake8 --max-line-length=88 src/
```

#### MyPy (Type Checker)
```bash
# Type check
mypy src/

# Type check with strict mode
mypy --strict src/
```

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

### Debugging

#### Debug Mode
```bash
# Enable debug mode
DEBUG=1 uv run main.py

# Enable verbose logging
LOG_LEVEL=DEBUG uv run main.py
```

#### Logging Configuration
```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

## 🚀 Deployment

### Docker Deployment

#### Build Image
```bash
# Build Docker image
docker build -t xiaozhi-webrtc .

# Build with specific tag
docker build -t xiaozhi-webrtc:latest .
```

#### Run Container
```bash
# Run container
docker run -p 51000:51000 xiaozhi-webrtc

# Run with environment variables
docker run -p 51000:51000 -e PORT=51000 xiaozhi-webrtc
```

#### Docker Compose
```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down
```

### Production Deployment

#### Environment Variables
```bash
# Production environment
export PORT=51000
export OTA_URL=wss://api.xiaozhi.dairoot.cn
export DEBUG=False
export LOG_LEVEL=INFO
```

#### Process Management
```bash
# Using systemd
sudo systemctl start xiaozhi-webrtc
sudo systemctl enable xiaozhi-webrtc

# Using PM2
pm2 start main.py --name xiaozhi-webrtc
pm2 save
pm2 startup
```

## 🔌 API Development

### Adding New Endpoints

#### 1. Define Route
```python
# In src/__init__.py
async def new_endpoint(request):
    # Handle request
    return web.Response(text="Hello World")

# Register route
app.router.add_get("/api/new", new_endpoint)
```

#### 2. Add WebSocket Handler
```python
# In src/server.py
async def handle_websocket_message(message):
    if message["type"] == "new_message_type":
        # Handle new message type
        pass
```

#### 3. Add MCP Tool
```python
# In src/server.py
def tool_new_function(data):
    # Implement new tool
    return result, is_binary

# Register tool
tools.append(tool_new_function)
```

### API Testing
```python
import pytest
from aiohttp.test_utils import TestClient

@pytest.mark.asyncio
async def test_new_endpoint():
    async with TestClient(app) as client:
        async with client.get("/api/new") as resp:
            assert resp.status == 200
            text = await resp.text()
            assert text == "Hello World"
```

## 🎨 Frontend Development

### Live2D Integration

#### Character Loading
```javascript
// Load Live2D character
const model = new Live2DModel();
await model.load('static/hiyori_pro_zh/hiyori_pro_t11.model3.json');
```

#### Animation Control
```javascript
// Control character animations
model.startMotion('motion_group', 'motion_name');

// Set character expression
model.setExpression('expression_name');
```

### WebRTC Client

#### Connection Setup
```javascript
// Create peer connection
const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Handle data channel
pc.ondatachannel = (event) => {
    const channel = event.channel;
    channel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };
};
```

#### Audio/Video Handling
```javascript
// Get user media
const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
});

// Add tracks to peer connection
stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
});
```

## 🔧 Configuration Management

### Environment Configuration
```python
# config/settings.py
import os

class Settings:
    PORT = int(os.getenv('PORT', 51000))
    OTA_URL = os.getenv('OTA_URL', 'wss://api.xiaozhi.dairoot.cn')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
```

### Feature Flags
```python
# config/features.py
class FeatureFlags:
    ENABLE_ECHO_CANCELLATION = True
    ENABLE_LIVE2D = True
    ENABLE_EMOJI_OVERLAY = True
    ENABLE_DEVICE_CONTROL = True
```

## 📊 Monitoring & Logging

### Application Metrics
```python
# metrics.py
import time
from collections import defaultdict

class Metrics:
    def __init__(self):
        self.counters = defaultdict(int)
        self.timers = defaultdict(list)
    
    def increment(self, metric_name):
        self.counters[metric_name] += 1
    
    def timer(self, metric_name, duration):
        self.timers[metric_name].append(duration)
```

### Logging Configuration
```python
# logging_config.py
import logging
import sys

def setup_logging(level=logging.INFO):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('xiaozhi-webrtc.log')
        ]
    )
```

## 🐛 Debugging Guide

### Common Issues

#### WebRTC Connection Issues
```python
# Debug WebRTC connection
@pc.on("connectionstatechange")
def on_connectionstatechange():
    print(f"Connection state: {pc.connectionState}")
    if pc.connectionState == "failed":
        print("Connection failed - check ICE servers")
```

#### Audio Processing Issues
```python
# Debug audio processing
def debug_audio_processing(pcm_data):
    print(f"Audio data shape: {pcm_data.shape}")
    print(f"Audio data range: {pcm_data.min()} to {pcm_data.max()}")
    print(f"Audio data type: {pcm_data.dtype}")
```

#### Memory Issues
```python
# Monitor memory usage
import psutil
import gc

def monitor_memory():
    process = psutil.Process()
    memory_info = process.memory_info()
    print(f"Memory usage: {memory_info.rss / 1024 / 1024:.2f} MB")
    
    # Force garbage collection
    gc.collect()
```

## 📚 Additional Resources

### Documentation
- [WebRTC Documentation](https://webrtc.org/getting-started/)
- [aiortc Documentation](https://aiortc.readthedocs.io/)
- [Live2D Documentation](https://docs.live2d.com/)
- [XiaoZhi SDK Documentation](https://github.com/dairoot/xiaozhi-sdk)

### Community
- [GitHub Repository](https://github.com/dairoot/xiaozhi-webrtc)
- [Issue Tracker](https://github.com/dairoot/xiaozhi-webrtc/issues)
- [Discussions](https://github.com/dairoot/xiaozhi-webrtc/discussions)

### Contributing
- Fork the repository
- Create a feature branch
- Make your changes
- Add tests
- Submit a pull request
