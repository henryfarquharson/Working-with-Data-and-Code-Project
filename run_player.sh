# This makes the script safer and more predictable by exiting immediately if the command fails
set -euo pipefail
# This ensures the script uses the correct Python version and dependencies
source /home/henry/player/.venv/bin/activate
# This retrieves the environment variables defined in the .env file so the script can access secrets like the API 
set -a
. /home/henry/player/.env
set +a

# This run's the main player program
exec python /home/henry/player/player.py
