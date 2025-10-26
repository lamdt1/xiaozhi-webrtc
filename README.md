[![Banners](docs/images/banner.png)](https://github.com/dairoot/xiaozhi-webrtc)

# XiaoZhi WebRTC

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

An AI real-time audio-video interaction project based on **WebRTC**, dedicated to creating your exclusive, caring and warm emotional companion.

---

## ✨ Features
- **XiaoZhi Core Capabilities**: Integrates visual multimodal understanding, intelligent Q&A and MCP control for more powerful interaction and processing capabilities.
- **Real-time Audio-Video Communication**: Ultra-low latency and high-definition experience for smooth and natural communication.
- **Live2D Dynamic Presentation**: Realistic interaction and immersive performance to enhance affinity and interactivity.
---

## 🎯 Online Experience

[https://xiaozhi.dairoot.cn](https://xiaozhi.dairoot.cn)

> 💡 **Note**: Due to deployment on overseas servers, access may be slightly slow (experience only)

https://github.com/user-attachments/assets/d985aacc-b07d-4874-a10a-c2139bd6c4bf

---

## 🚀 Quick Start

```bash
# Clone project
git clone https://github.com/dairoot/xiaozhi-webrtc.git
cd xiaozhi-webrtc
```

#### Method 1: Using uv (Recommended)

```bash
# Install uv
pip install uv

# Install project dependencies
uv sync

# Run project
uv run main.py
```

#### Method 2: Using Docker

```bash
# Run with Docker Compose
docker compose up
```

#### Method 3: Traditional pip installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

# Install dependencies
pip install -e .

# Run project
python main.py
```
---

## ⚙️ Deployment Requirements

### Port Requirements

WebRTC requires the following ports for real-time audio-video communication:

| Port | Protocol | Purpose |
|------|------|------|
| 3478 | UDP | STUN Service |
| 49152–65535 | UDP | WebRTC Media Stream Port (Default) |

**Note:** Ensure firewall allows communication on these ports, especially when deploying in production environments.


### HTTPS Requirements

**HTTPS must be used in production environments**: WebRTC needs access to cameras and microphones, and modern browsers only allow these features in HTTPS environments for security reasons.

## 📖 Usage Instructions

1. **Start service**: After running the project, the service will start at `http://localhost:51000` or `https://yourdomain.com`
2. **Access page**: Open the above address in a browser
3. **Authorize permissions**: Allow the browser to access camera and microphone
4. **Start communication**: Click the start button to establish WebRTC connection

**Note**: HTTPS must be used in production environments, otherwise WebRTC functionality will not work properly.

---
## 🫡 Acknowledgements
- Xiaoge [xiaozhi-esp32](https://github.com/78/xiaozhi-esp32) project
