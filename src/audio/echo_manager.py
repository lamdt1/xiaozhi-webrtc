"""
Echo Cancellation Manager
Echo Cancellation Manager - Unified management of echo cancellation logic
"""

import numpy as np

from src.audio.echo_canceller import EchoCanceller


class EchoCancellationManager:
    """
    Echo Cancellation Manager
    Responsible for unified management of all echo cancellation logic, including:
    - Echo canceller initialization and configuration
    - Audio processing and safety checks
    - Debug information output
    - Adaptive parameter adjustment
    """

    def __init__(self, enable_echo_cancellation=True, enable_debug=False):
        """
        Initialize echo cancellation manager

        Args:
            enable_echo_cancellation: Whether to enable echo cancellation
            enable_debug: Whether to enable debug information
        """
        self.enable_echo_cancellation = enable_echo_cancellation
        self.enable_debug = enable_debug

        # Initialize echo canceller
        self.echo_canceller = EchoCanceller()

        # Reference signal storage
        self.reference_audio = None

        # Statistics
        self.frame_count = 0
        self.over_suppression_count = 0

        # Safety check parameters
        self.min_energy_ratio = 0.1  # Minimum energy ratio to prevent over-suppression
        self.min_original_rms = 100  # Minimum original RMS threshold
        self.mix_ratio = 0.3  # Original audio mixing ratio when over-suppressed

        # Debug parameters
        self.debug_interval = 200  # Debug information output interval (frames)

    def update_reference_audio(self, reference_samples):
        """
        Update reference audio signal

        Args:
            reference_samples: Reference audio samples (numpy array)
        """
        if reference_samples is None:
            return

        try:
            # Validate reference audio validity
            if len(reference_samples) == 0:
                # self._log_debug("Reference audio is empty, skipping update")
                return

            # Check numerical validity
            if not np.all(np.isfinite(reference_samples)):
                # self._log_debug("Reference audio contains invalid values, cleaning")
                reference_samples = np.where(np.isfinite(reference_samples), reference_samples, 0)

            self.reference_audio = reference_samples.copy()
            # Also add to echo canceller buffer
            self.echo_canceller.add_reference_audio(reference_samples)

        except Exception as e:
            self._log_debug(f"Failed to update reference audio: {e}")
            # When update fails, don't affect existing reference audio

    def process_microphone_audio(self, input_audio):
        """
        Process microphone input audio

        Args:
            input_audio: Microphone input audio data (numpy array, int16)

        Returns:
            numpy array: Processed audio data (int16)
        """
        self.frame_count += 1

        # Input validation
        if input_audio is None or len(input_audio) == 0:
            self._log_debug(f"Frame {self.frame_count}: Input audio is empty")
            return np.zeros(960, dtype=np.int16)  # Return silent frame

        # Check input audio numerical validity
        if not np.all(np.isfinite(input_audio)):
            self._log_debug(f"Frame {self.frame_count}: Input audio contains invalid values, using zero padding")
            input_audio = np.where(np.isfinite(input_audio), input_audio, 0)

        # If echo cancellation is not enabled or no reference signal, return original audio directly
        if not self.enable_echo_cancellation or self.reference_audio is None:
            # self._log_debug(f"Frame {self.frame_count}: Echo cancellation not enabled or no reference signal")
            return input_audio

        # Perform echo cancellation - add exception handling
        try:
            cleaned_audio = self.echo_canceller.process_audio(input_audio, reference_audio=self.reference_audio)
        except Exception as e:
            self._log_debug(f"Frame {self.frame_count}: Echo cancellation processing failed: {e}")
            # When echo cancellation fails, return original audio
            return input_audio

        # Safety check and post-processing
        try:
            final_audio = self._safety_check_and_mix(input_audio, cleaned_audio)
        except Exception as e:
            self._log_debug(f"Frame {self.frame_count}: Safety check failed: {e}")
            # When safety check fails, return cleaned audio or original audio
            final_audio = cleaned_audio if cleaned_audio is not None else input_audio

        # Output debug information
        self._output_debug_info(input_audio, cleaned_audio, final_audio)

        return final_audio

    def _safety_check_and_mix(self, original_audio, cleaned_audio):
        """
        Safety check and audio mixing

        Args:
            original_audio: Original audio
            cleaned_audio: Cleaned audio

        Returns:
            numpy array: Final processed audio
        """
        # Calculate audio energy - using safe numerical calculation
        original_float64 = original_audio.astype(np.float64)
        cleaned_float64 = cleaned_audio.astype(np.float64)

        original_rms = np.sqrt(np.mean(original_float64**2))
        cleaned_rms = np.sqrt(np.mean(cleaned_float64**2))

        # Check RMS value validity
        if not np.isfinite(original_rms):
            original_rms = 0.0
        if not np.isfinite(cleaned_rms):
            cleaned_rms = 0.0

        # Check for over-suppression
        if cleaned_rms < original_rms * self.min_energy_ratio and original_rms > self.min_original_rms:

            # Over-suppression, mix original audio
            self.over_suppression_count += 1
            mixed_audio = self._mix_audio(original_audio, cleaned_audio, self.mix_ratio)

            if self.frame_count % 100 == 0:
                self._log_debug(
                    f"Frame {self.frame_count}: Over-suppression detected, mixing original audio "
                    f"(Total: {self.over_suppression_count} times)"
                )

            return mixed_audio

        return cleaned_audio

    def _mix_audio(self, original_audio, processed_audio, original_ratio):
        """
        Mix original audio and processed audio

        Args:
            original_audio: Original audio
            processed_audio: Processed audio
            original_ratio: Mixing ratio of original audio

        Returns:
            numpy array: Mixed audio
        """
        processed_ratio = 1.0 - original_ratio
        mixed_audio = (
            original_audio.astype(np.float32) * original_ratio + processed_audio.astype(np.float32) * processed_ratio
        )
        return mixed_audio.astype(np.int16)

    def _output_debug_info(self, original_audio, cleaned_audio, final_audio):
        """
        Output debug information

        Args:
            original_audio: Original audio
            cleaned_audio: Cleaned audio
            final_audio: Final audio
        """
        if not self.enable_debug or self.frame_count % self.debug_interval != 0:
            return

        original_rms = np.sqrt(np.mean(original_audio.astype(np.float32) ** 2))
        cleaned_rms = np.sqrt(np.mean(cleaned_audio.astype(np.float32) ** 2))
        final_rms = np.sqrt(np.mean(final_audio.astype(np.float32) ** 2))

        ratio = cleaned_rms / original_rms if original_rms > 0 else 0

        # Get echo canceller statistics
        echo_stats = self.echo_canceller.get_statistics()

        self._log_debug(
            f"Frame {self.frame_count}: "
            f"Original RMS={original_rms:.2f}, "
            f"Cleaned RMS={cleaned_rms:.2f}, "
            f"Final RMS={final_rms:.2f}, "
            f"Ratio={ratio:.3f}, "
            f"Echo Detection Rate={echo_stats['echo_detection_rate']:.3f}, "
            f"Over Suppression Count={self.over_suppression_count}"
        )

    def _log_debug(self, message):
        """Output debug information"""
        pass
        # if self.enable_debug:
        #     print(f"[EchoCancellationManager] {message}")

    def get_statistics(self):
        """
        Get manager statistics

        Returns:
            dict: Statistics
        """
        echo_stats = self.echo_canceller.get_statistics()

        return {
            "manager_stats": {
                "total_frames": self.frame_count,
                "over_suppression_count": self.over_suppression_count,
                "over_suppression_rate": self.over_suppression_count / max(1, self.frame_count),
                "echo_cancellation_enabled": self.enable_echo_cancellation,
                "has_reference_audio": self.reference_audio is not None,
            },
            "echo_canceller_stats": echo_stats,
        }

    def reset(self):
        """Reset manager state"""
        self.echo_canceller.reset()
        self.reference_audio = None
        self.frame_count = 0
        self.over_suppression_count = 0

    def set_parameters(self, **kwargs):
        """
        Dynamically set parameters

        Args:
            **kwargs: Parameter dictionary, can include:
                - enable_echo_cancellation: Whether to enable echo cancellation
                - min_energy_ratio: Minimum energy ratio
                - mix_ratio: Mixing ratio
                - debug_interval: Debug output interval
        """
        if "enable_echo_cancellation" in kwargs:
            self.enable_echo_cancellation = kwargs["enable_echo_cancellation"]
            self._log_debug(f"Echo cancellation {'enabled' if self.enable_echo_cancellation else 'disabled'}")

        if "min_energy_ratio" in kwargs:
            self.min_energy_ratio = kwargs["min_energy_ratio"]
            self._log_debug(f"Minimum energy ratio set to: {self.min_energy_ratio}")

        if "mix_ratio" in kwargs:
            self.mix_ratio = kwargs["mix_ratio"]
            self._log_debug(f"Mixing ratio set to: {self.mix_ratio}")

        if "debug_interval" in kwargs:
            self.debug_interval = kwargs["debug_interval"]
            self._log_debug(f"Debug output interval set to: {self.debug_interval}")
