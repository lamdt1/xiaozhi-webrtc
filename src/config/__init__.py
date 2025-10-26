import os

OTA_URL = "https://api.tenclass.net/xiaozhi/ota"
DEFAULT_MAC_ADDR = "00:00:00:00:00:AA"
# Read port from environment variable, use default value 51000 if not set
PORT = int(os.getenv("PORT", "51000"))
