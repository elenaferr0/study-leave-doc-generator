"""Document generation module."""

from .routes import router
from .models import DocumentInputs, ActivityType

__all__ = ["router", "DocumentInputs", "ActivityType"]
