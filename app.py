from __future__ import annotations

import asyncio
from io import BytesIO
import os
import sqlite3
from typing import Any
import urllib.request
import urllib.parse

import edge_tts
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Google OAuth configurations removed

class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = Field(min_length=1)
    rate: int = Field(ge=-50, le=50, default=0)
    pitch: int = Field(ge=-50, le=50, default=0)


class SignupRequest(BaseModel):
    email: str = Field(min_length=3)
    username: str = Field(min_length=1)
    avatar_url: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)


# Google auth request model removed


app = FastAPI(title="burmeserecp.tech")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Connection Manager for Real-Time Live Chat =====
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    def get_online_count(self) -> int:
        return len(self.active_connections)

    async def broadcast(self, message: dict):
        message["onlineCount"] = self.get_online_count()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

MAX_RECENT_MESSAGES = 30
recent_messages: list[dict] = [
    {
        "type": "message",
        "sender": "Min Khant",
        "text": "Hey everyone! This voice studio is amazing! The Burmese voices sound so natural. 🔥",
        "avatarBg": "linear-gradient(135deg, #ff9500, #ff5e3a)",
        "avatar_url": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&h=80&q=80"
    },
    {
        "type": "message",
        "sender": "Su Sandar",
        "text": "Has anyone tried adjusting the pitch for storytelling? What's the best setting for recaps?",
        "avatarBg": "linear-gradient(135deg, #34c759, #4cd964)",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80"
    },
    {
        "type": "message",
        "sender": "Aung Kyaw",
        "text": "I usually use +10% speed and -5% pitch for recaps, works perfectly! 🎙️",
        "avatarBg": "linear-gradient(135deg, #007aff, #0584ff)",
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"
    }
]

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, username: str = "Anonymous"):
    await manager.connect(websocket)
    
    # Send recent message history to the newly connected user
    for msg in recent_messages:
        try:
            await websocket.send_json(msg)
        except Exception:
            pass

    await manager.broadcast({
        "type": "system",
        "text": f"🎉 {username} joined the chat",
        "sender": "System"
    })
    try:
        import json
        while True:
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
            except Exception:
                data = {"text": data_str, "avatarBg": ""}
            
            msg_payload = {
                "type": "message",
                "sender": username,
                "text": data.get("text", "").strip(),
                "avatarBg": data.get("avatarBg", ""),
                "avatar_url": data.get("avatar_url", "")
            }
            recent_messages.append(msg_payload)
            if len(recent_messages) > MAX_RECENT_MESSAGES:
                recent_messages.pop(0)

            await manager.broadcast(msg_payload)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast({
            "type": "system",
            "text": f"👋 {username} left the chat",
            "sender": "System"
        })
    except Exception:
        manager.disconnect(websocket)

DB_PATH = "users.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            avatar_url TEXT NOT NULL
        )
    """)
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO users (email, username, avatar_url) VALUES (?, ?, ?)
        """, [
            ("aungkyaw.dev@gmail.com", "Aung Kyaw", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"),
            ("susandar.story@gmail.com", "Su Sandar", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80"),
            ("minkhant.recap@gmail.com", "Min Khant", "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&h=80&q=80")
        ])
        conn.commit()
    conn.close()

# Initialize DB on load
init_db()

@app.get("/api/mock-accounts")
async def get_mock_accounts():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT email, username, avatar_url FROM users")
    rows = cursor.fetchall()
    accounts = [dict(row) for row in rows]
    conn.close()
    return JSONResponse(accounts)

@app.post("/api/signup")
async def signup(payload: SignupRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, username, avatar_url) VALUES (?, ?, ?)",
            (payload.email.strip().lower(), payload.username.strip(), payload.avatar_url.strip())
        )
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Account with this email already exists.")
    conn.close()
    return JSONResponse({
        "status": "success",
        "id": user_id,
        "username": payload.username,
        "avatar_url": payload.avatar_url,
        "email": payload.email
    })

@app.post("/api/login")
async def login(payload: LoginRequest):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT email, username, avatar_url FROM users WHERE email = ?", (payload.email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found. Please sign up first.")
    return JSONResponse(dict(row))

# Google OAuth handlers removed

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


@app.get("/")
async def read_index() -> RedirectResponse:
    return RedirectResponse(url="/static/index.html")


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


FALLBACK_VOICES = [
    {"short_name": "my-MM-NilarNeural", "locale": "my-MM", "gender": "Female", "label": "Microsoft Nilar Online • Burmese • Female"},
    {"short_name": "my-MM-ThihaNeural", "locale": "my-MM", "gender": "Male", "label": "Microsoft Thiha Online • Burmese • Male"},
    {"short_name": "en-US-AvaMultilingualNeural", "locale": "en-US", "gender": "Female", "label": "Microsoft Ava Multilingual Online • English (US) • Female"},
    {"short_name": "en-US-AndrewMultilingualNeural", "locale": "en-US", "gender": "Male", "label": "Microsoft Andrew Multilingual Online • English (US) • Male"},
    {"short_name": "en-US-EmmaMultilingualNeural", "locale": "en-US", "gender": "Female", "label": "Microsoft Emma Multilingual Online • English (US) • Female"},
    {"short_name": "en-GB-SoniaNeural", "locale": "en-GB", "gender": "Female", "label": "Microsoft Sonia Online • English (UK) • Female"},
    {"short_name": "en-US-BrianNeural", "locale": "en-US", "gender": "Male", "label": "Microsoft Brian Online • English (US) • Male"},
    {"short_name": "ja-JP-NanamiNeural", "locale": "ja-JP", "gender": "Female", "label": "Microsoft Nanami Online • Japanese • Female"},
    {"short_name": "ja-JP-KeitaNeural", "locale": "ja-JP", "gender": "Male", "label": "Microsoft Keita Online • Japanese • Male"},
    {"short_name": "ko-KR-SunHiNeural", "locale": "ko-KR", "gender": "Female", "label": "Microsoft SunHi Online • Korean • Female"},
    {"short_name": "ko-KR-InJoonNeural", "locale": "ko-KR", "gender": "Male", "label": "Microsoft InJoon Online • Korean • Male"},
    {"short_name": "zh-CN-XiaoxiaoNeural", "locale": "zh-CN", "gender": "Female", "label": "Microsoft Xiaoxiao Online • Chinese (Simplified) • Female"},
    {"short_name": "zh-CN-YunxiNeural", "locale": "zh-CN", "gender": "Male", "label": "Microsoft Yunxi Online • Chinese (Simplified) • Male"}
]

CACHED_VOICES: list[dict[str, Any]] = []

async def fetch_and_cache_voices():
    global CACHED_VOICES
    try:
        # Fetch with 3-second timeout to avoid long hangs
        voices = await asyncio.wait_for(edge_tts.list_voices(), timeout=3.0)
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
        if filtered:
            CACHED_VOICES = filtered
            print("Successfully cached voices from Edge TTS API.")
    except Exception as e:
        print(f"Failed to fetch voices from API: {e}. Using fallback voices.")
        if not CACHED_VOICES:
            CACHED_VOICES = FALLBACK_VOICES

@app.on_event("startup")
async def startup_event():
    # Fetch in the background so it doesn't block startup
    asyncio.create_task(fetch_and_cache_voices())

@app.get("/api/voices")
async def get_voices() -> JSONResponse:
    global CACHED_VOICES
    if not CACHED_VOICES:
        CACHED_VOICES = FALLBACK_VOICES
    return JSONResponse(CACHED_VOICES)


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
