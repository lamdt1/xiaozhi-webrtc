"""
Echo Cancellation Manager Usage Examples
Echo Cancellation Manager Usage Examples
"""

# Example 1: Basic usage
from src.audio.echo_manager import EchoCancellationManager

# Create manager
echo_manager = EchoCancellationManager(enable_echo_cancellation=True, enable_debug=True)


# Typical audio processing workflow
def process_audio_example(microphone_audio, speaker_audio):
    """
    Audio processing example

    Args:
        microphone_audio: Microphone input audio data
        speaker_audio: Speaker output audio data
    """
    # 1. Update reference audio (speaker output)
    echo_manager.update_reference_audio(speaker_audio)

    # 2. Process microphone audio (echo cancellation)
    cleaned_audio = echo_manager.process_microphone_audio(microphone_audio)

    return cleaned_audio


# Example 2: Dynamic configuration
def configure_echo_cancellation_example():
    """Example of configuring echo cancellation parameters"""

    # Create manager
    manager = EchoCancellationManager()

    # Dynamically adjust parameters
    manager.set_parameters(
        enable_echo_cancellation=True,
        min_energy_ratio=0.15,  # Adjust minimum energy ratio
        mix_ratio=0.25,  # Adjust mixing ratio
        debug_interval=100,  # Adjust debug output frequency
    )

    # Get statistics
    stats = manager.get_statistics()
    print(f"Processed frames: {stats['manager_stats']['total_frames']}")
    print(f"Over-suppression rate: {stats['manager_stats']['over_suppression_rate']:.3f}")

    return manager


# Example 3: Usage in AudioFaceSwapper
def audio_face_swapper_example():
    """Example of usage in AudioFaceSwapper"""

    # Assume there's an AudioFaceSwapper instance
    # audio_swapper = AudioFaceSwapper(xiaozhi, track)

    # Get echo cancellation statistics
    # stats = audio_swapper.get_echo_cancellation_stats()
    # print(f"Echo detection rate: {stats['echo_canceller_stats']['echo_detection_rate']:.3f}")

    # Temporarily disable echo cancellation
    # audio_swapper.set_echo_cancellation_enabled(False)

    # Adjust echo cancellation parameters
    # audio_swapper.configure_echo_cancellation(
    #     min_energy_ratio=0.2,
    #     mix_ratio=0.4
    # )

    # Reset echo cancellation state
    # audio_swapper.reset_echo_cancellation()

    pass


# Example 4: Advanced configuration scenarios
def advanced_configuration_example():
    """Advanced configuration scenario examples"""

    # Create managers with different configurations for different scenarios

    # Quiet environment configuration - more aggressive echo cancellation
    quiet_environment = EchoCancellationManager(enable_echo_cancellation=True, enable_debug=False)
    quiet_environment.set_parameters(min_energy_ratio=0.05, mix_ratio=0.2)  # Lower threshold  # Less original audio mixing

    # Noisy environment configuration - more conservative echo cancellation
    noisy_environment = EchoCancellationManager(enable_echo_cancellation=True, enable_debug=True)
    noisy_environment.set_parameters(min_energy_ratio=0.3, mix_ratio=0.5)  # Higher threshold  # More original audio mixing

    # Debug mode configuration - detailed log output
    debug_mode = EchoCancellationManager(enable_echo_cancellation=True, enable_debug=True)
    debug_mode.set_parameters(debug_interval=50)  # More frequent debug output

    return {"quiet": quiet_environment, "noisy": noisy_environment, "debug": debug_mode}


if __name__ == "__main__":
    print("Echo Cancellation Manager Usage Examples")
    print("=" * 50)

    # Run configuration example
    manager = configure_echo_cancellation_example()
    print(f"Manager created successfully: {manager}")

    # Run advanced configuration example
    configs = advanced_configuration_example()
    print(f"Created {len(configs)} configurations")

    print("Examples completed!")
