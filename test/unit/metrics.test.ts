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
 - Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

'use strict'

const Test = require('tapes')(require('tape'))
import { Histogram } from "prom-client"
import { Metrics, metricOptionsType } from "../../src/metrics"
import { Server } from '@hapi/hapi'
import { Socket } from 'net'
import Http from 'http'

Test('Metrics Class Test', (metricsTest: any) => {

    metricsTest.test('setup should', (setupTest: any) => {
        setupTest.test('initialize the metrics object', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefix1_',
                    timeout: 1000
                }
                let result = metrics.setup(options)
                test.equal(result, true, 'Result match')
                test.deepEqual(metrics.getOptions(), options, 'Options match')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        setupTest.test('initialize the metrics object with default labels', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                let defaultLabels = new Map()
                defaultLabels.set('serviceName', 'testService')

                const options: metricOptionsType = {
                    prefix: 'prefix2_',
                    timeout: 1000,
                    defaultLabels
                }
                let result = metrics.setup(options)
                test.equal(result, true, 'Result match')
                test.deepEqual(metrics.getOptions(), options, 'Options match')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        setupTest.test('return false if setup is already initialized', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'alreadySetup_',
                    timeout: 1000
                }
                metrics.setup(options)
                let result: boolean = metrics.setup(options)
                test.equal(result, false, 'Result match')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        setupTest.end()
    })

    metricsTest.test('isInitiated should', (isInitiatedTest: any) => {
        isInitiatedTest.test('return false if metrics is not setup', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixIsInitiated1_',
                    timeout: 1000
                }

                // metrics.setup(options) <-- we skip this

                let result = metrics.isInitiated()
                test.equal(result, false, 'Metric should not be initialised')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        isInitiatedTest.test('return true if metrics is already setup', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixIsInitiated2_',
                    timeout: 1000
                }

                metrics.setup(options) // <-- we setup metrics

                let result = metrics.isInitiated()
                test.equal(result, true, 'Metric should not be initialised')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        isInitiatedTest.end()
    })

    metricsTest.test('getMetricsForPrometheus should', (getMetricsForPrometheusTest: any) => {
        getMetricsForPrometheusTest.test('return the metrics', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefix3_',
                    timeout: 1000
                }
                metrics.setup(options)
                const histTimerEnd = metrics.getHistogram(
                    'test_metric',
                    'Histogram for test metric',
                    ['test_label']
                ).startTimer()

                histTimerEnd({ test_label: 'true' })

                const expected: string = 'prefix3_test_metric_count{test_label="true"} 1'

                let result = await metrics.getMetricsForPrometheus()
                let matches = result.indexOf(expected)
                test.ok(matches != -1, 'Found the result')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getMetricsForPrometheusTest.end()
    })

    metricsTest.test('getDefaultRegister should', (getDefaultRegisterTest: any) => {
        getDefaultRegisterTest.test('return the default registry', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixGetDefaultRegisterTest1_',
                    timeout: 1000
                }
                metrics.setup(options)
                const result: any = metrics.getDefaultRegister()
                test.ok(result, 'Check result is a valid object')
                test.ok(result.contentType, 'Check contentType exists')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getDefaultRegisterTest.end()
    })

    metricsTest.test('getOptions should', (getOptionsTest: any) => {
        getOptionsTest.test('return the metrics options', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefix4_',
                    timeout: 1000
                }
                metrics.setup(options)
                const result: metricOptionsType = metrics.getOptions()
                test.equal(options, result, 'Results Match')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getOptionsTest.end()
    })

    metricsTest.test('getClient should', (getOptionsTest: any) => {
        getOptionsTest.test('return the client', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const result = metrics.getClient()
                test.ok(result, 'Return client')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getOptionsTest.end()
    })

    metricsTest.test('getHistogram should', (getHistogramTest: any) => {
        getHistogramTest.test('return the histogram', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefix5_',
                    timeout: 1000
                }
                const buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 3]
                const histogramConfig = {
                    constructor: 'Histogram',
                    name: 'prefix5_test_request',
                    help: 'Histogram for http operation',
                    aggregator: 'sum',
                    upperBounds: buckets,
                    buckets,
                    bucketValues: { '0.010': 0, '0.050': 0, '0.1': 0, '0.5': 0, '1': 0, '2': 0, '3': 0 },
                    sum: 0,
                    count: 0,
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const result: Histogram<string> = metrics.getHistogram('test_request',
                    histogramConfig.help,
                    histogramConfig.labelNames,
                    histogramConfig.buckets)
                test.equal(Object.getPrototypeOf(result).constructor.name, histogramConfig.constructor, 'Histogram object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getHistogramTest.test('return the histogram if help param is an empty string', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefix8_',
                    timeout: 100
                }
                const buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 3]
                const histogramConfig = {
                    constructor: 'Histogram',
                    name: 'prefix8_test_request',
                    help: '',
                    aggregator: 'sum',
                    upperBounds: buckets,
                    buckets,
                    bucketValues: { '1': 0, '2': 0, '3': 0, '0.01': 0, '0.05': 0, '0.1': 0, '0.5': 0 },
                    sum: 0,
                    count: 0,
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const result: object = metrics.getHistogram('test_request',
                    histogramConfig.help,
                    histogramConfig.labelNames,
                    histogramConfig.buckets)
                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get metrics histogram for test_request')
                test.end()
            }
        })

        getHistogramTest.test('return the histogram if help param are null', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefix8_1_',
                    timeout: 100
                }
                const buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 3]
                const histogramConfig = {
                    constructor: 'Histogram',
                    name: 'prefix8_1_test_request',
                    help: '',
                    aggregator: 'sum',
                    upperBounds: buckets,
                    buckets,
                    bucketValues: { '1': 0, '2': 0, '3': 0, '0.01': 0, '0.05': 0, '0.1': 0, '0.5': 0 },
                    sum: 0,
                    count: 0,
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const result: object = metrics.getHistogram(
                    'test_request'
                )
                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get metrics histogram for test_request')
                test.end()
            }
        })

        getHistogramTest.test('return the existing histogram', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefix6_',
                    timeout: 1000
                }
                const buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 3]
                const histogramConfig = {
                    constructor: 'Histogram',
                    name: 'prefix6_test_request',
                    help: 'Histogram for http operation',
                    aggregator: 'sum',
                    upperBounds: buckets,
                    buckets,
                    bucketValues: { '1': 0, '2': 0, '3': 0, '0.01': 0, '0.05': 0, '0.1': 0, '0.5': 0 },
                    sum: 0,
                    count: 0,
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const firstResult: object = metrics.getHistogram('test_request',
                    histogramConfig.help,
                    histogramConfig.labelNames,
                    histogramConfig.buckets)
                const secondResult: object = metrics.getHistogram('test_request',
                    histogramConfig.help,
                    histogramConfig.labelNames,
                    histogramConfig.buckets)
                test.equal(Object.getPrototypeOf(firstResult).constructor.name, histogramConfig.constructor, 'Histogram object is not valid')
                test.equal(Object.getPrototypeOf(secondResult).constructor.name, histogramConfig.constructor, 'Histogram object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        // TODO: Fix this test to get 100% coverage
        // getHistogramTest.test('return the error while getting histogram', async (test: any) => {
        //     try {

        //         const buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 3]

        //         const metrics: Metrics = new Metrics()
        //         const options: metricOptionsType = {
        //             prefix: 'prefix7_',
        //             timeout: 1000
        //         }
        //         metrics.setup(options)

        //         const result: object = metrics.getHistogram('test_request_fake',
        //             'Histogram for http operation',
        //             ['success', 'fsp', 'operation', 'source', 'destination'], buckets)
        //         test.fail('Error Thrown')
        //         test.end()

        //     } catch (e) {
        //         test.ok(e instanceof Error)
        //         test.end()
        //     }
        // })

        getHistogramTest.end()
    })

    metricsTest.test('getSummary should', (getSummaryTest: any) => {
        getSummaryTest.test('return the summary', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const metricName = 'test_request_summary'
                const options: metricOptionsType = {
                    prefix: 'prefixSummary1_',
                    timeout: 1000
                }

                const summaryConfig = {
                    constructor: 'Summary',
                    maxAgeSeconds: 300,
                    ageBuckets: 2,
                    name: `${options.prefix}${metricName}`,
                    help: 'Summary for http operation',
                    aggregator: 'sum',
                    percentiles: [0.01, 0.05, 0.1, 0.5, 1, 2, 3],
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination'],
                    compressCount: 1000
                }

                metrics.setup(options)
                const result: object = metrics.getSummary(
                    metricName,
                    summaryConfig.help,
                    summaryConfig.labelNames,
                    summaryConfig.percentiles,
                    summaryConfig.maxAgeSeconds,
                    summaryConfig.ageBuckets
                )
                test.equal(Object.getPrototypeOf(result).constructor.name, summaryConfig.constructor, 'Summary object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getSummaryTest.test('return the summary if help param is empty string', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const metricName = 'test_request_summary'
                const options: metricOptionsType = {
                    prefix: 'prefixSummary2_',
                    timeout: 1000
                }

                const summaryConfig = {
                    constructor: 'Summary',
                    maxAgeSeconds: 600,
                    ageBuckets: 5,
                    name: `${options.prefix}${metricName}`,
                    help: '',
                    aggregator: 'sum',
                    percentiles: [0.01, 0.05, 0.1, 0.5, 1, 2, 3],
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination'],
                    compressCount: 1000
                }

                metrics.setup(options)
                const result: object = metrics.getSummary(
                    metricName,
                    summaryConfig.help,
                    summaryConfig.labelNames,
                    summaryConfig.percentiles
                )

                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get summary for test_request_summary')
                test.end()
            }
        })

        getSummaryTest.test('return the summary if help param are null', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const metricName = 'test_request_summary'
                const options: metricOptionsType = {
                    prefix: 'prefixSummary2_1_',
                    timeout: 1000
                }

                const summaryConfig = {
                    constructor: 'Summary',
                    maxAgeSeconds: 600,
                    ageBuckets: 5,
                    name: `${options.prefix}${metricName}`,
                    help: '',
                    aggregator: 'sum',
                    percentiles: [0.01, 0.05, 0.1, 0.5, 1, 2, 3],
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination'],
                    compressCount: 1000
                }

                metrics.setup(options)
                const result: object = metrics.getSummary(
                    metricName
                )

                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get summary for test_request_summary')
                test.end()
            }
        })

        getSummaryTest.test('return the summary histogram', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const metricName = 'test_request_summary'
                const options: metricOptionsType = {
                    prefix: 'prefixSummary3_',
                    timeout: 1000
                }

                const summaryConfig = {
                    constructor: 'Summary',
                    maxAgeSeconds: 300,
                    ageBuckets: 2,
                    name: `${options.prefix}${metricName}`,
                    help: 'Summary for http operation',
                    aggregator: 'sum',
                    percentiles: [0.01, 0.05, 0.1, 0.5, 1, 2, 3],
                    hashMap: {},
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination'],
                    compressCount: 1000
                }

                metrics.setup(options)

                const firstResult: object = metrics.getSummary(
                    metricName,
                    summaryConfig.help,
                    summaryConfig.labelNames,
                    summaryConfig.percentiles,
                    summaryConfig.maxAgeSeconds,
                    summaryConfig.ageBuckets
                )

                const secondResult: object = metrics.getSummary(
                    metricName,
                    summaryConfig.help,
                    summaryConfig.labelNames,
                    summaryConfig.percentiles,
                    summaryConfig.maxAgeSeconds,
                    summaryConfig.ageBuckets
                )

                test.equal(Object.getPrototypeOf(firstResult).constructor.name, summaryConfig.constructor, 'Summary object is not valid')
                test.equal(Object.getPrototypeOf(secondResult).constructor.name, summaryConfig.constructor, 'Summary object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getSummaryTest.end()
    })

    metricsTest.test('getCounter should', (getCounterTest: any) => {
        getCounterTest.test('return the counter', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixCounter1_',
                    timeout: 1000
                }

                const counterConfig = {
                    constructor: 'Counter',
                    name: 'prefixCounter1_test_counter',
                    help: 'Counter for http operation',
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const result = metrics.getCounter(
                    'test_counter',
                    counterConfig.help,
                    counterConfig.labelNames
                )
                test.equal(Object.getPrototypeOf(result).constructor.name, counterConfig.constructor, 'Counter object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getCounterTest.test('return the counter if help param is empty string', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixCounter2_',
                    timeout: 1000
                }

                const counterConfig = {
                    constructor: 'Counter',
                    name: 'prefixCounter2_test_counter',
                    help: '',
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                metrics.getCounter(
                    'test_counter',
                    counterConfig.help,
                    counterConfig.labelNames
                )

                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get counter for test_counter')
                test.end()
            }
        })

        getCounterTest.test('return the counter if help param is null', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixCounter3_',
                    timeout: 1000
                }

                metrics.setup(options)
                metrics.getCounter(
                    'test_counter'
                )

                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get counter for test_counter')
                test.end()
            }
        })

        getCounterTest.test('return the existing counter', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixCounter4_',
                    timeout: 1000
                }

                const counterConfig = {
                    constructor: 'Counter',
                    name: 'prefixCounter4_test_counter',
                    help: 'Counter for http operation',
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const firstResult = metrics.getCounter(
                    'test_counter',
                    counterConfig.help,
                    counterConfig.labelNames
                )
                const secondResult = metrics.getCounter(
                    'test_counter',
                    counterConfig.help,
                    counterConfig.labelNames
                )
                test.equal(Object.getPrototypeOf(firstResult).constructor.name, counterConfig.constructor, 'Counter object is not valid')
                test.equal(Object.getPrototypeOf(secondResult).constructor.name, counterConfig.constructor, 'Counter object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        getCounterTest.end()
    })

    metricsTest.test('metrics plugin should', (pluginTest: any) => {
        pluginTest.test('register http metrics', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                metrics.getDefaultRegister().clear()
                const options: metricOptionsType = {
                    prefix: 'plugin1_',
                    timeout: 1000
                }
                metrics.setup(options)
                const server = new Server({ port: 0 })
                await server.register(metrics.plugin)
                server.route({
                    method: 'GET',
                    path: '/test',
                    handler: () => 'test'
                })
                server.route({
                    method: 'GET',
                    path: '/{p*}',
                    handler: () => 'test'
                })
                await server.start()
                test.ok(server, 'Server is started')
                await server.inject({ method: 'GET', url: '/test' })
                await server.inject({ method: 'GET', url: '/coverage' })
                await server.inject({ method: 'GET', url: '/live' })
                const metricsResponse = await server.inject({
                    method: 'GET',
                    url: '/metrics'
                })
                test.equal(metricsResponse.statusCode, 200, 'Metrics status code is 200')
                test.ok(metricsResponse.payload.match(/http_requests_total/), 'Total number of http requests metrics is returned')
                test.ok(metricsResponse.payload.match(/http_request_duration_seconds/), 'Duration of http requests metric is returned')
                test.ok(metricsResponse.payload.match(/http_request_duration_histogram_seconds/), 'Duration of http requests histogram is returned')
                test.ok(metricsResponse.payload.match(/http_requests_current/), 'Number of requests currently running metric is returned')
                test.ok(metricsResponse.payload.match(/http_connections_current/), 'Number of connections currently established metric is returned')
                await server.stop()
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        pluginTest.test('limit max pending requests', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                metrics.getDefaultRegister().clear()
                const options: metricOptionsType = {
                    prefix: 'plugin2_',
                    timeout: 1000,
                    maxRequestsPending: 1
                }
                metrics.setup(options)
                const server = new Server({ port: 0 })
                await server.register(metrics.plugin)
                server.route({
                    method: 'GET',
                    path: '/health',
                    handler: () => 'ready'
                })
                server.route({
                    method: 'GET',
                    path: '/delay',
                    handler: async () => {
                        await new Promise(resolve => setTimeout(resolve, 2000))
                        return 'ready'
                    }
                })
                await server.start()
                test.ok(server, 'Server is started')

                const readyResponse = await server.inject({
                    method: 'GET',
                    url: '/health'
                })
                test.equal(readyResponse.statusCode, 200, 'Ready status code is 200')

                const delayResponse = server.inject({
                    method: 'GET',
                    url: '/delay'
                })

                await new Promise(resolve => setTimeout(resolve, 1000)) // wait for the request to be processed
                const notReady = await server.inject({
                    method: 'GET',
                    url: '/health'
                })
                test.equal(notReady.statusCode, 503, 'Requests limit reached')
                await delayResponse;
                await server.stop()
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        pluginTest.test('limit connections', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                metrics.getDefaultRegister().clear()
                const options: metricOptionsType = {
                    prefix: 'plugin3_',
                    timeout: 1000,
                    maxConnections: 1
                }
                metrics.setup(options)
                const server = new Server({ port: 0 })
                await server.register(metrics.plugin)
                server.route({
                    method: 'GET',
                    path: '/health',
                    handler: () => 'ready'
                })
                await server.start()
                test.ok(server, 'Server is started')

                interface HttpResponse {
                    statusCode: number;
                }

                // Create a keep-alive connection
                const agent = new Http.Agent({ keepAlive: true, maxSockets: 1 })
                const firstResponse = await new Promise<HttpResponse>((resolve) => {
                    Http.get(
                        `http://localhost:${server.info.port}/health`,
                        { agent, headers: { Connection: 'keep-alive' } },
                        (res) => {
                            if (res.statusCode === undefined) {
                                test.fail('Received undefined statusCode')
                                test.end()
                                return
                            }
                            resolve({ statusCode: res.statusCode })
                        }
                    ).on('error', (err) => {
                        test.fail(`HTTP request error: ${err}`)
                        test.end()
                    })
                })

                test.equal(firstResponse.statusCode, 503, 'Connection limit reached')

                // Destroy the agent to close the connection
                agent.destroy()
                await new Promise<void>(resolve => setTimeout(resolve, 2000))

                // Verify connections count is 0
                const metricsOutput = await metrics.getMetricsForPrometheus()
                const connectionsMetric = metricsOutput.match(/http_connections_current\{remote_address="[^"]+"\}\s+(\d+)/)
                test.ok(connectionsMetric, 'Connections metric found')
                if (connectionsMetric) {
                    test.equal(parseInt(connectionsMetric[1]), 0, 'Connections count should be 0')
                } else {
                    test.fail('Connections metric not found in Prometheus output')
                    test.end()
                }

                // Verify /health returns 200
                const finalResponse = await server.inject({
                    method: 'GET',
                    url: '/health'
                })
                test.equal(finalResponse.statusCode, 200, 'Ready status code is 200')
                await server.stop()
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        pluginTest.test('handle aborted requests', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                metrics.getDefaultRegister().clear()
                const options: metricOptionsType = {
                    prefix: 'plugin4_',
                    timeout: 1000
                }
                metrics.setup(options)
                const server = new Server({ port: 0 })
                await server.register(metrics.plugin)
                let req: Http.ClientRequest;
                server.route({
                    method: 'GET',
                    path: '/',
                    handler: (request) => new Promise((resolve) => {
                        req.destroy();
                        request.events.once('disconnect', () => {
                            resolve('ok')
                        });
                    })
                });

                await server.start()
                test.ok(server, 'Server is started')

                req = Http.request({
                    hostname: 'localhost',
                    port: server.info.port,
                    method: 'get'
                });
                req.on('error', () => { });
                req.end();

                const [request] = await server.events.once('response');
                test.ok(request.response.isBoom, 'Request is aborted');
                await server.stop()
                test.end();
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        pluginTest.end()
    })

    metricsTest.test('getGauge should', (getGaugeTest: any) => {
        getGaugeTest.test('return the gauge', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixGauge1_',
                    timeout: 1000
                }

                const gaugeConfig = {
                    constructor: 'Gauge',
                    name: 'prefixGauge1_test_gauge',
                    help: 'Gauge for http operation',
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const result = metrics.getGauge(
                    'test_gauge',
                    gaugeConfig.help,
                    gaugeConfig.labelNames
                )
                test.equal(Object.getPrototypeOf(result).constructor.name, gaugeConfig.constructor, 'Gauge object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        getGaugeTest.test('return the gauge if help param is empty string', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixGauge2_',
                    timeout: 1000
                }

                const gaugeConfig = {
                    constructor: 'Gauge',
                    name: 'prefixGauge2_test_gauge',
                    help: '',
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                metrics.getGauge(
                    'test_gauge',
                    gaugeConfig.help,
                    gaugeConfig.labelNames
                )

                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get gauge for test_gauge')
                test.end()
            }
        })

        getGaugeTest.test('return the gauge if help param is null', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixGauge3_',
                    timeout: 1000
                }

                metrics.setup(options)
                metrics.getGauge(
                    'test_gauge'
                )

                test.fail('Expected an error to be thrown with help param being empty or null')
                test.end()
            } catch (e) {
                test.equal(e.message, 'Couldn\'t get gauge for test_gauge')
                test.end()
            }
        })

        getGaugeTest.test('return the existing gauge', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'prefixGauge4_',
                    timeout: 1000
                }

                const gaugeConfig = {
                    constructor: 'Gauge',
                    name: 'prefixGauge4_test_gauge',
                    help: 'Gauge for http operation',
                    labelNames: ['success', 'fsp', 'operation', 'source', 'destination']
                }

                metrics.setup(options)
                const firstResult = metrics.getGauge(
                    'test_gauge',
                    gaugeConfig.help,
                    gaugeConfig.labelNames
                )
                const secondResult = metrics.getGauge(
                    'test_gauge',
                    gaugeConfig.help,
                    gaugeConfig.labelNames
                )
                test.equal(Object.getPrototypeOf(firstResult).constructor.name, gaugeConfig.constructor, 'Gauge object is not valid')
                test.equal(Object.getPrototypeOf(secondResult).constructor.name, gaugeConfig.constructor, 'Gauge object is not valid')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        getGaugeTest.end()
    })

    metricsTest.end()
})
