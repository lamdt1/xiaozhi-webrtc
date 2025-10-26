import os
import logging
from typing import Any, Dict, List, Optional

from aiortc import RTCIceServer

logger = logging.getLogger(__name__)


class ICEConfig:
    """ICE server configuration management class"""

    def __init__(self):
        # Default STUN servers - prioritize Cloudflare for WebRTC service compatibility
        self.default_stun_urls = [
            "stun:stun.cloudflare.com:3478",  # Primary Cloudflare STUN
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun.stunprotocol.org:3478",
            "stun:stun.miwifi.com:3478",
        ]
        
        # TURN server configuration from environment variables
        self.turn_servers = self._load_turn_servers()
        
    def _load_turn_servers(self) -> List[Dict[str, Any]]:
        """Load TURN server configurations from environment variables"""
        turn_servers = []
        
        # Add the provided Cloudflare TURN server configuration
        turn_servers.append({
            'urls': [
                "turn:turn.cloudflare.com:3478?transport=udp",
                "turn:turn.cloudflare.com:3478?transport=tcp",
                "turns:turn.cloudflare.com:5349?transport=tcp"
            ],
            'username': "c682c16159f88382fcee1dfc6161bca4",
            'credential': "813b143a66f601f9e651920617c7cd2188437ab3172c12bdc146e4ad004a5fca"
        })
        logger.info("Loaded Cloudflare TURN server configuration")
        
        # Load additional TURN servers from environment
        turn_count = int(os.getenv('TURN_SERVER_COUNT', '0'))
        for i in range(turn_count):
            server_key = f'TURN_SERVER_{i+1}'
            urls = os.getenv(f'{server_key}_URLS', '').split(',')
            username = os.getenv(f'{server_key}_USERNAME')
            credential = os.getenv(f'{server_key}_CREDENTIAL')
            
            if urls and username and credential:
                try:
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
        """Get frontend ICE configuration optimized for WebRTCManager"""
        ice_servers = []

        # Add default STUN servers
        for url in self.default_stun_urls:
            ice_servers.append({"urls": url})

        # Add TURN servers with plain text credentials
        for turn_server in self.turn_servers:
            ice_servers.append({
                "urls": turn_server['urls'],
                "username": turn_server['username'],
                "credential": turn_server['credential']
            })

        return {
            "iceServers": ice_servers, 
            "iceCandidatePoolSize": 10, 
            "iceTransportPolicy": "all",
            "bundlePolicy": "max-bundle",
            "rtcpMuxPolicy": "require"
        }
    
    def get_cloudflare_optimized_config(self) -> Dict[str, Any]:
        """Get ICE configuration optimized for Cloudflare WebRTC service"""
        ice_servers = []

        # Prioritize Cloudflare STUN server
        ice_servers.append({"urls": "stun:stun.cloudflare.com:3478"})
        
        # Add other STUN servers as fallbacks
        for url in self.default_stun_urls[1:]:  # Skip first one as it's already added
            ice_servers.append({"urls": url})

        # Add TURN servers if available
        for turn_server in self.turn_servers:
            ice_servers.append({
                "urls": turn_server['urls'],
                "username": turn_server['username'],
                "credential": turn_server['credential']
            })

        return {
            "iceServers": ice_servers, 
            "iceCandidatePoolSize": 10, 
            "iceTransportPolicy": "all",
            "bundlePolicy": "max-bundle",
            "rtcpMuxPolicy": "require"
        }

    def get_server_ice_servers(self) -> List[RTCIceServer]:
        """Get server-side ICE server objects"""
        servers = []

        # Add default STUN servers
        for url in self.default_stun_urls:
            servers.append(RTCIceServer(urls=url))

        # Add TURN servers
        for turn_server in self.turn_servers:
            servers.append(RTCIceServer(
                urls=turn_server['urls'],
                username=turn_server['username'],
                credential=turn_server['credential']
            ))

        return servers
    
    def get_webrtc_manager_config(self) -> Dict[str, Any]:
        """Get configuration optimized for WebRTCManager class"""
        ice_config = self.get_ice_config()
        
        return {
            "iceServers": ice_config["iceServers"],
            "iceCandidatePoolSize": ice_config["iceCandidatePoolSize"],
            "bundlePolicy": ice_config["bundlePolicy"],
            "iceTransportPolicy": ice_config["iceTransportPolicy"],
            "rtcpMuxPolicy": ice_config["rtcpMuxPolicy"]
        }
    
    def get_cloudflare_webrtc_config(self) -> Dict[str, Any]:
        """Get configuration optimized for Cloudflare WebRTC service"""
        return {
            "iceServers": [
                {
                    "urls": "stun:stun.cloudflare.com:3478"
                }
            ],
            "bundlePolicy": "max-bundle"
        }
    
    def get_cloudflare_realtime_config(self) -> Dict[str, Any]:
        """Get configuration for Cloudflare Realtime API integration"""
        return {
            "appId": os.getenv('CLOUDFLARE_APP_ID', 'cb015f7379343011a6a0df5346eaf66a'),
            "appSecret": os.getenv('CLOUDFLARE_APP_SECRET', '766167af0976e9a98f16523f4c38b4abfa7b8d015a810c0dafd16cc68967b202'),
            "basePath": "https://rtc.live.cloudflare.com/v1",
            "iceServers": [
                {
                    "urls": "stun:stun.cloudflare.com:3478"
                }
            ],
            "bundlePolicy": "max-bundle"
        }
    
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
        summary += f"- Cloudflare optimized: Yes (stun.cloudflare.com prioritized)\n"
        summary += f"- Bundle policy: max-bundle (Cloudflare compatible)\n"
        
        if validation['issues']:
            summary += f"- Issues found: {len(validation['issues'])}\n"
            for issue in validation['issues']:
                summary += f"  - {issue}\n"
        
        return summary


# Global instance
ice_config = ICEConfig()
