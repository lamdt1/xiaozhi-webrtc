#!/usr/bin/env python3
"""
ICE Server Credential Management Script
Provides utilities for managing TURN server credentials
Note: Encryption has been removed - credentials are now stored in plain text
"""

import argparse
import os
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))


def generate_env_file(server_name: str, urls: list, username: str, password: str):
    """Generate environment variable configuration"""
    print(f"\n# {server_name} TURN Server Configuration")
    print(f"# URLs: {', '.join(urls)}")
    print(f"# Username: {username}")
    print(f"# Password: {password}")
    print()
    
    if server_name.lower() == 'cloudflare':
        print(f"# Note: Cloudflare TURN server is now hardcoded in the application")
        print(f"# CLOUDFLARE_TURN_USERNAME={username}")
        print(f"# CLOUDFLARE_TURN_CREDENTIAL={password}")
    else:
        print(f"# Add these to your .env file:")
        print(f"TURN_SERVER_COUNT=1")
        print(f"TURN_SERVER_1_URLS={','.join(urls)}")
        print(f"TURN_SERVER_1_USERNAME={username}")
        print(f"TURN_SERVER_1_CREDENTIAL={password}")


def main():
    parser = argparse.ArgumentParser(description='Manage ICE server credentials')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Generate Cloudflare config
    cf_parser = subparsers.add_parser('cloudflare', help='Generate Cloudflare TURN configuration')
    cf_parser.add_argument('username', help='Cloudflare TURN username')
    cf_parser.add_argument('password', help='Cloudflare TURN password')
    
    # Generate custom TURN server config
    custom_parser = subparsers.add_parser('custom', help='Generate custom TURN server configuration')
    custom_parser.add_argument('username', help='TURN server username')
    custom_parser.add_argument('password', help='TURN server password')
    custom_parser.add_argument('--server-name', default='Custom', help='Server name for output')
    custom_parser.add_argument('--urls', nargs='+', required=True, help='TURN server URLs')
    
    args = parser.parse_args()
    
    if args.command == 'cloudflare':
        urls = [
            "turn:turn.cloudflare.com:3478?transport=udp",
            "turn:turn.cloudflare.com:3478?transport=tcp",
            "turns:turn.cloudflare.com:5349?transport=tcp"
        ]
        generate_env_file('Cloudflare', urls, args.username, args.password)
    
    elif args.command == 'custom':
        generate_env_file(args.server_name, args.urls, args.username, args.password)
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
