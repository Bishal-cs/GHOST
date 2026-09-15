from typing import Dict
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

SYSTEM_INSTRUCTION = """
You are GHOST, an advanced, highly intelligent voice-enabled AI assistant.
Rules for conversation and memory:
1. ALWAYS respond in the EXACT same language and script used by the user.
2. Maintain context and remember all previous facts, preferences, and user details shared during the session.
3. Keep spoken responses concise, natural, and friendly for text-to-speech output.
"""

client = genai.Client()
chat_sessions: Dict[str, genai.chats.Chat] = {}

def get_or_create_session(session_id: str) -> genai.chats.Chat:
    """Retrieves an existing chat session or initializes a new persistent session."""
    if session_id not in chat_sessions:
        chat_sessions[session_id] = client.chats.create(
            model="gemini-3.6-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.6,
                top_p=0.95,
                tools=[]
            )
        )
    return chat_sessions[session_id]