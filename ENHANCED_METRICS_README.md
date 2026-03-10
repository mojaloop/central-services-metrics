# Enhanced Mojaloop Central Services Metrics

A comprehensive metrics library for JavaScript/TypeScript services with built-in support for Redis, Kafka, MySQL, WebSockets, MongoDB, Circuit Breakers, Health Checks, and more. Based on industry best practices from Netflix, Apache Kafka, Microsoft, and other leading organizations.

## Features

### 🚀 **New Infrastructure-Specific Utilities**
- **Redis Metrics**: Connection pools, operations, performance, pub/sub
- **Kafka Metrics**: Producer/consumer metrics, topics, partitions, streams
- **Database Metrics**: Connection pools, queries, transactions, replication
- **WebSocket Metrics**: Connections, messages, rooms, performance
- **MongoDB Metrics**: Operations, collections, replication, sharding

### 🛡️ **Resilience Patterns**
- **Circuit Breakers**: Following Netflix Hystrix patterns
- **Health Checks**: Service availability and dependency tracking
- **Rate Limiting**: Token bucket and sliding window metrics

### 🔗 **Middleware Integration**
- **Express/Koa**: HTTP request metrics with automatic instrumentation
- **Function Decorators**: Automatic timing and error tracking
- **Background Jobs**: Queue processing metrics

### 📊 **Enhanced Core Features**
- **Standardized Buckets**: Predefined buckets for API, database, and network latency
- **Utility Methods**: Timer creation, duration measurement, metric validation
- **Better Error Handling**: Detailed error messages and recovery

## Installation

```bash
npm install @mojaloop/central-services-metrics
```

## Quick Start

```typescript
import metricsInstance, {
  redisMetrics,
  kafkaMetrics,
  databaseMetrics,
  middlewareMetrics
} from '@mojaloop/central-services-metrics'

// Initialize metrics
metricsInstance.setup({
  timeout: 5000,
  prefix: 'myapp_',
  defaultMetrics: true,
  defaultLabels: new Map([
    ['service', 'payment-service'],
    ['version', '1.0.0']
  ])
})
```

## Infrastructure Metrics

### Redis Metrics

```typescript
import { Redis } from 'ioredis'

const redis = new Redis()
const instrumentedRedis = redisMetrics.instrumentRedisClient(redis, 'main')

// Automatic instrumentation tracks:
// - redis_commands_total
// - redis_command_duration_seconds
// - redis_pool_active_connections
// - redis_memory_usage_bytes
// - redis_keyspace_hits_total / redis_keyspace_misses_total

// Manual tracking
const ops = redisMetrics.trackOperations()
ops.commandsTotal.inc({ command: 'get', status: 'success' })
```

### Kafka Metrics

```typescript
import { Kafka } from 'kafkajs'

const kafka = new Kafka({ clientId: 'my-app', brokers: ['localhost:9092'] })
const producer = kafka.producer()

// Instrument producer/consumer
const instrumentedProducer = kafkaMetrics.instrumentProducer(producer)

// Tracks comprehensive Kafka metrics:
// - kafka_producer_records_sent_total
// - kafka_consumer_records_lag_max
// - kafka_producer_batch_size_avg
// - kafka_connection_count

await instrumentedProducer.send({
  topic: 'events',
  messages: [{ key: 'user-123', value: 'login' }]
})
```

### Database Metrics

```typescript
import mysql from 'mysql2/promise'

const pool = mysql.createPool({ /* config */ })

// Track database operations
const dbMetrics = databaseMetrics.trackQueries()
const timer = dbMetrics.queryDuration.startTimer({ operation: 'select', table: 'users' })

try {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [123])
  dbMetrics.queriesTotal.inc({ operation: 'select', status: 'success', table: 'users' })
} finally {
  timer()
}

// Metrics include:
// - db_queries_total
// - db_query_duration_seconds
// - db_pool_connections_used
// - db_transaction_rollbacks_total
```

### WebSocket Metrics

```typescript
import WebSocket from 'ws'

const wss = new WebSocket.Server({ port: 8080 })
const instrumentedWss = webSocketMetrics.instrumentWebSocketServer(wss)

// Automatic tracking of:
// - websocket_active_connections
// - websocket_messages_sent_total
// - websocket_message_size_bytes
// - websocket_connection_duration_seconds
```

### MongoDB Metrics

```typescript
import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://localhost:27017')
const instrumentedMongo = mongoDBMetrics.instrumentMongoClient(client)

const db = client.db('myapp')
const users = db.collection('users')

// Operations automatically tracked:
// - mongodb_operations_total
// - mongodb_operation_duration_seconds
// - mongodb_documents_returned
// - mongodb_pool_checked_out_connections
```

## Resilience Patterns

### Circuit Breakers

```typescript
import { circuitBreakerMetrics, CircuitBreakerState } from '@mojaloop/central-services-metrics'

async function externalAPICall(id: string) {
  const response = await fetch(`https://api.example.com/users/${id}`)
  return response.json()
}

// Add circuit breaker instrumentation
const protectedAPICall = circuitBreakerMetrics.instrumentCircuitBreaker(
  'external-api',
  externalAPICall,
  {
    timeout: 5000,
    fallback: (id: string) => ({ id, name: 'Unknown' })
  }
)

// Tracks:
// - circuit_breaker_state
// - circuit_breaker_calls_total
// - circuit_breaker_success_rate
// - circuit_breaker_requests_rejected_total
```

### Health Checks

```typescript
import { healthCheckMetrics } from '@mojaloop/central-services-metrics'

async function checkDatabase() {
  // Your health check logic
  await pool.execute('SELECT 1')
  return { status: 'healthy' }
}

const instrumentedHealthCheck = healthCheckMetrics.instrumentHealthCheck(
  'payment-service',
  'database',
  checkDatabase
)

// Tracks:
// - health_check_duration_seconds
// - health_check_success_total
// - service_up
// - health_check_consecutive_failures
```

## HTTP Middleware

### Express Integration

```typescript
import express from 'express'
import { middlewareMetrics } from '@mojaloop/central-services-metrics'

const app = express()

// Add comprehensive HTTP metrics
app.use(middlewareMetrics.expressMiddleware({
  slowRequestThreshold: 1000,
  pathNormalizer: (path) => path.replace(/\\/\\d+/g, '/:id')
}))

// Automatic tracking:
// - http_requests_total
// - http_request_duration_seconds  
// - http_requests_active
// - http_slow_requests_total
```

### Hapi Integration

```typescript
import Hapi from '@hapi/hapi'
import { middlewareMetrics } from '@mojaloop/central-services-metrics'

const server = Hapi.server({ port: 3000 })

// Register comprehensive metrics plugin
await server.register(middlewareMetrics.hapiPlugin({
  slowRequestThreshold: 1000,
  pathNormalizer: (path) => path.replace(/\/d+/g, '/:id'),
  excludePaths: ['/health', '/metrics', '/live']
}))

// Automatic tracking includes:
// - All standard HTTP metrics
// - hapi_connections_current
// - hapi_routes_registered  
// - hapi_plugins_loaded
// - hapi_cache_operations_total
// - hapi_auth_attempts_total
// - hapi_validation_errors_total

server.route({
  method: 'GET',
  path: '/api/users/{id}',
  handler: (request, h) => {
    // Metrics automatically tracked
    return { id: request.params.id, name: 'John Doe' }
  }
})
```

### Function Instrumentation

```typescript
const instrumentedFunction = middlewareMetrics.instrumentFunction(
  'processPayment',
  async (amount: number, currency: string) => {
    // Your function logic
    return { status: 'success', id: '12345' }
  },
  { labels: { service: 'payment' } }
)

// Tracks:
// - function_calls_total
// - function_duration_seconds
// - function_slow_calls_total
```

## Advanced Features

### Custom Histogram Buckets

```typescript
// Predefined buckets for different use cases
const apiLatency = metricsInstance.getLatencyHistogram('api_calls', 'API call duration', ['endpoint'], 'api')
const dbLatency = metricsInstance.getLatencyHistogram('db_queries', 'DB query duration', ['table'], 'database') 
const networkLatency = metricsInstance.getLatencyHistogram('network_calls', 'Network call duration', ['service'], 'network')

// Size histograms
const payloadSize = metricsInstance.getSizeHistogram('payload_size', 'Payload size', ['endpoint'], 'payload')
const memoryUsage = metricsInstance.getSizeHistogram('memory_usage', 'Memory usage', ['component'], 'memory')
```

### Duration Measurement

```typescript
// Measure function execution time
const operationDuration = await metricsInstance.measureDuration(
  histogram,
  async () => {
    // Your operation
    return await expensiveOperation()
  },
  { operation: 'data_processing' }
)
```

### Background Jobs

```typescript
const jobMetrics = middlewareMetrics.trackBackgroundJob() 

// Track job processing
jobMetrics.jobsStarted.inc({ job_type: 'email', queue: 'notifications' })
const timer = jobMetrics.jobDuration.startTimer({ job_type: 'email', queue: 'notifications' })

try {
  await processEmailJob(job)
  jobMetrics.jobsCompleted.inc({ job_type: 'email', queue: 'notifications', status: 'success' })
} finally {
  timer()
}
```

## Prometheus Integration

### Metrics Endpoint

```typescript
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  res.end(await metricsInstance.getMetricsForPrometheus())
})
```

### Standard Metric Names

The library follows Prometheus naming conventions and includes metrics commonly used by:

- **Netflix**: Circuit breaker patterns, service health metrics
- **Apache Kafka**: Comprehensive producer/consumer metrics  
- **Google/Microsoft**: HTTP request patterns, error tracking
- **Industry Standards**: Connection pools, query performance, message throughput

## Configuration

### Setup Options

```typescript
metricsInstance.setup({
  timeout: 5000,                    // Collection timeout
  prefix: 'myapp_',                 // Metric name prefix
  defaultMetrics: true,             // Collect Node.js default metrics
  maxConnections: 100,              // Max HTTP connections
  maxRequestsPending: 50,           // Max pending requests
  defaultLabels: new Map([          // Default labels for all metrics
    ['service', 'payment-service'],
    ['version', '1.0.0'],
    ['environment', 'production']
  ])
})
```

## Best Practices

### 1. **Metric Naming**
- Use snake_case for metric names
- Include units in names (`_seconds`, `_bytes`, `_total`)
- Be specific and descriptive

### 2. **Labels**
- Keep cardinality low (< 10,000 unique combinations)
- Use consistent label names across metrics
- Avoid high-cardinality labels like user IDs

### 3. **Histograms vs Summaries**
- Use histograms for most latency metrics
- Use summaries when you need specific percentiles
- Choose appropriate buckets for your use case

### 4. **Performance**
- Cache metric instances when possible
- Use the built-in instrumentation for automatic tracking
- Monitor metrics collection overhead

## Migration from Previous Version

The new version maintains backward compatibility:

```typescript
// Old usage still works
import metrics from '@mojaloop/central-services-metrics'

metrics.setup({ /* config */ })
const counter = metrics.getCounter('my_counter')

// New features available alongside
import { redisMetrics } from '@mojaloop/central-services-metrics'
const redisOps = redisMetrics.trackOperations()
```

## Examples

See [examples.ts](./src/examples.ts) for comprehensive usage examples covering all features.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on contributing to this project.

## License

Apache License 2.0 - see [LICENSE.md](./LICENSE.md) for details.