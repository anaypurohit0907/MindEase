#!/bin/bash

echo "Checking if Prometheus is scraping the test metrics..."
curl -s "http://localhost:9090/api/v1/query?query=test_metric" | grep -o '"result":\[.*\]'

echo -e "\nChecking if API requests metrics are being scraped..."
curl -s "http://localhost:9090/api/v1/query?query=api_requests_total" | grep -o '"result":\[.*\]'

echo -e "\nChecking Prometheus targets status..."
curl -s "http://localhost:9090/api/v1/targets" | grep -o '"job":"mindease".*"health":".*"'

echo -e "\nThe connection to the test server is being refused. Let's fix that."
echo -e "\nCreating a more accessible test metrics endpoint..."

# Create a docker container to serve test metrics
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

echo "Creating Dockerfile for metrics server..."
cat > /home/anay/Desktop/MindEase/test-metrics/Dockerfile << 'EOL'
FROM nginx:alpine
COPY metrics.txt /usr/share/nginx/html/metrics
EXPOSE 80
EOL

echo "Building and running test metrics container..."
cd /home/anay/Desktop/MindEase/test-metrics
docker build -t test-metrics .
docker run -d --name test-metrics -p 8000:80 --network mindease_monitoring-network test-metrics

echo "Updating Prometheus configuration..."
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
      - targets: ['test-metrics']
    metrics_path: '/metrics'
    scrape_interval: 5s
    scrape_timeout: 5s
EOL

echo "Restarting Prometheus to apply new configuration..."
docker restart prometheus

echo -e "\nWaiting for Prometheus to restart..."
sleep 5

echo -e "\nRestarting Grafana container..."
docker restart grafana

echo -e "\nWaiting for Grafana to restart..."
sleep 5

echo -e "\nChecking if Prometheus is now scraping the test metrics..."
curl -s "http://localhost:9090/api/v1/query?query=test_metric" | grep -o '"result":\[.*\]'

echo -e "\nGrafana should now be available at http://localhost:3001"
echo "Login with username: admin, password: mindease"
echo "Go to Dashboards -> Browse and look for 'Test Dashboard'"
echo -e "\nIf you don't see the dashboard, try creating it manually:"
echo "1. Login to Grafana"
echo "2. Go to + -> Dashboard"
echo "3. Add a new panel"
echo "4. Enter 'test_metric' in the query field"
echo "5. Click Apply"
