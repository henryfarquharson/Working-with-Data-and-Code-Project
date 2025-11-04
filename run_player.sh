
set -euo pipefail

source /home/henry/player/.venv/bin/activate

set -a
. /home/henry/player/.env
set +a


exec python /home/henry/player/player.py
