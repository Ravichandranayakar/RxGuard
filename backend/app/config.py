import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    ENV: str = Field(default="development")
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)

    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./rxguard.db"
    )

    # Security
    SECRET_KEY: str = Field(
        default="dev_insecure_jwt_secret_change_in_production_32chars"
    )
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # AES-256-GCM Master Key (32 bytes)
    MASTER_ENCRYPTION_KEY: str = Field(
        default="0123456789abcdef0123456789abcdef"  # 32 characters = 256 bits
    )

    # Hyperledger Fabric
    FABRIC_MODE: str = Field(default="standalone_dev")  # "fabric_gateway" or "standalone_dev"
    FABRIC_CHANNEL: str = Field(default="rxguardchannel")
    FABRIC_CHAINCODE: str = Field(default="prescription")
    FABRIC_MSP_ID: str = Field(default="HospitalMSP")
    FABRIC_PEER_ENDPOINT: str = Field(default="localhost:7051")

    # Off-chain storage path
    STORAGE_PATH: str = Field(default="./offchain_storage")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
