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

JWT_SECRET = os.environ.get("JWT_SECRET", "burmeserecap-super-secret-key-9988")

def decode_jwt(token: str) -> dict | None:
    try:
        import base64, json, hmac, hashlib, time
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts
        signature_base = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        def base64url_decode(s):
            p = '=' * (4 - (len(s) % 4))
            return base64.urlsafe_b64decode(s + p)
            
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), signature_base, hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b'=').decode('utf-8')
        
        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            return None
        
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    username = "Anonymous"
    if token:
        payload = decode_jwt(token)
        if payload:
            username = payload.get("username", "Anonymous")
        else:
            await websocket.accept()
            await websocket.close(code=4003)
            return
        
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
                avatar_url TEXT NOT NULL,
                password_hash VARCHAR(255),
                plan VARCHAR(50) DEFAULT 'Free',
                credits_remaining INTEGER DEFAULT 10000,
                last_credit_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
                avatar_url TEXT NOT NULL,
                password_hash TEXT,
                plan TEXT DEFAULT 'Free',
                credits_remaining INTEGER DEFAULT 10000,
                last_credit_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    # Migrations for users table
    columns_to_add = [
        ("email", "TEXT UNIQUE" if db_type == "sqlite" else "VARCHAR(255) UNIQUE"),
        ("username", "TEXT" if db_type == "sqlite" else "VARCHAR(255)"),
        ("avatar_url", "TEXT" if db_type == "sqlite" else "TEXT"),
        ("password_hash", "TEXT" if db_type == "sqlite" else "VARCHAR(255)"),
        ("plan", "TEXT DEFAULT 'Free'" if db_type == "sqlite" else "VARCHAR(50) DEFAULT 'Free'"),
        ("credits_remaining", "INTEGER DEFAULT 10000" if db_type == "sqlite" else "INTEGER DEFAULT 10000"),
        ("last_credit_reset", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" if db_type == "sqlite" else "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            conn.commit()
            print(f"Added column {col_name} to users table.")
        except Exception:
            if db_type == "postgres":
                conn.rollback()

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

    # Create indexes after columns are migrated
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        conn.commit()
    except Exception:
        if db_type == "postgres":
            conn.rollback()

    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)")
        conn.commit()
    except Exception:
        if db_type == "postgres":
            conn.rollback()

    conn.close()

# Initialize DB on load
init_db()

@app.get("/static/index.html")
async def redirect_static_index():
    return RedirectResponse(url="/")

@app.get("/index.html")
async def redirect_index_html():
    return RedirectResponse(url="/")

@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

app.mount("/", StaticFiles(directory="static", html=True), name="static")
