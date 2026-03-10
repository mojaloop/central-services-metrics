# central-services-metrics
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/central-services-metrics.svg?style=flat)](https://github.com/mojaloop/central-services-metrics/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/central-services-metrics.svg?style=flat)](https://github.com/mojaloop/central-services-metrics/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/central-services-metrics.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-metrics)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/central-services-metrics.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-metrics)
[![CircleCI](https://circleci.com/gh/mojaloop/central-services-metrics.svg?style=svg)](https://circleci.com/gh/mojaloop/central-services-metrics)

## CI/CD

This repository uses the [mojaloop/build](https://github.com/mojaloop/ci-config-orb-build) CircleCI orb for standardized CI/CD workflows, including automated Grype vulnerability scanning for source code security.

## Installation

```bash
npm install @mojaloop/central-services-metrics
```

## Usage

Import Metrics library:
```javascript
const Metrics = require('@mojaloop/central-services-metrics')
```

Set configuration options:
```javascript
let config = {
    "timeout": 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
    "prefix": "<PREFIX>", // Set prefix for all defined metrics names
    "defaultLabels": { // Set default labels that will be applied to all metrics
        "serviceName": "<NAME_OF_SERVICE>"
    }
}
```

Initialise Metrics library:
```JAVASCRIPT
Metrics.setup(config)

```

Example instrumentation:
```javascript
const exampleFunction = async (error, message) => {
    const histTimerEnd = Metrics.getHistogram( // Create a new Histogram instrumentation
      'exampleFunctionMetric', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for exampleFunction', // Description of metric
      ['success'] // Define a custom label 'success'
    ).startTimer() // Start instrumentation

    try {
        Logger.info('do something meaningful here')
        histTimerEnd({success: true}) // End the instrumentation & set custom label 'success=true'
    } catch (e) {
        histTimerEnd({success: false}) // End the instrumentation & set custom label 'success=false'
    }
}
```

## Auditing Dependencies

We use `audit-ci` along with `npm audit` to check dependencies for node vulnerabilities, and keep track of resolved dependencies with an `audit-ci.jsonc` file.

To start a new resolution process, run:

```bash
npm run audit:fix
```

You can then check to see if the CI will pass based on the current dependencies with:

```bash
npm run audit:check
```

The [audit-ci.jsonc](./audit-ci.jsonc) contains any audit-exceptions that cannot be fixed to ensure that CircleCI will build correctly.

## Enhanced Infrastructure Utilities

This library includes enhanced utilities for comprehensive metrics collection across your Node.js infrastructure stack.

### Database Metrics with Knex.js Support

The database metrics utility provides comprehensive instrumentation for database operations, with specialized support for Knex.js query builder including connection pooling, transactions, migrations, and query performance tracking.

```typescript
import { DatabaseMetrics } from '@mojaloop/central-services-metrics'
import knex from 'knex'

const databaseMetrics = new DatabaseMetrics(metrics)

// Create and instrument Knex instance
const db = knex({
  client: 'mysql2', // or 'pg', 'sqlite3', etc.
  connection: {
    host: 'localhost',
    user: 'root',
    database: 'myapp'
  },
  pool: { min: 2, max: 10 }
})

// Instrument Knex with comprehensive metrics
const instrumentedKnex = databaseMetrics.instrumentKnex(db, {
  trackQueryBuilder: true,    // Track query builder method calls
  trackConnectionPool: true,  // Monitor connection pool status
  trackTransactions: true,    // Track transaction lifecycle
  trackMigrations: true,      // Monitor migration operations
  slowQueryThreshold: 1000    // Log slow queries over 1 second
})

// Access specific metric groups
const knexMetrics = databaseMetrics.trackKnexMetrics()      // Knex-specific metrics
const poolMetrics = databaseMetrics.trackConnectionPool()   // Connection pool metrics
const queryMetrics = databaseMetrics.trackQueries()        // Query performance metrics
const transactionMetrics = databaseMetrics.trackTransactions() // Transaction metrics
```

**Key features for Knex.js:**
- **Query Tracking**: Monitors SELECT, INSERT, UPDATE, DELETE operations with timing
- **Query Builder Analysis**: Tracks method chaining patterns and complexity
- **Transaction Monitoring**: Tracks commit/rollback ratios and duration by isolation level
- **Migration Operations**: Monitors migrate.latest, migrate.rollback, seed operations
- **Connection Pool Health**: Real-time pool status (used/free/pending connections)
- **Schema Operations**: Tracks table/index creation, alteration, and deletion
- **Parameter Binding**: Monitors query parameter usage and patterns
- **Result Set Analysis**: Tracks query result sizes and performance impact

### WebSocket Metrics (for 'ws' library)

The WebSocket metrics utility provides comprehensive instrumentation for WebSocket servers and clients using the popular `ws` library, including per-message-deflate compression, fragmentation handling, and protocol-specific features.

```typescript
import { WebSocketMetrics } from '@mojaloop/central-services-metrics'
import WebSocket from 'ws'

const wsMetrics = new WebSocketMetrics(metrics)

// Instrument WebSocket server with 'ws' library features
const wss = new WebSocket.Server({ 
  port: 8080,
  perMessageDeflate: true // Enable compression
})

wsMetrics.instrumentWebSocketServer(wss, {
  trackPingPong: true,      // Track ping/pong frames
  trackExtensions: true,    // Track WebSocket extensions
  trackPerformance: true    // Track performance metrics
})

// Instrument WebSocket client
const ws = new WebSocket('ws://localhost:8080')
wsMetrics.instrumentWebSocketClient(ws, {
  trackPingPong: true,
  enablePingInterval: 30000 // Send ping every 30 seconds
})

// Track specific metrics
const connectionMetrics = wsMetrics.trackConnections()  // Connection lifecycle
const messageMetrics = wsMetrics.trackMessages()       // Message flow and opcodes
const errorMetrics = wsMetrics.trackErrors()           // Protocol errors
const heartbeatMetrics = wsMetrics.trackHeartbeat()    // Ping/pong latency
const compressionMetrics = wsMetrics.trackCompression() // Per-message-deflate
```

**Key features for 'ws' library:**
- **Protocol Support**: Tracks text (0x1) and binary (0x2) frame opcodes
- **Compression Tracking**: Per-message-deflate compression ratios and savings
- **Fragment Handling**: Tracks fragmented message frames
- **Extension Support**: Monitors WebSocket protocol extensions
- **Backpressure Monitoring**: Tracks bufferedAmount for flow control
- **Performance Metrics**: Memory usage, throughput, buffer utilization

