import json
import os
import base64
import hashlib
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature, InvalidTag

class CryptoEngine:
    @staticmethod
    def canonical_json_bytes(data: Dict[str, Any]) -> bytes:
        """
        Serializes a dictionary deterministically:
        - Sorted keys at all levels
        - Compact separators without whitespace
        - Encoded as UTF-8
        """
        return json.dumps(
            data,
            sort_keys=True,
            separators=(',', ':'),
            ensure_ascii=False
        ).encode('utf-8')

    @staticmethod
    def sha256_hash(data_bytes: bytes) -> str:
        """Computes hexadecimal SHA-256 hash."""
        return hashlib.sha256(data_bytes).hexdigest()

    @staticmethod
    def generate_ecdsa_keypair() -> Tuple[str, str]:
        """
        Generates a SECP256R1 (NIST P-256) ECDSA keypair.
        Returns: (private_pem_str, public_pem_str)
        """
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        public_pem = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        return private_pem, public_pem

    @staticmethod
    def sign_hash(private_key_pem: str, payload_hash: str) -> str:
        """
        Signs the payload hash using ECDSA with SHA-256.
        Returns: Base64-encoded signature.
        """
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        signature = private_key.sign(
            payload_hash.encode('utf-8'),
            ec.ECDSA(hashes.SHA256())
        )
        return base64.b64encode(signature).decode('utf-8')

    @staticmethod
    def verify_signature(public_key_pem: str, payload_hash: str, signature_b64: str) -> bool:
        """
        Verifies an ECDSA signature over the payload hash.
        """
        try:
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode('utf-8'),
                backend=default_backend()
            )
            signature = base64.b64decode(signature_b64.encode('utf-8'))
            public_key.verify(
                signature,
                payload_hash.encode('utf-8'),
                ec.ECDSA(hashes.SHA256())
            )
            return True
        except (InvalidSignature, Exception):
            return False

    @staticmethod
    def encrypt_aes_gcm(key_bytes: bytes, plaintext: str, associated_data: str = "") -> Dict[str, str]:
        """
        Encrypts plaintext using AES-256-GCM.
        Requires 32-byte key.
        Generates unique 96-bit (12-byte) nonce.
        Returns JSON-safe envelope with Base64 nonce and ciphertext (includes auth tag).
        """
        if len(key_bytes) != 32:
            raise ValueError("AES-256 requires a 32-byte key.")
        
        aesgcm = AESGCM(key_bytes)
        nonce = os.urandom(12)  # 96-bit nonce
        aad_bytes = associated_data.encode('utf-8') if associated_data else None
        
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), aad_bytes)
        
        return {
            "version": "1.0",
            "algorithm": "AES-256-GCM",
            "nonce": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
            "aad": associated_data
        }

    @staticmethod
    def decrypt_aes_gcm(key_bytes: bytes, envelope: Dict[str, str]) -> str:
        """
        Decrypts an AES-256-GCM envelope and verifies authentication tag.
        Raises ValueError if authentication fails or envelope is tampered.
        """
        if len(key_bytes) != 32:
            raise ValueError("AES-256 requires a 32-byte key.")

        try:
            aesgcm = AESGCM(key_bytes)
            nonce = base64.b64decode(envelope["nonce"].encode('utf-8'))
            ciphertext = base64.b64decode(envelope["ciphertext"].encode('utf-8'))
            aad = envelope.get("aad", "")
            aad_bytes = aad.encode('utf-8') if aad else None

            decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, aad_bytes)
            return decrypted_bytes.decode('utf-8')
        except (InvalidTag, Exception) as e:
            raise ValueError(f"Decryption / Authentication tag verification failed: {str(e)}")
