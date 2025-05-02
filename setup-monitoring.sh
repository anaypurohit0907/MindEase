#!/bin/bash

# Create necessary directories
mkdir -p /home/anay/Desktop/MindEase/grafana/provisioning/datasources
mkdir -p /home/anay/Desktop/MindEase/grafana/provisioning/dashboards

# Create the correct datasource configuration
cat > /home/anay/Desktop/MindEase/grafana/provisioning/datasources/prometheus.yml << 'EOL'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOL

# Create dashboard provider configuration
cat > /home/anay/Desktop/MindEase/grafana/provisioning/dashboards/dashboard.yml << 'EOL'
apiVersion: 1

providers:
  - name: 'MindEase Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOL

# Restart the monitoring stack
docker-compose -f docker compose.monitoring.yml down
docker volume rm mindease_grafana_data || echo "Volume not found or already removed"
docker-compose -f docker compose.monitoring.yml up -d

echo "Monitoring setup complete. Grafana should be available at http://localhost:3001"
echo "Login with username: admin, password: mindease"
