"""
Echo Cancellation Module
Echo Cancellation Module
"""

import time
from collections import deque

import numpy as np

from src.config.echo_config import EchoConfig


class EchoCanceller:
    """
    Adaptive Echo Cancellation (AEC) implementation
    Adaptive Echo Cancellation (AEC) implementation
    """

    def __init__(self):
        """Initialize echo canceller"""
        # Get configuration parameters
        adaptive_params = EchoConfig.get_adaptive_params()
        buffer_params = EchoConfig.get_buffer_params()
        warmup_params = EchoConfig.get_warmup_params()
        noise_params = EchoConfig.get_noise_gate_params()

        # Adaptive filter parameters
        self.adaptive_filter_length = adaptive_params["filter_length"]
        self.adaptive_filter = np.zeros(self.adaptive_filter_length)
        self.learning_rate = adaptive_params["learning_rate"]

        # Buffers
        self.echo_buffer = deque(maxlen=buffer_params["echo_buffer_size"])
        self.input_buffer = deque(maxlen=buffer_params["input_buffer_size"])

        # Warmup parameters
        self.start_time = time.time()
        self.warmup_duration = warmup_params["duration"]
        self.warmup_gain_factor = warmup_params["gain_factor"]

        # Noise gate parameters
        self.noise_gate_threshold = noise_params["threshold"]
        self.noise_gate_attenuation = noise_params["attenuation"]
        self.gain_factor = EchoConfig.GAIN_FACTOR

        # Statistics
        self.processed_frames = 0
        self.echo_detected_frames = 0

    def add_reference_audio(self, reference_audio):
        """
        Add reference audio (played audio) to buffer

        Args:
            reference_audio: Reference audio data (numpy array)
        """
        if reference_audio is not None:
            self.echo_buffer.append(reference_audio.copy())

    def process_audio(self, input_audio, reference_audio=None):
        """
        Process audio and perform echo cancellation

        Args:
            input_audio: Input audio data (numpy array)
            reference_audio: Current reference audio data (numpy array, optional)

        Returns:
            numpy array: Processed audio data
        """
        self.processed_frames += 1

        # If reference audio is provided, add to buffer
        if reference_audio is not None:
            self.add_reference_audio(reference_audio)

        # Convert to float32 for processing
        audio_float = input_audio.astype(np.float32)

        # Perform echo cancellation
        cleaned_audio = self._echo_cancellation(audio_float)

        # Special processing during warmup period
        cleaned_audio = self._warmup_processing(cleaned_audio)

        # Convert back to int16 format - safe numerical conversion
        # Check numerical validity
        if not np.all(np.isfinite(cleaned_audio)):
            # If there are invalid values, replace with original audio
            cleaned_audio = np.where(np.isfinite(cleaned_audio), cleaned_audio, input_audio.astype(np.float32))

        # Safe range limiting and type conversion
        cleaned_audio_clipped = np.clip(cleaned_audio, -32767, 32767)
        return cleaned_audio_clipped.astype(np.int16)

    def _echo_cancellation(self, input_audio):
        """
        Core echo cancellation algorithm

        Args:
            input_audio: Input audio data (float32)

        Returns:
            numpy array: Audio data after echo cancellation
        """
        if len(self.echo_buffer) == 0:
            # When no reference audio, only perform noise gate processing
            return self._noise_gate(input_audio)

        # Get the most recent reference audio
        ref_data = self._get_reference_signal()

        if len(ref_data) < self.adaptive_filter_length:
            return self._noise_gate(input_audio)

        # Extract reference signal of appropriate length
        ref_signal = ref_data[-self.adaptive_filter_length :]

        # Calculate predicted echo
        predicted_echo = np.convolve(ref_signal, self.adaptive_filter, mode="valid")

        # Ensure length matching and perform echo cancellation
        cleaned_audio = self._subtract_echo(input_audio, predicted_echo, ref_signal)

        # Apply noise gate
        return self._noise_gate(cleaned_audio)

    def _get_reference_signal(self):
        """Get reference signal"""
        if len(self.echo_buffer) >= 10:
            return np.concatenate(list(self.echo_buffer)[-10:])
        else:
            return np.concatenate(list(self.echo_buffer))

    def _subtract_echo(self, input_audio, predicted_echo, ref_signal):
        """Perform echo subtraction and filter update"""
        min_len = min(len(input_audio), len(predicted_echo))
        if min_len <= 0:
            return input_audio

        # Echo subtraction - using more conservative method
        input_segment = input_audio[:min_len]
        echo_segment = predicted_echo[:min_len]

        # Calculate input signal energy - using safe calculation to prevent overflow
        input_segment_float = input_segment.astype(np.float64)
        echo_segment_float = echo_segment.astype(np.float64)

        input_energy = np.mean(input_segment_float**2)
        echo_energy = np.mean(echo_segment_float**2)

        # Check numerical validity
        if not np.isfinite(input_energy):
            input_energy = 0.0
        if not np.isfinite(echo_energy):
            echo_energy = 0.0

        # If predicted echo energy is too high, might be misjudgment, reduce echo cancellation strength
        if echo_energy > input_energy * 0.8:
            # Only eliminate partial echo, preserve original signal
            echo_reduction_factor = 0.3  # Only eliminate 30% of predicted echo
            cleaned_audio = input_segment - echo_segment * echo_reduction_factor
        else:
            # Normal echo cancellation, but still conservative
            echo_reduction_factor = 0.7  # Eliminate 70% of predicted echo
            cleaned_audio = input_segment - echo_segment * echo_reduction_factor

        # Update adaptive filter (LMS algorithm) - using safe numerical calculation
        if len(ref_signal) >= len(input_segment):
            error = cleaned_audio.astype(np.float64)  # Convert to float64 to prevent overflow
            ref_segment = ref_signal[: len(error)].astype(np.float64)

            # Calculate gradient and update filter
            if len(error) <= len(self.adaptive_filter):
                # Calculate gradient, add numerical stability check
                gradient = self.learning_rate * error * ref_segment[: len(error)]

                # Check gradient validity
                if np.all(np.isfinite(gradient)):
                    # Limit gradient size to prevent excessive updates
                    gradient = np.clip(gradient, -1000, 1000)
                    self.adaptive_filter[: len(error)] += gradient.astype(np.float32)

                    # Limit filter coefficient range to prevent divergence
                    self.adaptive_filter = np.clip(self.adaptive_filter, -10, 10)

                # Echo detection statistics
                if np.mean(np.abs(error)) < np.mean(np.abs(input_segment)) * 0.8:
                    self.echo_detected_frames += 1

        # Pad to original length
        if len(cleaned_audio) < len(input_audio):
            padding = np.zeros(len(input_audio) - len(cleaned_audio))
            cleaned_audio = np.concatenate([cleaned_audio, padding])

        return cleaned_audio[: len(input_audio)]

    def _noise_gate(self, audio_data):
        """
        Noise gate processing - using safe numerical calculation

        Args:
            audio_data: Audio data

        Returns:
            numpy array: Processed audio data
        """
        # Calculate audio RMS value - using float64 to prevent overflow
        audio_float64 = audio_data.astype(np.float64)
        rms = np.sqrt(np.mean(audio_float64**2))

        # Check RMS value validity
        if not np.isfinite(rms):
            rms = 0.0

        if rms < self.noise_gate_threshold:
            # When below noise gate threshold, use configured attenuation factor
            result = audio_data * self.noise_gate_attenuation
        else:
            # When above threshold, normal processing
            result = audio_data * self.gain_factor

        # Ensure result is within valid range
        return np.clip(result, -32767, 32767)

    def _warmup_processing(self, input_audio):
        """
        Special processing during warmup period

        Args:
            input_audio: Input audio data

        Returns:
            numpy array: Processed audio data
        """
        elapsed_time = time.time() - self.start_time

        if elapsed_time < self.warmup_duration:
            # During warmup period, gradually increase gain
            warmup_gain = elapsed_time / self.warmup_duration
            return input_audio * warmup_gain * self.warmup_gain_factor

        return input_audio

    def get_statistics(self):
        """
        Get statistics

        Returns:
            dict: Statistics dictionary
        """
        echo_detection_rate = 0
        if self.processed_frames > 0:
            echo_detection_rate = self.echo_detected_frames / self.processed_frames

        return {
            "processed_frames": self.processed_frames,
            "echo_detected_frames": self.echo_detected_frames,
            "echo_detection_rate": echo_detection_rate,
            "warmup_completed": time.time() - self.start_time > self.warmup_duration,
            "buffer_size": len(self.echo_buffer),
            "filter_coefficients_norm": np.linalg.norm(self.adaptive_filter),
        }

    def reset(self):
        """Reset echo canceller state"""
        self.adaptive_filter = np.zeros(self.adaptive_filter_length)
        self.echo_buffer.clear()
        self.input_buffer.clear()
        self.start_time = time.time()
        self.processed_frames = 0
        self.echo_detected_frames = 0
