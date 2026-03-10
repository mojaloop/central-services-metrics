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
 * Middleware utilities for various frameworks following Next.js and Express patterns
 */
export class MiddlewareMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track HTTP middleware metrics (Next.js/Express inspired)
   */
  trackHTTP = () => {
    return {
      requestsTotal: this.metrics.getCounter('http_requests_total', 'Total HTTP requests', ['method', 'route', 'status_code']),
      requestDuration: this.metrics.getHistogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'route'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
      requestSizeBytes: this.metrics.getHistogram('http_request_size_bytes', 'HTTP request body size', ['method'], [100, 1000, 10000, 100000, 1000000]),
      responseSizeBytes: this.metrics.getHistogram('http_response_size_bytes', 'HTTP response body size', ['method'], [100, 1000, 10000, 100000, 1000000]),
      activeRequests: this.metrics.getGauge('http_requests_active', 'Currently active HTTP requests', ['method']),
      requestsPerRoute: this.metrics.getCounter('http_requests_per_route_total', 'Requests per route', ['route']),
      slowRequests: this.metrics.getCounter('http_slow_requests_total', 'Slow HTTP requests', ['method', 'route']),
      errorsByType: this.metrics.getCounter('http_errors_by_type_total', 'HTTP errors by type', ['error_type', 'route']),
      rateLimitHits: this.metrics.getCounter('http_rate_limit_hits_total', 'Rate limit hits', ['route', 'client_ip'])
    }
  }

  /**
   * Express/Connect middleware for HTTP metrics
   */
  expressMiddleware = (options: {
    slowRequestThreshold?: number
    collectRequestSize?: boolean
    collectResponseSize?: boolean
    pathNormalizer?: (path: string) => string
  } = {}) => {
    const {
      slowRequestThreshold = 1000, // 1 second
      collectRequestSize = true,
      collectResponseSize = true,
      pathNormalizer = (path: string) => path
    } = options

    const httpMetrics = this.trackHTTP()

    return (req: any, res: any, next: any) => {
      const startTime = Date.now()
      const method = req.method
      let route = pathNormalizer(req.route?.path || req.path || req.url || 'unknown')

      // Track active requests
      httpMetrics.activeRequests.inc({ method })

      // Track request size
      if (collectRequestSize && req.headers['content-length']) {
        const requestSize = parseInt(req.headers['content-length'], 10)
        httpMetrics.requestSizeBytes.observe({ method }, requestSize)
      }

      // Hook into response finish event
      res.on('finish', () => {
        const duration = Date.now() - startTime
        const statusCode = res.statusCode.toString()
        
        // Update route if it was determined during routing
        if (req.route?.path) {
          route = pathNormalizer(req.route.path)
        }

        // Track basic metrics
        httpMetrics.requestsTotal.inc({ method, route, status_code: statusCode })
        httpMetrics.requestDuration.observe({ method, route }, duration / 1000)
        httpMetrics.activeRequests.dec({ method })
        httpMetrics.requestsPerRoute.inc({ route })

        // Track slow requests
        if (duration > slowRequestThreshold) {
          httpMetrics.slowRequests.inc({ method, route })
        }

        // Track response size
        if (collectResponseSize && res.get('content-length')) {
          const responseSize = parseInt(res.get('content-length'), 10)
          httpMetrics.responseSizeBytes.observe({ method }, responseSize)
        }
      })

      // Track errors
      res.on('error', (error: Error) => {
        httpMetrics.errorsByType.inc({ error_type: error.name || 'unknown', route })
        httpMetrics.activeRequests.dec({ method })
      })

      next()
    }
  }

  /**
   * Koa middleware for HTTP metrics
   */
  koaMiddleware = (options: {
    slowRequestThreshold?: number
    pathNormalizer?: (path: string) => string
  } = {}) => {
    const {
      slowRequestThreshold = 1000,
      pathNormalizer = (path: string) => path
    } = options

    const httpMetrics = this.trackHTTP()

    return async (ctx: any, next: any) => {
      const startTime = Date.now()
      const method = ctx.method
      let route = pathNormalizer(ctx.path || 'unknown')

      httpMetrics.activeRequests.inc({ method })

      // Track request size
      if (ctx.length) {
        httpMetrics.requestSizeBytes.observe({ method }, ctx.length)
      }

      try {
        await next()

        const duration = Date.now() - startTime
        const statusCode = ctx.status.toString()

        // Update route if available
        if (ctx.routePath) {
          route = pathNormalizer(ctx.routePath)
        }

        httpMetrics.requestsTotal.inc({ method, route, status_code: statusCode })
        httpMetrics.requestDuration.observe({ method, route }, duration / 1000)
        httpMetrics.requestsPerRoute.inc({ route })

        if (duration > slowRequestThreshold) {
          httpMetrics.slowRequests.inc({ method, route })
        }

        // Track response size
        if (ctx.response.length) {
          httpMetrics.responseSizeBytes.observe({ method }, ctx.response.length)
        }
      } catch (error: any) {
        httpMetrics.errorsByType.inc({ error_type: error.name || 'unknown', route })
        throw error
      } finally {
        httpMetrics.activeRequests.dec({ method })
      }
    }
  }

  /**
   * Hapi plugin for HTTP metrics
   */
  hapiPlugin = (options: {
    slowRequestThreshold?: number
    collectRequestSize?: boolean
    collectResponseSize?: boolean
    pathNormalizer?: (path: string) => string
    excludePaths?: string[]
  } = {}) => {
    const {
      slowRequestThreshold = 1000,
      collectRequestSize = true,
      collectResponseSize = true,
      pathNormalizer = (path: string) => path,
      excludePaths = ['/health', '/metrics', '/live']
    } = options

    const httpMetrics = this.trackHTTP()
    let activeConnections = 0

    return {
      name: 'metrics-middleware',
      version: '1.0.0',
      register: async (server: any) => {
        // Track connections
        const connectionsGauge = this.metrics.getGauge('hapi_connections_current', 'Current Hapi connections', ['remote_address'])

        server.listener.on('connection', (socket: any) => {
          const labels = { remote_address: socket.remoteAddress || 'unknown' }
          activeConnections++
          connectionsGauge.inc(labels)
          
          socket.on('close', () => {
            activeConnections--
            connectionsGauge.dec(labels)
          })
        })

        // Track server lifecycle
        const serverStartGauge = this.metrics.getGauge('hapi_server_start', 'Hapi server start indicator')
        serverStartGauge.set(1)

        // Request lifecycle hooks
        server.ext('onRequest', (request: any, h: any) => {
          // Skip excluded paths
          if (excludePaths.includes(request.path)) {
            return h.continue
          }

          const method = request.method.toUpperCase()
          request.app.startTime = Date.now()
          
          httpMetrics.activeRequests.inc({ method })

          // Track request size
          if (collectRequestSize && request.headers['content-length']) {
            const requestSize = parseInt(request.headers['content-length'], 10)
            httpMetrics.requestSizeBytes.observe({ method }, requestSize)
          }

          return h.continue
        })

        server.events.on('response', (request: any) => {
          // Skip excluded paths
          if (excludePaths.includes(request.path)) {
            return
          }

          const startTime = request.app.startTime || Date.now()
          const duration = Date.now() - startTime
          const method = request.method.toUpperCase()
          const statusCode = String('isBoom' in request.response 
            ? request.response.output.statusCode 
            : request.response.statusCode)

          // Normalize path
          let route = request.route ? request.route.path : request.path
          if (route === '/{p*}') {
            route = request.path
          }
          route = pathNormalizer(route)

          // Track basic metrics
          httpMetrics.requestsTotal.inc({ method, route, status_code: statusCode })
          httpMetrics.requestDuration.observe({ method, route }, duration / 1000)
          httpMetrics.activeRequests.dec({ method })
          httpMetrics.requestsPerRoute.inc({ route })

          // Track slow requests
          if (duration > slowRequestThreshold) {
            httpMetrics.slowRequests.inc({ method, route })
          }

          // Track response size
          if (collectResponseSize) {
            const responseSize = request.response.headers?.['content-length']
            if (responseSize) {
              httpMetrics.responseSizeBytes.observe({ method }, parseInt(responseSize, 10))
            }
          }

          // Track errors
          if (request.response && 'isBoom' in request.response) {
            const errorType = request.response.constructor.name || 'boom_error'
            httpMetrics.errorsByType.inc({ error_type: errorType, route })
          }
        })

        // Track server errors
        server.events.on('request', (request: any, event: any) => {
          if (event.tags?.includes('error')) {
            const route = pathNormalizer(request.route?.path || request.path || 'unknown')
            httpMetrics.errorsByType.inc({ 
              error_type: event.error?.name || 'server_error', 
              route 
            })
          }
        })

        // Additional Hapi-specific metrics
        const hapiMetrics = {
          routesRegistered: this.metrics.getGauge('hapi_routes_registered', 'Number of registered routes'),
          pluginsLoaded: this.metrics.getGauge('hapi_plugins_loaded', 'Number of loaded plugins'),
          cacheOperations: this.metrics.getCounter('hapi_cache_operations_total', 'Hapi cache operations', ['operation', 'status']),
          authAttempts: this.metrics.getCounter('hapi_auth_attempts_total', 'Authentication attempts', ['scheme', 'status']),
          validationErrors: this.metrics.getCounter('hapi_validation_errors_total', 'Validation errors', ['type', 'route'])
        }

        // Track routes and plugins after server start
        server.events.on('start', () => {
          const routes = server.table()
          hapiMetrics.routesRegistered.set(routes.length)
          
          const plugins = Object.keys(server.registrations || {})
          hapiMetrics.pluginsLoaded.set(plugins.length)
        })

        // Track cache operations if cache is configured
        if (server.cache) {
          const originalGet = server.cache.get?.bind(server.cache)
          const originalSet = server.cache.set?.bind(server.cache)
          const originalDrop = server.cache.drop?.bind(server.cache)

          if (originalGet) {
            server.cache.get = async (...args: any[]) => {
              try {
                const result = await originalGet(...args)
                hapiMetrics.cacheOperations.inc({ operation: 'get', status: result ? 'hit' : 'miss' })
                return result
              } catch (error) {
                hapiMetrics.cacheOperations.inc({ operation: 'get', status: 'error' })
                throw error
              }
            }
          }

          if (originalSet) {
            server.cache.set = async (...args: any[]) => {
              try {
                const result = await originalSet(...args)
                hapiMetrics.cacheOperations.inc({ operation: 'set', status: 'success' })
                return result
              } catch (error) {
                hapiMetrics.cacheOperations.inc({ operation: 'set', status: 'error' })
                throw error
              }
            }
          }

          if (originalDrop) {
            server.cache.drop = async (...args: any[]) => {
              try {
                const result = await originalDrop(...args)
                hapiMetrics.cacheOperations.inc({ operation: 'drop', status: 'success' })
                return result
              } catch (error) {
                hapiMetrics.cacheOperations.inc({ operation: 'drop', status: 'error' })
                throw error
              }
            }
          }
        }

        // Track authentication events
        server.events.on('request', (request: any, event: any) => {
          if (event.tags?.includes('auth')) {
            const scheme = request.auth?.strategy || 'unknown'
            const status = request.auth?.isAuthenticated ? 'success' : 'failure'
            hapiMetrics.authAttempts.inc({ scheme, status })
          }

          // Track validation errors
          if (event.tags?.includes('validation') && event.tags?.includes('error')) {
            const route = pathNormalizer(request.route?.path || request.path || 'unknown')
            const validationType = event.data?.source || 'unknown'
            hapiMetrics.validationErrors.inc({ type: validationType, route })
          }
        })
      }
    }
  }

  /**
   * Generic function decorator for measuring execution time and calls
   */
  instrumentFunction = <T extends (...args: any[]) => any>(
    functionName: string,
    fn: T,
    options: {
      labels?: Record<string, string>
      trackSuccess?: boolean
      trackErrors?: boolean
      slowThreshold?: number
    } = {}
  ): T => {
    const {
      labels = {},
      trackSuccess = true,
      trackErrors = true,
      slowThreshold = 1000
    } = options

    const functionCalls = this.metrics.getCounter('function_calls_total', 'Function calls', ['function', 'status', ...Object.keys(labels)])
    const functionDuration = this.metrics.getHistogram('function_duration_seconds', 'Function execution time', ['function', ...Object.keys(labels)], [0.001, 0.01, 0.1, 1, 5])
    const slowFunctions = this.metrics.getCounter('function_slow_calls_total', 'Slow function calls', ['function', ...Object.keys(labels)])

    return ((...args: Parameters<T>): ReturnType<T> => {
      const startTime = Date.now()
      const timer = functionDuration.startTimer({ function: functionName, ...labels })

      functionCalls.inc({ function: functionName, status: 'started', ...labels })

      try {
        const result = fn(...args)

        if (result instanceof Promise) {
          return result
            .then((value) => {
              const duration = Date.now() - startTime
              if (trackSuccess) {
                functionCalls.inc({ function: functionName, status: 'success', ...labels })
              }
              if (duration > slowThreshold) {
                slowFunctions.inc({ function: functionName, ...labels })
              }
              return value
            })
            .catch((error) => {
              if (trackErrors) {
                functionCalls.inc({ function: functionName, status: 'error', ...labels })
              }
              throw error
            })
            .finally(() => {
              timer()
            }) as ReturnType<T>
        } else {
          const duration = Date.now() - startTime
          if (trackSuccess) {
            functionCalls.inc({ function: functionName, status: 'success', ...labels })
          }
          if (duration > slowThreshold) {
            slowFunctions.inc({ function: functionName, ...labels })
          }
          timer()
          return result
        }
      } catch (error) {
        if (trackErrors) {
          functionCalls.inc({ function: functionName, status: 'error', ...labels })
        }
        timer()
        throw error
      }
    }) as T
  }

  /**
   * Method decorator for class methods
   */
  instrumentMethod = (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
    options: {
      labels?: Record<string, string>
      slowThreshold?: number
    } = {}
  ) => {
    const originalMethod = descriptor.value
    const className = target.constructor.name
    const methodName = `${className}.${propertyKey}`

    descriptor.value = this.instrumentFunction(methodName, originalMethod, options)

    return descriptor
  }

  /**
   * Utility for tracking API endpoint metrics with common patterns
   */
  trackAPIEndpoint = (endpoint: string, version: string = 'v1') => {
    return {
      requests: this.metrics.getCounter('api_requests_total', 'API requests', ['endpoint', 'version', 'method', 'status']),
      duration: this.metrics.getHistogram('api_request_duration_seconds', 'API request duration', ['endpoint', 'version', 'method'], [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
      payloadSize: this.metrics.getHistogram('api_payload_size_bytes', 'API payload size', ['endpoint', 'version', 'direction'], [100, 1000, 10000, 100000, 1000000]),
      rateLimitExceeded: this.metrics.getCounter('api_rate_limit_exceeded_total', 'API rate limit exceeded', ['endpoint', 'version']),
      authFailures: this.metrics.getCounter('api_auth_failures_total', 'API authentication failures', ['endpoint', 'version', 'reason']),
      validationErrors: this.metrics.getCounter('api_validation_errors_total', 'API validation errors', ['endpoint', 'version', 'field']),
      deprecatedUsage: this.metrics.getCounter('api_deprecated_usage_total', 'Usage of deprecated API endpoints', ['endpoint', 'version'])
    }
  }

  /**
   * Utility for tracking background job metrics
   */
  trackBackgroundJob = () => {
    return {
      jobsStarted: this.metrics.getCounter('background_jobs_started_total', 'Background jobs started', ['job_type', 'queue']),
      jobsCompleted: this.metrics.getCounter('background_jobs_completed_total', 'Background jobs completed', ['job_type', 'queue', 'status']),
      jobDuration: this.metrics.getHistogram('background_job_duration_seconds', 'Background job duration', ['job_type', 'queue'], [1, 5, 10, 30, 60, 300, 600, 1800]),
      jobsQueued: this.metrics.getGauge('background_jobs_queued', 'Background jobs in queue', ['job_type', 'queue']),
      jobsActive: this.metrics.getGauge('background_jobs_active', 'Currently running background jobs', ['job_type', 'queue']),
      jobRetries: this.metrics.getCounter('background_job_retries_total', 'Background job retry attempts', ['job_type', 'queue', 'reason']),
      jobErrors: this.metrics.getCounter('background_job_errors_total', 'Background job errors', ['job_type', 'queue', 'error_type'])
    }
  }
}