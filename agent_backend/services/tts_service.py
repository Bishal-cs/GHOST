import re
import base64
import edge_tts

def detect_voice_for_text(text: str) -> str:
    """Detects text script to assign matching neural TTS voice."""
    if re.search(r'[\u0900-\u097F]', text):
        return "hi-IN-MadhurNeural"       # Hindi
    elif re.search(r'[\u0980-\u09FF]', text):
        return "bn-IN-TanishaaNeural"     # Bengali
    elif re.search(r'[¿¡áéíóúñ]', text, re.IGNORECASE):
        return "es-ES-AlvaroNeural"       # Spanish
    return "en-US-AndrewNeural"            # English / Default

async def generate_tts_base64(text: str) -> str:
    """Synthesizes text to base64-encoded audio format."""
    try:
        voice = detect_voice_for_text(text)
        communicate = edge_tts.Communicate(text, voice)
        audio_bytes = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]
        return base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as e:
        print(f"[TTS Service Error]: {e}")
        return ""