"""
Gemini Chat Router

Quick and dirty Gemini chatbot to test API key.
"""

from fastapi import APIRouter, HTTPException
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
    model = genai.GenerativeModel('gemini-2.0-flash')
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
        model_names = [model.name for model in models if 'generateContent' in model.supported_generation_methods]
        return {"status": "success", "models": model_names}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}
