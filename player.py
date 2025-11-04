# Here I am importing the essential libaries including pathlib to manage file paths and requests to manage the http requests made to the backend

import os, time, signal, shutil, requests
from pathlib import Path

# These are the settings from environment so if the API or display ID changes I won't need to change them here in the player.py file
API_BASE   = os.getenv("API_BASE", "https://pbaqcwrozmuxgzacajao.supabase.co/functions/v1")
DISPLAY_ID = os.getenv("DISPLAY_ID", "")
ASSETS     = Path(os.getenv("ASSET_DIR", "/home/henry/player/assets"))
CURRENT    = ASSETS / "current.jpg"
FALLBACK   = ASSETS / "fallback.jpg"

# this checks if there is a directory to save assets and if that is false then a directory will be made
ASSETS.mkdir(parents=True, exist_ok=True)

# The Graceful stop: Helping the script to shut down if instructed by the operating system or the user. 
_running = True
def _stop(*_):
    global _running
    _running = False
signal.signal(signal.SIGTERM, _stop)
signal.signal(signal.SIGINT, _stop)

# This prevents the display from showing a partially downloaded image
def atomic_write_bytes(dest: Path, content: bytes):
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    with open(tmp, "wb") as f:
        f.write(content)
    tmp.replace(dest)  # atomic swap -> viewer never sees a half file

#fetches and shows the fallback image. If there is an issue e.g. loss of connection to the backend, the system will show the default image to ensure a display is shown on the screen always.
def show_fallback():
    if FALLBACK.exists():
        shutil.copyfile(FALLBACK, CURRENT)
        print("Showing fallback.")
    else:
        print("Fallback not found:", FALLBACK)

def download_to_current(url: str):
    # it will download the image and cache it
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    atomic_write_bytes(CURRENT, r.content)
    print("Displayed:", url)

# here the script is trying to get the image url 
def extract_image_url(data: dict):
    # Try a few likely places based on your API
    # data.get("creative", {}).get("url") etc.
    creative = data.get("creative") or data.get("slot", {}).get("creative") or {}
    return creative.get("url") or creative.get("imageUrl")

# 1st Cycle
def run_once():
    # it tries to make a GET request to the playlist API
    try:
        r = requests.get(f"{API_BASE}/playlist", params={"displayId": DISPLAY_ID}, timeout=15)
    except requests.RequestException as e:
        print("Network error:", e)
        show_fallback()
        # here it waits before polling again
        time.sleep(5)
        return

    if r.status_code == 204:
        # No content scheduled right now -> show fallback
        show_fallback()
        time.sleep(25)
        return

    if r.ok:
        try:
            data = r.json()
        except Exception as e:
            print("Bad JSON:", e)
            show_fallback()
            time.sleep(10)
            return

        image_url = extract_image_url(data)
        if image_url:
            try:
                download_to_current(image_url)
            except Exception as e:
                print("Download error:", e)
                show_fallback()
        else:
            print("No image URL in response.")
            show_fallback()
    else:
        print("API error:", r.status_code, r.text[:200])
        show_fallback()

    time.sleep(5)

# when the program shuts down it prints clean exit to ensure an intentional shutdown
def main():
    backoff = 2
    while _running:
        try:
            run_once()
            backoff = 2
        except Exception as e:
            print("Loop error:", e)
            time.sleep(backoff)
            backoff = min(backoff * 2, 60)
    print("Clean exit.")

if __name__ == "__main__":
    main()

