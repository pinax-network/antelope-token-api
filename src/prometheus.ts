// From https://github.com/pinax-network/substreams-sink-websockets/blob/main/src/prometheus.ts
import client, { Counter, CounterConfiguration, Gauge, GaugeConfiguration, Histogram, HistogramConfiguration } from 'prom-client';
import { logger } from "./logger.js";

export const registry = new client.Registry();

// Metrics
export function registerCounter(name: string, help = "help", labelNames: string[] = [], config?: CounterConfiguration<string>) {
    try {
        registry.registerMetric(new Counter({ name, help, labelNames, ...config }));
        logger.debug(`Registered new counter metric: ${name}`);
        return registry.getSingleMetric(name) as Counter;
    } catch (e) {
        logger.error("Error registering counter:", { name, e });
        throw new Error(`${e}`);
    }
}

export function registerGauge(name: string, help = "help", labelNames: string[] = [], config?: GaugeConfiguration<string>) {
    try {
        registry.registerMetric(new Gauge({ name, help, labelNames, ...config }));
        logger.debug(`Registered new gauge metric: ${name}`);
        return registry.getSingleMetric(name) as Gauge;
    } catch (e) {
        logger.error("Error registering gauge:", { name, e });
        throw new Error(`${e}`);
    }
}

export function registerHistogram(name: string, help = "help", labelNames: string[] = [], config?: HistogramConfiguration<string>) {
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

// REST API metrics
export const request_error = registerCounter('request_error', 'Total Requests errors', ['pathname', 'status']);
export const request = registerCounter('request', 'Total Requests', ['pathname']);
export const query = registerCounter('query', 'Clickhouse DB queries made');
export const bytes_read = registerHistogram('bytes_read', 'Clickhouse DB Statistics bytes read', [],
    { 
        buckets: Array.from({ length: 63 }, (_, i) => (i % 9 + 1) * 10 ** (6 + Math.floor(i / 9))) // 1Mb to 10Tb buckets, each divided by 10
    }
);
export const rows_read = registerHistogram('rows_read', 'Clickhouse DB Statistics rows read', [],
    { 
        buckets: Array.from({ length: 54 }, (_, i) => (i % 9 + 1) * 10 ** (3 + Math.floor(i / 9))) // 1k to 100M, each divided by 10
    }
);
export const elapsed = registerHistogram('elapsed', 'Clickhouse DB Statistics query elapsed time (seconds)', [],
    { 
        buckets: [0.001, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30] // In seconds
    }
);
