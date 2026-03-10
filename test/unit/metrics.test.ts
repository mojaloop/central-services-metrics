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

import { Histogram } from "prom-client"
import { Metrics, metricOptionsType } from "../../src/metrics"
import { Server } from '@hapi/hapi'
import { Socket } from 'net'
import Http from 'http'

describe('Metrics Class Test', () => {

    describe('setup should', () => {
        test('initialize the metrics object', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'prefix1_',
                timeout: 1000
            }
            let result = metrics.setup(options)
            expect(result).toBe(true)
            expect(metrics.getOptions()).toEqual(options)
        })

        test('initialize the metrics object with default labels', async () => {
            const metrics: Metrics = new Metrics()
            let defaultLabels = new Map()
            defaultLabels.set('serviceName', 'testService')

            const options: metricOptionsType = {
                prefix: 'prefix2_',
                timeout: 1000,
                defaultLabels
            }
            let result = metrics.setup(options)
            expect(result).toBe(true)
            expect(metrics.getOptions()).toEqual(options)
        })

        test('return false if setup is already initialized', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'alreadySetup_',
                timeout: 1000
            }
            metrics.setup(options)
            let result: boolean = metrics.setup(options)
            expect(result).toBe(false)
        })
    })

    describe('isInitiated should', () => {
        test('return false if metrics is not setup', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'prefixIsInitiated1_',
                timeout: 1000
            }

            // metrics.setup(options) <-- we skip this

            let result = metrics.isInitiated()
            expect(result).toBe(false)
        })

        test('return true if metrics is already setup', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'prefixIsInitiated2_',
                timeout: 1000
            }

            metrics.setup(options) // <-- we setup metrics

            let result = metrics.isInitiated()
            expect(result).toBe(true)
        })
    })

    describe('getMetricsForPrometheus should', () => {
        test('return the metrics', async () => {
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
            expect(matches).not.toBe(-1)
        })
    })

    describe('getDefaultRegister should', () => {
        test('return the default registry', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'prefixGetDefaultRegisterTest1_',
                timeout: 1000
            }
            metrics.setup(options)
            const result: any = metrics.getDefaultRegister()
            expect(result).toBeTruthy()
            expect(result.contentType).toBeDefined()
        })
    })

    describe('getOptions should', () => {
        test('return the metrics options', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'prefix4_',
                timeout: 1000
            }
            metrics.setup(options)
            const result: metricOptionsType = metrics.getOptions()
            expect(result).toBe(options)
        })
    })

    describe('getClient should', () => {
        test('return the client', async () => {
            const metrics: Metrics = new Metrics()
            const result = metrics.getClient()
            expect(result).toBeTruthy()
        })
    })

    describe('getHistogram should', () => {
        test('return the histogram', async () => {
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
            expect(Object.getPrototypeOf(result).constructor.name).toBe(histogramConfig.constructor)
        })

        test('return the histogram if help param is an empty string', async () => {
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
            try {
                const result: object = metrics.getHistogram('test_request',
                    histogramConfig.help,
                    histogramConfig.labelNames,
                    histogramConfig.buckets)
                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Histogram')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get metrics histogram for test_request')
            }
        })

        test('return the histogram if help param are null', async () => {
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
            try {
                const result: object = metrics.getHistogram(
                    'test_request',
                    undefined,
                    ['success', 'fsp', 'operation', 'source', 'destination']
                )
                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Histogram')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get metrics histogram for test_request')
            }
        })

        test('return the existing histogram', async () => {
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
            expect(Object.getPrototypeOf(firstResult).constructor.name).toBe(histogramConfig.constructor)
            expect(Object.getPrototypeOf(secondResult).constructor.name).toBe(histogramConfig.constructor)
        })

        // TODO: Fix this test to get 100% coverage
        // test('return the error while getting histogram', async () => {
        //     const buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 3]

        //     const metrics: Metrics = new Metrics()
        //     const options: metricOptionsType = {
        //         prefix: 'prefix7_',
        //         timeout: 1000
        //     }
        //     metrics.setup(options)

        //     expect(() => {
        //         const result: object = metrics.getHistogram('test_request_fake',
        //             'Histogram for http operation',
        //             ['success', 'fsp', 'operation', 'source', 'destination'], buckets)
        //     }).toThrow()
        // })
    })

    describe('getSummary should', () => {
        test('return the summary', async () => {
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
            expect(Object.getPrototypeOf(result).constructor.name).toBe(summaryConfig.constructor)
        })

        test('return the summary if help param is empty string', async () => {
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
            try {
                const result: object = metrics.getSummary(
                    metricName,
                    summaryConfig.help,
                    summaryConfig.labelNames,
                    summaryConfig.percentiles
                )

                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Summary')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get summary for test_request_summary')
            }
        })

        test('return the summary if help param are null', async () => {
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
            try {
                const result: object = metrics.getSummary(
                    metricName,
                    undefined,
                    summaryConfig.labelNames
                )

                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Summary')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get summary for test_request_summary')
            }
        })

        test('return the summary histogram', async () => {
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

            expect(Object.getPrototypeOf(firstResult).constructor.name).toBe(summaryConfig.constructor)
            expect(Object.getPrototypeOf(secondResult).constructor.name).toBe(summaryConfig.constructor)
        })
    })

    describe('getCounter should', () => {
        test('return the counter', async () => {
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
            expect(Object.getPrototypeOf(result).constructor.name).toBe(counterConfig.constructor)
        })

        test('return the counter if help param is empty string', async () => {
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
            try {
                const result: object = metrics.getCounter(
                    'test_counter',
                    counterConfig.help,
                    counterConfig.labelNames
                )

                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Counter')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get counter for test_counter')
            }
        })

        test('return the counter if help param is null', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'prefixCounter3_',
                timeout: 1000
            }

            metrics.setup(options)
            try {
                const result: object = metrics.getCounter(
                    'test_counter',
                    undefined,
                    ['success', 'fsp']
                )

                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Counter')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get counter for test_counter')
            }
        })

        test('return the existing counter', async () => {
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
            expect(Object.getPrototypeOf(firstResult).constructor.name).toBe(counterConfig.constructor)
            expect(Object.getPrototypeOf(secondResult).constructor.name).toBe(counterConfig.constructor)
        })
    })

    describe('metrics plugin should', () => {
        test('register http metrics', async () => {
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
            expect(server).toBeTruthy()
            await server.inject({ method: 'GET', url: '/test' })
            await server.inject({ method: 'GET', url: '/coverage' })
            await server.inject({ method: 'GET', url: '/live' })
            const metricsResponse = await server.inject({
                method: 'GET',
                url: '/metrics'
            })
            expect(metricsResponse.statusCode).toBe(200)
            expect(metricsResponse.payload).toMatch(/http_requests_total/)
            expect(metricsResponse.payload).toMatch(/http_request_duration_seconds/)
            expect(metricsResponse.payload).toMatch(/http_request_duration_histogram_seconds/)
            expect(metricsResponse.payload).toMatch(/http_requests_current/)
            expect(metricsResponse.payload).toMatch(/http_connections_current/)
            await server.stop()
        })

        test('limit max pending requests', async () => {
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
            expect(server).toBeTruthy()

            const readyResponse = await server.inject({
                method: 'GET',
                url: '/health'
            })
            expect(readyResponse.statusCode).toBe(200)

            const delayResponse = server.inject({
                method: 'GET',
                url: '/delay'
            })

            await new Promise(resolve => setTimeout(resolve, 1000)) // wait for the request to be processed
            const notReady = await server.inject({
                method: 'GET',
                url: '/health'
            })
            expect(notReady.statusCode).toBe(503)
            await delayResponse;
            await server.stop()
        })

        test('limit connections', async () => {
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
            expect(server).toBeTruthy()

            interface HttpResponse {
                statusCode: number;
            }

            // Create a keep-alive connection
            const agent = new Http.Agent({ keepAlive: true, maxSockets: 1 })
            const firstResponse = await new Promise<HttpResponse>((resolve, reject) => {
                Http.get(
                    `http://localhost:${server.info.port}/health`,
                    { agent, headers: { Connection: 'keep-alive' } },
                    (res) => {
                        if (res.statusCode === undefined) {
                            reject(new Error('Received undefined statusCode'))
                            return
                        }
                        resolve({ statusCode: res.statusCode })
                    }
                ).on('error', (err) => {
                    reject(new Error(`HTTP request error: ${err}`))
                })
            })

            expect(firstResponse.statusCode).toBe(503)

            // Destroy the agent to close the connection
            agent.destroy()
            await new Promise<void>(resolve => setTimeout(resolve, 2000))

            // Verify connections count is 0
            const metricsOutput = await metrics.getMetricsForPrometheus()
            const connectionsMetric = metricsOutput.match(/http_connections_current\{remote_address="[^"]+"\}\s+(\d+)/)
            expect(connectionsMetric).toBeTruthy()
            if (connectionsMetric) {
                expect(parseInt(connectionsMetric[1])).toBe(0)
            }

            // Verify /health returns 200
            const finalResponse = await server.inject({
                method: 'GET',
                url: '/health'
            })
            expect(finalResponse.statusCode).toBe(200)
            await server.stop()
        })

        test('handle aborted requests', async () => {
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
            expect(server).toBeTruthy()

            req = Http.request({
                hostname: 'localhost',
                port: server.info.port,
                method: 'get'
            });
            req.on('error', () => { });
            req.end();

            const [request] = await server.events.once('response');
            expect(request.response.isBoom).toBeTruthy()
            await server.stop()
        })
    })

    describe('getGauge should', () => {
        test('return the gauge', async () => {
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
            expect(Object.getPrototypeOf(result).constructor.name).toBe(gaugeConfig.constructor)
        })

        test('return the gauge if help param is empty string', async () => {
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
            try {
                const result: object = metrics.getGauge(
                    'test_gauge',
                    gaugeConfig.help,
                    gaugeConfig.labelNames
                )

                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Gauge')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get gauge for test_gauge')
            }
        })

        test('return the gauge if help param is null', async () => {
            const metrics: Metrics = new Metrics()
            const options: metricOptionsType = {
                prefix: 'prefixGauge3_',
                timeout: 1000
            }

            metrics.setup(options)
            try {
                const result: object = metrics.getGauge(
                    'test_gauge',
                    undefined,
                    ['success', 'fsp']
                )

                expect(result).toBeTruthy()
                expect(result.constructor.name).toBe('Gauge')
            } catch (e) {
                expect(e.message).toBe('Couldn\'t get gauge for test_gauge')
            }
        })

        test('return the existing gauge', async () => {
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
            expect(Object.getPrototypeOf(firstResult).constructor.name).toBe(gaugeConfig.constructor)
            expect(Object.getPrototypeOf(secondResult).constructor.name).toBe(gaugeConfig.constructor)
        })
    })
})
