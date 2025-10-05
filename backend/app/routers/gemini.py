"""
Gemini Chat Router

Quick and dirty Gemini chatbot to test API key.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import google.generativeai as genai

router = APIRouter(prefix="/gemini", tags=["Gemini Chat"])


class ChatRequest(BaseModel):
    message: str


# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Use the latest stable model
    model = genai.GenerativeModel("gemini-2.0-flash")
else:
    model = None


@router.post("/chat")
async def chat_with_gemini(request: ChatRequest):
    """Quick Gemini chat to test API key."""

    if not GEMINI_API_KEY:
        return {"response": "❌ GEMINI_API_KEY not found in environment variables"}

    if not model:
        return {"response": "❌ Failed to initialize Gemini model"}

    try:
        # Simple chat with Gemini
        response = model.generate_content(request.message)
        return {"response": response.text}

    except Exception as e:
        return {"response": f"❌ Error: {str(e)}"}


class OptimizeRequest(BaseModel):
    code: str
    language: str = "python"
    recommendations: str
    filename: str | None = None


def build_optimization_prompt(
    language: str, code: str, recommendations: str, filename: str | None
) -> str:
    target_file = (
        filename or f"optimized_code.{ 'py' if language == 'python' else language }"
    )
    return (
        "You are a senior software engineer. Improve the following code according to the given recommendations. "
        "Preserve functionality, keep the style consistent, and apply concrete fixes. Output ONLY the full revised file contents with no commentary.\n\n"
        f"Language: {language}\n"
        f"Target filename: {target_file}\n\n"
        "Recommendations to apply (high priority first):\n"
        f"{recommendations}\n\n"
        "Existing code:\n"
        f"```{language}\n{code}\n```\n"
    )


@router.post("/optimize-code")
async def optimize_code(request: OptimizeRequest):
    """Stream optimized code using Gemini, based on recommendations and input code."""
    if not GEMINI_API_KEY:
        return StreamingResponse(
            iter(["❌ GEMINI_API_KEY not found in environment variables"]),
            media_type="text/plain",
        )
    if not model:
        return StreamingResponse(
            iter(["❌ Failed to initialize Gemini model"]), media_type="text/plain"
        )

    prompt = build_optimization_prompt(
        request.language, request.code, request.recommendations, request.filename
    )

    def event_stream():
        try:
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                text = getattr(chunk, "text", None)
                if text:
                    yield text
        except Exception as e:
            yield f"\n\n# Error: {str(e)}"

    return StreamingResponse(event_stream(), media_type="text/plain")


@router.get("/test")
async def test_gemini():
    """Test if Gemini is working."""
    if not GEMINI_API_KEY:
        return {"status": "error", "message": "GEMINI_API_KEY not found"}

    try:
        response = model.generate_content("Say hello in one word")
        return {"status": "success", "message": f"Gemini says: {response.text}"}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}


@router.get("/models")
async def list_models():
    """List available Gemini models."""
    if not GEMINI_API_KEY:
        return {"status": "error", "message": "GEMINI_API_KEY not found"}

    try:
        models = genai.list_models()
        model_names = [
            model.name
            for model in models
            if "generateContent" in model.supported_generation_methods
        ]
        return {"status": "success", "models": model_names}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}
