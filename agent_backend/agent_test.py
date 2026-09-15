import os
import json
import time
import ctypes
import asyncio
import webbrowser
from google import genai
from google.genai import types
import edge_tts

# Setup your local JSON cache path
FILE_PATH = "C:\\Users\\bisha\\OneDrive\\Desktop\\Ghost\\data\\user_data\\websites.json"

# Safely create directories and load cache
os.makedirs(os.path.dirname(FILE_PATH), exist_ok=True)
try:
    with open(FILE_PATH, "r") as file:
        websites = json.load(file)
except (FileNotFoundError, json.JSONDecodeError):
    websites = {}

# Initialize Gemini Client (Reads GEMINI_API_KEY from environment)
client = genai.Client()

# Dictionary of popular websites for instant access
common_sites = {
    "instagram": "https://instagram.com",
    "youtube": "https://youtube.com",
    "facebook": "https://facebook.com",
    "twitter": "https://x.com",
    "x": "https://x.com",
    "linkedin": "https://linkedin.com",
    "reddit": "https://reddit.com",
    "github": "https://github.com",
    "chatgpt": "https://chatgpt.com",
    "google": "https://google.com",
    "spotify": "https://spotify.com"
}

def add_website_to_json(name: str, url: str):
    websites[name] = url
    try:
        with open(FILE_PATH, "w") as file:
            json.dump(websites, file, indent=4)
    except Exception:
        pass

def open_website(webname: str) -> str:
    """The tool function that Gemini will choose to execute."""
    website_names = webname.lower().split()
    opened_links = []
    
    for name in set(website_names):
        # 1. Check history file
        if name in websites:
            url = websites[name]
        # 2. Check pre-defined everyday list
        elif name in common_sites:
            url = common_sites[name]
            add_website_to_json(name, url)
        # 3. Automatic Google search link fallback for uncommon sites (Never fails or blocks)
        else:
            url = f"https://google.com/search?q={name}"
            add_website_to_json(name, url)
            
        webbrowser.open(url)
        opened_links.append(f"{name} ({url})")
        
    return f"Successfully opened: {', '.join(opened_links)}."

def speak_text(text: str):
    """Generates natural TTS audio and plays it natively on Windows."""
    output_audio = "response.mp3"
    
    communicate = edge_tts.Communicate(text, "en-US-AndrewNeural")
    asyncio.run(communicate.save(output_audio))
    
    abs_path = os.path.abspath(output_audio)
    
    try:
        ctypes.windll.winmm.mciSendStringW(f'open "{abs_path}" type mpegvideo alias mp3audio', None, 0, 0)
        ctypes.windll.winmm.mciSendStringW('play mp3audio', None, 0, 0)
        
        status = ctypes.create_unicode_buffer(128)
        while True:
            ctypes.windll.winmm.mciSendStringW('status mp3audio mode', status, 128, 0)
            if status.value != 'playing':
                break
            time.sleep(0.1)
            
    finally:
        ctypes.windll.winmm.mciSendStringW('close mp3audio', None, 0, 0)

def run_agent_loop(user_prompt: str):
    """Executes the complete Agent Loop: LLM -> Tool Execution -> Speak Text"""
    print(f"\n[You]: {user_prompt}")
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=user_prompt,
        config=types.GenerateContentConfig(
            tools=[open_website],
            temperature=0.4
        )
    )
    
    agent_text = ""
    
    if response.function_calls:
        for call in response.function_calls:
            if call.name == "open_website":
                tool_output = open_website(**call.args)
                print(f"[System Tool]: {tool_output}")
                
                final_response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]),
                        response.candidates.content,
                        types.Content(role="tool", parts=[
                            types.Part.from_function_response(name=call.name, response={"result": tool_output})
                        ])
                    ]
                )
                agent_text = final_response.text
    else:
        agent_text = response.text

    print(f"[Agent]: {agent_text}")
    speak_text(agent_text)

if __name__ == "__main__":
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: Please set your GEMINI_API_KEY environment variable first.")
    else:
        print("Agent loop is active! Type 'exit' to quit.")
        while True:
            user_input = input("\nAsk your agent something: ")
            if user_input.lower() == 'exit':
                break
            if user_input.strip():
                run_agent_loop(user_input)
