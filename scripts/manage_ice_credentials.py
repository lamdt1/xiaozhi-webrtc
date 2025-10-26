#!/usr/bin/env python3
"""
ICE Server Credential Management Script
Provides utilities for encrypting/decrypting TURN server credentials
"""

import argparse
import os
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from config.crypto_config import crypto_config


def encrypt_credentials(username: str, password: str) -> tuple:
    """Encrypt TURN server credentials"""
    encrypted_username = crypto_config.encrypt_credential(username)
    encrypted_password = crypto_config.encrypt_credential(password)
    return encrypted_username, encrypted_password


def decrypt_credentials(encrypted_username: str, encrypted_password: str) -> tuple:
    """Decrypt TURN server credentials"""
    username = crypto_config.decrypt_credential(encrypted_username)
    password = crypto_config.decrypt_credential(encrypted_password)
    return username, password


def generate_env_file(server_name: str, urls: list, username: str, password: str):
    """Generate environment variable configuration"""
    encrypted_username, encrypted_password = encrypt_credentials(username, password)
    
    print(f"\n# {server_name} TURN Server Configuration")
    print(f"# URLs: {', '.join(urls)}")
    print(f"# Original Username: {username}")
    print(f"# Original Password: {password}")
    print()
    
    if server_name.lower() == 'cloudflare':
        print(f"CLOUDFLARE_TURN_USERNAME=encrypted:{encrypted_username}")
        print(f"CLOUDFLARE_TURN_CREDENTIAL=encrypted:{encrypted_password}")
    else:
        print(f"# Add these to your .env file:")
        print(f"TURN_SERVER_COUNT=1")
        print(f"TURN_SERVER_1_URLS={','.join(urls)}")
        print(f"TURN_SERVER_1_USERNAME=encrypted:{encrypted_username}")
        print(f"TURN_SERVER_1_CREDENTIAL=encrypted:{encrypted_password}")


def main():
    parser = argparse.ArgumentParser(description='Manage ICE server credentials')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Encrypt command
    encrypt_parser = subparsers.add_parser('encrypt', help='Encrypt credentials')
    encrypt_parser.add_argument('username', help='TURN server username')
    encrypt_parser.add_argument('password', help='TURN server password')
    encrypt_parser.add_argument('--server-name', default='Custom', help='Server name for output')
    encrypt_parser.add_argument('--urls', nargs='+', help='TURN server URLs')
    
    # Decrypt command
    decrypt_parser = subparsers.add_parser('decrypt', help='Decrypt credentials')
    decrypt_parser.add_argument('encrypted_username', help='Encrypted username')
    decrypt_parser.add_argument('encrypted_password', help='Encrypted password')
    
    # Generate Cloudflare config
    cf_parser = subparsers.add_parser('cloudflare', help='Generate Cloudflare TURN configuration')
    cf_parser.add_argument('username', help='Cloudflare TURN username')
    cf_parser.add_argument('password', help='Cloudflare TURN password')
    
    # Generate master key
    key_parser = subparsers.add_parser('generate-key', help='Generate new master encryption key')
    
    args = parser.parse_args()
    
    if args.command == 'encrypt':
        encrypted_username, encrypted_password = encrypt_credentials(args.username, args.password)
        print(f"Encrypted Username: encrypted:{encrypted_username}")
        print(f"Encrypted Password: encrypted:{encrypted_password}")
        
        if args.urls:
            generate_env_file(args.server_name, args.urls, args.username, args.password)
    
    elif args.command == 'decrypt':
        username, password = decrypt_credentials(args.encrypted_username, args.encrypted_password)
        print(f"Decrypted Username: {username}")
        print(f"Decrypted Password: {password}")
    
    elif args.command == 'cloudflare':
        urls = [
            "turn:turn.cloudflare.com:3478?transport=udp",
            "turn:turn.cloudflare.com:3478?transport=tcp",
            "turns:turn.cloudflare.com:5349?transport=tcp"
        ]
        generate_env_file('Cloudflare', urls, args.username, args.password)
    
    elif args.command == 'generate-key':
        from cryptography.fernet import Fernet
        new_key = Fernet.generate_key().decode()
        print(f"New Master Key: {new_key}")
        print(f"Set this as ICE_MASTER_KEY environment variable")
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
