# XiaoZhi WebRTC - Feature Specifications

## 🎯 Feature Specification Overview

This document provides detailed specifications for the major new features identified in the feature roadmap. Each specification includes technical requirements, implementation details, acceptance criteria, and testing strategies.

## 🌍 Feature 1: Multi-Language Support

### 1.1 Feature Description
Enable XiaoZhi to communicate in multiple languages, providing localized character interactions and AI responses.

### 1.2 User Stories
- **As a user**, I want to select my preferred language so that I can interact with XiaoZhi in my native language
- **As a user**, I want XiaoZhi to understand and respond in my language so that our conversation feels natural
- **As a user**, I want character animations to match the language context so that the experience is culturally appropriate

### 1.3 Technical Requirements

#### Backend Requirements
```python
# Language configuration
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'zh': 'Chinese (Simplified)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ru': 'Russian'
}

# Language detection
class LanguageDetector:
    def detect_language(self, text: str) -> str:
        """Detect language from input text"""
        pass
    
    def get_language_confidence(self, text: str) -> float:
        """Get confidence score for language detection"""
        pass

# Multi-language AI integration
class MultiLanguageAI:
    def __init__(self, language: str):
        self.language = language
        self.model = self.load_language_model(language)
    
    def process_text(self, text: str) -> str:
        """Process text in specific language"""
        pass
    
    def generate_response(self, context: str) -> str:
        """Generate response in specific language"""
        pass
```

#### Frontend Requirements
```javascript
// Language selection UI
class LanguageSelector {
    constructor() {
        this.currentLanguage = 'en';
        this.supportedLanguages = SUPPORTED_LANGUAGES;
    }
    
    showLanguageMenu() {
        // Display language selection menu
    }
    
    changeLanguage(languageCode) {
        // Change application language
        this.currentLanguage = languageCode;
        this.updateUI();
        this.notifyBackend(languageCode);
    }
    
    updateUI() {
        // Update all UI elements to new language
    }
}

// Localized character animations
class LocalizedCharacter {
    constructor(language) {
        this.language = language;
        this.animations = this.loadLanguageAnimations(language);
    }
    
    playLocalizedAnimation(emotion, context) {
        // Play animation appropriate for language/culture
    }
}
```

### 1.4 API Specifications

#### Language Detection Endpoint
```http
POST /api/detect-language
Content-Type: application/json

{
    "text": "Hello, how are you?",
    "fallback_language": "en"
}

Response:
{
    "language": "en",
    "confidence": 0.95,
    "alternatives": [
        {"language": "en", "confidence": 0.95},
        {"language": "es", "confidence": 0.03}
    ]
}
```

#### Language Configuration Endpoint
```http
POST /api/set-language
Content-Type: application/json

{
    "language": "zh",
    "user_id": "user_123"
}

Response:
{
    "success": true,
    "language": "zh",
    "character_assets_updated": true
}
```

### 1.5 Database Schema
```sql
-- User language preferences
CREATE TABLE user_language_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Language-specific character assets
CREATE TABLE character_assets (
    id SERIAL PRIMARY KEY,
    language_code VARCHAR(5) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    asset_path VARCHAR(500) NOT NULL,
    metadata JSONB
);

-- Localized responses
CREATE TABLE localized_responses (
    id SERIAL PRIMARY KEY,
    response_key VARCHAR(100) NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    response_text TEXT NOT NULL,
    context VARCHAR(100)
);
```

### 1.6 Acceptance Criteria
- [ ] User can select from 8 supported languages
- [ ] Language detection accuracy > 90% for supported languages
- [ ] Character animations adapt to cultural context
- [ ] AI responses are culturally appropriate
- [ ] Language switching works without page reload
- [ ] Performance impact < 100ms for language switching

### 1.7 Testing Strategy
```python
# Unit tests
def test_language_detection():
    detector = LanguageDetector()
    assert detector.detect_language("Hello") == "en"
    assert detector.detect_language("你好") == "zh"

# Integration tests
def test_multi_language_ai():
    ai_en = MultiLanguageAI("en")
    ai_zh = MultiLanguageAI("zh")
    
    response_en = ai_en.generate_response("How are you?")
    response_zh = ai_zh.generate_response("你好吗？")
    
    assert response_en is not None
    assert response_zh is not None

# Performance tests
def test_language_switching_performance():
    start_time = time.time()
    language_selector.changeLanguage("zh")
    end_time = time.time()
    
    assert (end_time - start_time) < 0.1  # < 100ms
```

## 🎭 Feature 2: Advanced Emotion Recognition

### 2.1 Feature Description
Implement real-time emotion recognition from facial expressions and voice to create more responsive and emotionally intelligent character interactions.

### 2.2 User Stories
- **As a user**, I want XiaoZhi to recognize my emotions so that she can respond appropriately
- **As a user**, I want character expressions to mirror my emotions so that the interaction feels more natural
- **As a user**, I want XiaoZhi to remember my emotional state so that conversations feel continuous

### 2.3 Technical Requirements

#### Emotion Recognition Pipeline
```python
# Facial emotion recognition
class FacialEmotionRecognizer:
    def __init__(self):
        self.model = self.load_emotion_model()
        self.face_detector = self.load_face_detector()
    
    def detect_emotions(self, frame: np.ndarray) -> Dict[str, float]:
        """Detect emotions from facial expressions"""
        faces = self.face_detector.detect_faces(frame)
        emotions = {}
        
        for face in faces:
            face_roi = self.extract_face_roi(frame, face)
            emotion_scores = self.model.predict(face_roi)
            emotions.update(emotion_scores)
        
        return emotions
    
    def get_dominant_emotion(self, emotions: Dict[str, float]) -> str:
        """Get the most prominent emotion"""
        return max(emotions.items(), key=lambda x: x[1])[0]

# Voice emotion recognition
class VoiceEmotionRecognizer:
    def __init__(self):
        self.model = self.load_voice_emotion_model()
        self.feature_extractor = VoiceFeatureExtractor()
    
    def detect_emotions(self, audio_data: np.ndarray) -> Dict[str, float]:
        """Detect emotions from voice characteristics"""
        features = self.feature_extractor.extract_features(audio_data)
        emotions = self.model.predict(features)
        return emotions

# Combined emotion analysis
class EmotionAnalyzer:
    def __init__(self):
        self.facial_recognizer = FacialEmotionRecognizer()
        self.voice_recognizer = VoiceEmotionRecognizer()
        self.emotion_history = []
    
    def analyze_emotions(self, video_frame: np.ndarray, audio_data: np.ndarray) -> EmotionState:
        """Analyze emotions from both visual and audio cues"""
        facial_emotions = self.facial_recognizer.detect_emotions(video_frame)
        voice_emotions = self.voice_recognizer.detect_emotions(audio_data)
        
        # Combine and weight emotions
        combined_emotions = self.combine_emotions(facial_emotions, voice_emotions)
        
        # Update emotion history
        self.emotion_history.append(combined_emotions)
        
        return EmotionState(
            current_emotions=combined_emotions,
            dominant_emotion=self.get_dominant_emotion(combined_emotions),
            emotion_trend=self.analyze_emotion_trend(),
            confidence=self.calculate_confidence(combined_emotions)
        )
```

#### Character Emotion Response System
```python
# Character emotion mapping
class CharacterEmotionMapper:
    def __init__(self):
        self.emotion_animations = {
            'happy': ['motion_happy_01', 'motion_happy_02'],
            'sad': ['motion_sad_01', 'motion_sad_02'],
            'angry': ['motion_angry_01', 'motion_angry_02'],
            'surprised': ['motion_surprised_01', 'motion_surprised_02'],
            'fearful': ['motion_fearful_01', 'motion_fearful_02'],
            'disgusted': ['motion_disgusted_01', 'motion_disgusted_02'],
            'neutral': ['motion_idle_01', 'motion_idle_02']
        }
        
        self.emotion_expressions = {
            'happy': 'expression_happy',
            'sad': 'expression_sad',
            'angry': 'expression_angry',
            'surprised': 'expression_surprised',
            'fearful': 'expression_fearful',
            'disgusted': 'expression_disgusted',
            'neutral': 'expression_neutral'
        }
    
    def get_character_response(self, emotion_state: EmotionState) -> CharacterResponse:
        """Get appropriate character response based on emotion"""
        dominant_emotion = emotion_state.dominant_emotion
        confidence = emotion_state.confidence
        
        # Select animation based on emotion and confidence
        if confidence > 0.7:
            animation = random.choice(self.emotion_animations[dominant_emotion])
        else:
            animation = random.choice(self.emotion_animations['neutral'])
        
        # Select expression
        expression = self.emotion_expressions[dominant_emotion]
        
        # Generate appropriate response text
        response_text = self.generate_emotion_response(dominant_emotion, emotion_state)
        
        return CharacterResponse(
            animation=animation,
            expression=expression,
            response_text=response_text,
            emotion_mirror=dominant_emotion
        )
```

### 2.4 API Specifications

#### Emotion Analysis Endpoint
```http
POST /api/analyze-emotions
Content-Type: application/json

{
    "video_frame": "base64_encoded_image",
    "audio_data": "base64_encoded_audio",
    "user_id": "user_123",
    "session_id": "session_456"
}

Response:
{
    "emotions": {
        "happy": 0.8,
        "sad": 0.1,
        "angry": 0.05,
        "surprised": 0.03,
        "fearful": 0.01,
        "disgusted": 0.01
    },
    "dominant_emotion": "happy",
    "confidence": 0.85,
    "emotion_trend": "increasing_happiness",
    "character_response": {
        "animation": "motion_happy_01",
        "expression": "expression_happy",
        "response_text": "You look so happy! I'm glad to see you smiling!"
    }
}
```

### 2.5 Database Schema
```sql
-- Emotion analysis history
CREATE TABLE emotion_analysis (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    facial_emotions JSONB,
    voice_emotions JSONB,
    combined_emotions JSONB,
    dominant_emotion VARCHAR(50),
    confidence FLOAT,
    character_response JSONB
);

-- Emotion patterns
CREATE TABLE emotion_patterns (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.6 Acceptance Criteria
- [ ] Emotion recognition accuracy > 85% for basic emotions
- [ ] Real-time processing with < 200ms latency
- [ ] Character responds appropriately to detected emotions
- [ ] Emotion history is maintained across sessions
- [ ] System adapts to user's emotional patterns
- [ ] Privacy: emotion data is not stored permanently

### 2.7 Testing Strategy
```python
# Unit tests
def test_facial_emotion_recognition():
    recognizer = FacialEmotionRecognizer()
    test_image = load_test_image("happy_face.jpg")
    emotions = recognizer.detect_emotions(test_image)
    assert emotions['happy'] > 0.8

# Integration tests
def test_emotion_analysis_pipeline():
    analyzer = EmotionAnalyzer()
    video_frame = load_test_video_frame()
    audio_data = load_test_audio()
    
    emotion_state = analyzer.analyze_emotions(video_frame, audio_data)
    assert emotion_state.dominant_emotion is not None
    assert emotion_state.confidence > 0.0

# Performance tests
def test_emotion_processing_performance():
    start_time = time.time()
    emotion_state = analyzer.analyze_emotions(video_frame, audio_data)
    end_time = time.time()
    
    assert (end_time - start_time) < 0.2  # < 200ms
```

## 🤖 Feature 3: Gesture Recognition System

### 3.1 Feature Description
Implement advanced gesture recognition to enable natural hand and body gesture interactions with the XiaoZhi character.

### 3.2 User Stories
- **As a user**, I want to wave at XiaoZhi so that she waves back
- **As a user**, I want to point at things so that XiaoZhi looks in that direction
- **As a user**, I want to use hand gestures to control the interface so that I don't need to touch the screen

### 3.3 Technical Requirements

#### Gesture Recognition Pipeline
```python
# Hand gesture recognition
class HandGestureRecognizer:
    def __init__(self):
        self.mediapipe_hands = mp.solutions.hands
        self.hands = self.mediapipe_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.gesture_classifier = self.load_gesture_classifier()
    
    def detect_gestures(self, frame: np.ndarray) -> List[Gesture]:
        """Detect hand gestures in video frame"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        gestures = []
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                gesture = self.classify_gesture(hand_landmarks)
                if gesture:
                    gestures.append(gesture)
        
        return gestures
    
    def classify_gesture(self, landmarks) -> Optional[Gesture]:
        """Classify hand gesture from landmarks"""
        # Extract features from hand landmarks
        features = self.extract_hand_features(landmarks)
        
        # Classify gesture
        gesture_type = self.gesture_classifier.predict(features)
        confidence = self.gesture_classifier.predict_proba(features).max()
        
        if confidence > 0.7:
            return Gesture(
                type=gesture_type,
                confidence=confidence,
                landmarks=landmarks,
                timestamp=time.time()
            )
        return None

# Body pose recognition
class BodyPoseRecognizer:
    def __init__(self):
        self.mediapipe_pose = mp.solutions.pose
        self.pose = self.mediapipe_pose.Pose(
            static_image_mode=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.pose_classifier = self.load_pose_classifier()
    
    def detect_poses(self, frame: np.ndarray) -> List[Pose]:
        """Detect body poses in video frame"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        poses = []
        if results.pose_landmarks:
            pose = self.classify_pose(results.pose_landmarks)
            if pose:
                poses.append(pose)
        
        return poses

# Gesture-to-action mapping
class GestureActionMapper:
    def __init__(self):
        self.gesture_actions = {
            'wave': self.handle_wave_gesture,
            'point': self.handle_point_gesture,
            'thumbs_up': self.handle_thumbs_up_gesture,
            'peace_sign': self.handle_peace_sign_gesture,
            'fist': self.handle_fist_gesture,
            'open_palm': self.handle_open_palm_gesture
        }
        
        self.pose_actions = {
            'nod': self.handle_nod_pose,
            'shake_head': self.handle_shake_head_pose,
            'lean_forward': self.handle_lean_forward_pose,
            'lean_back': self.handle_lean_back_pose
        }
    
    def map_gesture_to_action(self, gesture: Gesture) -> Action:
        """Map detected gesture to character action"""
        action_handler = self.gesture_actions.get(gesture.type)
        if action_handler:
            return action_handler(gesture)
        return None
    
    def map_pose_to_action(self, pose: Pose) -> Action:
        """Map detected pose to character action"""
        action_handler = self.pose_actions.get(pose.type)
        if action_handler:
            return action_handler(pose)
        return None
```

#### Character Gesture Response System
```python
# Character gesture responses
class CharacterGestureResponder:
    def __init__(self):
        self.gesture_responses = {
            'wave': {
                'animation': 'motion_wave_01',
                'expression': 'expression_happy',
                'response_text': 'Hello! I see you waving!'
            },
            'point': {
                'animation': 'motion_look_direction',
                'expression': 'expression_curious',
                'response_text': 'What are you pointing at?'
            },
            'thumbs_up': {
                'animation': 'motion_thumbs_up',
                'expression': 'expression_happy',
                'response_text': 'Great! I\'m glad you like it!'
            }
        }
    
    def generate_gesture_response(self, gesture: Gesture) -> CharacterResponse:
        """Generate character response to gesture"""
        response_config = self.gesture_responses.get(gesture.type)
        if response_config:
            return CharacterResponse(
                animation=response_config['animation'],
                expression=response_config['expression'],
                response_text=response_config['response_text'],
                gesture_type=gesture.type
            )
        return None
```

### 3.4 API Specifications

#### Gesture Recognition Endpoint
```http
POST /api/recognize-gestures
Content-Type: application/json

{
    "video_frame": "base64_encoded_image",
    "user_id": "user_123",
    "session_id": "session_456"
}

Response:
{
    "gestures": [
        {
            "type": "wave",
            "confidence": 0.85,
            "hand": "right",
            "position": {"x": 0.5, "y": 0.3}
        }
    ],
    "poses": [
        {
            "type": "nod",
            "confidence": 0.92,
            "position": {"x": 0.5, "y": 0.5}
        }
    ],
    "character_response": {
        "animation": "motion_wave_01",
        "expression": "expression_happy",
        "response_text": "Hello! I see you waving!"
    }
}
```

### 3.5 Database Schema
```sql
-- Gesture recognition history
CREATE TABLE gesture_recognition (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gesture_type VARCHAR(50),
    confidence FLOAT,
    hand_position JSONB,
    character_response JSONB
);

-- Gesture patterns
CREATE TABLE gesture_patterns (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    gesture_sequence JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.6 Acceptance Criteria
- [ ] Recognizes 6+ basic hand gestures with > 80% accuracy
- [ ] Recognizes 4+ body poses with > 85% accuracy
- [ ] Real-time processing with < 150ms latency
- [ ] Character responds appropriately to gestures
- [ ] Gesture recognition works in various lighting conditions
- [ ] System learns from user's gesture patterns

### 3.7 Testing Strategy
```python
# Unit tests
def test_hand_gesture_recognition():
    recognizer = HandGestureRecognizer()
    test_image = load_test_image("wave_gesture.jpg")
    gestures = recognizer.detect_gestures(test_image)
    assert len(gestures) > 0
    assert gestures[0].type == "wave"

# Integration tests
def test_gesture_action_mapping():
    mapper = GestureActionMapper()
    gesture = Gesture(type="wave", confidence=0.9)
    action = mapper.map_gesture_to_action(gesture)
    assert action is not None
    assert action.type == "character_wave"

# Performance tests
def test_gesture_processing_performance():
    start_time = time.time()
    gestures = recognizer.detect_gestures(video_frame)
    end_time = time.time()
    
    assert (end_time - start_time) < 0.15  # < 150ms
```

## 🎤 Feature 4: Voice Command System

### 4.1 Feature Description
Implement a comprehensive voice command system that allows users to control the application and interact with XiaoZhi using natural speech.

### 4.2 User Stories
- **As a user**, I want to say "XiaoZhi, play music" so that music starts playing
- **As a user**, I want to say "XiaoZhi, take a photo" so that a photo is captured
- **As a user**, I want to say "XiaoZhi, change your expression to happy" so that the character changes expression

### 4.3 Technical Requirements

#### Voice Command Processing Pipeline
```python
# Voice command recognition
class VoiceCommandRecognizer:
    def __init__(self):
        self.speech_recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.command_classifier = self.load_command_classifier()
        self.wake_word_detector = WakeWordDetector()
    
    def listen_for_commands(self, audio_data: np.ndarray) -> List[VoiceCommand]:
        """Listen for voice commands in audio data"""
        # Check for wake word
        if not self.wake_word_detector.detect_wake_word(audio_data):
            return []
        
        # Convert audio to text
        text = self.speech_to_text(audio_data)
        if not text:
            return []
        
        # Classify command
        commands = self.classify_commands(text)
        return commands
    
    def speech_to_text(self, audio_data: np.ndarray) -> str:
        """Convert speech to text"""
        try:
            # Convert numpy array to AudioData
            audio_data = sr.AudioData(
                audio_data.tobytes(),
                sample_rate=48000,
                sample_width=2
            )
            
            # Recognize speech
            text = self.speech_recognizer.recognize_google(audio_data)
            return text.lower()
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as e:
            print(f"Speech recognition error: {e}")
            return ""
    
    def classify_commands(self, text: str) -> List[VoiceCommand]:
        """Classify voice commands from text"""
        commands = []
        
        # Extract command patterns
        for pattern, command_type in self.command_patterns.items():
            if re.search(pattern, text):
                confidence = self.calculate_confidence(text, pattern)
                if confidence > 0.7:
                    commands.append(VoiceCommand(
                        type=command_type,
                        text=text,
                        confidence=confidence,
                        parameters=self.extract_parameters(text, command_type)
                    ))
        
        return commands

# Command execution system
class CommandExecutor:
    def __init__(self):
        self.command_handlers = {
            'play_music': self.handle_play_music,
            'stop_music': self.handle_stop_music,
            'set_volume': self.handle_set_volume,
            'take_photo': self.handle_take_photo,
            'open_website': self.handle_open_website,
            'change_expression': self.handle_change_expression,
            'start_animation': self.handle_start_animation,
            'get_weather': self.handle_get_weather,
            'set_reminder': self.handle_set_reminder
        }
    
    def execute_command(self, command: VoiceCommand) -> CommandResult:
        """Execute voice command"""
        handler = self.command_handlers.get(command.type)
        if handler:
            try:
                result = handler(command)
                return CommandResult(
                    success=True,
                    message=f"Executed command: {command.type}",
                    data=result
                )
            except Exception as e:
                return CommandResult(
                    success=False,
                    message=f"Error executing command: {str(e)}",
                    data=None
                )
        else:
            return CommandResult(
                success=False,
                message=f"Unknown command: {command.type}",
                data=None
            )
    
    def handle_play_music(self, command: VoiceCommand) -> dict:
        """Handle play music command"""
        # Extract music parameters
        genre = command.parameters.get('genre', 'random')
        artist = command.parameters.get('artist', None)
        
        # Execute music playback
        result = self.music_service.play_music(genre, artist)
        
        return {
            'action': 'play_music',
            'genre': genre,
            'artist': artist,
            'result': result
        }
    
    def handle_change_expression(self, command: VoiceCommand) -> dict:
        """Handle change expression command"""
        expression = command.parameters.get('expression', 'happy')
        
        # Update character expression
        result = self.character_service.set_expression(expression)
        
        return {
            'action': 'change_expression',
            'expression': expression,
            'result': result
        }
```

#### Command Pattern Recognition
```python
# Command pattern definitions
COMMAND_PATTERNS = {
    r'play\s+(?:some\s+)?music': 'play_music',
    r'play\s+(?:a\s+)?song': 'play_music',
    r'stop\s+(?:the\s+)?music': 'stop_music',
    r'pause\s+(?:the\s+)?music': 'stop_music',
    r'set\s+volume\s+to\s+(\d+)': 'set_volume',
    r'turn\s+(?:the\s+)?volume\s+(?:up|down)': 'adjust_volume',
    r'take\s+(?:a\s+)?photo': 'take_photo',
    r'capture\s+(?:a\s+)?photo': 'take_photo',
    r'open\s+(?:the\s+)?website\s+(.+)': 'open_website',
    r'go\s+to\s+(.+)': 'open_website',
    r'change\s+(?:your\s+)?expression\s+to\s+(.+)': 'change_expression',
    r'look\s+(.+)': 'change_expression',
    r'start\s+(?:the\s+)?animation\s+(.+)': 'start_animation',
    r'what\'s\s+(?:the\s+)?weather': 'get_weather',
    r'remind\s+me\s+to\s+(.+)': 'set_reminder'
}

# Parameter extraction
PARAMETER_EXTRACTORS = {
    'set_volume': lambda text: {'volume': int(re.search(r'(\d+)', text).group(1))},
    'open_website': lambda text: {'url': re.search(r'open\s+(?:the\s+)?website\s+(.+)', text).group(1)},
    'change_expression': lambda text: {'expression': re.search(r'change\s+(?:your\s+)?expression\s+to\s+(.+)', text).group(1)},
    'start_animation': lambda text: {'animation': re.search(r'start\s+(?:the\s+)?animation\s+(.+)', text).group(1)},
    'set_reminder': lambda text: {'reminder': re.search(r'remind\s+me\s+to\s+(.+)', text).group(1)}
}
```

### 4.4 API Specifications

#### Voice Command Endpoint
```http
POST /api/process-voice-command
Content-Type: application/json

{
    "audio_data": "base64_encoded_audio",
    "user_id": "user_123",
    "session_id": "session_456"
}

Response:
{
    "commands": [
        {
            "type": "play_music",
            "text": "play some music",
            "confidence": 0.92,
            "parameters": {
                "genre": "random"
            }
        }
    ],
    "execution_results": [
        {
            "success": true,
            "message": "Executed command: play_music",
            "data": {
                "action": "play_music",
                "genre": "random",
                "result": "Music started playing"
            }
        }
    ]
}
```

### 4.5 Database Schema
```sql
-- Voice command history
CREATE TABLE voice_commands (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    command_text TEXT,
    command_type VARCHAR(50),
    confidence FLOAT,
    parameters JSONB,
    execution_result JSONB
);

-- Command patterns
CREATE TABLE command_patterns (
    id SERIAL PRIMARY KEY,
    pattern_regex VARCHAR(500) NOT NULL,
    command_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 Acceptance Criteria
- [ ] Recognizes 20+ voice commands with > 85% accuracy
- [ ] Processes commands in real-time with < 500ms latency
- [ ] Executes commands successfully > 90% of the time
- [ ] Supports natural language variations
- [ ] Provides voice feedback for command execution
- [ ] Learns from user's command patterns

### 4.7 Testing Strategy
```python
# Unit tests
def test_voice_command_recognition():
    recognizer = VoiceCommandRecognizer()
    test_audio = load_test_audio("play_music.wav")
    commands = recognizer.listen_for_commands(test_audio)
    assert len(commands) > 0
    assert commands[0].type == "play_music"

# Integration tests
def test_command_execution():
    executor = CommandExecutor()
    command = VoiceCommand(type="play_music", text="play some music")
    result = executor.execute_command(command)
    assert result.success == True

# Performance tests
def test_voice_processing_performance():
    start_time = time.time()
    commands = recognizer.listen_for_commands(audio_data)
    end_time = time.time()
    
    assert (end_time - start_time) < 0.5  # < 500ms
```

## 📱 Feature 5: Mobile App Development

### 5.1 Feature Description
Develop native mobile applications for iOS and Android to provide a seamless mobile experience for XiaoZhi WebRTC.

### 5.2 User Stories
- **As a mobile user**, I want to use XiaoZhi on my phone so that I can interact with her anywhere
- **As a mobile user**, I want touch gestures to work naturally on mobile so that the experience feels native
- **As a mobile user**, I want the app to work offline for basic features so that I can use it without internet

### 5.3 Technical Requirements

#### React Native Implementation
```javascript
// Main App Component
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { WebRTCView } from 'react-native-webrtc';
import { Live2DView } from 'react-native-live2d';
import { VoiceCommandManager } from './VoiceCommandManager';
import { GestureRecognizer } from './GestureRecognizer';

const XiaoZhiApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [characterState, setCharacterState] = useState('idle');
  const [voiceCommands, setVoiceCommands] = useState([]);
  
  useEffect(() => {
    initializeApp();
  }, []);
  
  const initializeApp = async () => {
    try {
      // Initialize WebRTC
      await initializeWebRTC();
      
      // Initialize voice commands
      await VoiceCommandManager.initialize();
      
      // Initialize gesture recognition
      await GestureRecognizer.initialize();
      
      setIsConnected(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize app');
    }
  };
  
  const handleVoiceCommand = (command) => {
    setVoiceCommands(prev => [...prev, command]);
    // Process voice command
  };
  
  const handleGesture = (gesture) => {
    // Process gesture
    setCharacterState(gesture.characterResponse.animation);
  };
  
  return (
    <View style={styles.container}>
      <Live2DView
        characterState={characterState}
        onGesture={handleGesture}
        style={styles.character}
      />
      <WebRTCView
        onVoiceCommand={handleVoiceCommand}
        style={styles.webrtc}
      />
      <TouchableOpacity
        onPress={handleVoiceCommand}
        style={styles.voiceButton}
      >
        <Text>Voice Command</Text>
      </TouchableOpacity>
    </View>
  );
};

// Voice Command Manager
class VoiceCommandManager {
  static async initialize() {
    // Initialize speech recognition
    this.speechRecognizer = new SpeechRecognizer();
    this.commandProcessor = new CommandProcessor();
  }
  
  static async startListening() {
    try {
      const result = await this.speechRecognizer.start();
      const commands = await this.commandProcessor.process(result);
      return commands;
    } catch (error) {
      console.error('Voice command error:', error);
      return [];
    }
  }
}

// Gesture Recognizer
class GestureRecognizer {
  static async initialize() {
    // Initialize gesture recognition
    this.gestureDetector = new GestureDetector();
    this.gestureMapper = new GestureMapper();
  }
  
  static async detectGestures(touchEvents) {
    const gestures = await this.gestureDetector.detect(touchEvents);
    const characterResponses = await this.gestureMapper.map(gestures);
    return characterResponses;
  }
}
```

#### Native Module Integration
```java
// Android Native Module
public class XiaoZhiWebRTCModule extends ReactContextBaseJavaModule {
    private WebRTCManager webRTCManager;
    private VoiceCommandProcessor voiceProcessor;
    
    @ReactMethod
    public void initializeWebRTC(Promise promise) {
        try {
            webRTCManager = new WebRTCManager();
            voiceProcessor = new VoiceCommandProcessor();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void processVoiceCommand(String audioData, Promise promise) {
        try {
            String result = voiceProcessor.process(audioData);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("VOICE_ERROR", e.getMessage());
        }
    }
}
```

```objc
// iOS Native Module
#import "XiaoZhiWebRTCModule.h"
#import "WebRTCManager.h"
#import "VoiceCommandProcessor.h"

@implementation XiaoZhiWebRTCModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(initializeWebRTC:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        self.webRTCManager = [[WebRTCManager alloc] init];
        self.voiceProcessor = [[VoiceCommandProcessor alloc] init];
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(processVoiceCommand:(NSString *)audioData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *result = [self.voiceProcessor process:audioData];
        resolve(result);
    } @catch (NSException *exception) {
        reject(@"VOICE_ERROR", exception.reason, nil);
    }
}

@end
```

### 5.4 API Specifications

#### Mobile-Specific Endpoints
```http
POST /api/mobile/initialize
Content-Type: application/json

{
    "device_id": "device_123",
    "platform": "ios",
    "version": "1.0.0",
    "capabilities": {
        "voice_commands": true,
        "gesture_recognition": true,
        "camera": true,
        "microphone": true
    }
}

Response:
{
    "success": true,
    "session_id": "session_456",
    "config": {
        "webrtc_config": {...},
        "voice_config": {...},
        "gesture_config": {...}
    }
}
```

### 5.5 Database Schema
```sql
-- Mobile device information
CREATE TABLE mobile_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(20) NOT NULL,
    version VARCHAR(20) NOT NULL,
    capabilities JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mobile session data
CREATE TABLE mobile_sessions (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    interaction_count INTEGER DEFAULT 0,
    data_usage JSONB
);
```

### 5.6 Acceptance Criteria
- [ ] App works on iOS 12+ and Android 8+
- [ ] Voice commands work with > 80% accuracy
- [ ] Touch gestures are responsive and natural
- [ ] WebRTC connection is stable on mobile networks
- [ ] App performance is smooth (60 FPS)
- [ ] Offline mode works for basic features

### 5.7 Testing Strategy
```javascript
// React Native Testing
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import XiaoZhiApp from '../XiaoZhiApp';

describe('XiaoZhiApp', () => {
  test('initializes successfully', async () => {
    const { getByText } = render(<XiaoZhiApp />);
    await waitFor(() => {
      expect(getByText('Connected')).toBeTruthy();
    });
  });
  
  test('handles voice commands', async () => {
    const { getByTestId } = render(<XiaoZhiApp />);
    const voiceButton = getByTestId('voice-button');
    
    fireEvent.press(voiceButton);
    // Test voice command handling
  });
});
```

## 🔄 Implementation Timeline

### Phase 1: Core Features (Weeks 1-8)
- **Weeks 1-2**: Multi-Language Support
- **Weeks 3-4**: Advanced Emotion Recognition
- **Weeks 5-6**: Gesture Recognition System
- **Weeks 7-8**: Voice Command System

### Phase 2: Mobile Development (Weeks 9-16)
- **Weeks 9-10**: React Native setup and basic functionality
- **Weeks 11-12**: Native module integration
- **Weeks 13-14**: Mobile-specific features
- **Weeks 15-16**: Testing and optimization

### Phase 3: Integration and Testing (Weeks 17-20)
- **Weeks 17-18**: Feature integration
- **Weeks 19-20**: Comprehensive testing and bug fixes

## 📊 Success Metrics

### Technical Metrics
- **Feature Accuracy**: > 85% for all recognition systems
- **Response Time**: < 200ms for all real-time features
- **Uptime**: 99.9% availability
- **Performance**: 60 FPS on mobile devices

### User Experience Metrics
- **User Satisfaction**: > 4.5/5 rating
- **Feature Adoption**: > 80% of users try new features
- **Session Duration**: > 30 minutes average
- **Retention Rate**: > 70% monthly retention

### Business Metrics
- **User Growth**: 50% month-over-month growth
- **Revenue**: $100,000+ monthly recurring revenue
- **Market Share**: Top 3 in AI companion category
- **Customer Support**: < 24 hour response time
