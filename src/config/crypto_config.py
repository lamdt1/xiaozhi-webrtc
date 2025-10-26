"""
Secure credential encryption/decryption service for ICE server configuration.
Provides industry-standard encryption for TURN server credentials.
"""

import base64
import os
import secrets
from typing import Optional, Tuple

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class CryptoConfig:
    """Secure credential encryption/decryption service"""
    
    def __init__(self, master_key: Optional[str] = None):
        """
        Initialize crypto configuration.
        
        Args:
            master_key: Master encryption key. If None, will be generated or read from env.
        """
        self.master_key = master_key or os.getenv('ICE_MASTER_KEY')
        if not self.master_key:
            # Generate a new master key if none exists
            self.master_key = Fernet.generate_key().decode()
            print(f"Generated new master key. Please set ICE_MASTER_KEY={self.master_key}")
        
        # Derive encryption key from master key
        self.fernet = self._create_fernet()
    
    def _create_fernet(self) -> Fernet:
        """Create Fernet instance with derived key"""
        # Use a fixed salt for consistency (in production, consider storing salt separately)
        salt = b'xiaozhi_ice_salt_2024'
        
        # Derive key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key.encode()))
        return Fernet(key)
    
    def encrypt_credential(self, credential: str) -> str:
        """
        Encrypt a credential string.
        
        Args:
            credential: The credential to encrypt
            
        Returns:
            Base64 encoded encrypted credential
        """
        if not credential:
            return ""
        
        encrypted_bytes = self.fernet.encrypt(credential.encode())
        return base64.urlsafe_b64encode(encrypted_bytes).decode()
    
    def decrypt_credential(self, encrypted_credential: str) -> str:
        """
        Decrypt a credential string.
        
        Args:
            encrypted_credential: Base64 encoded encrypted credential
            
        Returns:
            Decrypted credential string
        """
        if not encrypted_credential:
            return ""
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_credential.encode())
            decrypted_bytes = self.fernet.decrypt(encrypted_bytes)
            return decrypted_bytes.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt credential: {e}")
    
    def generate_encrypted_credentials(self, username: str, password: str) -> Tuple[str, str]:
        """
        Generate encrypted credentials for TURN server.
        
        Args:
            username: TURN server username
            password: TURN server password
            
        Returns:
            Tuple of (encrypted_username, encrypted_password)
        """
        return (
            self.encrypt_credential(username),
            self.encrypt_credential(password)
        )


# Global instance
crypto_config = CryptoConfig()
