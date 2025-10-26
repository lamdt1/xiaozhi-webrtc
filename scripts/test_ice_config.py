#!/usr/bin/env python3
"""
Test script for ICE configuration functionality
Demonstrates the secure ICE configuration system
"""

import os
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from config.ice_config import ice_config
from config.crypto_config import crypto_config


def test_basic_configuration():
    """Test basic ICE configuration without TURN servers"""
    print("=== Testing Basic Configuration ===")
    
    config = ice_config.get_ice_config()
    print(f"ICE Servers: {len(config['iceServers'])}")
    print(f"ICE Candidate Pool Size: {config['iceCandidatePoolSize']}")
    print(f"ICE Transport Policy: {config['iceTransportPolicy']}")
    
    for i, server in enumerate(config['iceServers']):
        print(f"  Server {i+1}: {server}")
    
    print()


def test_encryption():
    """Test credential encryption and decryption"""
    print("=== Testing Encryption/Decryption ===")
    
    test_username = "test_user"
    test_password = "test_password_123"
    
    # Encrypt credentials
    encrypted_username = crypto_config.encrypt_credential(test_username)
    encrypted_password = crypto_config.encrypt_credential(test_password)
    
    print(f"Original Username: {test_username}")
    print(f"Encrypted Username: encrypted:{encrypted_username}")
    print(f"Original Password: {test_password}")
    print(f"Encrypted Password: encrypted:{encrypted_password}")
    
    # Decrypt credentials
    decrypted_username = crypto_config.decrypt_credential(encrypted_username)
    decrypted_password = crypto_config.decrypt_credential(encrypted_password)
    
    print(f"Decrypted Username: {decrypted_username}")
    print(f"Decrypted Password: {decrypted_password}")
    
    # Verify
    assert test_username == decrypted_username, "Username decryption failed"
    assert test_password == decrypted_password, "Password decryption failed"
    print("✓ Encryption/Decryption test passed")
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
    master_key = os.getenv('ICE_MASTER_KEY')
    cf_username = os.getenv('CLOUDFLARE_TURN_USERNAME')
    cf_credential = os.getenv('CLOUDFLARE_TURN_CREDENTIAL')
    
    if master_key:
        print(f"Master Key: {master_key[:20]}...")
    else:
        print("No master key set")
    
    if cf_username and cf_credential:
        print(f"Cloudflare Username: {cf_username[:30]}...")
        print(f"Cloudflare Credential: {cf_credential[:30]}...")
        
        # Test decryption
        try:
            if cf_username.startswith('encrypted:'):
                decrypted_username = crypto_config.decrypt_credential(cf_username[10:])
                print(f"Decrypted Username: {decrypted_username}")
            if cf_credential.startswith('encrypted:'):
                decrypted_credential = crypto_config.decrypt_credential(cf_credential[10:])
                print(f"Decrypted Credential: {decrypted_credential[:10]}...")
        except Exception as e:
            print(f"Decryption failed: {e}")
    else:
        print("No Cloudflare credentials set")
    
    print()


def main():
    """Run all tests"""
    print("ICE Configuration Test Suite")
    print("=" * 50)
    
    try:
        test_basic_configuration()
        test_encryption()
        test_validation()
        test_configuration_summary()
        test_with_environment_variables()
        
        print("✓ All tests completed successfully!")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
