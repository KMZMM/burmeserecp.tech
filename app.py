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
import requests
import boto3

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

class PresignRequest(BaseModel):
    filename: str
    content_type: str


app = FastAPI(title="burmeserecp.tech")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "users.db"
CREDS_PATH = "C:/Users/HP/.gemini/antigravity/brain/47446197-b7fd-43a6-a29d-da44be16af0f/scratch/infrastructure_credentials.json"

def check_and_update_db_status():
    try:
        if os.path.exists(CREDS_PATH):
            with open(CREDS_PATH, "r") as f:
                creds = json.load(f)
            db_config = creds.get("digitalocean_database", {})
            if db_config.get("status") != "active" and db_config.get("id"):
                API_KEY = creds.get("do_api_token") or os.environ.get("DIGITALOCEAN_TOKEN")
                if not API_KEY:
                    return
                headers = {"Authorization": f"Bearer {API_KEY}"}
                db_id = db_config.get("id")
                r = requests.get(f"https://api.digitalocean.com/v2/databases/{db_id}", headers=headers, timeout=3)
                if r.status_code == 200:
                    status = r.json().get("database", {}).get("status")
                    if status == "active":
                        creds["digitalocean_database"]["status"] = "active"
                        creds["digitalocean_database"]["connection"] = r.json().get("database", {}).get("connection", {})
                        with open(CREDS_PATH, "w") as fw:
                            json.dump(creds, fw, indent=2)
                        print("Database cluster has become active! Config updated.")
    except Exception as e:
        print("Error checking DB status:", e)

def get_db_connection():
    try:
        # Check environment variable first (production on DO App Platform)
        db_url = os.environ.get("DATABASE_URL")
        if db_url:
            import psycopg2
            return psycopg2.connect(db_url, connect_timeout=3), "postgres"

        # Fallback to local credentials JSON file (for local dev)
        if os.path.exists(CREDS_PATH):
            with open(CREDS_PATH, "r") as f:
                creds = json.load(f)
            db_config = creds.get("digitalocean_database", {})
            conn_info = db_config.get("connection", {})
            if conn_info and db_config.get("status") == "active":
                import psycopg2
                conn = psycopg2.connect(
                    host=conn_info.get("host"),
                    port=conn_info.get("port"),
                    user=conn_info.get("user"),
                    password=conn_info.get("password"),
                    database=conn_info.get("database"),
                    sslmode="require",
                    connect_timeout=3
                )
                return conn, "postgres"
    except Exception as e:
        print("PostgreSQL connection failed, falling back to SQLite:", e)
    
    conn = sqlite3.connect(DB_PATH)
    return conn, "sqlite"

def get_total_users_count() -> int:
    try:
        conn, db_type = get_db_connection()
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
        # Maps websocket -> username for accurate tracking
        self.active_connections: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[websocket] = username

    def disconnect(self, websocket: WebSocket):
        self.active_connections.pop(websocket, None)

    def get_online_count(self) -> int:
        return len(self.active_connections)

    async def broadcast(self, message: dict):
        message["onlineCount"] = self.get_online_count()
        dead = []
        for ws in list(self.active_connections.keys()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)

manager = ConnectionManager()

# ===== Server-side ping task to keep DO App Platform connections alive =====
async def keepalive_ping():
    """Send a ping to all clients every 25s to prevent idle timeout (DO uses ~60s)."""
    while True:
        await asyncio.sleep(25)
        if manager.active_connections:
            dead = []
            for ws in list(manager.active_connections.keys()):
                try:
                    await ws.send_json({"type": "ping"})
                except Exception:
                    dead.append(ws)
            for ws in dead:
                manager.disconnect(ws)
            # After cleanup, broadcast updated count
            if dead:
                await manager.broadcast({"type": "count_update"})

@app.on_event("startup")
async def on_startup():
    asyncio.create_task(keepalive_ping())
    asyncio.create_task(fetch_and_cache_voices())

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, username: str = "Anonymous"):
  await manager.connect(websocket, username)
  
  # Fetch recent message history from database
  conn, db_type = get_db_connection()
  cursor = conn.cursor()
  db_history = []
  try:
      cursor.execute("SELECT id, sender, text, avatar_bg, avatar_url, reactions, attachment FROM messages ORDER BY created_at DESC LIMIT 50")
      rows = cursor.fetchall()
      rows.reverse()
      for r in rows:
          try:
              reactions = json.loads(r[5]) if r[5] else {}
          except Exception:
              reactions = {}
          try:
              attachment = json.loads(r[6]) if r[6] else {}
          except Exception:
              attachment = {}
              
          db_history.append({
              "type": "message",
              "message_id": r[0],
              "sender": r[1],
              "text": r[2] or "",
              "avatarBg": r[3] or "",
              "avatar_url": r[4] or "",
              "reactions": reactions,
              "attachment": attachment
          })
  except Exception as e:
      print("Error loading chat history:", e)
  finally:
      conn.close()

  # Send history as a single batched packet for smooth rendering
  try:
    await websocket.send_json({
      "type": "history",
      "messages": db_history,
      "onlineCount": manager.get_online_count()
    })
  except Exception:
    manager.disconnect(websocket)
    return

  # Broadcast updated online count to everyone (including the new connection)
  await manager.broadcast({
    "type": "count_update"
  })
  try:
    while True:
      data_str = await websocket.receive_text()
      try:
        data = json.loads(data_str)
        if not isinstance(data, dict):
            data = {"text": str(data), "avatarBg": ""}
      except Exception:
        data = {"text": data_str, "avatarBg": ""}
      
      action = data.get("action")
      # Ignore client pong responses (keepalive reply to server ping)
      if action == "pong":
        continue

      if action == "delete":
        msg_id = data.get("message_id")
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        try:
            if db_type == "postgres":
                cursor.execute("SELECT sender FROM messages WHERE id = %s", (msg_id,))
            else:
                cursor.execute("SELECT sender FROM messages WHERE id = ?", (msg_id,))
            row = cursor.fetchone()
            if row and row[0] == username:
                if db_type == "postgres":
                    cursor.execute("DELETE FROM messages WHERE id = %s", (msg_id,))
                else:
                    cursor.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
                conn.commit()
                await manager.broadcast({
                  "type": "delete",
                  "message_id": msg_id
                })
        except Exception as e:
            print("Failed to delete message:", e)
        finally:
            conn.close()
        continue
        
      elif action == "react":
        msg_id = data.get("message_id")
        emoji = data.get("emoji")
        if msg_id and emoji:
          conn, db_type = get_db_connection()
          cursor = conn.cursor()
          try:
              if db_type == "postgres":
                  cursor.execute("SELECT reactions FROM messages WHERE id = %s", (msg_id,))
              else:
                  cursor.execute("SELECT reactions FROM messages WHERE id = ?", (msg_id,))
              row = cursor.fetchone()
              if row:
                  reactions = json.loads(row[0]) if row[0] else {}
                  
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
                  
                  # Update DB
                  reactions_str = json.dumps(reactions)
                  if db_type == "postgres":
                      cursor.execute("UPDATE messages SET reactions = %s WHERE id = %s", (reactions_str, msg_id))
                  else:
                      cursor.execute("UPDATE messages SET reactions = ? WHERE id = ?", (reactions_str, msg_id))
                  conn.commit()
                  
                  await manager.broadcast({
                    "type": "react_update",
                    "message_id": msg_id,
                    "reactions": reactions
                  })
          except Exception as e:
              print("Failed to react:", e)
          finally:
              conn.close()
        continue

      # Normal message broadcast
      msg_id = str(uuid.uuid4())
      attachment_data = data.get("attachment", {}) if isinstance(data, dict) else {}
      temp_id = data.get("tempId", "") if isinstance(data, dict) else ""
      msg_payload = {
        "type": "message",
        "message_id": msg_id,
        "sender": username,
        "text": data.get("text", "").strip() if isinstance(data, dict) else str(data),
        "avatarBg": data.get("avatarBg", "") if isinstance(data, dict) else "",
        "avatar_url": data.get("avatar_url", "") if isinstance(data, dict) else "",
        "reactions": {},
        "attachment": attachment_data,
        "tempId": temp_id
      }
      
      # Save to database
      conn, db_type = get_db_connection()
      cursor = conn.cursor()
      try:
          reactions_str = json.dumps({})
          attachment_str = json.dumps(attachment_data)
          if db_type == "postgres":
              cursor.execute(
                  "INSERT INTO messages (id, sender, text, avatar_bg, avatar_url, reactions, attachment) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                  (msg_id, username, msg_payload["text"], msg_payload["avatarBg"], msg_payload["avatar_url"], reactions_str, attachment_str)
              )
          else:
              cursor.execute(
                  "INSERT INTO messages (id, sender, text, avatar_bg, avatar_url, reactions, attachment) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  (msg_id, username, msg_payload["text"], msg_payload["avatarBg"], msg_payload["avatar_url"], reactions_str, attachment_str)
              )
          conn.commit()
      except Exception as e:
          print("Failed to save message:", e)
      finally:
          conn.close()

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
    check_and_update_db_status()
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    if db_type == "postgres":
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255) NOT NULL,
                avatar_url TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(255) PRIMARY KEY,
                sender VARCHAR(255) NOT NULL,
                text TEXT,
                avatar_bg VARCHAR(255),
                avatar_url TEXT,
                reactions TEXT,
                attachment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                avatar_url TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                sender TEXT NOT NULL,
                text TEXT,
                avatar_bg TEXT,
                avatar_url TEXT,
                reactions TEXT DEFAULT '{}',
                attachment TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    
    # Run database migrations for older deployments to add reactions/attachment columns safely
    if db_type == "postgres":
        for col in ["reactions", "attachment"]:
            try:
                cursor.execute(f"ALTER TABLE messages ADD COLUMN {col} TEXT")
                conn.commit()
            except Exception:
                conn.rollback()
    else:
        for col in ["reactions", "attachment"]:
            try:
                cursor.execute(f"ALTER TABLE messages ADD COLUMN {col} TEXT DEFAULT '{{}}'")
                conn.commit()
            except Exception:
                pass

    # Check default mock users for signup screen
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        presets = [
            ("aungkyaw.dev@gmail.com", "Aung Kyaw", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"),
            ("susandar.story@gmail.com", "Su Sandar", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80"),
            ("minkhant.recap@gmail.com", "Min Khant", "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&h=80&q=80")
        ]
        if db_type == "postgres":
            cursor.executemany("INSERT INTO users (email, username, avatar_url) VALUES (%s, %s, %s)", presets)
        else:
            cursor.executemany("INSERT INTO users (email, username, avatar_url) VALUES (?, ?, ?)", presets)
    
    conn.commit()
    conn.close()

# Initialize DB on load
init_db()

@app.get("/api/mock-accounts")
async def get_mock_accounts():
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email, username, avatar_url FROM users")
    rows = cursor.fetchall()
    accounts = []
    for row in rows:
        accounts.append({
            "email": row[0],
            "username": row[1],
            "avatar_url": row[2]
        })
    conn.close()
    return JSONResponse(accounts)

@app.post("/api/signup")
async def signup(payload: SignupRequest):
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    try:
        email_clean = payload.email.strip().lower()
        user_clean = payload.username.strip()
        avatar_clean = payload.avatar_url.strip()
        
        if db_type == "postgres":
            cursor.execute(
                "INSERT INTO users (email, username, avatar_url) VALUES (%s, %s, %s) RETURNING id",
                (email_clean, user_clean, avatar_clean)
            )
            user_id = cursor.fetchone()[0]
        else:
            cursor.execute(
                "INSERT INTO users (email, username, avatar_url) VALUES (?, ?, ?)",
                (email_clean, user_clean, avatar_clean)
            )
            user_id = cursor.lastrowid
            
        conn.commit()
    except Exception as e:
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
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    email_clean = payload.email.strip().lower()
    if db_type == "postgres":
        cursor.execute("SELECT email, username, avatar_url FROM users WHERE email = %s", (email_clean,))
    else:
        cursor.execute("SELECT email, username, avatar_url FROM users WHERE email = ?", (email_clean,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found. Please sign up first.")
    return JSONResponse({
        "email": row[0],
        "username": row[1],
        "avatar_url": row[2]
    })

@app.post("/api/storage/presign")
async def generate_presigned_upload_url(payload: PresignRequest):
    try:
        # Try environment variables first (production on DO App Platform)
        access_key = os.environ.get("DO_SPACES_KEY")
        secret_key = os.environ.get("DO_SPACES_SECRET")
        bucket_name = os.environ.get("DO_SPACES_BUCKET")
        region = os.environ.get("DO_SPACES_REGION", "sgp1")

        # Fallback to local credentials JSON file (for local dev)
        if not access_key or not secret_key or not bucket_name:
            if os.path.exists(CREDS_PATH):
                with open(CREDS_PATH, "r") as f:
                    creds = json.load(f)
                spaces_config = creds.get("digitalocean_spaces", {})
                access_key = access_key or spaces_config.get("access_key_id")
                secret_key = secret_key or spaces_config.get("secret_access_key")
                bucket_name = bucket_name or spaces_config.get("bucket_name")
                region = spaces_config.get("region", region)

        if not access_key or not secret_key or not bucket_name:
            raise HTTPException(status_code=500, detail="Storage not configured. Set DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET environment variables.")

        session = boto3.session.Session()
        s3_client = session.client(
            's3',
            region_name=region,
            endpoint_url=f"https://{region}.digitaloceanspaces.com",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )

        file_ext = os.path.splitext(payload.filename)[1].lower()
        unique_key = f"uploads/{uuid.uuid4().hex}{file_ext}"

        presigned_url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': bucket_name,
                'Key': unique_key,
                'ContentType': payload.content_type,
                'ACL': 'public-read'
            },
            ExpiresIn=3600
        )

        public_url = f"https://{bucket_name}.{region}.digitaloceanspaces.com/{unique_key}"

        return JSONResponse({
            "upload_url": presigned_url,
            "download_url": public_url,
            "filename": payload.filename,
            "key": unique_key
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload signature: {e}")

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
