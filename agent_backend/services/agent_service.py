import os
import sqlite3
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from google import genai
from google.genai import types
from dotenv import load_dotenv

# ---------------------------------------------------------
# 1. Advanced Configuration & Path Resolution
# ---------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgentService")

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
DB_PATH = BASE_DIR / "data" / "user_data" / "chat_history.db"

# Force load .env and OVERRIDE any existing system variables
load_dotenv(dotenv_path=ENV_PATH, override=True)

# ---------------------------------------------------------
# 2. Strict Authentication Fixes
# ---------------------------------------------------------
# Strip accidental quotes and spaces from the .env variables
raw_key = os.getenv("GEMINI_API_KEY", "")
CLEAN_API_KEY = raw_key.strip(" '\"")

if not CLEAN_API_KEY:
    raise RuntimeError(f"CRITICAL: GEMINI_API_KEY is missing or empty in {ENV_PATH}")

# Force the clean key into os.environ (The SDK looks for this exact variable)
os.environ["GEMINI_API_KEY"] = CLEAN_API_KEY

# CRITICAL FIX: Remove Google Cloud OAuth credentials to force API Key usage
os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)

Assistant_Name = os.getenv("Agent_Name", "GHOST").strip(" '\"")
User_Name = os.getenv("User_Name", "Bishal").strip(" '\"")

# Log safely to verify the key loaded (shows first 5 and last 4 characters)
logger.info(f"Loaded API Key: {CLEAN_API_KEY[:5]}...{CLEAN_API_KEY[-4:]} (Length: {len(CLEAN_API_KEY)})")

# Initialize Client seamlessly
client = genai.Client()
chat_sessions: Dict[str, genai.chats.Chat] = {}

# ---------------------------------------------------------
# 3. Optimized Database Engine
# ---------------------------------------------------------
def init_db():
    os.makedirs(DB_PATH.parent, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)
        # Added an index to drastically speed up fetching history for specific sessions
        conn.execute("CREATE INDEX IF NOT EXISTS idx_session ON chat_logs(session_id)")

def fetch_history(session_id: str) -> List[types.Content]:
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT role, content FROM chat_logs WHERE session_id = ? ORDER BY id ASC",
            (session_id,)
        )
        return [
            types.Content(
                role="user" if role == "user" else "model",
                parts=[types.Part.from_text(text=content)]
            )
            for role, content in cursor.fetchall()
        ]

def save_message(session_id: str, role: str, content: str):
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO chat_logs (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
            (session_id, role, content, current_time)
        )

# ---------------------------------------------------------
# 4. Agent Session Manager
# ---------------------------------------------------------
def get_system_instruction() -> str:
    now_str = datetime.now().strftime("%A, %B %d, %Y - %I:%M:%S %p")
    return f"""
You are {Assistant_Name}, an advanced voice-enabled AI assistant talking with {User_Name}.
Current Date & Time: {now_str}

Rules:
1. ALWAYS respond in the EXACT same language and script used by the user.
2. Maintain full context of prior turns.
3. Keep spoken responses concise and natural for TTS output.
""".strip()

init_db()

def get_or_create_session(session_id: str = "default_ghost_user") -> genai.chats.Chat:
    if session_id not in chat_sessions:
        db_history = fetch_history(session_id)
        
        # Corrected model string to 2.5-flash
        chat_sessions[session_id] = client.chats.create(
            model="gemini-2.5-flash",
            history=db_history,
            config=types.GenerateContentConfig(
                system_instruction=get_system_instruction(),
                temperature=0.6,
                top_p=0.95
            )
        )
    return chat_sessions[session_id]