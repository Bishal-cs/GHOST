import os
import json
import asyncio
import webbrowser
import base64
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from duckduckgo_search import DDGS
import edge_tts

app = FastAPI(title="GHOST AI Agent Engine")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client (Ensure GEMINI_API_KEY environment variable is set)
client = genai.Client()

# Local website cache setup
CACHE_PATH = os.path.join(os.path.expanduser("~"), "Desktop", "Ghost", "data", "user_data", "websites.json")
os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)

def load_website_cache() -> dict:
    try:
        if os.path.exists(CACHE_PATH):
            with open(CACHE_PATH, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_website_cache(cache: dict):
    try:
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f, indent=4)
    except Exception:
        pass

COMMON_SITES = {
    "instagram": "https://instagram.com",
    "youtube": "https://youtube.com",
    "facebook": "https://facebook.com",
    "twitter": "https://x.com",
    "x": "https://x.com",
    "linkedin": "https://linkedin.com",
    "github": "https://github.com",
    "chatgpt": "https://chatgpt.com",
    "google": "https://google.com"
}

# ---------------------------------------------------------
# AGENT TOOLS
# ---------------------------------------------------------
def open_website(webname: str) -> str:
    """
    Opens web applications or URLs in the user's default browser.
    Use this whenever the user asks to open YouTube, Instagram, GitHub, or any website.
    """
    cache = load_website_cache()
    names = set(webname.lower().split())
    opened = []

    for name in names:
        if name in cache:
            url = cache[name]
        elif name in COMMON_SITES:
            url = COMMON_SITES[name]
            cache[name] = url
            save_website_cache(cache)
        else:
            # Fallback search via DuckDuckGo
            url = f"https://google.com/search?q={name}"
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(name, max_results=1))
                    if results:
                        url = results[0]['href']
            except Exception:
                pass
            cache[name] = url
            save_website_cache(cache)

        webbrowser.open(url)
        opened.append(f"{name} ({url})")

    return f"Successfully opened in browser: {', '.join(opened)}"

tools_map = {
    "open_website": open_website
}

# ---------------------------------------------------------
# IN-MEMORY CHAT SESSIONS (Diagram 3 Memory Block)
# ---------------------------------------------------------
chat_sessions = {}

def get_or_create_chat(session_id: str):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction="You are GHOST, a voice-enabled AI desktop assistant. Be concise, direct, and conversational.",
                tools=[open_website],
                temperature=0.4,
            )
        )
    return chat_sessions[session_id]

# Helper function to generate Edge-TTS Audio as Base64
async def generate_speech_base64(text: str, voice: str = "en-US-AndrewNeural") -> str:
    communicate = edge_tts.Communicate(text, voice)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return base64.b64encode(audio_data).decode("utf-8")

# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------
class AgentRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_user"

@app.post("/api/agent")
async def process_agent_request(req: AgentRequest):
    try:
        chat = get_or_create_chat(req.session_id)
        
        # Turn 1: Send user message to Gemini
        response = chat.send_message(req.message)
        executed_tool = None

        # Check for function calls (Diagram 2 Feedback Loop)
        if response.function_calls:
            for call in response.function_calls:
                tool_name = call.name
                tool_args = call.args

                if tool_name in tools_map:
                    # Run the tool locally
                    tool_result = tools_map[tool_name](**tool_args)
                    executed_tool = tool_name

                    # Turn 2: Pass execution result back into Gemini context
                    response = chat.send_message(
                        types.Content(
                            role="tool",
                            parts=[
                                types.Part.from_function_response(
                                    name=tool_name,
                                    response={"result": tool_result}
                                )
                            ]
                        )
                    )

        final_text = response.text or "Command completed."
        
        # Convert text to audio stream for frontend speaker playback
        audio_b64 = await generate_speech_base64(final_text)

        return {
            "text": final_text,
            "tool_executed": executed_tool,
            "audio": f"data:audio/mp3;base64,{audio_b64}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)