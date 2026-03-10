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
 - Name Surname <name.surname@mojaloop.io>

 - Shashikant Hirugade <shashikant.hirugade@modusbox.com>

 --------------
 ******/
'use strict'

// Core metrics system
import metrics = require('./metrics')

// Infrastructure-specific metrics utilities
import { RedisMetrics } from './redis-metrics'
import { KafkaMetrics } from './kafka-metrics'
import { DatabaseMetrics } from './database-metrics'
import { WebSocketMetrics } from './websocket-metrics'
import { MongoDBMetrics } from './mongodb-metrics'

// Resilience patterns
import { CircuitBreakerMetrics, HealthCheckMetrics, RateLimitMetrics, CircuitBreakerState } from './resilience-metrics'

// Middleware utilities
import { MiddlewareMetrics } from './middleware-metrics'

// Create a singleton instance
const metricsInstance = new metrics.Metrics()

// Create utility instances that use the main metrics instance
export const redisMetrics = new RedisMetrics(metricsInstance)
export const kafkaMetrics = new KafkaMetrics(metricsInstance)
export const databaseMetrics = new DatabaseMetrics(metricsInstance)
export const webSocketMetrics = new WebSocketMetrics(metricsInstance)
export const mongoDBMetrics = new MongoDBMetrics(metricsInstance)
export const circuitBreakerMetrics = new CircuitBreakerMetrics(metricsInstance)
export const healthCheckMetrics = new HealthCheckMetrics(metricsInstance)
export const rateLimitMetrics = new RateLimitMetrics(metricsInstance)
export const middlewareMetrics = new MiddlewareMetrics(metricsInstance)

// Export types and classes for advanced usage
export {
  // Core types
  metrics,

  // Infrastructure utilities
  RedisMetrics,
  KafkaMetrics,
  DatabaseMetrics,
  WebSocketMetrics,
  MongoDBMetrics,

  // Resilience patterns
  CircuitBreakerMetrics,
  HealthCheckMetrics,
  RateLimitMetrics,
  CircuitBreakerState,

  // Middleware utilities
  MiddlewareMetrics
}

// Export the main metrics instance for default export (maintains backward compatibility)
module.exports = metricsInstance
module.exports.redisMetrics = redisMetrics
module.exports.kafkaMetrics = kafkaMetrics
module.exports.databaseMetrics = databaseMetrics
module.exports.webSocketMetrics = webSocketMetrics
module.exports.mongoDBMetrics = mongoDBMetrics
module.exports.circuitBreakerMetrics = circuitBreakerMetrics
module.exports.healthCheckMetrics = healthCheckMetrics
module.exports.rateLimitMetrics = rateLimitMetrics
module.exports.middlewareMetrics = middlewareMetrics

// Named exports
module.exports.RedisMetrics = RedisMetrics
module.exports.KafkaMetrics = KafkaMetrics
module.exports.DatabaseMetrics = DatabaseMetrics
module.exports.WebSocketMetrics = WebSocketMetrics
module.exports.MongoDBMetrics = MongoDBMetrics
module.exports.CircuitBreakerMetrics = CircuitBreakerMetrics
module.exports.HealthCheckMetrics = HealthCheckMetrics
module.exports.RateLimitMetrics = RateLimitMetrics
module.exports.CircuitBreakerState = CircuitBreakerState
module.exports.MiddlewareMetrics = MiddlewareMetrics
