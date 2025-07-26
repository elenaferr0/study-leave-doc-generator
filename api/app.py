"""Main application factory for the Study Leave API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .src.routes import router as document_router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="Study Leave API",
        description="API for generating study leave documents",
        version="0.1.0"
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(document_router, prefix="/document", tags=["document"])
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {"message": "Study Leave API", "version": "0.1.0"}
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy"}
    
    return app


app = create_app()
