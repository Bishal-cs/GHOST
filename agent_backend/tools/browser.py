import json
import subprocess
import webbrowser

try:
    from googlesearch import search  # pip install googlesearch-python
except ModuleNotFoundError:
    subprocess.run(["pip", "install", "googlesearch-python"])
    from googlesearch import search

FILE_PATH = r"data\user_data\websites.json"

# Load cache safely
try:
    with open(FILE_PATH, "r") as file:
        websites = json.load(file)
except (FileNotFoundError, json.JSONDecodeError):
    websites = {}

def google_search_website(name: str) -> str | None:
    try:
        # Requesting a few extra results just in case the first one is an ad or bad link
        for url in search(name, num_results=2):
            return url
    except Exception as e:
        return None
    return None

def add_website_to_json(name: str, url: str):
    websites[name] = url
    try:
        with open(FILE_PATH, "w") as file:
            json.dump(websites, file, indent=4)
    except Exception as e:
        pass # Handle file permission errors gracefully if they occur

def open_website(webname: str) -> str:
    """
    Parses a website request, searches Google if it's missing from the cache,
    opens the browsers, and returns a status string for the LLM.
    """
    website_names = webname.lower().split()
    
    # Track actions to report back to the LLM
    opened_from_cache = []
    newly_found_and_opened = []
    failed_to_find = []
    
    # Process unique entries
    unique_names = set(website_names)

    for name in unique_names:
        if name in websites:
            url = websites[name]
            webbrowser.open(url)
            opened_from_cache.append(f"{name} ({url})")
        else:
            url = google_search_website(name)
            if url:
                add_website_to_json(name, url)
                webbrowser.open(url)
                newly_found_and_opened.append(f"{name} ({url})")
            else:
                failed_to_find.append(name)
                
    # Build a descriptive status string for the LLM context
    status_parts = []
    if opened_from_cache:
        status_parts.append(f"Opened from history: {', '.join(opened_from_cache)}.")
    if newly_found_and_opened:
        status_parts.append(f"Found on Google and opened: {', '.join(newly_found_and_opened)}.")
    if failed_to_find:
        status_parts.append(f"Failed to find or open: {', '.join(failed_to_find)}.")
        
    if not status_parts:
        return "No websites were requested or opened."
        
    return " ".join(status_parts)

if __name__ == "__main__":
    # Test execution out of the agent loop
    result = open_website("hugging face")
    print(f"Returned to LLM: {result}")
