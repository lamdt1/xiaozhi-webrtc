# XiaoZhi WebRTC - User Guide

## 🎯 Getting Started

### What is XiaoZhi WebRTC?
XiaoZhi WebRTC is an AI-powered real-time audio/video interaction platform that features a Live2D character companion. It combines advanced WebRTC technology with AI capabilities to create an immersive, interactive experience.

### Key Features
- **Real-time Communication**: Ultra-low latency audio/video streaming
- **AI Companion**: Intelligent conversation and interaction
- **Live2D Character**: Animated character with emotional expressions
- **Touch Interaction**: Interactive character responses to touch
- **Device Control**: Control your device through voice commands
- **Echo Cancellation**: Advanced audio processing for clear communication

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Microphone and camera access
- Stable internet connection
- HTTPS connection (required for production)

### Installation

#### Option 1: Local Development
```bash
# Clone the repository
git clone https://github.com/dairoot/xiaozhi-webrtc.git
cd xiaozhi-webrtc

# Install dependencies
pip install uv
uv sync

# Run the application
uv run main.py
```

#### Option 2: Docker
```bash
# Clone the repository
git clone https://github.com/dairoot/xiaozhi-webrtc.git
cd xiaozhi-webrtc

# Run with Docker Compose
docker compose up
```

#### Option 3: Production Deployment
```bash
# Install dependencies
pip install -e .

# Run the application
python main.py
```

### Accessing the Application
1. Open your web browser
2. Navigate to `http://localhost:51000` (development) or `https://yourdomain.com` (production)
3. Allow microphone and camera access when prompted
4. Click "Start" to begin the interaction

## 🎮 User Interface Guide

### Main Interface
The main interface consists of several key components:

#### 1. **Live2D Character Display**
- **Location**: Center of the screen
- **Features**: 
  - Animated character with emotional expressions
  - Responds to touch interactions
  - Shows different expressions based on conversation

#### 2. **Control Panel**
- **Start/Stop Button**: Begin or end the session
- **Settings Button**: Access configuration options
- **Volume Control**: Adjust audio levels

#### 3. **Status Indicators**
- **Connection Status**: Shows WebRTC connection state
- **Audio Level**: Visual indicator of microphone input
- **AI Status**: Shows when AI is processing

### Touch Interactions

#### Double Tap (Double Hit)
- **Head**: Gently pats the character's head
- **Face**: Gently touches the character's face
- **Body**: Gently pats the character's body

#### Swipe Gestures
- **Head**: Swipes across the character's head
- **Face**: Swipes across the character's face

### Voice Commands

#### Basic Commands
- **"Hello"**: Greet the character
- **"How are you?"**: Ask about the character's status
- **"Tell me a story"**: Request a story
- **"Sing a song"**: Ask for music

#### Device Control Commands
- **"Set volume to 50"**: Adjust device volume
- **"Open YouTube"**: Open a website
- **"Stop music"**: Stop currently playing audio
- **"Take a photo"**: Capture a photo

## 🔧 Configuration

### Audio Settings
```python
# Audio configuration
SAMPLE_RATE = 48000
CHANNELS = 2
FRAME_DURATION = 20
```

### Video Settings
```python
# Video configuration
WIDTH = 640
HEIGHT = 480
FPS = 30
```

### Echo Cancellation
```python
# Echo cancellation settings
ENABLE_ECHO_CANCELLATION = True
MIN_ENERGY_RATIO = 0.1
MIN_ORIGINAL_RMS = 100
MIX_RATIO = 0.3
```

## 🎵 Audio Features

### Echo Cancellation
The system includes advanced echo cancellation to prevent audio feedback:

- **Automatic Detection**: Detects and removes echo automatically
- **Adaptive Processing**: Adjusts to different acoustic environments
- **Quality Monitoring**: Monitors audio quality in real-time
- **Safety Checks**: Prevents over-suppression of audio

### Audio Processing Pipeline
1. **Capture**: Microphone input
2. **Echo Cancellation**: Remove echo and feedback
3. **Noise Suppression**: Reduce background noise
4. **AI Processing**: Send to AI for analysis
5. **Response Audio**: Play AI response
6. **Output**: Speaker output

## 🎬 Video Features

### Face Swapping
The system can overlay character expressions on your face:

- **Real-time Processing**: Live face detection and overlay
- **Emotion Recognition**: Detects your emotions
- **Character Expressions**: Shows character's emotional state
- **Smooth Animation**: Fluid transitions between expressions

### Video Processing Pipeline
1. **Capture**: Camera input
2. **Face Detection**: Detect faces in video
3. **Expression Analysis**: Analyze facial expressions
4. **Character Overlay**: Apply character expressions
5. **Output**: Display processed video

## 🤖 AI Interaction

### Conversation Features
- **Natural Language Processing**: Understands natural speech
- **Context Awareness**: Remembers conversation history
- **Emotional Intelligence**: Responds with appropriate emotions
- **Multi-modal Understanding**: Processes both audio and visual cues

### MCP Tools Integration
The system includes various tools for device control:

#### Device Control
- **Volume Control**: Adjust system volume
- **Screen Control**: Change brightness and theme
- **Network Control**: Monitor network status

#### Media Control
- **Music Playback**: Play and control music
- **Photo Capture**: Take photos with camera
- **Tab Management**: Open and manage browser tabs

#### Information Retrieval
- **Device Status**: Get current device information
- **System Information**: Retrieve system details
- **Network Status**: Check network connectivity

## 🔒 Security & Privacy

### Data Protection
- **Local Processing**: Audio/video processed locally when possible
- **Encrypted Communication**: All data encrypted in transit
- **No Data Storage**: Conversations not stored permanently
- **Privacy Controls**: User controls what data is shared

### Security Features
- **HTTPS Required**: Secure connections only
- **Permission Management**: Granular permission controls
- **Session Management**: Secure session handling
- **Input Validation**: All inputs validated and sanitized

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
**Issue**: Cannot establish WebRTC connection
**Solutions**:
- Check internet connection
- Ensure HTTPS is enabled
- Verify firewall settings
- Check STUN/TURN server configuration

#### Audio Issues
**Issue**: No audio or poor audio quality
**Solutions**:
- Check microphone permissions
- Verify audio device selection
- Adjust audio levels
- Check echo cancellation settings

#### Video Issues
**Issue**: No video or poor video quality
**Solutions**:
- Check camera permissions
- Verify camera device selection
- Ensure good lighting
- Check video resolution settings

#### AI Not Responding
**Issue**: AI not responding to voice commands
**Solutions**:
- Check microphone input levels
- Verify wake word detection
- Check network connection to AI service
- Restart the application

### Performance Optimization

#### Audio Optimization
- Use high-quality microphone
- Minimize background noise
- Adjust echo cancellation settings
- Monitor audio levels

#### Video Optimization
- Ensure good lighting
- Use stable camera position
- Adjust video resolution if needed
- Close unnecessary applications

#### Network Optimization
- Use stable internet connection
- Minimize network latency
- Use wired connection if possible
- Close bandwidth-intensive applications

## 📱 Mobile Support

### Mobile Browsers
- **Chrome Mobile**: Full support
- **Safari Mobile**: Full support
- **Firefox Mobile**: Full support
- **Edge Mobile**: Full support

### Mobile-Specific Features
- **Touch Gestures**: Optimized for touch interaction
- **Responsive Design**: Adapts to different screen sizes
- **Mobile Permissions**: Handles mobile permission requests
- **Performance Optimization**: Optimized for mobile devices

### Mobile Limitations
- **Battery Usage**: May drain battery faster
- **Data Usage**: Uses significant data for video streaming
- **Performance**: May be slower on older devices
- **Permissions**: Requires camera and microphone access

## 🔄 Updates & Maintenance

### Automatic Updates
- **OTA Updates**: Over-the-air updates for AI models
- **Feature Updates**: New features added regularly
- **Security Updates**: Security patches applied automatically
- **Bug Fixes**: Bugs fixed in regular updates

### Manual Updates
```bash
# Update dependencies
uv sync

# Update application
git pull origin main
uv run main.py
```

### Version Management
- **Semantic Versioning**: Uses semantic versioning
- **Backward Compatibility**: Maintains backward compatibility
- **Migration Guides**: Provides migration guides for major updates
- **Rollback Support**: Supports rollback to previous versions

## 📞 Support & Community

### Getting Help
- **Documentation**: Comprehensive documentation available
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Join the community discussion
- **Email Support**: Direct support via email

### Contributing
- **Code Contributions**: Submit pull requests
- **Bug Reports**: Report issues and bugs
- **Feature Requests**: Suggest new features
- **Documentation**: Help improve documentation

### Resources
- **GitHub Repository**: https://github.com/dairoot/xiaozhi-webrtc
- **Live Demo**: https://xiaozhi.dairoot.cn
- **Documentation**: https://github.com/dairoot/xiaozhi-webrtc/docs
- **Community**: https://github.com/dairoot/xiaozhi-webrtc/discussions

## 🎯 Best Practices

### For Users
- **Stable Connection**: Use stable internet connection
- **Good Environment**: Use in quiet environment for better AI interaction
- **Regular Updates**: Keep application updated
- **Privacy Awareness**: Be aware of privacy settings

### For Developers
- **Code Quality**: Follow coding standards
- **Testing**: Write comprehensive tests
- **Documentation**: Keep documentation updated
- **Security**: Follow security best practices

### For Administrators
- **Monitoring**: Monitor system performance
- **Backups**: Regular backups of configuration
- **Security**: Regular security audits
- **Updates**: Keep system updated
