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
 * WebSocket metrics utility class specifically designed for the 'ws' library
 */
export class WebSocketMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track WebSocket connection metrics
   */
  trackConnections = () => {
    return {
      activeConnections: this.metrics.getGauge('ws_active_connections', 'Active WebSocket connections'),
      connectionsTotal: this.metrics.getCounter('ws_connections_total', 'Total WebSocket connections', ['status']),
      connectionDuration: this.metrics.getHistogram('ws_connection_duration_seconds', 'WebSocket connection duration', [], [1, 5, 10, 30, 60, 300, 600, 1800, 3600]),
      handshakeDuration: this.metrics.getHistogram('ws_handshake_duration_seconds', 'WebSocket handshake duration', [], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]),
      upgradeRequests: this.metrics.getCounter('ws_upgrade_requests_total', 'WebSocket upgrade requests', ['status']),
      maxConnections: this.metrics.getGauge('ws_max_connections', 'Maximum concurrent WebSocket connections'),
      connectionsByOrigin: this.metrics.getGauge('ws_connections_by_origin', 'Connections by origin', ['origin']),
      connectionsPerSecond: this.metrics.getGauge('ws_connections_per_second', 'Connection rate per second'),
      totalBytesReceived: this.metrics.getCounter('ws_total_bytes_received', 'Total bytes received'),
      totalBytesSent: this.metrics.getCounter('ws_total_bytes_sent', 'Total bytes sent')
    }
  }

  /**
   * Track WebSocket message metrics
   */
  trackMessages = () => {
    return {
      messagesSent: this.metrics.getCounter('ws_messages_sent_total', 'WebSocket messages sent', ['type', 'opcode']),
      messagesReceived: this.metrics.getCounter('ws_messages_received_total', 'WebSocket messages received', ['type', 'opcode']),
      messagesSentBytes: this.metrics.getCounter('ws_messages_sent_bytes_total', 'WebSocket bytes sent', ['type']),
      messagesReceivedBytes: this.metrics.getCounter('ws_messages_received_bytes_total', 'WebSocket bytes received', ['type']),
      messageSizeBytes: this.metrics.getHistogram('ws_message_size_bytes', 'WebSocket message size', ['direction'], [100, 1000, 10000, 100000, 1000000]),
      messageLatency: this.metrics.getHistogram('ws_message_roundtrip_seconds', 'WebSocket message roundtrip time', [], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]),
      messageQueue: this.metrics.getGauge('ws_message_queue_size', 'WebSocket message queue size'),
      messageDropped: this.metrics.getCounter('ws_messages_dropped_total', 'WebSocket messages dropped', ['reason']),
      fragmentedMessages: this.metrics.getCounter('ws_fragmented_messages_total', 'Fragmented WebSocket messages', ['direction']),
      compressedMessages: this.metrics.getCounter('ws_compressed_messages_total', 'Compressed WebSocket messages', ['direction'])
    }
  }

  /**
   * Track WebSocket error and performance metrics
   */
  trackErrors = () => {
    return {
      errorsTotal: this.metrics.getCounter('ws_errors_total', 'WebSocket errors', ['type', 'code']),
      disconnectsTotal: this.metrics.getCounter('ws_disconnects_total', 'WebSocket disconnections', ['code', 'reason']),
      timeouts: this.metrics.getCounter('ws_timeouts_total', 'WebSocket timeouts', ['type']),
      protocolErrors: this.metrics.getCounter('ws_protocol_errors_total', 'WebSocket protocol errors', ['error_code']),
      reconnects: this.metrics.getCounter('ws_reconnects_total', 'WebSocket reconnection attempts', ['status']),
      heartbeatMissed: this.metrics.getCounter('ws_heartbeat_missed_total', 'Missed heartbeat/ping responses'),
      compressionErrors: this.metrics.getCounter('ws_compression_errors_total', 'WebSocket compression errors'),
      extensionErrors: this.metrics.getCounter('ws_extension_errors_total', 'WebSocket extension errors', ['extension']),
      bufferOverflow: this.metrics.getCounter('ws_buffer_overflow_total', 'WebSocket buffer overflow events')
    }
  }

  /**
   * Track WebSocket performance and resource metrics
   */
  trackPerformance = () => {
    return {
      memoryUsage: this.metrics.getGauge('ws_memory_usage_bytes', 'WebSocket server memory usage'),
      cpuUsage: this.metrics.getGauge('ws_cpu_usage_ratio', 'WebSocket server CPU usage'),
      frameRate: this.metrics.getGauge('ws_frame_rate', 'WebSocket frames per second', ['direction']),
      compressionRatio: this.metrics.getGauge('ws_compression_ratio', 'WebSocket compression ratio'),
      bufferUtilization: this.metrics.getGauge('ws_buffer_utilization_ratio', 'WebSocket buffer utilization'),
      gcPressure: this.metrics.getGauge('ws_gc_pressure', 'Garbage collection pressure from WebSocket operations'),
      throughputBytesPerSecond: this.metrics.getGauge('ws_throughput_bytes_per_second', 'WebSocket throughput in bytes per second', ['direction']),
      averageFrameSize: this.metrics.getGauge('ws_average_frame_size_bytes', 'Average WebSocket frame size', ['direction']),
      backpressure: this.metrics.getGauge('ws_backpressure_bytes', 'WebSocket backpressure buffer size')
    }
  }

  /**
   * Middleware for automatic WebSocket Server instrumentation (ws library)
   */
  instrumentWebSocketServer = (wss: any, options: {
    trackPingPong?: boolean
    trackExtensions?: boolean
    trackPerformance?: boolean
  } = {}) => {
    const {
      trackPingPong = true,
      trackExtensions = true,
      trackPerformance = false
    } = options

    const connectionMetrics = this.trackConnections()
    const messageMetrics = this.trackMessages()
    const errorMetrics = this.trackErrors()
    const performanceMetrics = trackPerformance ? this.trackPerformance() : null

    let activeConnections = 0
    let totalConnections = 0
    let maxConcurrentConnections = 0

    // Track server-level metrics
    const serverStartTime = Date.now()
    connectionMetrics.connectionsTotal.inc({ status: 'server_started' })

    wss.on('connection', (ws: any, request: any) => {
      const connectionStartTime = Date.now()
      activeConnections++
      totalConnections++

      if (activeConnections > maxConcurrentConnections) {
        maxConcurrentConnections = activeConnections
        connectionMetrics.maxConnections.set(maxConcurrentConnections)
      }

      connectionMetrics.activeConnections.set(activeConnections)
      connectionMetrics.connectionsTotal.inc({ status: 'opened' })

      // Track connection by origin
      const origin = request.headers.origin || 'unknown'
      connectionMetrics.connectionsByOrigin.inc({ origin })

      // Track handshake duration
      const handshakeDuration = (Date.now() - connectionStartTime) / 1000
      connectionMetrics.handshakeDuration.observe(handshakeDuration)

      // Message event handlers
      ws.on('message', (data: Buffer, isBinary: boolean) => {
        const messageType = isBinary ? 'binary' : 'text'
        const messageSize = data.length
        const opcode = isBinary ? '0x2' : '0x1' // Binary or Text frame

        messageMetrics.messagesReceived.inc({ type: messageType, opcode })
        messageMetrics.messagesReceivedBytes.inc({ type: messageType }, messageSize)
        messageMetrics.messageSizeBytes.observe({ direction: 'inbound' }, messageSize)
        connectionMetrics.totalBytesReceived.inc(messageSize)

        // Track fragmented messages if enabled
        if (trackExtensions && ws._fragments && ws._fragments.length > 1) {
          messageMetrics.fragmentedMessages.inc({ direction: 'inbound' })
        }

        // Track compressed messages
        if (trackExtensions && ws._permessageDeflate && ws._permessageDeflate._isServer) {
          messageMetrics.compressedMessages.inc({ direction: 'inbound' })
        }
      })

      // Ping/Pong tracking
      if (trackPingPong) {
        const pingMetrics = this.trackHeartbeat()

        ws.on('ping', (data: Buffer) => {
          pingMetrics.pingSent.inc()
          ws.pong(data)
        })

        ws.on('pong', (data: Buffer) => {
          pingMetrics.pongReceived.inc()
          // Calculate ping latency if timestamp was included
          try {
            const timestamp = parseInt(data.toString())
            if (!isNaN(timestamp)) {
              const latency = (Date.now() - timestamp) / 1000
              pingMetrics.pingLatency.observe(latency)
            }
          } catch (e) {
            // Ignore parsing errors
          }
        })
      }

      // Override send method to track outbound messages
      const originalSend = ws.send.bind(ws)
      ws.send = function(data: any, options: any = {}, callback?: (error?: Error) => void) {
        const isBinary = options.binary || Buffer.isBuffer(data) || data instanceof ArrayBuffer
        const messageType = isBinary ? 'binary' : 'text'
        const messageSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data.toString(), 'utf8')
        const opcode = isBinary ? '0x2' : '0x1'

        messageMetrics.messagesSent.inc({ type: messageType, opcode })
        messageMetrics.messagesSentBytes.inc({ type: messageType }, messageSize)
        messageMetrics.messageSizeBytes.observe({ direction: 'outbound' }, messageSize)
        connectionMetrics.totalBytesSent.inc(messageSize)

        // Track fragmentation and compression
        if (trackExtensions) {
          if (options.fin === false) {
            messageMetrics.fragmentedMessages.inc({ direction: 'outbound' })
          }

          if (options.compress !== false && ws._permessageDeflate) {
            messageMetrics.compressedMessages.inc({ direction: 'outbound' })
          }
        }

        return originalSend(data, options, callback)
      }

      // Error handling
      ws.on('error', (error: Error) => {
        const errorType = error.name || 'unknown'
        const errorCode = (error as any).code || 'unknown'
        errorMetrics.errorsTotal.inc({ type: errorType, code: errorCode })
      })

      // Connection close handling
      ws.on('close', (code: number, reason: Buffer) => {
        activeConnections--
        const duration = (Date.now() - connectionStartTime) / 1000
        const reasonString = reason.toString() || 'normal_closure'

        connectionMetrics.activeConnections.set(activeConnections)
        connectionMetrics.connectionsTotal.inc({ status: 'closed' })
        connectionMetrics.connectionDuration.observe(duration)
        errorMetrics.disconnectsTotal.inc({ code: code.toString(), reason: reasonString })
      })

      // Track WebSocket extensions if enabled
      if (trackExtensions && ws.extensions) {
        Object.keys(ws.extensions).forEach(extName => {
          const extMetric = errorMetrics.extensionErrors
          // Could track extension-specific metrics here
        })
      }
    })

    // Server error handling
    wss.on('error', (error: Error) => {
      errorMetrics.errorsTotal.inc({ type: 'server_error', code: (error as any).code || 'unknown' })
    })

    // Performance monitoring (if enabled)
    if (performanceMetrics && trackPerformance) {
      const performanceInterval = setInterval(() => {
        // Track memory usage
        const memUsage = process.memoryUsage()
        performanceMetrics.memoryUsage.set(memUsage.heapUsed)

        // Track connections per second
        const uptime = (Date.now() - serverStartTime) / 1000
        const connectionsPerSecond = totalConnections / uptime
        connectionMetrics.connectionsPerSecond.set(connectionsPerSecond)

        // Track buffer utilization for each client
        let totalBackpressure = 0
        wss.clients.forEach((client: any) => {
          if (client.bufferedAmount) {
            totalBackpressure += client.bufferedAmount
          }
        })
        if (performanceMetrics.backpressure) {
          performanceMetrics.backpressure.set(totalBackpressure)
        }
      }, 5000) // Update every 5 seconds

      // Clean up interval when server closes
      wss.on('close', () => {
        clearInterval(performanceInterval)
      })
    }

    return wss
  }

  /**
   * Utility for tracking WebSocket client metrics (ws library)
   */
  instrumentWebSocketClient = (ws: any, options: {
    trackPingPong?: boolean
    enablePingInterval?: number
  } = {}) => {
    const {
      trackPingPong = true,
      enablePingInterval = 30000 // 30 seconds
    } = options

    const connectionMetrics = this.trackConnections()
    const messageMetrics = this.trackMessages()
    const errorMetrics = this.trackErrors()

    const startTime = Date.now()
    let pingInterval: ReturnType<typeof setTimeout> | null = null

    ws.on('open', () => {
      const handshakeDuration = (Date.now() - startTime) / 1000
      connectionMetrics.handshakeDuration.observe(handshakeDuration)
      connectionMetrics.connectionsTotal.inc({ status: 'opened' })

      // Start ping interval if enabled
      if (trackPingPong && enablePingInterval > 0) {
        pingInterval = setInterval(() => {
          if (ws.readyState === ws.OPEN) {
            const timestamp = Date.now().toString()
            ws.ping(Buffer.from(timestamp))

            const pingMetrics = this.trackHeartbeat()
            pingMetrics.pingSent.inc()
          }
        }, enablePingInterval)
      }
    })

    ws.on('message', (data: Buffer, isBinary: boolean) => {
      const messageType = isBinary ? 'binary' : 'text'
      const messageSize = data.length
      const opcode = isBinary ? '0x2' : '0x1'

      messageMetrics.messagesReceived.inc({ type: messageType, opcode })
      messageMetrics.messageSizeBytes.observe({ direction: 'inbound' }, messageSize)
    })

    // Ping/Pong handling for client
    if (trackPingPong) {
      const pingMetrics = this.trackHeartbeat()

      ws.on('ping', (data: Buffer) => {
        ws.pong(data)
      })

      ws.on('pong', (data: Buffer) => {
        pingMetrics.pongReceived.inc()

        try {
          const timestamp = parseInt(data.toString())
          if (!isNaN(timestamp)) {
            const latency = (Date.now() - timestamp) / 1000
            pingMetrics.pingLatency.observe(latency)
          }
        } catch (e) {
          // Ignore parsing errors
        }
      })
    }

    // Override send method
    const originalSend = ws.send.bind(ws)
    ws.send = function(data: any, options: any = {}, callback?: (error?: Error) => void) {
      const isBinary = options.binary || Buffer.isBuffer(data) || data instanceof ArrayBuffer
      const messageType = isBinary ? 'binary' : 'text'
      const opcode = isBinary ? '0x2' : '0x1'

      messageMetrics.messagesSent.inc({ type: messageType, opcode })
      return originalSend(data, options, callback)
    }

    ws.on('error', (error: Error) => {
      const errorType = error.name || 'unknown'
      const errorCode = (error as any).code || 'unknown'
      errorMetrics.errorsTotal.inc({ type: errorType, code: errorCode })
    })

    ws.on('close', (code: number, reason: string) => {
      const duration = (Date.now() - startTime) / 1000
      connectionMetrics.connectionDuration.observe(duration)
      connectionMetrics.connectionsTotal.inc({ status: 'closed' })
      errorMetrics.disconnectsTotal.inc({ code: code.toString(), reason: reason || 'normal_closure' })

      if (pingInterval) {
        clearInterval(pingInterval)
      }
    })

    return ws
  }

  /**
   * Utility for tracking WebSocket ping/pong heartbeat metrics
   */
  trackHeartbeat = () => {
    return {
      pingSent: this.metrics.getCounter('ws_ping_sent_total', 'WebSocket ping frames sent'),
      pongReceived: this.metrics.getCounter('ws_pong_received_total', 'WebSocket pong frames received'),
      pingLatency: this.metrics.getHistogram('ws_ping_latency_seconds', 'WebSocket ping-pong latency', [], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1])
    }
  }

  /**
   * Utility for tracking WebSocket per-message-deflate compression metrics
   */
  trackCompression = () => {
    return {
      compressionRatio: this.metrics.getGauge('ws_compression_ratio_current', 'Current WebSocket compression ratio'),
      compressionSavings: this.metrics.getCounter('ws_compression_savings_bytes_total', 'Total bytes saved by compression'),
      decompressionTime: this.metrics.getHistogram('ws_decompression_duration_seconds', 'Time spent decompressing messages'),
      compressionTime: this.metrics.getHistogram('ws_compression_duration_seconds', 'Time spent compressing messages')
    }
  }
}
