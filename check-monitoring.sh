#!/bin/bash

echo "Checking Docker container status..."
docker ps -a | grep -E 'grafana|prometheus'

echo -e "\nChecking Grafana container logs..."
docker logs grafana

echo -e "\nChecking if port 3001 is in use..."
ss -tuln | grep 3001

echo -e "\nChecking network connections..."
docker network inspect monitoring-network

echo -e "\nRestarting monitoring stack..."
# Fix: Use docker compose instead of docker-compose
docker compose -f docker-compose.monitoring.yml down
docker compose -f docker-compose.monitoring.yml up -d

echo -e "\nNew container status:"
docker ps -a | grep -E 'grafana|prometheus'

echo -e "\nChecking metrics endpoint directly..."
curl -s http://localhost:3000/api/metrics

echo -e "\nChecking if Prometheus can reach the metrics endpoint..."
docker exec prometheus wget -qO- host.docker.internal:3000/api/metrics | head -n 20

echo -e "\nGrafana should now be available at http://localhost:3001"
echo "Login with username: admin, password: mindease"
