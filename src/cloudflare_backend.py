"""
Cloudflare Realtime API Backend Integration
Handles backend processing for Cloudflare Realtime API connections
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any, Optional

from aiohttp import web
from src.config.ice_config import ice_config
from src.server import XiaoZhiServer
from src.track.audio import AudioFaceSwapper
from src.track.video import VideoFaceSwapper

logger = logging.getLogger(__name__)

class CloudflareRealtimeBackend:
    """Backend handler for Cloudflare Realtime API integration"""
    
    def __init__(self):
        self.xiaozhi_server = XiaoZhiServer()
        self.audio_processor = AudioFaceSwapper()
        self.video_processor = VideoFaceSwapper()
        self.active_sessions = {}  # Track active Cloudflare sessions
        
    async def handle_cloudflare_session(self, request):
        """
        Handle Cloudflare Realtime API session management
        This replaces the traditional /api/offer endpoint
        """
        try:
            data = await request.json()
            session_id = data.get('sessionId')
            action = data.get('action', 'create')
            
            if action == 'create':
                return await self.create_session(request, data)
            elif action == 'update':
                return await self.update_session(request, data)
            elif action == 'close':
                return await self.close_session(request, data)
            else:
                return web.Response(
                    status=400,
                    content_type="application/json",
                    text=json.dumps({"error": "Invalid action"})
                )
                
        except Exception as e:
            logger.error(f"Error handling Cloudflare session: {e}")
            return web.Response(
                status=500,
                content_type="application/json",
                text=json.dumps({"error": str(e)})
            )
    
    async def create_session(self, request, data):
        """Create a new Cloudflare session"""
        try:
            session_id = data.get('sessionId')
            client_ip = self.get_client_ip(request)
            mac_address = data.get('macAddress', '00:00:00:00:00:00')
            
            # Store session information
            self.active_sessions[session_id] = {
                'client_ip': client_ip,
                'mac_address': mac_address,
                'created_at': asyncio.get_event_loop().time(),
                'status': 'active'
            }
            
            logger.info(f"Created Cloudflare session: {session_id} for IP: {client_ip}")
            
            return web.Response(
                content_type="application/json",
                text=json.dumps({
                    "sessionId": session_id,
                    "status": "created",
                    "message": "Session created successfully"
                })
            )
            
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return web.Response(
                status=500,
                content_type="application/json",
                text=json.dumps({"error": str(e)})
            )
    
    async def update_session(self, request, data):
        """Update an existing Cloudflare session"""
        try:
            session_id = data.get('sessionId')
            
            if session_id not in self.active_sessions:
                return web.Response(
                    status=404,
                    content_type="application/json",
                    text=json.dumps({"error": "Session not found"})
                )
            
            # Update session data
            self.active_sessions[session_id].update({
                'last_activity': asyncio.get_event_loop().time(),
                'status': 'active'
            })
            
            logger.info(f"Updated Cloudflare session: {session_id}")
            
            return web.Response(
                content_type="application/json",
                text=json.dumps({
                    "sessionId": session_id,
                    "status": "updated",
                    "message": "Session updated successfully"
                })
            )
            
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            return web.Response(
                status=500,
                content_type="application/json",
                text=json.dumps({"error": str(e)})
            )
    
    async def close_session(self, request, data):
        """Close a Cloudflare session"""
        try:
            session_id = data.get('sessionId')
            
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
                logger.info(f"Closed Cloudflare session: {session_id}")
            
            return web.Response(
                content_type="application/json",
                text=json.dumps({
                    "sessionId": session_id,
                    "status": "closed",
                    "message": "Session closed successfully"
                })
            )
            
        except Exception as e:
            logger.error(f"Error closing session: {e}")
            return web.Response(
                status=500,
                content_type="application/json",
                text=json.dumps({"error": str(e)})
            )
    
    async def handle_audio_processing(self, request):
        """
        Handle audio processing requests from Cloudflare Realtime API
        This processes audio streams that come through Cloudflare
        """
        try:
            data = await request.json()
            session_id = data.get('sessionId')
            audio_data = data.get('audioData')
            
            if not session_id or not audio_data:
                return web.Response(
                    status=400,
                    content_type="application/json",
                    text=json.dumps({"error": "Missing sessionId or audioData"})
                )
            
            # Process audio through XiaoZhi AI
            processed_audio = await self.audio_processor.process_audio(audio_data)
            
            return web.Response(
                content_type="application/json",
                text=json.dumps({
                    "sessionId": session_id,
                    "processedAudio": processed_audio,
                    "status": "processed"
                })
            )
            
        except Exception as e:
            logger.error(f"Error processing audio: {e}")
            return web.Response(
                status=500,
                content_type="application/json",
                text=json.dumps({"error": str(e)})
            )
    
    async def handle_video_processing(self, request):
        """
        Handle video processing requests from Cloudflare Realtime API
        This processes video streams that come through Cloudflare
        """
        try:
            data = await request.json()
            session_id = data.get('sessionId')
            video_data = data.get('videoData')
            
            if not session_id or not video_data:
                return web.Response(
                    status=400,
                    content_type="application/json",
                    text=json.dumps({"error": "Missing sessionId or videoData"})
                )
            
            # Process video through XiaoZhi AI
            processed_video = await self.video_processor.process_video(video_data)
            
            return web.Response(
                content_type="application/json",
                text=json.dumps({
                    "sessionId": session_id,
                    "processedVideo": processed_video,
                    "status": "processed"
                })
            )
            
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            return web.Response(
                status=500,
                content_type="application/json",
                text=json.dumps({"error": str(e)})
            )
    
    async def get_session_status(self, request):
        """Get status of active Cloudflare sessions"""
        try:
            session_id = request.match_info.get('sessionId')
            
            if session_id:
                # Get specific session status
                if session_id in self.active_sessions:
                    session_data = self.active_sessions[session_id]
                    return web.Response(
                        content_type="application/json",
                        text=json.dumps({
                            "sessionId": session_id,
                            "status": session_data['status'],
                            "clientIp": session_data['client_ip'],
                            "macAddress": session_data['mac_address'],
                            "createdAt": session_data['created_at'],
                            "lastActivity": session_data.get('last_activity', session_data['created_at'])
                        })
                    )
                else:
                    return web.Response(
                        status=404,
                        content_type="application/json",
                        text=json.dumps({"error": "Session not found"})
                    )
            else:
                # Get all sessions status
                sessions = {}
                for sid, data in self.active_sessions.items():
                    sessions[sid] = {
                        "status": data['status'],
                        "clientIp": data['client_ip'],
                        "macAddress": data['mac_address'],
                        "createdAt": data['created_at'],
                        "lastActivity": data.get('last_activity', data['created_at'])
                    }
                
                return web.Response(
                    content_type="application/json",
                    text=json.dumps({
                        "activeSessions": len(self.active_sessions),
                        "sessions": sessions
                    })
                )
                
        except Exception as e:
            logger.error(f"Error getting session status: {e}")
            return web.Response(
                status=500,
                content_type="application/json",
                text=json.dumps({"error": str(e)})
            )
    
    def get_client_ip(self, request):
        """Get client real IP address"""
        # 1. X-Real-IP: Real IP set by reverse proxy
        real_ip = request.headers.get("X-Real-IP")
        if real_ip and real_ip != "unknown":
            return real_ip

        # 2. X-Forwarded-For: IP list in proxy chain
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            first_ip = forwarded_for.split(",")[0].strip()
            if first_ip and first_ip != "unknown":
                return first_ip

        # 3. CF-Connecting-IP: Real IP set by Cloudflare
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip and cf_ip != "unknown":
            return cf_ip

        # 4. X-Client-IP: Header used by some proxies
        client_ip = request.headers.get("X-Client-IP")
        if client_ip and client_ip != "unknown":
            return client_ip

        # 5. Remote address as fallback
        return request.remote or "unknown"
    
    async def cleanup_inactive_sessions(self):
        """Clean up inactive sessions periodically"""
        current_time = asyncio.get_event_loop().time()
        inactive_threshold = 300  # 5 minutes
        
        inactive_sessions = []
        for session_id, data in self.active_sessions.items():
            last_activity = data.get('last_activity', data['created_at'])
            if current_time - last_activity > inactive_threshold:
                inactive_sessions.append(session_id)
        
        for session_id in inactive_sessions:
            del self.active_sessions[session_id]
            logger.info(f"Cleaned up inactive session: {session_id}")
    
    def get_stats(self):
        """Get backend statistics"""
        return {
            "activeSessions": len(self.active_sessions),
            "sessions": list(self.active_sessions.keys()),
            "backendStatus": "running",
            "cloudflareIntegration": True
        }

# Global instance
cloudflare_backend = CloudflareRealtimeBackend()
