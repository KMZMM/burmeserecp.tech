from __future__ import annotations

from io import BytesIO
from typing import Any

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = Field(min_length=1)
    rate: int = Field(ge=-50, le=50, default=0)
    pitch: int = Field(ge=-50, le=50, default=0)


app = FastAPI(title="BurmeseRecp")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


def format_voice_label(voice: dict[str, Any]) -> str:
    locale_name = voice.get("Locale", "").replace("-", " ")
    gender = voice.get("Gender", "")
    short_name = voice.get("ShortName", "")
    friendly_name = voice.get("FriendlyName", short_name)
    return f"{friendly_name} • {locale_name} • {gender}".strip(" •")


def sort_key(voice: dict[str, Any]) -> tuple[int, str]:
    locale = voice.get("Locale", "")
    priority = 0 if locale.startswith("en-") else 1
    return priority, locale, voice.get("ShortName", "")


@app.get("/", response_class=FileResponse)
async def read_index() -> str:
    return "static/index.html"


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/voices")
async def get_voices() -> JSONResponse:
    try:
        voices = await edge_tts.list_voices()
    except Exception as exc:  # pragma: no cover - network dependent
        raise HTTPException(status_code=502, detail=f"Unable to load voices: {exc}") from exc

    filtered = []
    for voice in sorted(voices, key=sort_key):
        locale = voice.get("Locale", "")
        if locale.startswith(("en-", "my-", "ja-", "ko-", "zh-")):
            filtered.append(
                {
                    "short_name": voice["ShortName"],
                    "locale": locale,
                    "gender": voice.get("Gender", ""),
                    "label": format_voice_label(voice),
                }
            )

    return JSONResponse(filtered)


@app.post("/api/tts")
async def text_to_speech(payload: TTSRequest) -> StreamingResponse:
    rate = f"{payload.rate:+d}%"
    pitch = f"{payload.pitch:+d}Hz"

    try:
        communicate = edge_tts.Communicate(
            text=payload.text.strip(),
            voice=payload.voice,
            rate=rate,
            pitch=pitch,
        )
        audio_buffer = BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
    except Exception as exc:  # pragma: no cover - network dependent
        raise HTTPException(status_code=502, detail=f"TTS generation failed: {exc}") from exc

    audio_buffer.seek(0)
    headers = {"Content-Disposition": 'inline; filename="burmeserecp-tts.mp3"'}
    return StreamingResponse(audio_buffer, media_type="audio/mpeg", headers=headers)

