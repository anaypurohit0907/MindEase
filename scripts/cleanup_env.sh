#!/bin/bash

# This script unsets environment variables to prevent leaking sensitive information

# List of sensitive variables to unset
SENSITIVE_VARS=(
  "VERCEL_TOKEN"
  "GEMINI_API_KEY"
  "JENKINS_ADMIN_PASSWORD"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
)

# Unset each variable
for var in "${SENSITIVE_VARS[@]}"; do
  unset "$var"
  echo "Unset $var"
done

echo "Environment cleanup complete"
