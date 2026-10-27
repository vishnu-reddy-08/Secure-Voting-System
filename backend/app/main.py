from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
import logging

from app.core.config import settings
from app.database.firebase import get_db
from app.database.init_db import initialize_database
from app.api import auth, voters, elections, audit, biometrics, voting

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_voting.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Firebase Firestore collections and default seed data...")
    initialize_database()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Backend shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Biometric Voting System API with Multimodal Biometrics & Firebase Firestore",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Process timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(voters.router, prefix="/api")
app.include_router(elections.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(biometrics.router, prefix="/api")
app.include_router(voting.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "Firebase Firestore",
        "biometrics": ["face_arcface_onnx", "iris_daugman_prototype", "challenge_liveness"],
        "status": "online"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "database": "firebase_firestore",
        "timestamp": time.time()
    }

@app.get("/api/database/status")
def database_status():
    db = get_db()
    collections_list = [
        "users",
        "biometric_templates",
        "admins",
        "elections",
        "candidates",
        "voting_sessions",
        "votes",
        "audit_logs"
    ]
    
    collection_stats = {}
    for col in collections_list:
        docs = list(db.collection(col).stream())
        collection_stats[col] = len(docs)
        
    return {
        "database": "Firebase Firestore",
        "status": "connected",
        "provider": "Cloud Firestore" if hasattr(db, "batch") and not hasattr(db, "collections") else "Firebase Firestore Local/Hybrid Provider",
        "collections": collection_stats,
        "timestamp": time.time()
    }
