import os
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Import modular services
from services.tts_service import generate_tts_base64
from services.agent_service import get_or_create_session

load_dotenv()

app = FastAPI(
    title="GHOST Core Server",
    description="Main FastAPI backend server handling API endpoints",
    version="3.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentRequest(BaseModel):
    message: str = Field(..., description="User prompt or speech text")
    session_id: str = Field(default="default_ghost_user", description="Unique session ID")
    voice_enabled: bool = Field(default=True, description="Toggle audio output")

class AgentResponse(BaseModel):
    text: str
    audio: Optional[str] = None
    session_id: str
    status: str

@app.get("/health")
async def health_check():
    return {"status": "online", "engine": "GHOST Modular Backend"}

@app.post("/api/agent", response_model=AgentResponse)
async def run_agent(req: AgentRequest):
    if not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Message prompt cannot be empty."
        )

    try:
        # Retrieve persistent memory session
        chat = get_or_create_session(req.session_id)
        
        # Process user message
        response = chat.send_message(req.message)
        agent_text = response.text or "Command processed."

        # Synthesize audio response
        audio_b64_uri = None
        if req.voice_enabled:
            raw_audio_b64 = await generate_tts_base64(agent_text)
            if raw_audio_b64:
                audio_b64_uri = f"data:audio/mp3;base64,{raw_audio_b64}"

        return AgentResponse(
            text=agent_text,
            audio=audio_b64_uri,
            session_id=req.session_id,
            status="success"
        )

    except Exception as e:
        print(f"[Main Server Error]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent execution failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)