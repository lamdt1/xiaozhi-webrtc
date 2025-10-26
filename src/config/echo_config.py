# Echo Cancellation Configuration File
# Echo Cancellation Configuration


class EchoConfig:
    """Echo cancellation configuration class"""

    # Adaptive filter parameters - more conservative settings to avoid over-suppression
    ADAPTIVE_FILTER_LENGTH = 1024  # Restore to smaller filter length
    LEARNING_RATE = 0.02  # Reduce learning rate to avoid over-adjustment

    # Buffer parameters - moderate buffer size
    ECHO_BUFFER_SIZE = 100  # Echo buffer size (about 2 seconds)
    INPUT_BUFFER_SIZE = 50  # Input buffer size

    # Warmup parameters - gentler warmup processing
    WARMUP_DURATION = 2.0  # Increase warmup time to let algorithm stabilize
    WARMUP_GAIN_FACTOR = 0.7  # Increase gain factor during warmup to preserve more original audio

    # Noise gate parameters - more conservative threshold settings
    NOISE_GATE_THRESHOLD = 200  # Lower threshold, but with gentler attenuation
    NOISE_GATE_ATTENUATION = 0.3  # Reduce attenuation to preserve more audio signal

    # Audio processing parameters
    GAIN_FACTOR = 1.0  # Normal gain factor
    SAMPLE_RATE = 48000  # Sample rate

    # Client audio constraint parameters - optimized to enhance echo cancellation effect
    CLIENT_AUDIO_CONSTRAINTS = {
        "echoCancellation": True,
        "echoCancellationType": "system",  # Use system-level echo cancellation
        "noiseSuppression": True,
        "autoGainControl": True,
        "googEchoCancellation": True,
        "googAutoGainControl": True,
        "googNoiseSuppression": True,
        "googHighpassFilter": True,
        "googTypingNoiseDetection": True,
        "googAudioMirroring": False,
        "googEchoCancellation2": True,  # Enable enhanced echo cancellation
        "googDAEchoCancellation": True,  # Enable digital audio echo cancellation
        "googNoiseReduction": True,  # Additional noise suppression
        "latency": 0.02,  # Increase to 20ms latency to improve echo cancellation effect
        "sampleRate": 48000,
        "sampleSize": 16,
        "channelCount": 1,
    }

    @classmethod
    def get_adaptive_params(cls):
        """Get adaptive filter parameters"""
        return {"filter_length": cls.ADAPTIVE_FILTER_LENGTH, "learning_rate": cls.LEARNING_RATE}

    @classmethod
    def get_buffer_params(cls):
        """Get buffer parameters"""
        return {"echo_buffer_size": cls.ECHO_BUFFER_SIZE, "input_buffer_size": cls.INPUT_BUFFER_SIZE}

    @classmethod
    def get_warmup_params(cls):
        """Get warmup parameters"""
        return {"duration": cls.WARMUP_DURATION, "gain_factor": cls.WARMUP_GAIN_FACTOR}

    @classmethod
    def get_noise_gate_params(cls):
        """Get noise gate parameters"""
        return {"threshold": cls.NOISE_GATE_THRESHOLD, "attenuation": cls.NOISE_GATE_ATTENUATION}
