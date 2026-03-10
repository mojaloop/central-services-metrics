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
 * Kafka metrics utility class following Apache Kafka comprehensive metrics patterns
 */
export class KafkaMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track Kafka producer metrics (Kafka streams pattern)
   */
  trackProducer = () => {
    return {
      recordsSentTotal: this.metrics.getCounter('kafka_producer_records_sent_total', 'Records sent to Kafka', ['topic']),
      recordsSentRate: this.metrics.getGauge('kafka_producer_records_sent_rate', 'Rate of records sent per second', ['topic']),
      recordSendDuration: this.metrics.getHistogram('kafka_producer_record_send_duration_seconds', 'Time to send record', ['topic'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]),
      batchSizeAvg: this.metrics.getGauge('kafka_producer_batch_size_avg', 'Average batch size', ['topic']),
      batchSizeMax: this.metrics.getGauge('kafka_producer_batch_size_max', 'Maximum batch size', ['topic']),
      bufferAvailableBytes: this.metrics.getGauge('kafka_producer_buffer_available_bytes', 'Available buffer space'),
      bufferTotalBytes: this.metrics.getGauge('kafka_producer_buffer_total_bytes', 'Total buffer space'),
      recordsPerRequest: this.metrics.getGauge('kafka_producer_records_per_request_avg', 'Average records per request', ['topic']),
      compressionRatio: this.metrics.getGauge('kafka_producer_compression_ratio', 'Compression ratio', ['topic']),
      recordErrors: this.metrics.getCounter('kafka_producer_record_errors_total', 'Producer record errors', ['topic', 'error_type']),
      recordRetries: this.metrics.getCounter('kafka_producer_record_retries_total', 'Producer record retries', ['topic'])
    }
  }

  /**
   * Track Kafka consumer metrics (Kafka pattern)
   */
  trackConsumer = () => {
    return {
      recordsConsumedTotal: this.metrics.getCounter('kafka_consumer_records_consumed_total', 'Records consumed from Kafka', ['topic']),
      recordsLagMax: this.metrics.getGauge('kafka_consumer_records_lag_max', 'Maximum consumer lag', ['topic', 'partition']),
      recordsLagSum: this.metrics.getGauge('kafka_consumer_records_lag_sum', 'Total consumer lag', ['topic']),
      fetchLatencyAvg: this.metrics.getGauge('kafka_consumer_fetch_latency_avg_ms', 'Average fetch latency'),
      fetchLatencyMax: this.metrics.getGauge('kafka_consumer_fetch_latency_max_ms', 'Maximum fetch latency'),
      fetchSizeAvg: this.metrics.getGauge('kafka_consumer_fetch_size_avg', 'Average fetch size', ['topic']),
      fetchSizeMax: this.metrics.getGauge('kafka_consumer_fetch_size_max', 'Maximum fetch size', ['topic']),
      bytesConsumedRate: this.metrics.getGauge('kafka_consumer_bytes_consumed_rate', 'Bytes consumed per second', ['topic']),
      recordsConsumedRate: this.metrics.getGauge('kafka_consumer_records_consumed_rate', 'Records consumed per second', ['topic']),
      commitLatency: this.metrics.getHistogram('kafka_consumer_commit_latency_seconds', 'Offset commit latency', [], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]),
      commitErrors: this.metrics.getCounter('kafka_consumer_commit_errors_total', 'Commit errors', ['error_type']),
      rebalanceTotal: this.metrics.getCounter('kafka_consumer_rebalance_total', 'Consumer rebalances', ['type'])
    }
  }

  /**
   * Track Kafka connection and network metrics (Kafka common pattern)
   */
  trackConnections = () => {
    return {
      connectionCloseRate: this.metrics.getGauge('kafka_connection_close_rate', 'Connection close rate'),
      connectionCreationRate: this.metrics.getGauge('kafka_connection_creation_rate', 'Connection creation rate'),
      connectionCount: this.metrics.getGauge('kafka_connection_count', 'Active connection count'),
      networkIoRate: this.metrics.getGauge('kafka_network_io_rate', 'Network I/O rate'),
      ioWaitTimeAvg: this.metrics.getGauge('kafka_io_wait_time_avg_ns', 'Average I/O wait time'),
      requestLatencyAvg: this.metrics.getGauge('kafka_request_latency_avg_ms', 'Average request latency', ['request_type']),
      requestLatencyMax: this.metrics.getGauge('kafka_request_latency_max_ms', 'Maximum request latency', ['request_type']),
      requestsInFlight: this.metrics.getGauge('kafka_requests_in_flight', 'Requests in flight'),
      requestErrors: this.metrics.getCounter('kafka_request_errors_total', 'Request errors', ['request_type', 'error_type'])
    }
  }

  /**
   * Track Kafka topic and partition metrics
   */
  trackTopics = () => {
    return {
      topicCount: this.metrics.getGauge('kafka_topic_count', 'Number of topics'),
      partitionCount: this.metrics.getGauge('kafka_partition_count', 'Number of partitions', ['topic']),
      partitionSize: this.metrics.getGauge('kafka_partition_size_bytes', 'Partition size in bytes', ['topic', 'partition']),
      partitionMessages: this.metrics.getGauge('kafka_partition_messages', 'Number of messages in partition', ['topic', 'partition']),
      replicationFactor: this.metrics.getGauge('kafka_topic_replication_factor', 'Topic replication factor', ['topic'])
    }
  }

  /**
   * Middleware for automatic Kafka producer instrumentation
   */
  instrumentProducer = (producer: any) => {
    const producerMetrics = this.trackProducer()

    const originalSend = producer.send?.bind(producer)
    if (originalSend) {
      producer.send = async (record: any) => {
        const topic = record.topic
        const timer = producerMetrics.recordSendDuration.startTimer({ topic })

        try {
          const result = await originalSend(record)
          producerMetrics.recordsSentTotal.inc({ topic })
          return result
        } catch (error: any) {
          producerMetrics.recordErrors.inc({ topic, error_type: error.name || 'unknown' })
          throw error
        } finally {
          timer()
        }
      }
    }

    return producer
  }

  /**
   * Middleware for automatic Kafka consumer instrumentation
   */
  instrumentConsumer = (consumer: any) => {
    const consumerMetrics = this.trackConsumer()

    const originalRun = consumer.run?.bind(consumer)
    if (originalRun) {
      consumer.run = (config: any) => {
        const originalEachMessage = config.eachMessage
        if (originalEachMessage) {
          config.eachMessage = async (payload: any) => {
            const { topic, partition, message } = payload
            consumerMetrics.recordsConsumedTotal.inc({ topic })

            return await originalEachMessage(payload)
          }
        }

        return originalRun(config)
      }
    }

    return consumer
  }

  /**
   * Utility to track Kafka stream processing metrics
   */
  trackStreams = () => {
    return {
      recordsProcessed: this.metrics.getCounter('kafka_streams_records_processed_total', 'Stream records processed', ['processor_node']),
      recordsDropped: this.metrics.getCounter('kafka_streams_records_dropped_total', 'Stream records dropped', ['processor_node']),
      processingRate: this.metrics.getGauge('kafka_streams_processing_rate', 'Stream processing rate', ['processor_node']),
      punctuateLatency: this.metrics.getHistogram('kafka_streams_punctuate_latency_seconds', 'Stream punctuate latency', ['processor_node']),
      stateStoreSize: this.metrics.getGauge('kafka_streams_state_store_size_bytes', 'State store size', ['store_name']),
      rebalanceLatency: this.metrics.getHistogram('kafka_streams_rebalance_latency_seconds', 'Stream rebalance latency')
    }
  }
}
