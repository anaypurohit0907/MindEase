import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

// Create a registry to register metrics
const register = new Registry();

// Add default metrics (Node.js metrics like memory usage, etc.)
collectDefaultMetrics({ register });

// Add this line to ensure metrics are properly initialized
console.log("Initializing metrics in metrics.ts");

// Create a counter for API requests
export const apiRequestsCounter = new Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['model', 'status'],
  registers: [register],
});

// Create a histogram for API request duration
export const apiRequestDuration = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Create a counter for total tokens processed
export const tokensProcessedCounter = new Counter({
  name: 'tokens_processed_total',
  help: 'Total number of tokens processed',
  labelNames: ['model', 'type'], // type can be 'input' or 'output'
  registers: [register],
});

// Initialize with zero values to ensure metrics appear even before first request
apiRequestsCounter.inc({ model: 'gemini-api', status: 'success' }, 0);
apiRequestsCounter.inc({ model: 'gemini-api', status: 'error' }, 0);
tokensProcessedCounter.inc({ model: 'gemini-api', type: 'input' }, 0);
tokensProcessedCounter.inc({ model: 'gemini-api', type: 'output' }, 0);

console.log('Prometheus metrics initialized with zero values');

// Export the registry for the /metrics endpoint
export { register };
