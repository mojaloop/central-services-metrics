/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

/**
 * @fileoverview Usage examples for the enhanced Mojaloop metrics library
 * 
 * This file demonstrates how to use the various metric utilities for different
 * technologies in a JavaScript/TypeScript service stack including:
 * - Redis
 * - Kafka
 * - MySQL/Database
 * - WebSockets
 * - MongoDB
 * - Circuit breakers and health checks
 * - HTTP middleware
 */

// Import the metrics library and utilities
import * as metricsModule from './index'

const metricsInstance = metricsModule as any // Type assertion to avoid compilation issues
const {
  redisMetrics,
  kafkaMetrics,
  databaseMetrics,
  webSocketMetrics,
  mongoDBMetrics,
  circuitBreakerMetrics,
  healthCheckMetrics,
  middlewareMetrics,
  CircuitBreakerState
} = metricsModule as any

// =============================================================================
// BASIC SETUP
// =============================================================================

// Initialize metrics (this should be done once at application startup)
metricsInstance.setup({
  timeout: 5000,
  prefix: 'myapp_',
  defaultMetrics: true, // Collect default Node.js metrics
  defaultLabels: new Map([
    ['service', 'payment-service'],
    ['version', '1.0.0'],
    ['environment', 'production']
  ])
})

// =============================================================================
// REDIS METRICS EXAMPLES
// =============================================================================

// Example: Instrument Redis client
import Redis from 'ioredis'

const redis = new Redis()
const instrumentedRedis = redisMetrics.instrumentRedisClient(redis, 'main')

// Track Redis operations
const redisOps = redisMetrics.trackOperations()
const redisPool = redisMetrics.trackConnectionPool('main')
const redisPerf = redisMetrics.trackPerformance()

async function exampleRedisUsage() {
  // Manual tracking
  const timer = redisOps.commandDuration.startTimer({ command: 'get' })
  
  try {
    const value = await redis.get('user:123')
    redisOps.commandsTotal.inc({ command: 'get', status: 'success' })
    
    // Update performance metrics
    redisPerf.cacheHitRatio.set(0.95) // 95% hit ratio
    
    return value
  } catch (error) {
    redisOps.commandsTotal.inc({ command: 'get', status: 'error' })
    throw error
  } finally {
    timer()
  }
}

// =============================================================================
// KAFKA METRICS EXAMPLES
// =============================================================================

// Example: Instrument Kafka producer
import { Kafka } from 'kafkajs'

const kafka = new Kafka({ clientId: 'my-app', brokers: ['localhost:9092'] })
const producer = kafka.producer()

// Instrument the producer
const instrumentedProducer = kafkaMetrics.instrumentProducer(producer)

// Track Kafka metrics
const kafkaProducerMetrics = kafkaMetrics.trackProducer()
const kafkaConsumerMetrics = kafkaMetrics.trackConsumer()

async function exampleKafkaUsage() {
  // Send a message (metrics are automatically tracked by instrumentation)
  await instrumentedProducer.send({
    topic: 'user-events',
    messages: [{
      key: 'user-123',
      value: JSON.stringify({ action: 'login', timestamp: Date.now() })
    }]
  })
  
  // Manually update additional metrics
  kafkaProducerMetrics.batchSizeAvg.set({ topic: 'user-events' }, 5.2)
  kafkaProducerMetrics.compressionRatio.set({ topic: 'user-events' }, 0.7)
}

// =============================================================================
// DATABASE METRICS EXAMPLES
// =============================================================================

// Example: Instrument database client (works with any Promise-based DB client)
import mysql from 'mysql2/promise'

const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'myapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Track database metrics
const dbPoolMetrics = databaseMetrics.trackConnectionPool('main')
const dbQueryMetrics = databaseMetrics.trackQueries()
const dbTransactionMetrics = databaseMetrics.trackTransactions()

async function exampleDatabaseUsage() {
  // Update pool metrics
  dbPoolMetrics.poolSize.set({ pool: 'main' }, 10)
  dbPoolMetrics.poolUsed.set({ pool: 'main' }, 3)
  
  // Track a query
  const timer = dbQueryMetrics.queryDuration.startTimer({ operation: 'select', table: 'users' })
  
  try {
    const [rows] = await dbPool.execute('SELECT * FROM users WHERE id = ?', [123])
    
    dbQueryMetrics.queriesTotal.inc({ operation: 'select', status: 'success', table: 'users' })
    dbQueryMetrics.rowsAffected.inc({ operation: 'select', table: 'users' }, (rows as any[]).length)
    
    return rows
  } catch (error) {
    dbQueryMetrics.queryErrors.inc({ operation: 'select', error_type: 'mysql_error', table: 'users' })
    throw error
  } finally {
    timer()
  }
}

// =============================================================================
// KNEX.JS DATABASE METRICS EXAMPLES
// =============================================================================

// Example: Instrument Knex instance with comprehensive metrics
import knex from 'knex'

// Create Knex instance
const db = knex({
  client: 'mysql2', // or 'pg', 'sqlite3', etc.
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'myapp'
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000
  }
})

// Instrument Knex with comprehensive options
const instrumentedKnex = databaseMetrics.instrumentKnex(db, {
  trackQueryBuilder: true,
  trackConnectionPool: true,
  trackTransactions: true,
  trackMigrations: true,
  slowQueryThreshold: 1000 // 1 second
})

// Track Knex-specific metrics
const knexMetrics = databaseMetrics.trackKnexMetrics()

// Example: Using Knex with automatic metrics tracking
async function exampleKnexUsage() {
  // All of these Knex operations are automatically tracked:
  
  // 1. Query Builder Operations (tracked automatically)
  const users = await instrumentedKnex('users')
    .select('*')
    .where('active', true)
    .orderBy('created_at', 'desc')
    .limit(10)

  // 2. Transaction with metrics tracking
  await instrumentedKnex.transaction(async (trx) => {
    const userId = await trx('users').insert({
      name: 'John Doe',
      email: 'john@example.com'
    })

    await trx('user_profiles').insert({
      user_id: userId[0],
      bio: 'Software Developer'
    })

    return userId
  })

  // 3. Raw queries (tracked automatically)
  const stats = await instrumentedKnex.raw(`
    SELECT COUNT(*) as total_users, 
           AVG(age) as avg_age 
    FROM users 
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
  `)

  // 4. Schema operations (tracked automatically)
  await instrumentedKnex.schema.createTableIfNotExists('temp_processing', (table) => {
    table.increments('id')
    table.string('status')
    table.timestamp('created_at').defaultTo(instrumentedKnex.fn.now())
  })

  return { users, stats }
}

// Example: Migration operations with metrics
async function exampleKnexMigrations() {
  // Run latest migrations (tracked automatically)
  await instrumentedKnex.migrate.latest({
    directory: './migrations'
  })

  // Run seeds (tracked automatically)  
  await instrumentedKnex.seed.run({
    directory: './seeds'
  })

  // Check migration status
  const [batchNo, log] = await instrumentedKnex.migrate.currentVersion()
  console.log(`Current migration batch: ${batchNo}`)
}

// Example: Manual Knex metrics tracking for custom operations
async function exampleCustomKnexMetrics() {
  // Track custom query patterns
  const timer = knexMetrics.knexQueryDuration.startTimer({ method: 'batch_insert', table: 'logs' })
  
  try {
    // Batch insert operation
    const batchData = Array.from({ length: 1000 }, (_, i) => ({
      message: `Log entry ${i}`,
      level: 'info',
      timestamp: new Date()
    }))

    await instrumentedKnex.batchInsert('logs', batchData, 100) // Insert in batches of 100
    
    knexMetrics.knexQueries.inc({ method: 'batch_insert', table: 'logs', status: 'success' })
    knexMetrics.knexResultSetSize.observe({ method: 'batch_insert', table: 'logs' }, batchData.length)
    
  } catch (error) {
    knexMetrics.knexQueries.inc({ method: 'batch_insert', table: 'logs', status: 'error' })
    throw error
  } finally {
    timer()
  }

  // Track connection pool status manually
  if (instrumentedKnex.client && instrumentedKnex.client.pool) {
    const pool = instrumentedKnex.client.pool
    knexMetrics.knexConnectionPool.set({ status: 'used' }, pool.numUsed())
    knexMetrics.knexConnectionPool.set({ status: 'free' }, pool.numFree())
    knexMetrics.knexConnectionPool.set({ status: 'pending' }, pool.numPendingAcquires())
  }
}

// Example: Using wrapped query builder for additional tracking
const wrappedQuery = databaseMetrics.wrapKnexQuery(
  instrumentedKnex('products')
    .select('id', 'name', 'price')
    .where('category_id', 5),
  'products'
)

async function exampleWrappedKnexQuery() {
  // This will track all the query builder method calls
  const expensiveProducts = await wrappedQuery
    .where('price', '>', 100)
    .orderBy('price', 'desc')
    .limit(20)
    
  return expensiveProducts
}

// =============================================================================
// WEBSOCKET METRICS EXAMPLES (using 'ws' library)
// =============================================================================

// Example: Instrument WebSocket server with comprehensive 'ws' library support
import WebSocket from 'ws'

const wss = new WebSocket.Server({ 
  port: 8080,
  perMessageDeflate: true, // Enable per-message-deflate compression
  maxPayload: 16 * 1024 * 1024, // 16MB max message size
  handleProtocols: ['chat', 'protocol2']
})

// Instrument the WebSocket server with full 'ws' library features
const instrumentedWss = webSocketMetrics.instrumentWebSocketServer(wss, {
  trackPingPong: true,
  trackExtensions: true,
  trackPerformance: true
})

// Track comprehensive WebSocket metrics
const wsConnections = webSocketMetrics.trackConnections()
const wsMessages = webSocketMetrics.trackMessages()
const wsErrors = webSocketMetrics.trackErrors()
const wsPerformance = webSocketMetrics.trackPerformance()
const wsHeartbeat = webSocketMetrics.trackHeartbeat()
const wsCompression = webSocketMetrics.trackCompression()

// Example: Instrument WebSocket client with 'ws' library
const clientWs = new WebSocket('ws://localhost:8080', ['chat'], {
  perMessageDeflate: true,
  handshakeTimeout: 5000
})

const instrumentedClient = webSocketMetrics.instrumentWebSocketClient(clientWs, {
  trackPingPong: true,
  enablePingInterval: 30000 // Send ping every 30 seconds
})

// Example: Manual WebSocket metrics tracking for custom events
function exampleWebSocketUsage() {
  // Simulate comprehensive connection metrics
  wsConnections.activeConnections.set(42)
  wsConnections.maxConnections.set(100)
  wsConnections.connectionsPerSecond.set(1.5)
  wsConnections.totalBytesReceived.inc(2048)
  wsConnections.totalBytesSent.inc(1024)
  
  // Simulate message metrics with opcodes
  wsMessages.messagesSent.inc({ type: 'text', opcode: '0x1' }, 1)
  wsMessages.messagesReceived.inc({ type: 'binary', opcode: '0x2' }, 1)
  wsMessages.messageSizeBytes.observe({ direction: 'outbound' }, 1024)
  wsMessages.fragmentedMessages.inc({ direction: 'inbound' })
  wsMessages.compressedMessages.inc({ direction: 'outbound' })
  
  // Simulate error tracking with specific codes
  wsErrors.errorsTotal.inc({ type: 'ECONNRESET', code: 'ECONNRESET' })
  wsErrors.disconnectsTotal.inc({ code: '1006', reason: 'abnormal_closure' })
  wsErrors.protocolErrors.inc({ error_code: 'invalid_frame' })
  wsErrors.compressionErrors.inc()
  
  // Simulate heartbeat metrics
  wsHeartbeat.pingSent.inc()
  wsHeartbeat.pongReceived.inc()
  wsHeartbeat.pingLatency.observe(0.025) // 25ms latency
}

// Example: Custom 'ws' server with application-level metrics
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress)
  
  // Track connection by origin
  const origin = req.headers.origin || 'unknown'
  wsConnections.connectionsByOrigin.inc({ origin })
  
  ws.on('message', (message, isBinary) => {
    try {
      // Parse application-level messages
      const data = JSON.parse(message.toString())
      
      // Track different message types
      if (data.type === 'heartbeat') {
        wsHeartbeat.pingSent.inc()
      } else if (data.type === 'chat') {
        wsMessages.messagesSent.inc({ type: 'application_chat', opcode: '0x1' })
      } else if (data.type === 'file_upload' && isBinary) {
        wsMessages.messagesSent.inc({ type: 'application_file', opcode: '0x2' })
        wsMessages.messageSizeBytes.observe({ direction: 'inbound' }, message.length)
      }
    } catch (err) {
      wsErrors.protocolErrors.inc({ error_code: 'json_parse_error' })
    }
  })
  
  // Handle WebSocket-specific events
  ws.on('ping', (data) => {
    console.log('Received ping:', data.toString())
    // Pong is automatically sent by 'ws' library
  })
  
  ws.on('pong', (data) => {
    console.log('Received pong:', data.toString())
  })
  
  // Track extension usage if available
  if (ws.extensions && Object.keys(ws.extensions).length > 0) {
    console.log('WebSocket extensions:', Object.keys(ws.extensions))
  }
})

// =============================================================================
// MONGODB METRICS EXAMPLES
// =============================================================================

// Example: Instrument MongoDB client
import { MongoClient } from 'mongodb'

const mongoClient = new MongoClient('mongodb://localhost:27017')
const instrumentedMongo = mongoDBMetrics.instrumentMongoClient(mongoClient)

// Track MongoDB metrics
const mongoOps = mongoDBMetrics.trackOperations()
const mongoPool = mongoDBMetrics.trackConnectionPool()
const mongoPerf = mongoDBMetrics.trackPerformance()

async function exampleMongoUsage() {
  // Connect and use instrumented client
  await mongoClient.connect()
  const db = mongoClient.db('myapp')
  const users = db.collection('users')
  
  // Operations are automatically tracked by instrumentation
  const user = await users.findOne({ _id: 'user-123' })
  
  // Manually track additional metrics
  mongoPerf.memoryUsage.set({ type: 'resident' }, 256 * 1024 * 1024) // 256MB
  mongoPool.poolSize.set({ pool: 'default' }, 5)
  
  return user
}

// =============================================================================
// CIRCUIT BREAKER EXAMPLES
// =============================================================================

// Example: Circuit breaker for external API calls
async function callExternalAPI(userId: string) {
  return fetch(`https://api.example.com/users/${userId}`)
    .then(response => response.json())
}

// Create instrumented version with circuit breaker
const instrumentedAPICall = circuitBreakerMetrics.instrumentCircuitBreaker(
  'external-api',
  callExternalAPI,
  {
    timeout: 5000,
    fallback: async (userId: string) => ({ id: userId, name: 'Unknown' }) // Fallback data
  }
)

// Track circuit breaker metrics
const cbMetrics = circuitBreakerMetrics.trackCircuitBreaker('external-api')

function exampleCircuitBreakerUsage() {
  // Update circuit breaker state
  circuitBreakerMetrics.updateState('external-api', CircuitBreakerState.CLOSED)
  
  // Update success/failure rates
  cbMetrics.successRate.set({ circuit: 'external-api' }, 0.95)
  cbMetrics.failureRate.set({ circuit: 'external-api' }, 0.05)
}

// =============================================================================
// HEALTH CHECK EXAMPLES
// =============================================================================

// Example: Health check functions
async function checkDatabaseHealth() {
  try {
    await dbPool.execute('SELECT 1')
    return { status: 'healthy' }
  } catch (error) {
    throw new Error('Database connection failed')
  }
}

async function checkRedisHealth() {
  try {
    await redis.ping()
    return { status: 'healthy' }
  } catch (error) {
    throw new Error('Redis connection failed')
  }
}

// Instrument health checks
const instrumentedDbHealth = healthCheckMetrics.instrumentHealthCheck(
  'payment-service',
  'database',
  checkDatabaseHealth
)

const instrumentedRedisHealth = healthCheckMetrics.instrumentHealthCheck(
  'payment-service',
  'redis',
  checkRedisHealth
)

// Track health metrics
const healthMetrics = healthCheckMetrics.trackHealthCheck()

async function exampleHealthCheckUsage() {
  try {
    await instrumentedDbHealth()
    await instrumentedRedisHealth()
    
    // Update overall service health score
    healthCheckMetrics.updateHealthScore('payment-service', 1.0) // Fully healthy
  } catch (error) {
    // Health checks are automatically tracked by instrumentation
    healthCheckMetrics.updateHealthScore('payment-service', 0.5) // Degraded
  }
}

// =============================================================================
// HTTP MIDDLEWARE EXAMPLES
// =============================================================================

// Example: Express middleware
import express from 'express'

const app = express()

// Add metrics middleware
app.use(middlewareMetrics.expressMiddleware({
  slowRequestThreshold: 1000,
  pathNormalizer: (path) => {
    // Normalize dynamic paths
    return path.replace(/\/\d+/g, '/:id')
  }
}))

// Track API endpoints
const apiMetrics = middlewareMetrics.trackAPIEndpoint('/api/users', 'v1')

app.get('/api/users/:id', (req, res) => {
  // API metrics are automatically tracked by middleware
  
  // Manually track endpoint-specific metrics
  apiMetrics.requests.inc({ endpoint: '/api/users/:id', version: 'v1', method: 'get', status: '200' })
  
  res.json({ id: req.params.id, name: 'John Doe' })
})

// =============================================================================
// HAPI MIDDLEWARE EXAMPLES
// =============================================================================

// Example: Hapi plugin
import Hapi from '@hapi/hapi'

async function exampleHapiUsage() {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  })

  // Register metrics plugin
  await server.register(middlewareMetrics.hapiPlugin({
    slowRequestThreshold: 1000,
    pathNormalizer: (path) => {
      // Normalize dynamic paths
      return path.replace(/\/\d+/g, '/:id')
    },
    excludePaths: ['/health', '/metrics', '/live', '/status']
  }))

  // Add routes
  server.route({
    method: 'GET',
    path: '/api/users/{id}',
    handler: (request, h) => {
      // Metrics are automatically tracked by the plugin
      
      // Manually track additional metrics if needed
      const userApiMetrics = middlewareMetrics.trackAPIEndpoint('/api/users/{id}', 'v1')
      userApiMetrics.requests.inc({ 
        endpoint: '/api/users/{id}', 
        version: 'v1', 
        method: 'get', 
        status: '200' 
      })
      
      return { id: request.params.id, name: 'John Doe' }
    }
  })

  // Add metrics endpoint
  server.route({
    method: 'GET',
    path: '/metrics',
    handler: async (request, h) => {
      const metrics = await metricsInstance.getMetricsForPrometheus()
      return h.response(metrics)
        .type('text/plain; version=0.0.4; charset=utf-8')
    }
  })

  await server.start()
  console.log('Hapi server running on %s', server.info.uri)
  
  return server
}

// =============================================================================
// BACKGROUND JOB EXAMPLES
// =============================================================================

// Example: Background job processing
import Bull from 'bull'

const jobQueue = new Bull('email jobs', 'redis://localhost:6379')
const jobMetrics = middlewareMetrics.trackBackgroundJob()

jobQueue.process('send-email', async (job) => {
  const timer = jobMetrics.jobDuration.startTimer({ job_type: 'send-email', queue: 'email' })
  
  jobMetrics.jobsStarted.inc({ job_type: 'send-email', queue: 'email' })
  jobMetrics.jobsActive.inc({ job_type: 'send-email', queue: 'email' })
  
  try {
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    jobMetrics.jobsCompleted.inc({ job_type: 'send-email', queue: 'email', status: 'success' })
  } catch (error) {
    jobMetrics.jobErrors.inc({ job_type: 'send-email', queue: 'email', error_type: 'smtp_error' })
    throw error
  } finally {
    jobMetrics.jobsActive.dec({ job_type: 'send-email', queue: 'email' })
    timer()
  }
})

// =============================================================================
// ADVANCED PATTERNS
// =============================================================================

// Example: Measure function execution time
async function expensiveOperation() {
  return new Promise(resolve => setTimeout(resolve, 1000))
}

const operationHistogram = metricsInstance.getLatencyHistogram(
  'expensive_operation_duration',
  'Duration of expensive operation',
  ['operation_type'],
  'api'
)

async function exampleMeasureDuration() {
  const result = await metricsInstance.measureDuration(
    operationHistogram,
    expensiveOperation,
    { operation_type: 'data_processing' }
  )
  
  return result
}

// Example: Function decorator
const instrumentedFunction = middlewareMetrics.instrumentFunction(
  'processPayment',
  async (amount: number, currency: string) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 500))
    return { status: 'success', transactionId: '12345' }
  },
  { labels: { service: 'payment' }, slowThreshold: 1000 }
)

// =============================================================================
// METRICS ENDPOINT
// =============================================================================

// Expose metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  res.end(await metricsInstance.getMetricsForPrometheus())
})

// =============================================================================
// EXPORT EXAMPLES
// =============================================================================

export {
  exampleRedisUsage,
  exampleKafkaUsage,
  exampleDatabaseUsage,
  exampleWebSocketUsage,
  exampleMongoUsage,
  exampleCircuitBreakerUsage,
  exampleHealthCheckUsage,
  exampleMeasureDuration,
  exampleHapiUsage,
  instrumentedAPICall,
  instrumentedFunction,
  app
}