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

/**
 * Type that represents the options that are required to setup the prom-client
 */
type metricOptionsType = {
  timeout: number,
  prefix: string
}
/**
 * Object that holds the histogram values
 */
type histogramsType = { [key: string]: client.Histogram }

/** Wrapper class for prom-client. */
class Metrics {
  /** To make sure the setup is run only once */
  private alreadySetup: boolean = false

  /** Object containg the histogram values */
  private histograms: histogramsType = {}

  /** The options passed to the setup */
  private options: metricOptionsType = { prefix: '', timeout: 0 }

  /**
   * Setup the prom client for collecting metrics using the options passed
   */
  setup = (options: metricOptionsType): boolean => {
    if (this.alreadySetup) {
      return false
    }
    this.options = options
    client.collectDefaultMetrics(this.options)
    client.register.metrics()
    this.alreadySetup = true
    return true
  }

  /**
   * Get the histogram values for given name
   */
  getHistogram = (name: string, help?: string, labelNames?: string[], buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 5]): client.Histogram => {
    try {
      if (this.histograms[name]) {
        return this.histograms[name]
      }
      this.histograms[name] = new client.Histogram({
        name: `${this.getOptions().prefix}${name}`,
        help: help || `${name}_histogram`,
        labelNames,
        buckets // this is in seconds - the startTimer().end() collects in seconds with ms precision
      })
      return this.histograms[name]
    } catch (e) {
      throw new Error(`Couldn't get metrics histogram for ${name}`)
    }
  }

  /**
   * Get the metrics
   */
  getMetricsForPrometheus = (): string => {
    return client.register.metrics()
  }

  /**
   * Get the options that are used to setup the prom-client
   */
  getOptions = (): metricOptionsType => {
    return this.options
  }
}

export { Metrics }
