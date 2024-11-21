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

 - Shashikant Hirugade <shashikant.hirugade@modusbox.com>

 --------------
 ******/

'use strict'

const Test = require('tapes')(require('tape'))
import { Histogram } from "prom-client"
import { Metrics, metricOptionsType } from "../../src/metrics"
import { Server } from '@hapi/hapi'
import { Socket } from 'net'

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
                    bucketValues: { '0.010': 0, '0.050': 0, '0.1': 0, '0.5': 0, '1':0 , '2':0 , '3':0 },
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
                    percentiles: [ 0.01, 0.05, 0.1, 0.5, 1, 2, 3 ],
                    hashMap: {},
                    labelNames: [ 'success', 'fsp', 'operation', 'source', 'destination' ],
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
                    percentiles: [ 0.01, 0.05, 0.1, 0.5, 1, 2, 3 ],
                    hashMap: {},
                    labelNames: [ 'success', 'fsp', 'operation', 'source', 'destination' ],
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
                    percentiles: [ 0.01, 0.05, 0.1, 0.5, 1, 2, 3 ],
                    hashMap: {},
                    labelNames: [ 'success', 'fsp', 'operation', 'source', 'destination' ],
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
                    percentiles: [ 0.01, 0.05, 0.1, 0.5, 1, 2, 3 ],
                    hashMap: {},
                    labelNames: [ 'success', 'fsp', 'operation', 'source', 'destination' ],
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

    metricsTest.test('metrics plugin should', (pluginTest: any) => {
        pluginTest.test('register http metrics and handle readiness', async (test: any) => {
            try {
                const metrics: Metrics = new Metrics()
                const options: metricOptionsType = {
                    prefix: 'plugin2_',
                    timeout: 1000
                }
                metrics.setup(options)
                const server = new Server({ port: 0 })
                await server.register({plugin: metrics.plugin, options: {maxConnections: 1}})
                server.route({
                    method: 'GET',
                    path: '/test',
                    handler: () => {
                        return 'test'
                    }
                })
                server.route({
                    method: 'GET',
                    path: '/ready',
                    handler: () => {
                        return 'ready'
                    }
                })
                await server.start()
                test.ok(server, 'Server is started')
                await server.inject({ method: 'GET',url: '/test' })
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


                const socket = new Socket()
                socket.on('connect', async() => {
                    test.pass('Connection established')
                    try {
                        const readyResponse = await server.inject({
                            method: 'GET',
                            url: '/ready'
                        })
                        test.equal(readyResponse.statusCode, 503, 'Connection limit reached')
                        socket.destroy()
                    }
                    catch (e) {
                        test.fail(`Error Thrown - ${e}`)
                        test.end()
                    }
                })
                socket.on('close', async() => {
                    await new Promise(resolve => setTimeout(resolve, 1000)) // wait for the connection to close
                    test.pass('Connection closed')
                    try {
                        const readyResponse = await server.inject({
                            method: 'GET',
                            url: '/ready'
                        })
                        test.equal(readyResponse.statusCode, 200, 'Ready status code is 200')
                        await server.stop()
                        test.end()
                    } catch (e) {
                        test.fail(`Error Thrown - ${e}`)
                        test.end()
                    }
                });
                socket.connect(Number(server.info.port), 'localhost');
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        pluginTest.end()
    })

    metricsTest.end()
})
