#!/usr/bin/env python3
"""
Test script for ICE configuration functionality
Demonstrates the ICE configuration system
Note: Encryption has been removed - credentials are now stored in plain text
"""

import os
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from config.ice_config import ice_config


def test_basic_configuration():
    """Test basic ICE configuration"""
    print("=== Testing Basic Configuration ===")
    
    config = ice_config.get_ice_config()
    print(f"ICE Servers: {len(config['iceServers'])}")
    print(f"ICE Candidate Pool Size: {config['iceCandidatePoolSize']}")
    print(f"ICE Transport Policy: {config['iceTransportPolicy']}")
    
    for i, server in enumerate(config['iceServers']):
        print(f"  Server {i+1}: {server}")
    
    print()


def test_validation():
    """Test configuration validation"""
    print("=== Testing Configuration Validation ===")
    
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


def test_configuration_summary():
    """Test configuration summary"""
    print("=== Configuration Summary ===")
    summary = ice_config.get_configuration_summary()
    print(summary)


def test_with_environment_variables():
    """Test with environment variables (if set)"""
    print("=== Testing with Environment Variables ===")
    
    # Check if environment variables are set
    cf_username = os.getenv('CLOUDFLARE_TURN_USERNAME')
    cf_credential = os.getenv('CLOUDFLARE_TURN_CREDENTIAL')
    
    if cf_username and cf_credential:
        print(f"Cloudflare Username: {cf_username[:30]}...")
        print(f"Cloudflare Credential: {cf_credential[:30]}...")
    else:
        print("No Cloudflare credentials set in environment (using hardcoded values)")
    
    # Check additional TURN servers
    turn_count = int(os.getenv('TURN_SERVER_COUNT', '0'))
    if turn_count > 0:
        print(f"Additional TURN servers configured: {turn_count}")
        for i in range(turn_count):
            server_key = f'TURN_SERVER_{i+1}'
            urls = os.getenv(f'{server_key}_URLS', '')
            username = os.getenv(f'{server_key}_USERNAME', '')
            if urls and username:
                print(f"  Server {i+1}: {username[:20]}...")
    else:
        print("No additional TURN servers configured")
    
    print()


def test_server_ice_servers():
    """Test server-side ICE server objects"""
    print("=== Testing Server ICE Servers ===")
    
    servers = ice_config.get_server_ice_servers()
    print(f"Server ICE Servers: {len(servers)}")
    
    for i, server in enumerate(servers):
        print(f"  Server {i+1}: {server.urls}")
        if hasattr(server, 'username') and server.username:
            print(f"    Username: {server.username[:20]}...")
        if hasattr(server, 'credential') and server.credential:
            print(f"    Credential: {server.credential[:20]}...")
    
    print()


def main():
    """Run all tests"""
    print("ICE Configuration Test Suite")
    print("=" * 50)
    
    try:
        test_basic_configuration()
        test_validation()
        test_configuration_summary()
        test_with_environment_variables()
        test_server_ice_servers()
        
        print("✓ All tests completed successfully!")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
