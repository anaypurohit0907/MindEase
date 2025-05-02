#!/bin/bash

# This script extracts the GEMINI_API_KEY from .env and exports it for Terraform

set -e

ENV_FILE="../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Extract the GEMINI_API_KEY
GEMINI_API_KEY=$(grep "GEMINI_API_KEY" "$ENV_FILE" | cut -d '=' -f2)

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY not found in .env file"
  exit 1
fi

# Export the variable for Terraform to use
export TF_VAR_gemini_api_key="$GEMINI_API_KEY"

echo "GEMINI_API_KEY has been exported as TF_VAR_gemini_api_key"
echo "You can now run Terraform commands"
