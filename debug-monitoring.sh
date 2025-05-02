#!/bin/bash

echo "Checking if your metrics are available..."
curl -s http://localhost:3000/api/metrics | head -n 20

echo -e "\nRestarting monitoring stack with debug options..."
docker-compose -f docker-compose.monitoring.yml down
docker volume rm mindease_grafana_data || echo "Volume not found or already removed"

# Update datasource to set as default
mkdir -p /home/anay/Desktop/MindEase/grafana/provisioning/datasources/
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

# Start the services again
docker-compose -f docker-compose.monitoring.yml up -d

echo -e "\nWaiting for services to start..."
sleep 10

echo -e "\nTesting Prometheus endpoint directly (this should return metrics):"
curl -s http://localhost:9090/api/v1/query?query=up | grep -o '"result":\[.*\]'

echo -e "\nChecking if Prometheus is scraping your application metrics:"
curl -s http://localhost:9090/api/v1/query?query=api_requests_total | grep -o '"result":\[.*\]'

echo -e "\nChecking Prometheus targets status (look for 'mindease' job):"
curl -s http://localhost:9090/api/v1/targets | grep -o '"job":"mindease".*"health":".*"'

echo -e "\nIf you see empty results above, Prometheus isn't scraping your metrics properly."
echo "Grafana should be available at http://localhost:3001"
echo "Login with username: admin, password: mindease"
