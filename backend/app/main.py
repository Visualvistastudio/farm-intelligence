import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.bootstrap import bootstrap_system
from app.api.v1 import admin, agronomy, assessments, auth, billing, farms

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("farm_intelligence")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and run bootstrap
    logger.info("Initializing Farm Intelligence database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        bootstrap_system(db)
    finally:
        db.close()
    yield
    # Shutdown
    logger.info("Farm Intelligence service shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(farms.router, prefix=api_v1_prefix)
app.include_router(agronomy.router, prefix=api_v1_prefix)
app.include_router(assessments.router, prefix=api_v1_prefix)
app.include_router(billing.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "market": "Nigeria (Initial) -> International"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to Farm Intelligence API. See /docs for OpenAPI documentation.",
        "admin_portal": "/admin",
        "farmer_portal": "/app"
    }
