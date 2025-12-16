#!/usr/bin/env zsh
set -euo pipefail

# deploy-poll.sh
# Usage:
#   ./scripts/deploy-poll.sh [--host http://localhost:8000] [--wallet 0x...] [--start-in 3600] [--duration 3600]
# Defaults:
#   host=http://localhost:8000
#   wallet = $WALLET_ADDRESS from .env if present
#   start-in = 3600 (1 hour from now)
#   duration = 3600 (1 hour)

# Parse args
HOST="http://localhost:8000"
WALLET_ADDR=""
START_IN=3600
DURATION=3600

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="$2"; shift 2;;
    --wallet)
      WALLET_ADDR="$2"; shift 2;;
    --start-in)
      START_IN="$2"; shift 2;;
    --duration)
      DURATION="$2"; shift 2;;
    -h|--help)
      echo "Usage: $0 [--host http://localhost:8000] [--wallet 0x...] [--start-in seconds] [--duration seconds]"; exit 0;;
    *)
      echo "Unknown arg: $1"; exit 1;;
  esac
done

# If wallet not provided, try to load from .env
if [[ -z "$WALLET_ADDR" ]]; then
  if [[ -f ".env" ]]; then
    WALLET_ADDR=$(grep -E '^WALLET_ADDRESS=' .env | cut -d'=' -f2- | tr -d '"') || true
  fi
fi

if [[ -z "$WALLET_ADDR" ]]; then
  echo "Error: wallet address not provided and not found in .env (WALLET_ADDRESS). Use --wallet." >&2
  exit 2
fi

# Compute start/end
NOW=$(date +%s)
START=$((NOW + START_IN))
END=$((START + DURATION))

echo "Using host: $HOST"
echo "Wallet: $WALLET_ADDR"
echo "Start (epoch): $START -> $(date -r $START)"
echo "End   (epoch): $END -> $(date -r $END)"

# Generate auth header
AUTH=$(node src/utils/generate-auth.js 2>/dev/null | grep -m1 '^Bearer ' || true)
if [[ -z "$AUTH" ]]; then
  echo "Failed to generate Authorization header via src/utils/generate-auth.js" >&2
  exit 3
fi

# Generate encrypted session key
SESSION=$(node src/utils/encrypt-helper.js "$WALLET_ADDR" 2>/dev/null | grep -E -m1 '^[A-Za-z0-9+/=]+$' || true)
if [[ -z "$SESSION" ]]; then
  echo "Failed to generate encrypted session key via src/utils/encrypt-helper.js" >&2
  exit 4
fi

# POST to API
BODY=$(cat <<JSON
{
  "startDate": $START,
  "endDate": $END,
  "voteOptions": 4
}
JSON
)

# If host is coordinator directly (contains /v1) ensure we call correct path — default script calls the API endpoint
TARGET="$HOST/maci/deploy-poll"

echo "Calling $TARGET"

curl -i -s -X POST "$TARGET" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH" \
  -d "$BODY" | sed -e 's/^/    /'

exit 0
