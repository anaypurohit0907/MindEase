#!/bin/bash

echo "Creating a test metrics endpoint to verify Prometheus scraping..."

# Create a simple metrics file
cat > /home/anay/Desktop/MindEase/test-metrics.txt << 'EOL'
# HELP test_metric A test metric
# TYPE test_metric gauge
test_metric 42
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{model="gemini-api",status="success"} 1
api_requests_total{model="gemini-api",status="error"} 0
# HELP api_request_duration_seconds Duration of API requests in seconds
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{model="gemini-api",le="0.1"} 0
api_request_duration_seconds_bucket{model="gemini-api",le="0.5"} 0
api_request_duration_seconds_bucket{model="gemini-api",le="1"} 0
api_request_duration_seconds_bucket{model="gemini-api",le="2"} 1
api_request_duration_seconds_bucket{model="gemini-api",le="5"} 2
api_request_duration_seconds_bucket{model="gemini-api",le="10"} 2
api_request_duration_seconds_bucket{model="gemini-api",le="30"} 2
api_request_duration_seconds_bucket{model="gemini-api",le="+Inf"} 2
api_request_duration_seconds_sum{model="gemini-api"} 5.011
api_request_duration_seconds_count{model="gemini-api"} 2
EOL

# Run a simple HTTP server to serve these metrics
echo "Starting a simple HTTP server on port 8000 to serve test metrics..."
echo "In a new terminal, run: docker compose -f docker-compose.monitoring.yml down"
echo "Then update prometheus.yml to point to the test metrics endpoint"

cat > /home/anay/Desktop/MindEase/prometheus.yml << 'EOL'
global:
  scrape_interval: 5s
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'mindease'
    static_configs:
      - targets: ['host.docker.internal:8000']
    metrics_path: '/'
    scrape_interval: 5s
    scrape_timeout: 5s
EOL

echo "Now restart the monitoring stack in another terminal with:"
echo "docker compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "Then check Grafana to see if data appears."
echo ""
echo "Press Ctrl+C to stop the test server when you're done."

# Start the simple HTTP server
cd /home/anay/Desktop/MindEase
python3 -m http.server 8000 --bind 0.0.0.0
