from __future__ import annotations

import asyncio
from io import BytesIO
import json
import os
import sqlite3
from typing import Any
import urllib.request
import urllib.parse
import uuid

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

DB_PATH = "users.db"

def get_total_users_count() -> int:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception:
        return 3

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
        message["totalUsers"] = get_total_users_count()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

MAX_RECENT_MESSAGES = 30
recent_messages: list[dict] = []

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, username: str = "Anonymous"):
  await manager.connect(websocket)
  
  # Send recent message history to the newly connected user
  for msg in recent_messages:
    try:
      await websocket.send_json(msg)
    except Exception:
      pass

  # Broadcast online counts without printing a system message
  await manager.broadcast({
    "type": "count_update"
  })
  try:
    while True:
      data_str = await websocket.receive_text()
      try:
        data = json.loads(data_str)
      except Exception:
        data = {"text": data_str, "avatarBg": ""}
      
      action = data.get("action")
      if action == "delete":
        msg_id = data.get("message_id")
        found_msg = None
        for msg in recent_messages:
          if msg.get("message_id") == msg_id:
            found_msg = msg
            break
        if found_msg and found_msg.get("sender") == username:
          recent_messages.remove(found_msg)
          await manager.broadcast({
            "type": "delete",
            "message_id": msg_id
          })
        continue
        
      elif action == "react":
        msg_id = data.get("message_id")
        emoji = data.get("emoji")
        if msg_id and emoji:
          for msg in recent_messages:
            if msg.get("message_id") == msg_id:
              reactions = msg.setdefault("reactions", {})
              
              # Enforce 1 reaction limit: remove user's name from any other emoji on this message
              other_emojis_to_cleanup = []
              for k, u_list in reactions.items():
                if k != emoji and username in u_list:
                  u_list.remove(username)
                  if not u_list:
                    other_emojis_to_cleanup.append(k)
              for k in other_emojis_to_cleanup:
                del reactions[k]
              
              # Toggle the target emoji
              user_list = reactions.setdefault(emoji, [])
              if username in user_list:
                user_list.remove(username)
                if not user_list:
                  del reactions[emoji]
              else:
                user_list.append(username)
              
              await manager.broadcast({
                "type": "react_update",
                "message_id": msg_id,
                "reactions": reactions
              })
              break
        continue

      # Normal message broadcast
      msg_id = str(uuid.uuid4())
      msg_payload = {
        "type": "message",
        "message_id": msg_id,
        "sender": username,
        "text": data.get("text", "").strip(),
        "avatarBg": data.get("avatarBg", ""),
        "avatar_url": data.get("avatar_url", ""),
        "reactions": {}
      }
      recent_messages.append(msg_payload)
      if len(recent_messages) > MAX_RECENT_MESSAGES:
        recent_messages.pop(0)

      await manager.broadcast(msg_payload)
  except WebSocketDisconnect:
    manager.disconnect(websocket)
    await manager.broadcast({
      "type": "count_update"
    })
  except Exception:
    manager.disconnect(websocket)

# DB_PATH defined globally at the top

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

# Static mount moved to the end of file for root-level fallback


def format_voice_label(voice: dict[str, Any]) -> str:
    short_name = voice.get("ShortName", "")
    parts = short_name.split("-")
    last = parts[-1] if parts else ""
    name = last.replace("MultilingualNeural", "").replace("Neural", "")
    is_multi = "multilingual" in short_name.lower()
    return f"{name} ({'Multilingual' if is_multi else 'Burmese'})"


def sort_key(voice: dict[str, Any]) -> tuple[int, str]:
    locale = voice.get("Locale", "")
    priority = 0 if locale.startswith("en-") else 1
    return priority, locale, voice.get("ShortName", "")


# Root index handler replaced by StaticFiles fallback

@app.get("/static/index.html")
async def redirect_static_index():
    return RedirectResponse(url="/")

@app.get("/index.html")
async def redirect_index_html():
    return RedirectResponse(url="/")


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


FALLBACK_VOICES = [
    {"short_name": "my-MM-NilarNeural", "locale": "my-MM", "gender": "Female", "label": "Nilar (Burmese)"},
    {"short_name": "my-MM-ThihaNeural", "locale": "my-MM", "gender": "Male", "label": "Thiha (Burmese)"},
    {"short_name": "en-US-AvaMultilingualNeural", "locale": "en-US", "gender": "Female", "label": "Ava (Multilingual)"},
    {"short_name": "en-US-AndrewMultilingualNeural", "locale": "en-US", "gender": "Male", "label": "Andrew (Multilingual)"},
    {"short_name": "en-US-EmmaMultilingualNeural", "locale": "en-US", "gender": "Female", "label": "Emma (Multilingual)"},
    {"short_name": "en-US-BrianMultilingualNeural", "locale": "en-US", "gender": "Male", "label": "Brian (Multilingual)"},
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
            short_name = voice.get("ShortName", "")
            is_burmese = locale.startswith("my-")
            is_multilingual = "multilingual" in short_name.lower()
            if is_burmese or is_multilingual:
                filtered.append(
                    {
                        "short_name": short_name,
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

app.mount("/", StaticFiles(directory="static", html=True), name="static")
