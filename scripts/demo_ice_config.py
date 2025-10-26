#!/usr/bin/env python3
"""
Demo script for ICE configuration functionality
Shows how to use the secure ICE configuration system
"""

import os
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

def demo_encryption():
    """Demonstrate credential encryption"""
    print("=== ICE Configuration Demo ===")
    print()
    
    try:
        from config.crypto_config import crypto_config
        
        print("1. Credential Encryption Demo")
        print("-" * 30)
        
        # Example credentials (from the provided configuration)
        username = "c682c16159f88382fcee1dfc6161bca4"
        password = "813b143a66f601f9e651920617c7cd2188437ab3172c12bdc146e4ad004a5fca"
        
        print(f"Original Username: {username}")
        print(f"Original Password: {password}")
        print()
        
        # Encrypt credentials
        encrypted_username = crypto_config.encrypt_credential(username)
        encrypted_password = crypto_config.encrypt_credential(password)
        
        print("Encrypted Credentials:")
        print(f"CLOUDFLARE_TURN_USERNAME=encrypted:{encrypted_username}")
        print(f"CLOUDFLARE_TURN_CREDENTIAL=encrypted:{encrypted_password}")
        print()
        
        # Decrypt to verify
        decrypted_username = crypto_config.decrypt_credential(encrypted_username)
        decrypted_password = crypto_config.decrypt_credential(encrypted_password)
        
        print("Verification (Decrypted):")
        print(f"Username: {decrypted_username}")
        print(f"Password: {decrypted_password}")
        print(f"Match: {username == decrypted_username and password == decrypted_password}")
        print()
        
    except ImportError as e:
        print(f"Error: {e}")
        print("Please install dependencies: pip install cryptography")
        return False
    
    return True


def demo_environment_setup():
    """Show how to set up environment variables"""
    print("2. Environment Setup")
    print("-" * 20)
    
    print("To use the secure ICE configuration, set these environment variables:")
    print()
    print("# Generate master key first:")
    print("python scripts/manage_ice_credentials.py generate-key")
    print()
    print("# Then set in your .env file or environment:")
    print("ICE_MASTER_KEY=your_generated_master_key")
    print("CLOUDFLARE_TURN_USERNAME=encrypted:your_encrypted_username")
    print("CLOUDFLARE_TURN_CREDENTIAL=encrypted:your_encrypted_password")
    print()


def demo_client_usage():
    """Show client-side usage"""
    print("3. Client-Side Usage")
    print("-" * 20)
    
    print("In your HTML files, include the crypto library and set the master key:")
    print()
    print('<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>')
    print('<script src="static/js/ice-crypto.js"></script>')
    print()
    print('<script>')
    print('// Set master key for decryption')
    print('window.ICE_MASTER_KEY = "your_master_key_here";')
    print('// or store in localStorage')
    print('localStorage.setItem("ice_master_key", "your_master_key_here");')
    print('</script>')
    print()


def demo_api_endpoints():
    """Show available API endpoints"""
    print("4. API Endpoints")
    print("-" * 15)
    
    print("Available endpoints:")
    print("- GET /api/ice - Get ICE configuration (with encrypted credentials)")
    print("- GET /api/ice/status - Get configuration status and validation")
    print()
    print("Example usage:")
    print("curl http://localhost:51000/api/ice")
    print("curl http://localhost:51000/api/ice/status")
    print()


def main():
    """Run the demo"""
    print("XiaoZhi WebRTC - Secure ICE Configuration Demo")
    print("=" * 50)
    print()
    
    success = demo_encryption()
    if success:
        demo_environment_setup()
        demo_client_usage()
        demo_api_endpoints()
        
        print("5. Next Steps")
        print("-" * 12)
        print("1. Generate a master key")
        print("2. Encrypt your TURN server credentials")
        print("3. Set environment variables")
        print("4. Update your HTML files with client-side decryption")
        print("5. Test the configuration")
        print()
        print("For detailed documentation, see: docs/SECURE_ICE_CONFIGURATION.md")
    else:
        print("Please install the required dependencies and try again.")


if __name__ == '__main__':
    main()
