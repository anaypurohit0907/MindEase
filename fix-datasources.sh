#!/bin/bash

echo "Finding and fixing conflicting datasource files..."

# List all datasource configuration files
echo "Datasource files found:"
find /home/anay/Desktop/MindEase/grafana/provisioning/datasources -type f -name "*.yml" | xargs ls -la

# Remove any datasource files that might conflict (except the main prometheus.yml)
echo "Removing potentially conflicting datasource files..."
find /home/anay/Desktop/MindEase/grafana/provisioning/datasources -type f -name "*.yml" ! -name "prometheus.yml" -exec rm {} \;

# Ensure the main prometheus.yml has the correct content
echo "Creating a correct datasource file..."
cat > /home/anay/Desktop/MindEase/grafana/provisioning/datasources/prometheus.yml << 'EOL'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOL

echo "Restarting monitoring stack..."
cd /home/anay/Desktop/MindEase
docker compose -f docker-compose.monitoring.yml down
docker volume rm mindease_grafana_data 2>/dev/null || true
docker compose -f docker-compose.monitoring.yml up -d

echo "Grafana should now be available at http://localhost:3001"
echo "Login with username: admin, password: mindease"
