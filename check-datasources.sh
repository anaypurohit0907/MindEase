#!/bin/bash

echo "Finding all datasource configuration files..."
find /home/anay/Desktop/MindEase/grafana/provisioning -name "*.yml" -o -name "*.yaml"

echo -e "\nChecking contents of datasource files for 'isDefault: true'..."
grep -r "isDefault" /home/anay/Desktop/MindEase/grafana/provisioning

echo -e "\nCleaning up any existing grafana volumes and recreating the directory structure..."
# Fix: Use docker compose instead of docker-compose
docker compose -f docker-compose.monitoring.yml down
docker volume rm mindease_grafana_data || echo "Volume not found or already removed"
mkdir -p /home/anay/Desktop/MindEase/grafana/provisioning/datasources
mkdir -p /home/anay/Desktop/MindEase/grafana/provisioning/dashboards

echo -e "\nRestarting monitoring stack..."
docker compose -f docker-compose.monitoring.yml up -d

echo -e "\nGrafana logs after restart:"
sleep 5
docker logs grafana
