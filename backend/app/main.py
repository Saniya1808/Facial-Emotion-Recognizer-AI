from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.database.session import engine, Base
from backend.app.models import analysis  # noqa: F401 - ensures models are registered
from backend.app.api.router import api_router
from backend.app.schemas.common import RootResponse
from backend.app.schemas.health import SimpleHealthResponse
from backend.app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Initializing {settings.APP_NAME} v{settings.APP_VERSION}...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as exc:
        logger.error(f"Error initializing database tables: {exc}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-grade API for Facial Emotion Recognizer AI.\n\n"
        f"**Tagline:** {settings.APP_TAGLINE}\n\n"
        f"**Brand:** {settings.BRAND_IDENTITY}\n\n"
        "Phase 1: Foundation & Application Architecture."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Configuration
origins = list(settings.ALLOWED_ORIGINS)
if settings.FRONTEND_ORIGIN not in origins:
    origins.append(settings.FRONTEND_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected error occurred",
            "path": request.url.path,
        },
    )


# Root endpoint
@app.get("/", response_model=RootResponse, summary="Root Service Information", tags=["General"])
def read_root():
    """
    Returns general metadata, branding, and API endpoints for the service.
    """
    return RootResponse(
        name=settings.APP_NAME,
        version=settings.APP_VERSION,
        tagline=settings.APP_TAGLINE,
        brand_identity=settings.BRAND_IDENTITY,
        status="active",
        docs_url="/docs",
        api_v1_url=f"{settings.API_V1_STR}",
    )


# Root Health endpoint
@app.get("/health", response_model=SimpleHealthResponse, summary="Basic Health Check", tags=["Health"])
def health_check():
    """
    Returns simple health check for load balancers and orchestrators.
    """
    return SimpleHealthResponse(status="healthy")


# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)
