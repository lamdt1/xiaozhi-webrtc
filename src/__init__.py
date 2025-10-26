import asyncio
import json
import logging
import os

from aiohttp import web
from aiortc import RTCConfiguration, RTCPeerConnection, RTCSessionDescription

from src.config import DEFAULT_MAC_ADDR, OTA_URL, PORT
from src.config.ice_config import ice_config
from src.server import XiaoZhiServer
from src.track.audio import AudioFaceSwapper
from src.track.video import VideoFaceSwapper

# Setup logger
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# Disable aioice.ice module logging output
logging.getLogger("aioice.ice").setLevel(logging.WARNING)

ROOT = os.path.dirname(__file__)


def get_client_ip(request):
    """
    Get client real IP address
    Try multiple methods in priority order to ensure correct IP retrieval in various deployment environments
    """
    # 1. X-Real-IP: Real IP set by reverse proxy (Nginx, Apache, etc.)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip and real_ip != "unknown":
        return real_ip

    # 2. X-Forwarded-For: IP list in proxy chain, take the first one
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # There may be multiple IPs, separated by commas, take the first one
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

    return "unknown"


async def index(request):
    content = open(os.path.join(ROOT, "index.html"), "r", encoding="utf-8").read()
    return web.Response(content_type="text/html", text=content)


async def chatv2(request):
    content = open(os.path.join(ROOT, "chatv2.html"), "r", encoding="utf-8").read()
    return web.Response(content_type="text/html", text=content)


async def chat(request):
    content = open(os.path.join(ROOT, "chat.html"), "r", encoding="utf-8").read()
    return web.Response(content_type="text/html", text=content)


async def ice(request):
    """Return ICE server configuration"""
    ice_servers_config = ice_config.get_ice_config()
    return web.Response(content_type="application/json", text=json.dumps(ice_servers_config, ensure_ascii=False))


async def offer(request):
    params = await request.json()
    _offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    # Use dynamic ICE server configuration
    ice_servers = ice_config.get_server_ice_servers()
    configuration = RTCConfiguration(iceServers=ice_servers)
    pc = RTCPeerConnection(configuration=configuration)
    pcs.add(pc)

    # Store client IP in the peer connection object
    # Use improved IP retrieval function
    pc.client_ip = get_client_ip(request)
    pc.mac_address = params.get("macAddress") or DEFAULT_MAC_ADDR

    await server(pc, _offer)

    return web.Response(
        content_type="application/json",
        text=json.dumps({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}),
    )


pcs = set()


async def server(pc, offer):
    # Dictionary to store track instances

    xiaozhi = XiaoZhiServer(pc)
    await xiaozhi.start()

    # Listen for DataChannel from client
    @pc.on("datachannel")
    def on_datachannel(channel):

        @channel.on("message")
        async def on_message(message):
            logger.info("Received client message [%s %s]: %s", pc.mac_address, pc.client_ip, message)
            if xiaozhi.server is None:
                await xiaozhi.start()

            if xiaozhi.server.output_audio_queue:
                return
            message = json.loads(message)

            send_text_dict = {
                "doublehit": {
                    "Head": "patted your head",
                    "Face": "patted your face",
                    "Body": "patted your body",
                },
                "swipe": {
                    "Head": "touched your head",
                    "Face": "touched your face",
                },
            }
            send_text = send_text_dict.get(message.get("event", ""), {}).get(message.get("area", ""), "")
            if send_text:
                await xiaozhi.server.send_wake_word(send_text)

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        logger.info("Connection state is %s %s %s", pc.connectionState, pc.mac_address, pc.client_ip)
        if pc.connectionState in ["failed", "closed", "disconnected"]:
            # Stop all AudioFaceSwapper instances
            if xiaozhi.server:
                await xiaozhi.server.close()
            await pc.close()
            pcs.discard(pc)

    @pc.on("track")
    def on_track(track):
        if track.kind == "audio":
            t = AudioFaceSwapper(xiaozhi, track)
            pc.addTrack(t)
            # Store track instance in pc object
            pc.audio_track = t
        elif track.kind == "video":
            t = VideoFaceSwapper(xiaozhi, track)
            pc.addTrack(t)
            # Store track instance in pc object
            pc.video_track = t

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)


async def on_shutdown(app):
    # Close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


def run():
    app = web.Application()
    app.on_shutdown.append(on_shutdown)

    app.router.add_get("/", index)
    app.router.add_get("/chat", chat)
    app.router.add_get("/chatv2", chatv2)

    app.router.add_get("/api/ice", ice)
    app.router.add_post("/api/offer", offer)
    app.router.add_static("/static/", path=os.path.join(ROOT, "static"), name="static")

    web.run_app(app, host="0.0.0.0", port=PORT)
