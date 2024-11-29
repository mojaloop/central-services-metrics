/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Pedro Barreto <pedrob@crosslaketech.com>
 - Rajiv Mothilal <rajivmothilal@gmail.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Shashikant Hirugade <shashikant.hirugade@modusbox.com>

 --------------
 ******/

'use strict'

import client = require('prom-client')
import { type Server } from '@hapi/hapi'

/**
 * Type that represents the options that are required for setup
 */
interface metricOptionsType {
  timeout: number
  prefix: string
  defaultLabels?: Map<string, string>
  register?: client.Registry
  defaultMetrics?: boolean
  maxConnections?: number
  maxRequestsPending?: number
}

/**
 * Type that represents the options that are required to setup the prom-client specifically
 */
interface normalisedMetricOptionsType {
  timeout: number
  prefix: string
}

/**
 * Object that holds the histogram values
 */
// Required for Prom-Client v12.x
// type histogramsType = { [key: string]: client.Histogram<string> }
// type summariesType = { [key: string]: client.Summary<string> }

export interface histogramsType { [key: string]: client.Histogram<string> }
export interface summariesType { [key: string]: client.Summary<string> }
export interface gaugesType { [key: string]: client.Gauge<string> }

/** Wrapper class for prom-client. */
class Metrics {
  /** To make sure the setup is run only once */
  private _alreadySetup: boolean = false

  /** The options passed to the setup */
  private _options: metricOptionsType = { prefix: '', timeout: 0, maxConnections: 0, maxRequestsPending: 0 }

  /** Object containing the default registry */
  private _register: client.Registry = client.register

  /** Object containing the histogram values */
  private _histograms: histogramsType = {}

  /** Object containing the summaries values */
  private _summaries: summariesType = {}

  /**
     * Setup the prom client for collecting metrics using the options passed
     */
  setup = (options: metricOptionsType): boolean => {
    if (this._alreadySetup) {
      client.AggregatorRegistry.setRegistries(this.getDefaultRegister())
      return false
    }
    this._options = options
    // map the options to the normalised options specific to the prom-client
    const normalisedOptions: normalisedMetricOptionsType = {
      prefix: this._options.prefix,
      timeout: this._options.timeout
    }
    if (this._options.defaultLabels !== undefined) {
      client.register.setDefaultLabels(this._options.defaultLabels)
    }

    // configure detault metrics
    if (options.defaultMetrics !== false) client.collectDefaultMetrics(normalisedOptions)

    // set default registry
    // client.AggregatorRegistry.setRegistries(this.getDefaultRegister())
    this._register = client.register

    // set setup flag
    this._alreadySetup = true

    // return true if we are setup
    return true
  }

  /**
     * Get the histogram values for given name
     */
  // getHistogram = (name: string, help?: string, labelNames?: string[], buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 5]): client.Histogram<string> => { // <-- required for Prom-Client v12.x
  getHistogram = (name: string, help?: string, labelNames?: string[], buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 5]): client.Histogram<string> => { // <-- required for Prom-Client v11.x
    try {
      if (this._histograms[name] != null) {
        return this._histograms[name]
      }
      this._histograms[name] = new client.Histogram({
        name: `${this.getOptions().prefix}${name}`,
        help: (help != null ? help : `${name}_histogram`),
        labelNames,
        buckets // this is in seconds - the startTimer().end() collects in seconds with ms precision
      })
      return this._histograms[name]
    } catch (e) {
      throw new Error(`Couldn't get metrics histogram for ${name}`)
    }
  }

  /**
     * Get the summary for given name
     */
  // getSummary = (name: string, help?: string, labelNames?: string[], percentiles: number[] = [ 0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999], maxAgeSeconds: number = 600, ageBuckets: number = 5): client.Summary<string> => { // <-- required for Prom-Client v12.x
  getSummary = (name: string, help?: string, labelNames?: string[], percentiles: number[] = [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999], maxAgeSeconds: number = 600, ageBuckets: number = 5): client.Summary<string> => { // <-- required for Prom-Client v11.x
    try {
      if (this._summaries[name] != null) {
        return this._summaries[name]
      }
      this._summaries[name] = new client.Summary({
        name: `${this.getOptions().prefix}${name}`,
        help: (help != null ? help : `${name}_summary`),
        labelNames,
        maxAgeSeconds,
        percentiles,
        ageBuckets
      })
      return this._summaries[name]
    } catch (e) {
      throw new Error(`Couldn't get summary for ${name}`)
    }
  }

  /**
     * Get the metrics
     */
  getMetricsForPrometheus = async (): Promise<string> => {
    return await client.register.metrics()
  }

  /**
     * Get the options that are used to setup the prom-client
     */
  getOptions = (): metricOptionsType => {
    return this._options
  }

  /**
     * To check is it the Metrics already initiated
     */
  isInitiated = (): boolean => {
    return this._alreadySetup
  }

  getDefaultRegister = (): client.Registry => {
    return this._register
  }

  getClient = (): typeof client => {
    return client
  }

  plugin = {
    name: 'http server metrics',
    register: (server: Server) => {
      const requestCounter = new client.Counter({
        registers: [this.getDefaultRegister()],
        name: 'http_requests_total',
        help: 'Total number of http requests',
        labelNames: ['method', 'status_code', 'path']
      })
      const requestDuration = new client.Summary({
        registers: [this.getDefaultRegister()],
        name: 'http_request_duration_seconds',
        help: 'Duration of http requests',
        labelNames: ['method', 'status_code', 'path'],
        aggregator: 'average'
      })
      const requestDurationHistogram = new client.Histogram({
        registers: [this.getDefaultRegister()],
        name: 'http_request_duration_histogram_seconds',
        help: 'Duration of http requests',
        labelNames: ['method', 'status_code', 'path'],
        aggregator: 'average'
      })

      let requests = 0
      const requestsGauge = new client.Gauge({
        registers: [this.getDefaultRegister()],
        name: 'http_requests_current',
        help: 'Number of requests currently running',
        labelNames: ['method']
      })

      new client.Gauge({
        registers: [this.getDefaultRegister()],
        name: 'http_server_start',
        help: 'Start indicator for the server'
      }).inc()
      let first = true

      server.ext('onRequest', (request, h) => {
        const { maxConnections = 0, maxRequestsPending = 0 } = this.getOptions()
        if ((maxConnections > 0 || maxRequestsPending > 0) && request.path === '/health') {
          if (maxConnections > 0 && connections >= maxConnections) { return h.response('Max connections reached').code(503).takeover() }
          if (maxRequestsPending > 0 && requests >= maxRequestsPending) { return h.response('Max requests pending reached').code(503).takeover() }
        }
        if (request.path === '/live') return h.response('OK').code(200).takeover()
        if (['/metrics', '/health'].includes(request.path)) return h.continue
        requests++
        requestsGauge.inc({ method: request.method })
        return h.continue
      })

      server.events.on('response', request => {
        if (['/metrics', '/health', '/live'].includes(request.path)) return
        requests--
        requestsGauge.dec({ method: request.method })
        const path = request.route.path === '/{p*}' ? request.path : request.route.path
        const statusCode = String('isBoom' in request.response
          ? request.response.output.statusCode
          : request.response.statusCode)
        const duration = Math.max(Math.max(request.info.completed, request.info.responded) - request.info.received, 0)
        requestCounter.labels(request.method, statusCode, path).inc()
        requestDuration.labels(request.method, statusCode, path).observe(duration)
        requestDurationHistogram.labels(request.method, statusCode, path).observe(duration / 1000)
      })

      let connections = 0
      const connectionsGauge = new client.Gauge({
        registers: [this.getDefaultRegister()],
        name: 'http_connections_current',
        help: 'Number of connections currently established',
        labelNames: ['remote_address']
      })

      server.listener.on('connection', (socket) => {
        const labels = { remote_address: socket.remoteAddress }
        connections++
        connectionsGauge.inc(labels)
        socket.on('close', () => {
          connections--
          connectionsGauge.dec(labels)
        })
      })

      server.route({
        method: 'GET',
        path: '/metrics',
        handler: async (request, h) => {
          const metrics = await this.getMetricsForPrometheus()
          if (first) {
            this.getDefaultRegister().removeSingleMetric('http_server_start')
            first = false
          }
          return h.response(metrics).code(200).type('text/plain; version=0.0.4')
        },
        options: {
          tags: ['api', 'metrics'],
          description: 'Prometheus metrics endpoint',
          id: 'metrics'
        }
      })
    }
  }
}

export {
  Metrics,
  metricOptionsType
}
