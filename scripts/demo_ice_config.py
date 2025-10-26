#!/usr/bin/env python3
"""
Demo script for ICE configuration functionality
Shows how to use the ICE configuration system
Note: Encryption has been removed - credentials are now stored in plain text
"""

import os
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

def demo_basic_configuration():
    """Demonstrate basic ICE configuration"""
    print("=== ICE Configuration Demo ===")
    print()
    
    try:
        from config.ice_config import ice_config
        
        print("1. ICE Configuration Demo")
        print("-" * 30)
        
        # Get ICE configuration
        config = ice_config.get_ice_config()
        print(f"ICE Servers: {len(config['iceServers'])}")
        print(f"ICE Candidate Pool Size: {config['iceCandidatePoolSize']}")
        print(f"ICE Transport Policy: {config['iceTransportPolicy']}")
        print()
        
        print("Configured ICE Servers:")
        for i, server in enumerate(config['iceServers']):
            print(f"  Server {i+1}: {server}")
        print()
        
        # Show validation
        validation = ice_config.validate_configuration()
        print(f"Configuration Valid: {validation['valid']}")
        print(f"STUN Servers: {validation['stun_servers']}")
        print(f"TURN Servers: {validation['turn_servers']}")
        print(f"Total Servers: {validation['total_servers']}")
        
        if validation['issues']:
            print("Issues found:")
            for issue in validation['issues']:
                print(f"  - {issue}")
        else:
            print("✓ No issues found")
        print()
        
    except ImportError as e:
        print(f"Error: {e}")
        return False
    
    return True


def demo_environment_setup():
    """Show how to set up environment variables"""
    print("2. Environment Setup")
    print("-" * 20)
    
    print("The Cloudflare TURN server is now hardcoded in the application.")
    print("For additional TURN servers, you can set these environment variables:")
    print()
    print("# Additional TURN Servers Configuration")
    print("TURN_SERVER_COUNT=1")
    print("TURN_SERVER_1_URLS=turn:your-turn-server.com:3478?transport=udp,turn:your-turn-server.com:3478?transport=tcp")
    print("TURN_SERVER_1_USERNAME=your_username")
    print("TURN_SERVER_1_CREDENTIAL=your_password")
    print()


def demo_client_usage():
    """Show client-side usage"""
    print("3. Client-Side Usage")
    print("-" * 20)
    
    print("The client-side code now directly uses the ICE configuration from the server:")
    print()
    print("// Get ICE configuration from server")
    print("const resp = await fetch('/api/ice');")
    print("const iceConfig = await resp.json();")
    print("const pc = new RTCPeerConnection(iceConfig);")
    print()


def demo_api_endpoints():
    """Show available API endpoints"""
    print("4. API Endpoints")
    print("-" * 15)
    
    print("Available endpoints:")
    print("- GET /api/ice - Get ICE configuration (with plain text credentials)")
    print("- GET /api/ice/status - Get configuration status and validation")
    print()
    print("Example usage:")
    print("curl http://localhost:51000/api/ice")
    print("curl http://localhost:51000/api/ice/status")
    print()


def main():
    """Run the demo"""
    print("XiaoZhi WebRTC - ICE Configuration Demo")
    print("=" * 50)
    print()
    
    success = demo_basic_configuration()
    if success:
        demo_environment_setup()
        demo_client_usage()
        demo_api_endpoints()
        
        print("5. Next Steps")
        print("-" * 12)
        print("1. The Cloudflare TURN server is already configured")
        print("2. Add additional TURN servers if needed using environment variables")
        print("3. Test the configuration")
        print()
        print("For detailed documentation, see: docs/SECURE_ICE_CONFIGURATION.md")
    else:
        print("Please check the configuration and try again.")


if __name__ == '__main__':
    main()
