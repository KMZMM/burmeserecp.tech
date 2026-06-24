from __future__ import annotations

import asyncio
from io import BytesIO
import json
import os
import sqlite3
import struct
import time
import uuid
import hashlib
import hmac
import base64
from typing import Any

import boto3
import requests
import edge_tts
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

# JWT Authentication Config
JWT_SECRET = os.environ.get("JWT_SECRET", "burmeserecap-super-secret-key-9988")

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_jwt(payload: dict, expires_in: int = 86400) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload_copy = payload.copy()
    payload_copy["exp"] = int(time.time()) + expires_in
    
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload_copy).encode('utf-8'))
    
    signature_base = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_base, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_jwt(token: str) -> dict | None:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        signature_base = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        # Verify signature
        expected_signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_base, hashlib.sha256).digest()
        expected_signature_b64 = base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
        
        # Decode payload
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        
        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None

# Password Hashing Helper
def hash_password(password: str) -> str:
    salt = uuid.uuid4().hex
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt, hashed = hashed_password.split(':')
        test_hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
        return hmac.compare_digest(hashed, test_hashed)
    except Exception:
        return False

# Pydantic Schemas
class SignupRequest(BaseModel):
    email: str = Field(min_length=3)
    username: str = Field(min_length=1)
    password: str = Field(min_length=6)
    avatar_url: str = Field(min_length=1)

class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)

class SubscribeRequest(BaseModel):
    plan: str = Field(min_length=1)

class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = Field(min_length=1)
    rate: int = Field(ge=-50, le=50, default=0)
    pitch: int = Field(ge=-50, le=50, default=0)

class PresignRequest(BaseModel):
    filename: str
    content_type: str

# App config
app = FastAPI(title="burmeserecp-api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "users.db"
CREDS_PATH = "C:/Users/HP/.gemini/antigravity/brain/47446197-b7fd-43a6-a29d-da44be16af0f/scratch/infrastructure_credentials.json"

def get_db_connection():
    try:
        db_url = os.environ.get("DATABASE_URL")
        if db_url:
            import psycopg2
            return psycopg2.connect(db_url, connect_timeout=3), "postgres"

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
        print("API PostgreSQL connection failed, falling back to SQLite:", e)
    
    conn = sqlite3.connect(DB_PATH)
    return conn, "sqlite"

def get_current_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format.")
    token = authorization.split(" ")[1]
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid token. Please sign in again.")
    return payload

PLAN_CREDITS_LIMITS = {
    "Free": 10000,
    "Basic": 50000,
    "Premium": 150000,
    "Pro": 500000
}

def verify_and_reset_user_credits(email: str) -> dict:
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    try:
        if db_type == "postgres":
            cursor.execute("SELECT plan, credits_remaining, last_credit_reset, username, avatar_url FROM users WHERE email = %s", (email,))
        else:
            cursor.execute("SELECT plan, credits_remaining, last_credit_reset, username, avatar_url FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found.")
        
        plan = row[0] or "Free"
        credits_remaining = row[1] if row[1] is not None else 10000
        last_reset = row[2]
        username = row[3]
        avatar_url = row[4]

        # Reset credits if last reset was on a previous calendar day
        # Compare current day with last reset day in UTC
        current_time = time.time()
        current_struct = time.gmtime(current_time)
        
        # Parse last reset time
        last_reset_struct = None
        if isinstance(last_reset, str):
            # Handle SQLite text format
            try:
                # SQLite TIMESTAMP format is usually YYYY-MM-DD HH:MM:SS or ISO
                if " " in last_reset:
                    last_reset_struct = time.strptime(last_reset.split(".")[0], "%Y-%m-%d %H:%M:%S")
                else:
                    last_reset_struct = time.strptime(last_reset.split("T")[0], "%Y-%m-%d")
            except Exception:
                pass
        elif last_reset:
            # Handle datetime object from postgresql
            last_reset_struct = last_reset.timetuple()

        should_reset = False
        if not last_reset_struct or (
            current_struct.tm_year != last_reset_struct.tm_year or
            current_struct.tm_yday != last_reset_struct.tm_yday
        ):
            should_reset = True

        if should_reset:
            credits_remaining = PLAN_CREDITS_LIMITS.get(plan, 10000)
            if db_type == "postgres":
                cursor.execute(
                    "UPDATE users SET credits_remaining = %s, last_credit_reset = CURRENT_TIMESTAMP WHERE email = %s",
                    (credits_remaining, email)
                )
            else:
                cursor.execute(
                    "UPDATE users SET credits_remaining = ?, last_credit_reset = CURRENT_TIMESTAMP WHERE email = ?",
                    (credits_remaining, email)
                )
            conn.commit()

        return {
            "email": email,
            "username": username,
            "avatar_url": avatar_url,
            "plan": plan,
            "credits_remaining": credits_remaining
        }
    finally:
        conn.close()

# Initial database migration script
def init_db():
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    try:
        # Create users table
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
        conn.commit()

        # Run safe migrations to add new columns if they do not exist
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
    finally:
        conn.close()

init_db()

@app.post("/api/signup")
async def signup(payload: SignupRequest):
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    try:
        email_clean = payload.email.strip().lower()
        user_clean = payload.username.strip()
        avatar_clean = payload.avatar_url.strip()
        pass_hash = hash_password(payload.password)
        
        if db_type == "postgres":
            cursor.execute(
                "INSERT INTO users (email, username, avatar_url, password_hash, plan, credits_remaining) VALUES (%s, %s, %s, %s, 'Free', 10000) RETURNING id",
                (email_clean, user_clean, avatar_clean, pass_hash)
            )
            user_id = cursor.fetchone()[0]
        else:
            cursor.execute(
                "INSERT INTO users (email, username, avatar_url, password_hash, plan, credits_remaining) VALUES (?, ?, ?, ?, 'Free', 10000)",
                (email_clean, user_clean, avatar_clean, pass_hash)
            )
            user_id = cursor.lastrowid
            
        conn.commit()
    except Exception as e:
        conn.close()
        print("Signup error details:", e)
        raise HTTPException(status_code=400, detail=f"Account creation failed: {str(e)}")
    conn.close()
    
    # Generate JWT
    token = create_jwt({"email": email_clean, "username": user_clean})
    return JSONResponse({
        "status": "success",
        "token": token,
        "profile": {
            "id": user_id,
            "username": user_clean,
            "avatar_url": avatar_clean,
            "email": email_clean,
            "plan": "Free",
            "credits_remaining": 10000
        }
    })

@app.post("/api/login")
async def login(payload: LoginRequest):
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    email_clean = payload.email.strip().lower()
    
    if db_type == "postgres":
        cursor.execute("SELECT email, username, avatar_url, password_hash, plan, credits_remaining FROM users WHERE email = %s", (email_clean,))
    else:
        cursor.execute("SELECT email, username, avatar_url, password_hash, plan, credits_remaining FROM users WHERE email = ?", (email_clean,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Account not found. Please sign up first.")
    
    stored_hash = row[3]
    if not stored_hash or not verify_password(payload.password, stored_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    # Call credit reset check
    user_info = verify_and_reset_user_credits(email_clean)

    token = create_jwt({"email": email_clean, "username": row[1]})
    return JSONResponse({
        "token": token,
        "profile": {
            "email": user_info["email"],
            "username": user_info["username"],
            "avatar_url": user_info["avatar_url"],
            "plan": user_info["plan"],
            "credits_remaining": user_info["credits_remaining"]
        }
    })

@app.get("/api/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    user_info = verify_and_reset_user_credits(user["email"])
    return JSONResponse(user_info)

@app.post("/api/plans/subscribe")
async def subscribe_plan(payload: SubscribeRequest, user: dict = Depends(get_current_user)):
    target_plan = payload.plan
    if target_plan not in PLAN_CREDITS_LIMITS:
        raise HTTPException(status_code=400, detail="Invalid plan selection.")
    
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    try:
        new_credits = PLAN_CREDITS_LIMITS[target_plan]
        if db_type == "postgres":
            cursor.execute(
                "UPDATE users SET plan = %s, credits_remaining = %s, last_credit_reset = CURRENT_TIMESTAMP WHERE email = %s",
                (target_plan, new_credits, user["email"])
            )
        else:
            cursor.execute(
                "UPDATE users SET plan = ?, credits_remaining = ?, last_credit_reset = CURRENT_TIMESTAMP WHERE email = ?",
                (target_plan, new_credits, user["email"])
            )
        conn.commit()
    finally:
        conn.close()
        
    return JSONResponse({
        "status": "success",
        "plan": target_plan,
        "credits_remaining": new_credits
    })

@app.post("/api/storage/presign")
async def generate_presigned_upload_url(payload: PresignRequest, user: dict = Depends(get_current_user)):
    try:
        access_key = os.environ.get("DO_SPACES_KEY")
        secret_key = os.environ.get("DO_SPACES_SECRET")
        bucket_name = os.environ.get("DO_SPACES_BUCKET")
        region = os.environ.get("DO_SPACES_REGION", "sgp1")

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
            raise HTTPException(status_code=500, detail="Storage not configured.")

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload signature: {e}")

# WAV header packing logic
def pcm_to_wav_bytes(pcm_data: bytes) -> bytes:
    pcm_len = len(pcm_data)
    # Format specification: Little-endian (<)
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',                 # ChunkID
        36 + pcm_len,            # ChunkSize
        b'WAVE',                 # Format
        b'fmt ',                 # Subchunk1ID
        16,                      # Subchunk1Size
        1,                       # AudioFormat (PCM)
        1,                       # NumChannels (Mono)
        24000,                   # SampleRate
        48000,                   # ByteRate (24000 * 1 * 2 bytes)
        2,                       # BlockAlign
        16,                      # BitsPerSample
        b'data',                 # Subchunk2ID
        pcm_len                  # Subchunk2Size
    )
    return header + pcm_data

FREE_VOICES = [
    {"short_name": "my-MM-NilarNeural", "locale": "my-MM", "gender": "Female", "label": "Nilar (Burmese)"},
    {"short_name": "my-MM-ThihaNeural", "locale": "my-MM", "gender": "Male", "label": "Thiha (Burmese)"},
    {"short_name": "en-US-AvaMultilingualNeural", "locale": "en-US", "gender": "Female", "label": "Ava (Multilingual)"},
    {"short_name": "en-US-AndrewMultilingualNeural", "locale": "en-US", "gender": "Male", "label": "Andrew (Multilingual)"},
    {"short_name": "en-US-EmmaMultilingualNeural", "locale": "en-US", "gender": "Female", "label": "Emma (Multilingual)"},
    {"short_name": "en-US-BrianMultilingualNeural", "locale": "en-US", "gender": "Male", "label": "Brian (Multilingual)"},
]

PREMIUM_VOICES = [
    {"short_name": "gemini-Aoede", "locale": "multilingual", "gender": "Female", "label": "Aoede (Premium Multilingual)", "provider": "gemini"},
    {"short_name": "gemini-Charon", "locale": "multilingual", "gender": "Male", "label": "Charon (Premium Multilingual)", "provider": "gemini"},
    {"short_name": "gemini-Fenrir", "locale": "multilingual", "gender": "Male", "label": "Fenrir (Premium Multilingual)", "provider": "gemini"},
    {"short_name": "gemini-Kore", "locale": "multilingual", "gender": "Female", "label": "Kore (Premium Multilingual)", "provider": "gemini"},
    {"short_name": "gemini-Puck", "locale": "multilingual", "gender": "Male", "label": "Puck (Premium Multilingual)", "provider": "gemini"}
]

@app.get("/api/voices")
async def get_voices(user_token: str = None):
    # Determine the user's plan if a token is provided, to show lock status on premium voices
    plan = "Free"
    if user_token:
        payload = decode_jwt(user_token)
        if payload:
            try:
                info = verify_and_reset_user_credits(payload["email"])
                plan = info.get("plan", "Free")
            except Exception:
                pass
            
    voices = []
    # Add Free voices
    for v in FREE_VOICES:
        voices.append({**v, "premium": False, "locked": False})
        
    # Add Premium voices
    for v in PREMIUM_VOICES:
        voices.append({**v, "premium": True, "locked": (plan == "Free")})
        
    return JSONResponse(voices)

@app.post("/api/tts")
async def text_to_speech(payload: TTSRequest, user: dict = Depends(get_current_user)) -> StreamingResponse:
    user_info = verify_and_reset_user_credits(user["email"])
    plan = user_info["plan"]
    credits_remaining = user_info["credits_remaining"]

    is_premium = payload.voice.startswith("gemini-")
    char_count = len(payload.text.strip())

    # Check premium lock
    if is_premium and plan == "Free":
        raise HTTPException(status_code=403, detail="Premium voices require a Basic, Premium, or Pro Plan.")

    # Calculate cost
    cost = char_count * 5 if is_premium else char_count
    if credits_remaining < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient credits. Remaining: {credits_remaining}, Required: {cost}.")

    # Deduct credits
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    try:
        new_credits = credits_remaining - cost
        if db_type == "postgres":
            cursor.execute("UPDATE users SET credits_remaining = %s WHERE email = %s", (new_credits, user["email"]))
        else:
            cursor.execute("UPDATE users SET credits_remaining = ? WHERE email = ?", (new_credits, user["email"]))
        conn.commit()
    finally:
        conn.close()

    # Generate Speech
    if is_premium:
        # Gemini Multimodal TTS API
        api_key = os.environ.get("GEMINI_TTS_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            # Fallback to check credentials JSON for GEMINI API key if set there
            if os.path.exists(CREDS_PATH):
                try:
                    with open(CREDS_PATH, "r") as f:
                        creds = json.load(f)
                    api_key = creds.get("gemini_api_key")
                except Exception:
                    pass

        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API Key is not configured on the server.")

        voice_name = payload.voice.replace("gemini-", "")
        # Call Gemini TTS Proxy URL
        url = "https://yansd666.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        text_content = payload.text.strip()
        
        req_body = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": text_content
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {
                            "voiceName": voice_name
                        }
                    }
                }
            }
        }

        try:
            res = requests.post(url, json=req_body, headers=headers, timeout=20)
            if res.status_code != 200:
                raise Exception(f"Gemini API returned status {res.status_code}: {res.text}")
            
            res_data = res.json()
            base64_pcm = res_data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
            pcm_bytes = base64.b64decode(base64_pcm)
            
            # Prepend 44-byte WAV header
            wav_bytes = pcm_to_wav_bytes(pcm_bytes)
            
            headers_res = {"Content-Disposition": 'inline; filename="burmeserecp-gemini.wav"'}
            return StreamingResponse(BytesIO(wav_bytes), media_type="audio/wav", headers=headers_res)

        except Exception as exc:
            # Refund credits in case of network failure
            conn, db_type = get_db_connection()
            cursor = conn.cursor()
            try:
                if db_type == "postgres":
                    cursor.execute("UPDATE users SET credits_remaining = %s WHERE email = %s", (credits_remaining, user["email"]))
                else:
                    cursor.execute("UPDATE users SET credits_remaining = ? WHERE email = ?", (credits_remaining, user["email"]))
                conn.commit()
            finally:
                conn.close()
            raise HTTPException(status_code=502, detail=f"Gemini TTS generation failed: {exc}")
    else:
        # Edge TTS (Free voices)
        try:
            rate = f"{payload.rate:+d}%"
            pitch = f"{payload.pitch:+d}Hz"
            communicate = edge_tts.Communicate(
                text=payload.text.strip(),
                voice=payload.voice,
                rate=rate,
                pitch=pitch,
            )
            audio_buffer = BytesIO()
            async def iterate_chunks():
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_buffer.write(chunk["data"])
                audio_buffer.seek(0)
                return audio_buffer

            buf = await iterate_chunks()
            headers_res = {"Content-Disposition": 'inline; filename="burmeserecp-tts.mp3"'}
            return StreamingResponse(buf, media_type="audio/mpeg", headers=headers_res)
        except Exception as exc:
            # Refund credits
            conn, db_type = get_db_connection()
            cursor = conn.cursor()
            try:
                if db_type == "postgres":
                    cursor.execute("UPDATE users SET credits_remaining = %s WHERE email = %s", (credits_remaining, user["email"]))
                else:
                    cursor.execute("UPDATE users SET credits_remaining = ? WHERE email = ?", (credits_remaining, user["email"]))
                conn.commit()
            finally:
                conn.close()
            raise HTTPException(status_code=502, detail=f"TTS generation failed: {exc}")
