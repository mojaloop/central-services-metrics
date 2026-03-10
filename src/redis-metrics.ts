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

'use strict'

import client = require('prom-client')
import { type Metrics } from './metrics'

/**
 * Redis metrics utility class following Netflix and Apache Kafka patterns
 */
export class RedisMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track Redis connection pool metrics (Netflix Conductor pattern)
   */
  trackConnectionPool = (poolName: string = 'default') => {
    return {
      activeConnections: this.metrics.getGauge('redis_pool_active_connections', 'Redis pool active connections', ['pool']),
      idleConnections: this.metrics.getGauge('redis_pool_idle_connections', 'Redis pool idle connections', ['pool']),
      pendingRequests: this.metrics.getGauge('redis_pool_pending_requests', 'Redis pool pending requests', ['pool']),
      totalConnections: this.metrics.getGauge('redis_pool_total_connections', 'Redis pool total connections', ['pool']),
      poolErrors: this.metrics.getCounter('redis_pool_errors_total', 'Redis pool errors', ['pool', 'error_type'])
    }
  }

  /**
   * Track Redis operation metrics (Apache Kafka pattern)
   */
  trackOperations = () => {
    return {
      commandsTotal: this.metrics.getCounter('redis_commands_total', 'Redis commands executed', ['command', 'status']),
      commandDuration: this.metrics.getHistogram('redis_command_duration_seconds', 'Redis command duration', ['command'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]),
      reconnectionsTotal: this.metrics.getCounter('redis_reconnections_total', 'Redis reconnections'),
      pipelineLength: this.metrics.getHistogram('redis_pipeline_length', 'Redis pipeline batch size', [], [1, 5, 10, 25, 50, 100, 250, 500]),
      slowCommands: this.metrics.getCounter('redis_slow_commands_total', 'Redis slow commands', ['command']),
      timeouts: this.metrics.getCounter('redis_timeouts_total', 'Redis operation timeouts', ['command'])
    }
  }

  /**
   * Track Redis performance and memory metrics (RocksDB-inspired pattern)
   */
  trackPerformance = () => {
    return {
      memoryUsage: this.metrics.getGauge('redis_memory_usage_bytes', 'Redis memory usage in bytes'),
      keysTotal: this.metrics.getGauge('redis_keys_total', 'Total number of keys', ['database']),
      keyspaceHits: this.metrics.getCounter('redis_keyspace_hits_total', 'Redis keyspace hits'),
      keyspaceMisses: this.metrics.getCounter('redis_keyspace_misses_total', 'Redis keyspace misses'),
      evictedKeys: this.metrics.getCounter('redis_evicted_keys_total', 'Redis evicted keys'),
      expiredKeys: this.metrics.getCounter('redis_expired_keys_total', 'Redis expired keys'),
      cacheHitRatio: this.metrics.getGauge('redis_cache_hit_ratio', 'Redis cache hit ratio')
    }
  }

  /**
   * Middleware for automatic Redis command instrumentation
   */
  instrumentRedisClient = (redisClient: any, clientName: string = 'default') => {
    const operationMetrics = this.trackOperations()
    const poolMetrics = this.trackConnectionPool(clientName)

    // Wrap command methods
    const originalSendCommand = redisClient.sendCommand?.bind(redisClient)
    if (originalSendCommand) {
      redisClient.sendCommand = (...args: any[]) => {
        const command = args[0]?.name || 'unknown'
        const timer = operationMetrics.commandDuration.startTimer({ command })

        operationMetrics.commandsTotal.inc({ command, status: 'started' })

        return originalSendCommand(...args)
          .then((result: any) => {
            operationMetrics.commandsTotal.inc({ command, status: 'success' })
            return result
          })
          .catch((error: Error) => {
            operationMetrics.commandsTotal.inc({ command, status: 'error' })
            throw error
          })
          .finally(() => {
            timer()
          })
      }
    }

    return redisClient
  }

  /**
   * Utility to track Redis pub/sub metrics
   */
  trackPubSub = () => {
    return {
      subscribedChannels: this.metrics.getGauge('redis_pubsub_subscribed_channels', 'Number of subscribed channels'),
      messagesPublished: this.metrics.getCounter('redis_pubsub_messages_published_total', 'Messages published', ['channel']),
      messagesReceived: this.metrics.getCounter('redis_pubsub_messages_received_total', 'Messages received', ['channel']),
      subscriptionErrors: this.metrics.getCounter('redis_pubsub_subscription_errors_total', 'Subscription errors', ['error_type'])
    }
  }
}