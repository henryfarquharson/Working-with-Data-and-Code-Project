#!/usr/bin/env bash
set -euo pipefail

# Turn on your Python virtual environment (we'll create it in the next step)
source /home/henry/player/.venv/bin/activate

# Load values from .env and export them so Python can read them
set -a
. /home/henry/player/.env
set +a

# Start your program
exec python /home/henry/player/player.py
