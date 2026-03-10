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
 * MongoDB metrics utility class following RocksDB state metrics and Kafka patterns
 */
export class MongoDBMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track MongoDB connection pool metrics (similar to Redis pattern)
   */
  trackConnectionPool = (poolName: string = 'default') => {
    return {
      poolSize: this.metrics.getGauge('mongodb_pool_size', 'MongoDB connection pool size', ['pool']),
      poolAvailable: this.metrics.getGauge('mongodb_pool_available_connections', 'MongoDB available connections', ['pool']),
      poolCheckedOut: this.metrics.getGauge('mongodb_pool_checked_out_connections', 'MongoDB checked out connections', ['pool']),
      poolWaitQueueDepth: this.metrics.getGauge('mongodb_pool_wait_queue_depth', 'MongoDB connection pool wait queue depth', ['pool']),
      checkoutDuration: this.metrics.getHistogram('mongodb_connection_checkout_duration_seconds', 'MongoDB connection checkout duration', ['pool'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]),
      checkinDuration: this.metrics.getHistogram('mongodb_connection_checkin_duration_seconds', 'MongoDB connection checkin duration', ['pool']),
      connectionErrors: this.metrics.getCounter('mongodb_connection_errors_total', 'MongoDB connection errors', ['pool', 'error_type']),
      connectionTimeouts: this.metrics.getCounter('mongodb_connection_timeouts_total', 'MongoDB connection timeouts', ['pool'])
    }
  }

  /**
   * Track MongoDB operation metrics (Kafka-inspired)
   */
  trackOperations = () => {
    return {
      operationsTotal: this.metrics.getCounter('mongodb_operations_total', 'MongoDB operations executed', ['operation', 'collection', 'status']),
      operationDuration: this.metrics.getHistogram('mongodb_operation_duration_seconds', 'MongoDB operation duration', ['operation', 'collection'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]),
      documentsReturned: this.metrics.getHistogram('mongodb_documents_returned', 'MongoDB documents returned per operation', ['operation', 'collection'], [1, 5, 10, 25, 50, 100, 250, 500, 1000]),
      documentsExamined: this.metrics.getHistogram('mongodb_documents_examined', 'MongoDB documents examined per operation', ['collection'], [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000]),
      documentsInserted: this.metrics.getCounter('mongodb_documents_inserted_total', 'MongoDB documents inserted', ['collection']),
      documentsUpdated: this.metrics.getCounter('mongodb_documents_updated_total', 'MongoDB documents updated', ['collection']),
      documentsDeleted: this.metrics.getCounter('mongodb_documents_deleted_total', 'MongoDB documents deleted', ['collection']),
      operationErrors: this.metrics.getCounter('mongodb_operation_errors_total', 'MongoDB operation errors', ['operation', 'collection', 'error_type'])
    }
  }

  /**
   * Track MongoDB index and performance metrics (RocksDB pattern)
   */
  trackPerformance = () => {
    return {
      indexUsage: this.metrics.getCounter('mongodb_index_usage_total', 'MongoDB index usage', ['collection', 'index']),
      collectionScans: this.metrics.getCounter('mongodb_collection_scans_total', 'MongoDB collection scans', ['collection']),
      sortOperations: this.metrics.getCounter('mongodb_sort_operations_total', 'MongoDB sort operations', ['collection']),
      writeConflicts: this.metrics.getCounter('mongodb_write_conflicts_total', 'MongoDB write conflicts', ['collection']),
      cursorTimeouts: this.metrics.getCounter('mongodb_cursor_timeouts_total', 'MongoDB cursor timeouts', ['collection']),
      planCacheHits: this.metrics.getCounter('mongodb_plan_cache_hits_total', 'MongoDB query plan cache hits', ['collection']),
      planCacheMisses: this.metrics.getCounter('mongodb_plan_cache_misses_total', 'MongoDB query plan cache misses', ['collection']),
      memoryUsage: this.metrics.getGauge('mongodb_memory_usage_bytes', 'MongoDB memory usage', ['type'])
    }
  }

  /**
   * Track MongoDB collection and database metrics
   */
  trackCollections = () => {
    return {
      collectionSize: this.metrics.getGauge('mongodb_collection_size_bytes', 'MongoDB collection size in bytes', ['database', 'collection']),
      collectionCount: this.metrics.getGauge('mongodb_collection_count', 'MongoDB collection document count', ['database', 'collection']),
      indexSize: this.metrics.getGauge('mongodb_index_size_bytes', 'MongoDB index size in bytes', ['database', 'collection', 'index']),
      avgObjectSize: this.metrics.getGauge('mongodb_avg_object_size_bytes', 'MongoDB average object size', ['collection']),
      storageSize: this.metrics.getGauge('mongodb_storage_size_bytes', 'MongoDB storage size', ['database', 'collection']),
      totalIndexes: this.metrics.getGauge('mongodb_total_indexes', 'MongoDB total indexes', ['database', 'collection'])
    }
  }

  /**
   * Track MongoDB replication metrics
   */
  trackReplication = () => {
    return {
      replicationLag: this.metrics.getGauge('mongodb_replication_lag_seconds', 'MongoDB replication lag', ['replica_set', 'member']),
      oplogWindow: this.metrics.getGauge('mongodb_oplog_window_seconds', 'MongoDB oplog window size', ['replica_set']),
      oplogSize: this.metrics.getGauge('mongodb_oplog_size_bytes', 'MongoDB oplog size', ['replica_set']),
      replicationState: this.metrics.getGauge('mongodb_replication_state', 'MongoDB replication state', ['replica_set', 'member']),
      electionCount: this.metrics.getCounter('mongodb_elections_total', 'MongoDB elections', ['replica_set']),
      stepDownCount: this.metrics.getCounter('mongodb_step_downs_total', 'MongoDB step downs', ['replica_set'])
    }
  }

  /**
   * Track MongoDB sharding metrics
   */
  trackSharding = () => {
    return {
      chunksTotal: this.metrics.getGauge('mongodb_chunks_total', 'MongoDB total chunks', ['database', 'collection']),
      chunkSplits: this.metrics.getCounter('mongodb_chunk_splits_total', 'MongoDB chunk splits', ['database', 'collection']),
      chunkMigrations: this.metrics.getCounter('mongodb_chunk_migrations_total', 'MongoDB chunk migrations', ['from_shard', 'to_shard']),
      balancerRounds: this.metrics.getCounter('mongodb_balancer_rounds_total', 'MongoDB balancer rounds', ['status']),
      shardedCollections: this.metrics.getGauge('mongodb_sharded_collections', 'MongoDB sharded collections', ['database'])
    }
  }

  /**
   * Middleware for automatic MongoDB instrumentation
   */
  instrumentMongoClient = (client: any) => {
    const operationMetrics = this.trackOperations()
    const poolMetrics = this.trackConnectionPool()

    // Instrument database operations
    const wrapCollection = (collection: any) => {
      const originalMethods = ['find', 'findOne', 'insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'aggregate']
      
      originalMethods.forEach(method => {
        if (collection[method]) {
          const originalMethod = collection[method].bind(collection)
          collection[method] = (...args: any[]) => {
            const operation = method
            const collectionName = collection.collectionName || 'unknown'
            const timer = operationMetrics.operationDuration.startTimer({ operation, collection: collectionName })
            
            operationMetrics.operationsTotal.inc({ operation, collection: collectionName, status: 'started' })

            const result = originalMethod(...args)

            // Handle promise-based results
            if (result && typeof result.then === 'function') {
              return result
                .then((queryResult: any) => {
                  operationMetrics.operationsTotal.inc({ operation, collection: collectionName, status: 'success' })
                  
                  // Track result metrics for read operations
                  if (['find', 'findOne', 'aggregate'].includes(operation) && queryResult) {
                    if (queryResult.toArray) {
                      // Cursor result
                      queryResult.toArray().then((docs: any[]) => {
                        operationMetrics.documentsReturned.observe({ operation, collection: collectionName }, docs.length)
                      })
                    } else if (Array.isArray(queryResult)) {
                      operationMetrics.documentsReturned.observe({ operation, collection: collectionName }, queryResult.length)
                    } else if (queryResult) {
                      operationMetrics.documentsReturned.observe({ operation, collection: collectionName }, 1)
                    }
                  }
                  
                  return queryResult
                })
                .catch((error: Error) => {
                  operationMetrics.operationsTotal.inc({ operation, collection: collectionName, status: 'error' })
                  operationMetrics.operationErrors.inc({ operation, collection: collectionName, error_type: error.name || 'unknown' })
                  throw error
                })
                .finally(() => {
                  timer()
                })
            } else {
              // Synchronous result
              timer()
              operationMetrics.operationsTotal.inc({ operation, collection: collectionName, status: 'success' })
              return result
            }
          }
        }
      })

      return collection
    }

    // Wrap database collection method
    const originalCollection = client.db?.bind(client)
    if (originalCollection) {
      client.db = (...args: any[]) => {
        const database = originalCollection(...args)
        const originalDbCollection = database.collection?.bind(database)
        
        if (originalDbCollection) {
          database.collection = (name: string, options?: any) => {
            const collection = originalDbCollection(name, options)
            return wrapCollection(collection)
          }
        }
        
        return database
      }
    }

    return client
  }

  /**
   * Utility for tracking MongoDB aggregation pipeline metrics
   */
  trackAggregation = () => {
    return {
      pipelineStages: this.metrics.getCounter('mongodb_aggregation_pipeline_stages_total', 'MongoDB aggregation pipeline stages executed', ['stage_type', 'collection']),
      pipelineDuration: this.metrics.getHistogram('mongodb_aggregation_pipeline_duration_seconds', 'MongoDB aggregation pipeline duration', ['collection'], [0.01, 0.1, 1, 5, 10, 30]),
      documentsProcessed: this.metrics.getHistogram('mongodb_aggregation_documents_processed', 'MongoDB aggregation documents processed', ['collection'], [1, 10, 100, 1000, 10000]),
      memoryUsage: this.metrics.getGauge('mongodb_aggregation_memory_usage_bytes', 'MongoDB aggregation memory usage', ['collection'])
    }
  }

  /**
   * Utility for tracking MongoDB GridFS metrics
   */
  trackGridFS = () => {
    return {
      filesUploaded: this.metrics.getCounter('mongodb_gridfs_files_uploaded_total', 'MongoDB GridFS files uploaded', ['bucket']),
      filesDownloaded: this.metrics.getCounter('mongodb_gridfs_files_downloaded_total', 'MongoDB GridFS files downloaded', ['bucket']),
      uploadDuration: this.metrics.getHistogram('mongodb_gridfs_upload_duration_seconds', 'MongoDB GridFS upload duration', ['bucket']),
      downloadDuration: this.metrics.getHistogram('mongodb_gridfs_download_duration_seconds', 'MongoDB GridFS download duration', ['bucket']),
      fileSize: this.metrics.getHistogram('mongodb_gridfs_file_size_bytes', 'MongoDB GridFS file size', ['bucket'], [1024, 10240, 102400, 1048576, 10485760, 104857600]),
      totalStorageSize: this.metrics.getGauge('mongodb_gridfs_total_storage_bytes', 'MongoDB GridFS total storage size', ['bucket'])
    }
  }
}