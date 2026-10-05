import os
import pygame
import asyncio
import edge_tts
import threading
import re

BUFFER_SIZE = 1024

def detect_voice(text: str) -> str:
    """Dynamically sets the edge-tts voice based on the text script."""
    # Bengali character range
    if re.search(r'[\u0980-\u09FF]', text):
        return "bn-IN-TanishaaNeural"
    # Hindi/Devanagari character range
    elif re.search(r'[\u0900-\u097F]', text):
        return "hi-IN-MadhurNeural"
    # Spanish character range
    elif re.search(r'[¿¡áéíóúñ]', text, re.IGNORECASE):
        return "es-ES-AlvaroNeural"
    # Default English Fallback
    return "en-US-JennyNeural"

def remove_file(file_path):
    max_attempts = 3
    attempts = 0
    while attempts < max_attempts:
        try:
            with open(file_path, "wb"):
                pass
            os.remove(file_path)
            break
        except Exception:
            attempts += 1

async def amain(text, output_file) -> None:
    try:
        # Dynamically assign the voice based on the LLM's text
        selected_voice = detect_voice(text)
        print(f"[*] TTS Engine routing to voice: {selected_voice}")
        
        cm_text = edge_tts.Communicate(text, selected_voice)
        await cm_text.save(output_file)
        
        playback_thread = threading.Thread(target=play_audio, args=(output_file,))
        playback_thread.start()
        playback_thread.join()
    except Exception as e:
        print(f"[TTS Error]: {e}")
    finally:
        remove_file(output_file)

def play_audio(file_path):
    try:
        pygame.init()
        pygame.mixer.init()
        sound = pygame.mixer.Sound(file_path)
        sound.play()
        while pygame.mixer.get_busy():
            pygame.time.Clock().tick(10)
        pygame.quit()
    except Exception as e:
        print(f"[Playback Error]: {e}")

def speak(Text, output_file=None):
    if output_file is None:
        # Ensure the directory exists
        os.makedirs(os.path.join(os.getcwd(), "agent_backend/data/user_data"), exist_ok=True)
        output_file = os.path.join(os.getcwd(), "agent_backend/data/user_data", "speech.wav")
    try:
        asyncio.run(amain(Text, output_file))
    except Exception as e:
        print(f"[Speak Error]: {e}")
        
if __name__ == "__main__":
    while True:
        x = input("Enter the text: ")
        speak(x)