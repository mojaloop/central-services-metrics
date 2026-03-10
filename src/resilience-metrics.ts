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
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 0,
  OPEN = 1,
  HALF_OPEN = 2
}

/**
 * Circuit breaker metrics utility class following Netflix resilience patterns
 */
export class CircuitBreakerMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track circuit breaker state and performance metrics (Netflix pattern)
   */
  trackCircuitBreaker = (circuitName: string) => {
    return {
      state: this.metrics.getGauge('circuit_breaker_state', 'Circuit breaker current state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)', ['circuit']),
      successRate: this.metrics.getGauge('circuit_breaker_success_rate', 'Circuit breaker success rate', ['circuit']),
      failureRate: this.metrics.getGauge('circuit_breaker_failure_rate', 'Circuit breaker failure rate', ['circuit']),
      callsTotal: this.metrics.getCounter('circuit_breaker_calls_total', 'Circuit breaker total calls', ['circuit', 'status']),
      stateTransitions: this.metrics.getCounter('circuit_breaker_state_transitions_total', 'Circuit breaker state transitions', ['circuit', 'from_state', 'to_state']),
      timeInState: this.metrics.getHistogram('circuit_breaker_time_in_state_seconds', 'Time spent in each state', ['circuit', 'state'], [0.1, 1, 5, 10, 30, 60, 300, 600]),
      requestsRejected: this.metrics.getCounter('circuit_breaker_requests_rejected_total', 'Requests rejected by circuit breaker', ['circuit']),
      requestLatency: this.metrics.getHistogram('circuit_breaker_request_latency_seconds', 'Request latency through circuit breaker', ['circuit', 'status'], [0.001, 0.01, 0.1, 1, 5]),
      timeoutCount: this.metrics.getCounter('circuit_breaker_timeouts_total', 'Circuit breaker timeout events', ['circuit']),
      fallbackExecutions: this.metrics.getCounter('circuit_breaker_fallback_executions_total', 'Circuit breaker fallback executions', ['circuit', 'status'])
    }
  }

  /**
   * Utility decorator for instrumenting functions with circuit breaker metrics
   */
  instrumentCircuitBreaker = <T extends (...args: any[]) => any>(
    circuitName: string,
    fn: T,
    options: {
      timeout?: number
      fallback?: (...args: Parameters<T>) => ReturnType<T>
    } = {}
  ): T => {
    const cbMetrics = this.trackCircuitBreaker(circuitName)
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const startTime = Date.now()
      
      return new Promise((resolve, reject) => {
        cbMetrics.callsTotal.inc({ circuit: circuitName, status: 'attempted' })
        
        const timer = cbMetrics.requestLatency.startTimer({ circuit: circuitName, status: 'success' })
        
        try {
          const result = fn(...args)
          
          if (result instanceof Promise) {
            result
              .then((value) => {
                cbMetrics.callsTotal.inc({ circuit: circuitName, status: 'success' })
                resolve(value)
              })
              .catch((error) => {
                cbMetrics.callsTotal.inc({ circuit: circuitName, status: 'failure' })
                
                if (options.fallback) {
                  try {
                    const fallbackResult = options.fallback(...args)
                    cbMetrics.fallbackExecutions.inc({ circuit: circuitName, status: 'success' })
                    resolve(fallbackResult)
                  } catch (fallbackError) {
                    cbMetrics.fallbackExecutions.inc({ circuit: circuitName, status: 'failure' })
                    reject(error)
                  }
                } else {
                  reject(error)
                }
              })
              .finally(() => {
                timer()
              })
          } else {
            cbMetrics.callsTotal.inc({ circuit: circuitName, status: 'success' })
            timer()
            resolve(result)
          }
        } catch (error) {
          cbMetrics.callsTotal.inc({ circuit: circuitName, status: 'failure' })
          timer()
          
          if (options.fallback) {
            try {
              const fallbackResult = options.fallback(...args)
              cbMetrics.fallbackExecutions.inc({ circuit: circuitName, status: 'success' })
              resolve(fallbackResult)
            } catch (fallbackError) {
              cbMetrics.fallbackExecutions.inc({ circuit: circuitName, status: 'failure' })
              reject(error)
            }
          } else {
            reject(error)
          }
        }
        
        // Handle timeout
        if (options.timeout) {
          setTimeout(() => {
            cbMetrics.timeoutCount.inc({ circuit: circuitName })
            cbMetrics.callsTotal.inc({ circuit: circuitName, status: 'timeout' })
            reject(new Error(`Circuit breaker timeout after ${options.timeout}ms`))
          }, options.timeout)
        }
      }) as ReturnType<T>
    }) as T
  }

  /**
   * Utility for updating circuit breaker state metrics
   */
  updateState = (circuitName: string, newState: CircuitBreakerState, oldState?: CircuitBreakerState) => {
    const cbMetrics = this.trackCircuitBreaker(circuitName)
    
    cbMetrics.state.set({ circuit: circuitName }, newState)
    
    if (oldState !== undefined) {
      cbMetrics.stateTransitions.inc({
        circuit: circuitName,
        from_state: CircuitBreakerState[oldState],
        to_state: CircuitBreakerState[newState]
      })
    }
  }
}

/**
 * Health check metrics utility class following Netflix and Kafka patterns
 */
export class HealthCheckMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track health check metrics for services
   */
  trackHealthCheck = () => {
    return {
      healthCheckDuration: this.metrics.getHistogram('health_check_duration_seconds', 'Health check execution duration', ['service', 'check_type'], [0.001, 0.01, 0.1, 1, 5]),
      healthCheckSuccess: this.metrics.getCounter('health_check_success_total', 'Successful health checks', ['service', 'check_type']),
      healthCheckFailure: this.metrics.getCounter('health_check_failure_total', 'Failed health checks', ['service', 'check_type']),
      serviceUp: this.metrics.getGauge('service_up', 'Service availability (1=up, 0=down)', ['service']),
      serviceHealth: this.metrics.getGauge('service_health_score', 'Service health score (0-1)', ['service']),
      dependencyUp: this.metrics.getGauge('dependency_up', 'Dependency availability (1=up, 0=down)', ['service', 'dependency']),
      checkInterval: this.metrics.getGauge('health_check_interval_seconds', 'Health check execution interval', ['service', 'check_type']),
      lastSuccessTime: this.metrics.getGauge('health_check_last_success_timestamp', 'Last successful health check timestamp', ['service']),
      consecutiveFailures: this.metrics.getGauge('health_check_consecutive_failures', 'Consecutive health check failures', ['service'])
    }
  }

  /**
   * Middleware for automatic health check instrumentation
   */
  instrumentHealthCheck = <T extends (...args: any[]) => any>(
    serviceName: string,
    checkType: string,
    healthCheckFn: T
  ): T => {
    const healthMetrics = this.trackHealthCheck()
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const timer = healthMetrics.healthCheckDuration.startTimer({ service: serviceName, check_type: checkType })
      
      try {
        const result = healthCheckFn(...args)
        
        if (result instanceof Promise) {
          return result
            .then((value) => {
              healthMetrics.healthCheckSuccess.inc({ service: serviceName, check_type: checkType })
              healthMetrics.serviceUp.set({ service: serviceName }, 1)
              healthMetrics.lastSuccessTime.set({ service: serviceName }, Date.now() / 1000)
              healthMetrics.consecutiveFailures.set({ service: serviceName }, 0)
              return value
            })
            .catch((error) => {
              healthMetrics.healthCheckFailure.inc({ service: serviceName, check_type: checkType })
              healthMetrics.serviceUp.set({ service: serviceName }, 0)
              healthMetrics.consecutiveFailures.inc({ service: serviceName })
              throw error
            })
            .finally(() => {
              timer()
            }) as ReturnType<T>
        } else {
          healthMetrics.healthCheckSuccess.inc({ service: serviceName, check_type: checkType })
          healthMetrics.serviceUp.set({ service: serviceName }, 1)
          healthMetrics.lastSuccessTime.set({ service: serviceName }, Date.now() / 1000)
          healthMetrics.consecutiveFailures.set({ service: serviceName }, 0)
          timer()
          return result
        }
      } catch (error) {
        healthMetrics.healthCheckFailure.inc({ service: serviceName, check_type: checkType })
        healthMetrics.serviceUp.set({ service: serviceName }, 0)
        healthMetrics.consecutiveFailures.inc({ service: serviceName })
        timer()
        throw error
      }
    }) as T
  }

  /**
   * Utility for tracking dependency health
   */
  trackDependency = (serviceName: string, dependencyName: string, isHealthy: boolean) => {
    const healthMetrics = this.trackHealthCheck()
    healthMetrics.dependencyUp.set({ service: serviceName, dependency: dependencyName }, isHealthy ? 1 : 0)
  }

  /**
   * Utility for calculating and updating service health score
   */
  updateHealthScore = (serviceName: string, score: number) => {
    const healthMetrics = this.trackHealthCheck()
    const normalizedScore = Math.max(0, Math.min(1, score))
    healthMetrics.serviceHealth.set({ service: serviceName }, normalizedScore)
  }
}

/**
 * Rate limiting metrics utility class
 */
export class RateLimitMetrics {
  private readonly metrics: Metrics

  constructor (metrics: Metrics) {
    this.metrics = metrics
  }

  /**
   * Track rate limiting metrics
   */
  trackRateLimit = () => {
    return {
      requestsAllowed: this.metrics.getCounter('rate_limit_requests_allowed_total', 'Rate limit requests allowed', ['limiter', 'key']),
      requestsRejected: this.metrics.getCounter('rate_limit_requests_rejected_total', 'Rate limit requests rejected', ['limiter', 'key', 'reason']),
      currentTokens: this.metrics.getGauge('rate_limit_current_tokens', 'Rate limit current token count', ['limiter', 'key']),
      maxTokens: this.metrics.getGauge('rate_limit_max_tokens', 'Rate limit maximum token count', ['limiter']),
      refillRate: this.metrics.getGauge('rate_limit_refill_rate', 'Rate limit token refill rate', ['limiter']),
      bucketFillRatio: this.metrics.getGauge('rate_limit_bucket_fill_ratio', 'Rate limit bucket fill ratio (0-1)', ['limiter', 'key']),
      windowUtilization: this.metrics.getGauge('rate_limit_window_utilization', 'Rate limit window utilization', ['limiter', 'key'])
    }
  }

  /**
   * Middleware for automatic rate limiting instrumentation
   */
  instrumentRateLimit = (limiterName: string, key: string = 'default') => {
    const rateLimitMetrics = this.trackRateLimit()
    
    return {
      allowed: () => {
        rateLimitMetrics.requestsAllowed.inc({ limiter: limiterName, key })
      },
      rejected: (reason: string = 'exceeded') => {
        rateLimitMetrics.requestsRejected.inc({ limiter: limiterName, key, reason })
      },
      updateTokens: (current: number, max: number) => {
        rateLimitMetrics.currentTokens.set({ limiter: limiterName, key }, current)
        rateLimitMetrics.maxTokens.set({ limiter: limiterName }, max)
        rateLimitMetrics.bucketFillRatio.set({ limiter: limiterName, key }, current / max)
      }
    }
  }
}