// From https://github.com/pinax-network/substreams-sink-websockets/blob/main/src/prometheus.ts
import client, { Counter, CounterConfiguration, Gauge, GaugeConfiguration, Histogram, HistogramConfiguration } from 'prom-client';
import { logger } from "./logger.js";

export const registry = new client.Registry();

// Metrics
export function registerCounter(name: string, help = "help", labelNames: string[] = [], config?: Partial<CounterConfiguration<string>>) {
    try {
        registry.registerMetric(new Counter({ name, help, labelNames, ...config }));
        logger.debug(`Registered new counter metric: ${name}`);
        return registry.getSingleMetric(name) as Counter;
    } catch (e) {
        logger.error("Error registering counter:", { name, e });
        throw new Error(`${e}`);
    }
}

export function registerGauge(name: string, help = "help", labelNames: string[] = [], config?: Partial<GaugeConfiguration<string>>) {
    try {
        registry.registerMetric(new Gauge({ name, help, labelNames, ...config }));
        logger.debug(`Registered new gauge metric: ${name}`);
        return registry.getSingleMetric(name) as Gauge;
    } catch (e) {
        logger.error("Error registering gauge:", { name, e });
        throw new Error(`${e}`);
    }
}

export function registerHistogram(name: string, help = "help", labelNames: string[] = [], config?: Partial<HistogramConfiguration<string>>) {
    try {
        registry.registerMetric(new Histogram({ name, help, labelNames, ...config }));
        logger.debug(`Registered new histogram metric: ${name}`);
        return registry.getSingleMetric(name) as Histogram;
    } catch (e) {
        logger.error("Error registering histogram:", { name, e });
        throw new Error(`${e}`);
    }
}

export async function getSingleMetric(name: string) {
    const metric = registry.getSingleMetric(name);
    const get = await metric?.get();
    return get?.values[0]?.value;
}

function createBucket(lowExponentBound: number, highExponentBound: number): number[] {
    if (lowExponentBound > highExponentBound)
        return createBucket(highExponentBound, lowExponentBound);

    // Returns 1*10^k, 2*10^k, ..., 9*10^k for successive powers of 10 between low and high bounds.
    return Array.from(
        { length: 9 * (highExponentBound - lowExponentBound) },
        (_, i) => Number(
            (
                (i % 9 + 1) * 10 ** (lowExponentBound + Math.floor(i / 9))
            ).toFixed(
                // Fixes floating point arithmetic imprecisions for negative exponents
                Math.max(Math.abs(lowExponentBound) - Math.floor(i / 9), 1)
            )
        )
    );
}

// REST API metrics
export const request_error = registerCounter('request_error', 'Total Requests errors', ['pathname', 'status']);
export const request = registerCounter('request', 'Total Requests', ['pathname']);
export const query = registerCounter('query', 'Clickhouse DB queries made');
export const bytes_read = registerHistogram('bytes_read', 'Clickhouse DB Statistics bytes read', [],
    { 
        buckets: createBucket(3, 9) // 1Kb to 1Gb buckets, each divided by 10
    }
);
export const rows_read = registerHistogram('rows_read', 'Clickhouse DB Statistics rows read', [],
    { 
        buckets: createBucket(2, 7) // 100 to 10M, each divided by 10
    }
);
export const elapsed = registerHistogram('elapsed', 'Clickhouse DB Statistics query elapsed time (seconds)', [],
    { 
        buckets: createBucket(-4, 1) // 0.1ms to 10s, each divided by 10
    }
);
