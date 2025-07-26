from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import json
import typst as typ

from .models import DocumentInputs

router = APIRouter()


@router.get("/activity-types")
def get_activity_types():
    """Get available activity types."""
    from .models.document_inputs import ActivityType
    return {
        "activity_types": [
            {
                "value": activity.value,
                "name": activity.value.replace("-", " ").title()
            }
            for activity in ActivityType
        ]
    }


@router.post("/build")
def build_document(inputs: DocumentInputs):
    try:
        input_dict = inputs.model_dump(mode='json')
        pdf_bytes = typ.compile(input="template/template.typ", sys_inputs={"inputs": json.dumps(input_dict)})
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "inline; filename=document.pdf"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Document generation failed",
                "message": str(e)
            }
        )
