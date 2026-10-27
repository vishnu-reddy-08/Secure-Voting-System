from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Biometric Voting System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Security
    JWT_SECRET: str = "supersecret-academic-biometric-voting-key-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 120
    ENCRYPTION_KEY: str = "academic-prototype-encryption-key-32b-length!"
    
    # Firebase
    FIREBASE_PROJECT_ID: str = "smart-biometric-voting"
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIRESTORE_EMULATOR_HOST: Optional[str] = None
    
    # URLs & CORS
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    
    # Default Admin
    DEFAULT_ADMIN_NAME: str = "Chief Election Officer"
    DEFAULT_ADMIN_EMAIL: str = "admin@election.gov"
    DEFAULT_ADMIN_PASSWORD: str = "Admin@Voting2026!"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
