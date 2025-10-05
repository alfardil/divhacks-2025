"""Main entry point for the FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import generate, jury, opik_jury, character_jury, frontend_jury, gemini
from app.opik_config import setup_opik

app = FastAPI()

# Initialize Opik for LLM tracking (optional)
opik_enabled = setup_opik()
if not opik_enabled:
    print("ℹ️  Running without Opik tracking. Set OPIK_API_KEY to enable tracking.")

app.include_router(generate.router)
app.include_router(jury.router)
app.include_router(opik_jury.router)
app.include_router(character_jury.router)
app.include_router(frontend_jury.router)
app.include_router(gemini.router)


# add public frontend url later for cors
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://divhacks-2025.vercel.app/",
    "https://divhacks-2025.vercel.app",
]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root API for the project."""
    return {
        "message": "Welcome to the API for this project.",
        "contributors": ["Alfardil Alam", "Maheen Rassell"],
    }
