from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import json
import typst as typ

from .datatypes import DocumentInputs

app = FastAPI()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom handler for validation errors"""
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation failed",
            "message": "The request data is invalid",
            "details": exc.errors()
        }
    )


@app.post("/build")
def build_document(inputs: DocumentInputs):
    try:
        input_dict = inputs.model_dump(mode='json')
        pdf_bytes = typ.compile(input="template/document.typ", sys_inputs={"inputs": json.dumps(input_dict)})
        
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
