import os
import logging
from typing import Any, Dict, List, Optional

from aiortc import RTCIceServer

from .crypto_config import crypto_config

logger = logging.getLogger(__name__)


class ICEConfig:
    """ICE server configuration management class with secure credential support"""

    def __init__(self):
        # Default STUN servers
        self.default_stun_urls = [
            "stun:stun.miwifi.com:3478",
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun.stunprotocol.org:3478",
        ]
        
        # TURN server configuration from environment variables
        self.turn_servers = self._load_turn_servers()
        
    def _load_turn_servers(self) -> List[Dict[str, Any]]:
        """Load TURN server configurations from environment variables"""
        turn_servers = []
        
        # Load Cloudflare TURN servers (from the provided configuration)
        cf_username = os.getenv('CLOUDFLARE_TURN_USERNAME')
        cf_credential = os.getenv('CLOUDFLARE_TURN_CREDENTIAL')
        
        if cf_username and cf_credential:
            try:
                # Decrypt credentials if they are encrypted
                if cf_username.startswith('encrypted:'):
                    cf_username = crypto_config.decrypt_credential(cf_username[10:])
                if cf_credential.startswith('encrypted:'):
                    cf_credential = crypto_config.decrypt_credential(cf_credential[10:])
                
                turn_servers.append({
                    'urls': [
                        "turn:turn.cloudflare.com:3478?transport=udp",
                        "turn:turn.cloudflare.com:3478?transport=tcp",
                        "turns:turn.cloudflare.com:5349?transport=tcp"
                    ],
                    'username': cf_username,
                    'credential': cf_credential
                })
                logger.info("Loaded Cloudflare TURN server configuration")
            except Exception as e:
                logger.error(f"Failed to load Cloudflare TURN server: {e}")
        
        # Load additional TURN servers from environment
        turn_count = int(os.getenv('TURN_SERVER_COUNT', '0'))
        for i in range(turn_count):
            server_key = f'TURN_SERVER_{i+1}'
            urls = os.getenv(f'{server_key}_URLS', '').split(',')
            username = os.getenv(f'{server_key}_USERNAME')
            credential = os.getenv(f'{server_key}_CREDENTIAL')
            
            if urls and username and credential:
                try:
                    # Decrypt credentials if they are encrypted
                    if username.startswith('encrypted:'):
                        username = crypto_config.decrypt_credential(username[10:])
                    if credential.startswith('encrypted:'):
                        credential = crypto_config.decrypt_credential(credential[10:])
                    
                    turn_servers.append({
                        'urls': [url.strip() for url in urls if url.strip()],
                        'username': username,
                        'credential': credential
                    })
                    logger.info(f"Loaded TURN server {i+1} configuration")
                except Exception as e:
                    logger.error(f"Failed to load TURN server {i+1}: {e}")
        
        return turn_servers

    def get_ice_config(self) -> Dict[str, Any]:
        """Get frontend ICE configuration with encrypted credentials for client-side decryption"""
        ice_servers = []

        # Add default STUN servers
        for url in self.default_stun_urls:
            ice_servers.append({"urls": url})

        # Add TURN servers with encrypted credentials for client-side decryption
        for turn_server in self.turn_servers:
            # Encrypt credentials for client-side decryption
            encrypted_username = crypto_config.encrypt_credential(turn_server['username'])
            encrypted_credential = crypto_config.encrypt_credential(turn_server['credential'])
            
            ice_servers.append({
                "urls": turn_server['urls'],
                "username": f"encrypted:{encrypted_username}",
                "credential": f"encrypted:{encrypted_credential}"
            })

        return {"iceServers": ice_servers, "iceCandidatePoolSize": 10, "iceTransportPolicy": "all"}

    def get_server_ice_servers(self) -> List[RTCIceServer]:
        """Get server-side ICE server objects with decrypted credentials"""
        servers = []

        # Add default STUN servers
        for url in self.default_stun_urls:
            servers.append(RTCIceServer(urls=url))

        # Add TURN servers with decrypted credentials
        for turn_server in self.turn_servers:
            servers.append(RTCIceServer(
                urls=turn_server['urls'],
                username=turn_server['username'],
                credential=turn_server['credential']
            ))

        return servers
    
    def validate_configuration(self) -> Dict[str, Any]:
        """
        Validate ICE server configuration and return validation results.
        
        Returns:
            Dictionary with validation results and any issues found
        """
        validation_result = {
            'valid': True,
            'issues': [],
            'stun_servers': len(self.default_stun_urls),
            'turn_servers': len(self.turn_servers),
            'total_servers': len(self.default_stun_urls) + len(self.turn_servers)
        }
        
        # Validate STUN servers
        for url in self.default_stun_urls:
            if not url.startswith('stun:'):
                validation_result['issues'].append(f"Invalid STUN URL format: {url}")
                validation_result['valid'] = False
        
        # Validate TURN servers
        for i, turn_server in enumerate(self.turn_servers):
            if not turn_server.get('urls'):
                validation_result['issues'].append(f"TURN server {i+1}: No URLs specified")
                validation_result['valid'] = False
            else:
                for url in turn_server['urls']:
                    if not (url.startswith('turn:') or url.startswith('turns:')):
                        validation_result['issues'].append(f"TURN server {i+1}: Invalid URL format: {url}")
                        validation_result['valid'] = False
            
            if not turn_server.get('username'):
                validation_result['issues'].append(f"TURN server {i+1}: No username specified")
                validation_result['valid'] = False
            
            if not turn_server.get('credential'):
                validation_result['issues'].append(f"TURN server {i+1}: No credential specified")
                validation_result['valid'] = False
        
        return validation_result
    
    def get_configuration_summary(self) -> str:
        """Get a human-readable summary of the current ICE configuration"""
        validation = self.validate_configuration()
        
        summary = f"ICE Configuration Summary:\n"
        summary += f"- STUN servers: {validation['stun_servers']}\n"
        summary += f"- TURN servers: {validation['turn_servers']}\n"
        summary += f"- Total servers: {validation['total_servers']}\n"
        summary += f"- Configuration valid: {validation['valid']}\n"
        
        if validation['issues']:
            summary += f"- Issues found: {len(validation['issues'])}\n"
            for issue in validation['issues']:
                summary += f"  - {issue}\n"
        
        return summary


# Global instance
ice_config = ICEConfig()
