# central-services-metrics
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/central-services-metrics.svg?style=flat)](https://github.com/mojaloop/central-services-metrics/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/central-services-metrics.svg?style=flat)](https://github.com/mojaloop/central-services-metrics/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/central-services-metrics.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-metrics)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/central-services-metrics.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-metrics)
[![CircleCI](https://circleci.com/gh/mojaloop/central-services-metrics.svg?style=svg)](https://circleci.com/gh/mojaloop/central-services-metrics)

## CI/CD

This repository uses the [mojaloop/build](https://github.com/mojaloop/ci-config-orb-build) CircleCI orb for standardized CI/CD workflows, including automated Grype vulnerability scanning for source code security.

## Installation

```bash
npm install @mojaloop/central-services-metrics
```

## Usage

Import Metrics library:
```javascript
const Metrics = require('@mojaloop/central-services-metrics')
```

Set configuration options:
```javascript
let config = {
    "timeout": 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
    "prefix": "<PREFIX>", // Set prefix for all defined metrics names
    "defaultLabels": { // Set default labels that will be applied to all metrics
        "serviceName": "<NAME_OF_SERVICE>"
    }
}
```

Initialise Metrics library:
```JAVASCRIPT
Metrics.setup(config)

```

Example instrumentation:
```javascript
const exampleFunction = async (error, message) => {
    const histTimerEnd = Metrics.getHistogram( // Create a new Histogram instrumentation
      'exampleFunctionMetric', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for exampleFunction', // Description of metric
      ['success'] // Define a custom label 'success'
    ).startTimer() // Start instrumentation
    
    try {
        Logger.info('do something meaningful here')
        histTimerEnd({success: true}) // End the instrumentation & set custom label 'success=true'
    } catch (e) {
        histTimerEnd({success: false}) // End the instrumentation & set custom label 'success=false'
    }
}
```

## Auditing Dependencies

We use `audit-ci` along with `npm audit` to check dependencies for node vulnerabilities, and keep track of resolved dependencies with an `audit-ci.jsonc` file.

To start a new resolution process, run:

```bash
npm run audit:fix
```

You can then check to see if the CI will pass based on the current dependencies with:

```bash
npm run audit:check
```

The [audit-ci.jsonc](./audit-ci.jsonc) contains any audit-exceptions that cannot be fixed to ensure that CircleCI will build correctly.

