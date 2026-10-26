import os
import json
from typing import Dict, Any
from app.config import settings

class EncryptedStorageService:
    def __init__(self):
        self.base_path = settings.STORAGE_PATH
        os.makedirs(self.base_path, exist_ok=True)

    def _file_path(self, prescription_id: str) -> str:
        safe_id = "".join(c for c in prescription_id if c.isalnum() or c in "-_")
        return os.path.join(self.base_path, f"{safe_id}.enc.json")

    def save_envelope(self, prescription_id: str, envelope: Dict[str, Any]) -> str:
        """Writes AES-256-GCM envelope to storage and returns file path."""
        path = self._file_path(prescription_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(envelope, f, indent=2)
        return path

    def load_envelope(self, prescription_id: str) -> Dict[str, Any]:
        """Loads and returns the encrypted envelope."""
        path = self._file_path(prescription_id)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Encrypted payload not found for prescription: {prescription_id}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

encrypted_storage_service = EncryptedStorageService()
