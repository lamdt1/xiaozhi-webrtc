import os
from typing import Any, Dict, List

from aiortc import RTCIceServer


class ICEConfig:
    """ICE server configuration management class"""

    def __init__(self):
        # Default STUN servers
        self.default_stun_urls = [
            "stun:stun.miwifi.com:3478",
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun.stunprotocol.org:3478",
        ]

    def get_ice_config(self) -> Dict[str, Any]:
        """Get frontend ICE configuration"""
        ice_servers = []

        # Add default STUN servers
        for url in self.default_stun_urls:
            ice_servers.append({"urls": url})

        return {"iceServers": ice_servers, "iceCandidatePoolSize": 10, "iceTransportPolicy": "all"}

    def get_server_ice_servers(self) -> List[RTCIceServer]:
        """Get server-side ICE server objects"""
        servers = []

        # Add default STUN servers
        for url in self.default_stun_urls:
            servers.append(RTCIceServer(urls=url))

        return servers


# Global instance
ice_config = ICEConfig()
