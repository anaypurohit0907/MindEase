#!/bin/bash

# This script loads environment variables from .env file

ENV_FILE="/home/anay/Desktop/MindEase/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo "Environment variables loaded from $ENV_FILE"
else
  echo "Error: $ENV_FILE not found"
  exit 1
fi

# Execute the command passed as arguments with the loaded environment
exec "$@"
