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
 * Database metrics utility class following Netflix and RocksDB patterns
 */
export class DatabaseMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track database connection pool metrics (Netflix/Kafka pattern)
   */
  trackConnectionPool = (poolName: string = 'default') => {
    return {
      poolSize: this.metrics.getGauge('db_pool_size', 'Database connection pool size', ['pool']),
      poolUsed: this.metrics.getGauge('db_pool_connections_used', 'Database pool connections in use', ['pool']),
      poolFree: this.metrics.getGauge('db_pool_connections_free', 'Database pool free connections', ['pool']),
      poolPending: this.metrics.getGauge('db_pool_connections_pending', 'Database pool pending connections', ['pool']),
      poolTimeouts: this.metrics.getCounter('db_pool_timeouts_total', 'Database pool connection timeouts', ['pool']),
      connectionWaitTime: this.metrics.getHistogram('db_connection_wait_duration_seconds', 'Time waiting for connection', ['pool'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]),
      connectionLifetime: this.metrics.getHistogram('db_connection_lifetime_seconds', 'Connection lifetime', ['pool'], [1, 5, 10, 30, 60, 300, 600, 1800, 3600]),
      connectionErrors: this.metrics.getCounter('db_connection_errors_total', 'Database connection errors', ['pool', 'error_type'])
    }
  }

  /**
   * Track database query metrics (RocksDB/Kafka inspired)
   */
  trackQueries = () => {
    return {
      queriesTotal: this.metrics.getCounter('db_queries_total', 'Database queries executed', ['operation', 'status', 'table']),
      queryDuration: this.metrics.getHistogram('db_query_duration_seconds', 'Database query duration', ['operation', 'table'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
      slowQueries: this.metrics.getCounter('db_slow_queries_total', 'Database slow queries', ['table']),
      queryErrors: this.metrics.getCounter('db_query_errors_total', 'Database query errors', ['operation', 'error_type', 'table']),
      deadlocks: this.metrics.getCounter('db_deadlocks_total', 'Database deadlocks'),
      rowsAffected: this.metrics.getCounter('db_rows_affected_total', 'Database rows affected', ['operation', 'table']),
      rowsExamined: this.metrics.getCounter('db_rows_examined_total', 'Database rows examined', ['operation', 'table']),
      indexHits: this.metrics.getCounter('db_index_hits_total', 'Database index hits', ['table', 'index']),
      tableScansFull: this.metrics.getCounter('db_table_scans_full_total', 'Full table scans', ['table'])
    }
  }

  /**
   * Track database transaction metrics
   */
  trackTransactions = () => {
    return {
      transactionsTotal: this.metrics.getCounter('db_transactions_total', 'Database transactions', ['status']),
      transactionDuration: this.metrics.getHistogram('db_transaction_duration_seconds', 'Database transaction duration', [], [0.001, 0.01, 0.1, 1, 10, 30]),
      rollbacksTotal: this.metrics.getCounter('db_transaction_rollbacks_total', 'Database transaction rollbacks', ['reason']),
      lockWaitTime: this.metrics.getHistogram('db_lock_wait_duration_seconds', 'Database lock wait time', ['lock_type'], [0.001, 0.01, 0.1, 1, 5]),
      lockTimeouts: this.metrics.getCounter('db_lock_timeouts_total', 'Database lock timeouts', ['lock_type']),
      activeTransactions: this.metrics.getGauge('db_transactions_active', 'Active database transactions')
    }
  }

  /**
   * Track database performance and health metrics
   */
  trackPerformance = () => {
    return {
      cacheHitRatio: this.metrics.getGauge('db_cache_hit_ratio', 'Database cache hit ratio', ['cache_type']),
      bufferPoolUsage: this.metrics.getGauge('db_buffer_pool_usage_ratio', 'Database buffer pool usage'),
      diskReads: this.metrics.getCounter('db_disk_reads_total', 'Database disk reads', ['table']),
      diskWrites: this.metrics.getCounter('db_disk_writes_total', 'Database disk writes', ['table']),
      ioWaitTime: this.metrics.getHistogram('db_io_wait_duration_seconds', 'Database I/O wait time', ['operation']),
      tableSizeBytes: this.metrics.getGauge('db_table_size_bytes', 'Database table size in bytes', ['table']),
      indexSizeBytes: this.metrics.getGauge('db_index_size_bytes', 'Database index size in bytes', ['table', 'index']),
      fragmentationRatio: this.metrics.getGauge('db_table_fragmentation_ratio', 'Database table fragmentation', ['table'])
    }
  }

  /**
   * Track database replication metrics (if applicable)
   */
  trackReplication = () => {
    return {
      replicationLag: this.metrics.getGauge('db_replication_lag_seconds', 'Database replication lag', ['replica']),
      replicationErrors: this.metrics.getCounter('db_replication_errors_total', 'Database replication errors', ['replica', 'error_type']),
      binlogSize: this.metrics.getGauge('db_binlog_size_bytes', 'MySQL binlog size'),
      slaveIORunning: this.metrics.getGauge('db_slave_io_running', 'MySQL slave IO thread running', ['replica']),
      slaveSQLRunning: this.metrics.getGauge('db_slave_sql_running', 'MySQL slave SQL thread running', ['replica'])
    }
  }

  /**
   * Middleware for automatic database query instrumentation
   */
  instrumentDatabase = (db: any, dbName: string = 'default') => {
    const queryMetrics = this.trackQueries()
    const transactionMetrics = this.trackTransactions()

    // Generic query wrapper
    const wrapQuery = (originalMethod: (...args: any[]) => any, operation: string) => {
      return function (this: any, ...args: any[]) {
        const timer = queryMetrics.queryDuration.startTimer({ operation, table: 'unknown' })
        queryMetrics.queriesTotal.inc({ operation, status: 'started', table: 'unknown' })

        const result = originalMethod.apply(this, args)

        // Handle both callback and promise-based results
        if (result instanceof Promise) {
          return result
            .then((queryResult: any) => {
              queryMetrics.queriesTotal.inc({ operation, status: 'success', table: 'unknown' })
              return queryResult
            })
            .catch((error: Error) => {
              queryMetrics.queriesTotal.inc({ operation, status: 'error', table: 'unknown' })
              queryMetrics.queryErrors.inc({ operation, error_type: error.name || 'unknown', table: 'unknown' })
              throw error
            })
            .finally(() => {
              timer()
            })
        } else {
          // Synchronous result or callback-based
          timer()
          return result
        }
      }
    }

    // Instrument common database methods
    if (db.query) {
      db.query = wrapQuery(db.query.bind(db), 'query')
    }
    if (db.execute) {
      db.execute = wrapQuery(db.execute.bind(db), 'execute')
    }

    return db
  }

  /**
   * Utility for tracking prepared statement metrics
   */
  trackPreparedStatements = () => {
    return {
      preparedStatementsActive: this.metrics.getGauge('db_prepared_statements_active', 'Active prepared statements'),
      preparedStatementsExecuted: this.metrics.getCounter('db_prepared_statements_executed_total', 'Prepared statements executed', ['statement_type']),
      preparedStatementsCacheHit: this.metrics.getCounter('db_prepared_statements_cache_hits_total', 'Prepared statement cache hits'),
      preparedStatementsCacheMiss: this.metrics.getCounter('db_prepared_statements_cache_misses_total', 'Prepared statement cache misses')
    }
  }

  /**
   * Utility for tracking database backup and maintenance metrics
   */
  trackMaintenance = () => {
    return {
      backupDuration: this.metrics.getHistogram('db_backup_duration_seconds', 'Database backup duration', ['backup_type'], [60, 300, 600, 1800, 3600, 7200]),
      backupSize: this.metrics.getGauge('db_backup_size_bytes', 'Database backup size', ['backup_type']),
      maintenanceOperations: this.metrics.getCounter('db_maintenance_operations_total', 'Database maintenance operations', ['operation', 'status']),
      vacuumDuration: this.metrics.getHistogram('db_vacuum_duration_seconds', 'Database vacuum duration', ['table'], [1, 10, 60, 300, 1800]),
      analyzeOperations: this.metrics.getCounter('db_analyze_operations_total', 'Database analyze operations', ['table'])
    }
  }

  /**
   * Track Knex.js specific metrics
   */
  trackKnexMetrics = () => {
    return {
      knexQueries: this.metrics.getCounter('knex_queries_total', 'Knex queries executed', ['method', 'table', 'status']),
      knexQueryDuration: this.metrics.getHistogram('knex_query_duration_seconds', 'Knex query execution time', ['method', 'table'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
      knexTransactions: this.metrics.getCounter('knex_transactions_total', 'Knex transactions', ['status', 'isolation_level']),
      knexTransactionDuration: this.metrics.getHistogram('knex_transaction_duration_seconds', 'Knex transaction duration', ['isolation_level'], [0.001, 0.01, 0.1, 1, 10, 30]),
      knexConnectionPool: this.metrics.getGauge('knex_pool_connections', 'Knex connection pool status', ['status']), // free, used, pending
      knexMigrations: this.metrics.getCounter('knex_migrations_total', 'Knex migration operations', ['operation', 'status']),
      knexSeeds: this.metrics.getCounter('knex_seeds_total', 'Knex seed operations', ['status']),
      knexSchemaOps: this.metrics.getCounter('knex_schema_operations_total', 'Knex schema operations', ['operation', 'table', 'status']),
      knexRawQueries: this.metrics.getCounter('knex_raw_queries_total', 'Knex raw SQL queries', ['status']),
      knexQueryBuilder: this.metrics.getCounter('knex_query_builder_operations_total', 'Knex query builder method calls', ['method', 'stage']),
      knexBindingsCount: this.metrics.getHistogram('knex_query_bindings_count', 'Number of parameter bindings in Knex queries', ['method'], [1, 5, 10, 25, 50, 100]),
      knexResultSetSize: this.metrics.getHistogram('knex_result_set_size', 'Knex query result set size', ['method', 'table'], [1, 10, 100, 1000, 10000, 100000])
    }
  }

  /**
   * Instrument Knex instance with comprehensive metrics tracking
   */
  instrumentKnex = (knex: any, options: {
    trackQueryBuilder?: boolean
    trackConnectionPool?: boolean
    trackTransactions?: boolean
    trackMigrations?: boolean
    slowQueryThreshold?: number
  } = {}) => {
    const {
      trackQueryBuilder = true,
      trackConnectionPool = true,
      trackTransactions = true,
      trackMigrations = true,
      slowQueryThreshold = 1000 // milliseconds
    } = options

    const knexMetrics = this.trackKnexMetrics()
    const connectionMetrics = this.trackConnectionPool()
    const queryMetrics = this.trackQueries()

    // Track connection pool metrics if enabled
    if (trackConnectionPool && knex.client && knex.client.pool) {
      const pool = knex.client.pool

      const updatePoolMetrics = () => {
        if (pool.numUsed !== undefined) knexMetrics.knexConnectionPool.set({ status: 'used' }, pool.numUsed())
        if (pool.numFree !== undefined) knexMetrics.knexConnectionPool.set({ status: 'free' }, pool.numFree())
        if (pool.numPendingAcquires !== undefined) knexMetrics.knexConnectionPool.set({ status: 'pending' }, pool.numPendingAcquires())
      }

      // Update pool metrics periodically
      const poolInterval = setInterval(updatePoolMetrics, 5000)

      // Clean up interval when knex is destroyed
      const originalDestroy = knex.destroy.bind(knex)
      knex.destroy = function(...args: any[]) {
        clearInterval(poolInterval)
        return originalDestroy(...args)
      }

      // Track pool events if available
      if (pool.on) {
        pool.on('acquireRequest', () => {
          connectionMetrics.poolPending.inc({ pool: 'knex' })
        })

        pool.on('acquireSuccess', () => {
          connectionMetrics.poolUsed.inc({ pool: 'knex' })
        })

        pool.on('acquireFail', (err: Error) => {
          connectionMetrics.connectionErrors.inc({ pool: 'knex', error_type: err.name || 'unknown' })
        })

        pool.on('release', () => {
          connectionMetrics.poolFree.inc({ pool: 'knex' })
        })
      }
    }

    // Instrument query execution
    this.instrumentKnexQueries(knex, knexMetrics, slowQueryThreshold)

    // Instrument transactions if enabled
    if (trackTransactions) {
      this.instrumentKnexTransactions(knex, knexMetrics)
    }

    // Instrument migration operations if enabled
    if (trackMigrations) {
      this.instrumentKnexMigrations(knex, knexMetrics)
    }

    // Instrument query builder if enabled
    if (trackQueryBuilder) {
      this.instrumentKnexQueryBuilder(knex, knexMetrics)
    }

    return knex
  }

  /**
   * Instrument Knex query execution
   */
  private instrumentKnexQueries = (knex: any, knexMetrics: ReturnType<typeof this.trackKnexMetrics>, slowQueryThreshold: number) => {
    // Hook into Knex query execution events
    knex.on('query', (query: any) => {
      const startTime = Date.now()
      const method = this.extractKnexMethod(query.sql)
      const table = this.extractTableFromQuery(query.sql)

      knexMetrics.knexQueries.inc({ method, table, status: 'started' })

      if (query.bindings && query.bindings.length > 0) {
        knexMetrics.knexBindingsCount.observe({ method }, query.bindings.length)
      }

      // Store timing info for response handler
      query._metricsStartTime = startTime
      query._metricsMethod = method
      query._metricsTable = table
    })

    knex.on('query-response', (response: any, query: any) => {
      if (query._metricsStartTime) {
        const duration = (Date.now() - query._metricsStartTime) / 1000
        const method = query._metricsMethod || 'unknown'
        const table = query._metricsTable || 'unknown'

        knexMetrics.knexQueries.inc({ method, table, status: 'success' })
        knexMetrics.knexQueryDuration.observe({ method, table }, duration)

        // Track slow queries
        if (duration * 1000 > slowQueryThreshold) {
          const queryMetrics = this.trackQueries()
          queryMetrics.slowQueries.inc({ table })
        }

        // Track result set size for SELECT queries
        if (method === 'select' && Array.isArray(response)) {
          knexMetrics.knexResultSetSize.observe({ method, table }, response.length)
        }
      }
    })

    knex.on('query-error', (error: Error, query: any) => {
      if (query._metricsStartTime) {
        const duration = (Date.now() - query._metricsStartTime) / 1000
        const method = query._metricsMethod || 'unknown'
        const table = query._metricsTable || 'unknown'

        knexMetrics.knexQueries.inc({ method, table, status: 'error' })
        knexMetrics.knexQueryDuration.observe({ method, table }, duration)

        const queryMetrics = this.trackQueries()
        queryMetrics.queryErrors.inc({
          operation: method,
          error_type: error.name || 'unknown',
          table
        })
      }
    })
  }

  /**
   * Instrument Knex transaction operations
   */
  private instrumentKnexTransactions = (knex: any, knexMetrics: ReturnType<typeof this.trackKnexMetrics>) => {
    const originalTransaction = knex.transaction.bind(knex)

    knex.transaction = function(callback?: (trx?: any) => any, config?: any) {
      const startTime = Date.now()
      const isolationLevel = config?.isolationLevel || 'default'

      knexMetrics.knexTransactions.inc({ status: 'started', isolation_level: isolationLevel })

      const transactionPromise = originalTransaction(callback, config)

      if (transactionPromise && transactionPromise.then) {
        return transactionPromise
          .then((result: any) => {
            const duration = (Date.now() - startTime) / 1000
            knexMetrics.knexTransactions.inc({ status: 'committed', isolation_level: isolationLevel })
            knexMetrics.knexTransactionDuration.observe({ isolation_level: isolationLevel }, duration)
            return result
          })
          .catch((error: Error) => {
            const duration = (Date.now() - startTime) / 1000
            knexMetrics.knexTransactions.inc({ status: 'rolled_back', isolation_level: isolationLevel })
            knexMetrics.knexTransactionDuration.observe({ isolation_level: isolationLevel }, duration)
            throw error
          })
      }

      return transactionPromise
    }
  }

  /**
   * Instrument Knex migration operations
   */
  private instrumentKnexMigrations = (knex: any, knexMetrics: ReturnType<typeof this.trackKnexMetrics>) => {
    // Instrument migration methods if available
    if (knex.migrate) {
      const originalLatest = knex.migrate.latest?.bind(knex.migrate)
      const originalRollback = knex.migrate.rollback?.bind(knex.migrate)
      const originalUp = knex.migrate.up?.bind(knex.migrate)
      const originalDown = knex.migrate.down?.bind(knex.migrate)

      if (originalLatest) {
        knex.migrate.latest = function(...args: any[]) {
          knexMetrics.knexMigrations.inc({ operation: 'latest', status: 'started' })

          const result = originalLatest(...args)
          if (result && result.then) {
            return result
              .then((migrationResult: any) => {
                knexMetrics.knexMigrations.inc({ operation: 'latest', status: 'success' })
                return migrationResult
              })
              .catch((error: Error) => {
                knexMetrics.knexMigrations.inc({ operation: 'latest', status: 'error' })
                throw error
              })
          }
          return result
        }
      }

      if (originalRollback) {
        knex.migrate.rollback = function(...args: any[]) {
          knexMetrics.knexMigrations.inc({ operation: 'rollback', status: 'started' })

          const result = originalRollback(...args)
          if (result && result.then) {
            return result
              .then((migrationResult: any) => {
                knexMetrics.knexMigrations.inc({ operation: 'rollback', status: 'success' })
                return migrationResult
              })
              .catch((error: Error) => {
                knexMetrics.knexMigrations.inc({ operation: 'rollback', status: 'error' })
                throw error
              })
          }
          return result
        }
      }

      if (originalUp) {
        knex.migrate.up = function(...args: any[]) {
          knexMetrics.knexMigrations.inc({ operation: 'up', status: 'started' })

          const result = originalUp(...args)
          if (result && result.then) {
            return result
              .then((migrationResult: any) => {
                knexMetrics.knexMigrations.inc({ operation: 'up', status: 'success' })
                return migrationResult
              })
              .catch((error: Error) => {
                knexMetrics.knexMigrations.inc({ operation: 'up', status: 'error' })
                throw error
              })
          }
          return result
        }
      }

      if (originalDown) {
        knex.migrate.down = function(...args: any[]) {
          knexMetrics.knexMigrations.inc({ operation: 'down', status: 'started' })

          const result = originalDown(...args)
          if (result && result.then) {
            return result
              .then((migrationResult: any) => {
                knexMetrics.knexMigrations.inc({ operation: 'down', status: 'success' })
                return migrationResult
              })
              .catch((error: Error) => {
                knexMetrics.knexMigrations.inc({ operation: 'down', status: 'error' })
                throw error
              })
          }
          return result
        }
      }
    }

    // Instrument seed operations if available
    if (knex.seed) {
      const originalRun = knex.seed.run?.bind(knex.seed)

      if (originalRun) {
        knex.seed.run = function(...args: any[]) {
          knexMetrics.knexSeeds.inc({ status: 'started' })

          const result = originalRun(...args)
          if (result && result.then) {
            return result
              .then((seedResult: any) => {
                knexMetrics.knexSeeds.inc({ status: 'success' })
                return seedResult
              })
              .catch((error: Error) => {
                knexMetrics.knexSeeds.inc({ status: 'error' })
                throw error
              })
          }
          return result
        }
      }
    }
  }

  /**
   * Instrument Knex query builder operations
   */
  private instrumentKnexQueryBuilder = (knex: any, knexMetrics: ReturnType<typeof this.trackKnexMetrics>) => {
    const originalSchema = knex.schema

    // Instrument schema operations
    if (originalSchema) {
      const schemaOperations = ['createTable', 'alterTable', 'dropTable', 'createIndex', 'dropIndex', 'createView', 'dropView']

      schemaOperations.forEach(operation => {
        if (originalSchema[operation]) {
          const originalMethod = originalSchema[operation].bind(originalSchema)

          originalSchema[operation] = function(tableName: string, ...args: any[]) {
            knexMetrics.knexSchemaOps.inc({ operation, table: tableName, status: 'started' })

            const result = originalMethod(tableName, ...args)
            if (result && result.then) {
              return result
                .then((schemaResult: any) => {
                  knexMetrics.knexSchemaOps.inc({ operation, table: tableName, status: 'success' })
                  return schemaResult
                })
                .catch((error: Error) => {
                  knexMetrics.knexSchemaOps.inc({ operation, table: tableName, status: 'error' })
                  throw error
                })
            }
            return result
          }
        }
      })
    }

    // Instrument raw queries
    const originalRaw = knex.raw.bind(knex)
    knex.raw = function(...args: any[]) {
      knexMetrics.knexRawQueries.inc({ status: 'started' })

      const result = originalRaw(...args)
      if (result && result.then) {
        return result
          .then((rawResult: any) => {
            knexMetrics.knexRawQueries.inc({ status: 'success' })
            return rawResult
          })
          .catch((error: Error) => {
            knexMetrics.knexRawQueries.inc({ status: 'error' })
            throw error
          })
      }
      return result
    }
  }

  /**
   * Extract SQL method from query string
   */
  private extractKnexMethod = (sql: string): string => {
    if (!sql) return 'unknown'

    const lowerSql = sql.toLowerCase().trim()
    if (lowerSql.startsWith('select')) return 'select'
    if (lowerSql.startsWith('insert')) return 'insert'
    if (lowerSql.startsWith('update')) return 'update'
    if (lowerSql.startsWith('delete')) return 'delete'
    if (lowerSql.startsWith('create')) return 'create'
    if (lowerSql.startsWith('alter')) return 'alter'
    if (lowerSql.startsWith('drop')) return 'drop'
    if (lowerSql.startsWith('truncate')) return 'truncate'

    return 'other'
  }

  /**
   * Extract table name from SQL query (basic implementation)
   */
  private extractTableFromQuery = (sql: string): string => {
    if (!sql) return 'unknown'

    // Simple regex patterns for common operations
    const patterns = [
      /(?:from|into|update|join)\s+[`"]?(\w+)[`"]?/i,
      /(?:table)\s*\(\s*[`'"]?(\w+)[`'"]?\s*\)/i,
      /create\s+table\s+[`"]?(\w+)[`"]?/i
    ]

    for (const pattern of patterns) {
      const match = sql.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return 'unknown'
  }

  /**
   * Create a Knex query wrapper for additional instrumentation
   */
  wrapKnexQuery = (queryBuilder: any, tableName?: string) => {
    const knexMetrics = this.trackKnexMetrics()

    // Track query builder method calls
    const builderMethods = [
      'where', 'whereNot', 'whereIn', 'whereNotIn', 'whereBetween', 'whereNotBetween',
      'whereNull', 'whereNotNull', 'whereExists', 'whereNotExists',
      'join', 'leftJoin', 'rightJoin', 'innerJoin', 'crossJoin',
      'orderBy', 'groupBy', 'having', 'limit', 'offset',
      'select', 'distinct', 'count', 'sum', 'avg', 'min', 'max'
    ]

    builderMethods.forEach(method => {
      if (queryBuilder[method]) {
        const originalMethod = queryBuilder[method].bind(queryBuilder)

        queryBuilder[method] = function(...args: any[]) {
          knexMetrics.knexQueryBuilder.inc({ method, stage: 'build' })
          return originalMethod(...args)
        }
      }
    })

    return queryBuilder
  }
}
