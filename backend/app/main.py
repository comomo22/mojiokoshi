from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import router as v1_router


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="Whisper Web API",
        description="API for Whisper Web transcription service",
        version="1.0.0",
        debug=settings.DEBUG
    )

    # Configure CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API v1 router
    application.include_router(v1_router, prefix="/api/v1")

    return application


app = create_application()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Whisper Web API",
        "version": "1.0.0",
        "docs": "/docs"
    }
