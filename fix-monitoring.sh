#!/bin/bash

# Clean up everything for a fresh start
echo "Cleaning up all containers and volumes..."
docker stop test-metrics prometheus grafana 2>/dev/null || true
docker rm test-metrics prometheus grafana 2>/dev/null || true
docker volume rm mindease_prometheus_data mindease_grafana_data 2>/dev/null || true

# Create test metrics file
echo "Creating test metrics file..."
mkdir -p /home/anay/Desktop/MindEase/test-metrics
cat > /home/anay/Desktop/MindEase/test-metrics/metrics.txt << 'EOL'
# HELP test_metric A test metric
# TYPE test_metric gauge
test_metric 42
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{model="gemini-api",status="success"} 1
api_requests_total{model="gemini-api",status="error"} 0
EOL

# Create NGINX configuration for metrics
echo "Creating NGINX configuration for metrics..."
mkdir -p /home/anay/Desktop/MindEase/test-metrics/conf
cat > /home/anay/Desktop/MindEase/test-metrics/conf/default.conf << 'EOL'
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    location /metrics {
        default_type text/plain;
        alias /usr/share/nginx/html/metrics;
    }
}
EOL

# Create a simple Docker Compose file
echo "Creating Docker Compose file..."
cat > /home/anay/Desktop/MindEase/docker-compose.monitoring.yml << 'EOL'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped
    networks:
      - monitoring-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=mindease
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - monitoring-network

  test-metrics:
    image: nginx:alpine
    container_name: test-metrics
    volumes:
      - ./test-metrics/metrics.txt:/usr/share/nginx/html/metrics
      - ./test-metrics/conf/default.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "8000:80"
    networks:
      - monitoring-network

networks:
  monitoring-network:
    driver: bridge
EOL

# Create a simple Prometheus configuration
echo "Creating Prometheus configuration..."
cat > /home/anay/Desktop/MindEase/prometheus.yml << 'EOL'
global:
  scrape_interval: 5s
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'test-metrics'
    static_configs:
      - targets: ['test-metrics']
    metrics_path: '/metrics'
EOL

# Set up Grafana
echo "Setting up Grafana configuration..."
mkdir -p /home/anay/Desktop/MindEase/grafana/provisioning/datasources
mkdir -p /home/anay/Desktop/MindEase/grafana/provisioning/dashboards

# Create datasource
cat > /home/anay/Desktop/MindEase/grafana/provisioning/datasources/prometheus.yml << 'EOL'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOL

# Create dashboard provider
cat > /home/anay/Desktop/MindEase/grafana/provisioning/dashboards/default.yml << 'EOL'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOL

# Create a simple dashboard
cat > /home/anay/Desktop/MindEase/grafana/provisioning/dashboards/test_dashboard.json << 'EOL'
{
  "annotations": {
    "list": []
  },
  "editable": true,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "panels": [
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 10,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 1,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "datasource": "Prometheus",
          "expr": "test_metric",
          "refId": "A"
        }
      ],
      "title": "Test Metric",
      "type": "timeseries"
    }
  ],
  "refresh": "5s",
  "schemaVersion": 37,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-5m",
    "to": "now"
  },
  "title": "Test Dashboard",
  "uid": "test-dashboard",
  "version": 0
}
EOL

# Start the monitoring stack
echo "Starting monitoring stack..."
cd /home/anay/Desktop/MindEase
docker compose -f docker-compose.monitoring.yml down
docker compose -f docker-compose.monitoring.yml up -d

echo "Waiting for services to start..."
sleep 10

# Verify the NGINX configuration and content type
echo "Checking NGINX configuration and response headers..."
docker exec test-metrics nginx -t
echo -e "\nChecking Content-Type header from metrics endpoint..."
curl -I http://localhost:8000/metrics

# Verify the test-metrics endpoint is accessible
echo "Verifying test-metrics endpoint..."
curl -s http://localhost:8000/metrics | head

# Verify Prometheus can scrape the metrics
echo -e "\nVerifying Prometheus targets..."
curl -s http://localhost:9090/api/v1/targets | grep test-metrics

# Check if the metrics are being collected
echo -e "\nChecking if test_metric is available in Prometheus..."
curl -s "http://localhost:9090/api/v1/query?query=test_metric" | grep -o '"result":\[.*\]'

echo -e "\nGrafana should now be available at http://localhost:3001"
echo "Login with username: admin, password: mindease"
echo "You should see a 'Test Dashboard' with test metric data"
