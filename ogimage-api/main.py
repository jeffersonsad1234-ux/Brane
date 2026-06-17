"""
OGImage API - MVP
Generate Open Graph images from text.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from renderer import render_og_image

app = FastAPI(title="OGImage API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class OGRequest(BaseModel):
    title: str
    style: str = "minimal"

STYLES = ["minimal", "dark", "gradient", "bold"]

@app.get("/")
async def root():
    return {
        "service": "OGImage API",
        "version": "1.0.0",
        "endpoints": {
            "POST /og": "Generate OG image",
            "GET /styles": "List available styles",
        },
    }

@app.get("/styles")
async def list_styles():
    return {"styles": STYLES}

@app.post("/og")
async def generate_og(req: OGRequest):
    if not req.title or not req.title.strip():
        raise HTTPException(400, "Title is required")

    if req.style not in STYLES:
        raise HTTPException(400, f"Style '{req.style}' not found. Use: {STYLES}")

    try:
        png_bytes = render_og_image(req.title, req.style)
    except Exception as e:
        raise HTTPException(500, f"Image generation failed: {str(e)}")

    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "X-Style": req.style,
            "X-Title": req.title[:50],
        },
    )
