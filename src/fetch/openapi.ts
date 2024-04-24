import pkg from "../../package.json" assert { type: "json" };

import { OpenApiBuilder, SchemaObject, ExampleObject, ParameterObject } from "openapi3-ts/oas31";
import { config } from "../config.js";
import { registry } from "../prometheus.js";
import { makeQuery } from "../clickhouse/makeQuery.js";
import { getBalanceChanges, getTotalSupply, getTransfers } from "../queries.js";
const TAGS = {
    MONITORING: "Monitoring",
    HEALTH: "Health",
    USAGE: "Usage",
    DOCS: "Documentation",
} as const;

const timestampExamplesArrayFilter = ["greater_or_equals_by_timestamp", "greater_by_timestamp", "less_or_equals_by_timestamp", "less_by_timestamp"];
const blockExamplesArrayFilter = ["greater_or_equals_by_block", "greater_by_block", "less_or_equals_by_block", "less_by_block"];
const amountExamplesArrayFilter = ["amount_greater_or_equals", "amount_greater", "amount_less_or_equals", "amount_less"];

const supply_example = (await makeQuery(getTotalSupply(new URLSearchParams({ limit: "2" }), true))).data;
const balance_example = (await makeQuery(getBalanceChanges(new URLSearchParams({ limit: "2" }), true))).data;
const transfers_example = (await makeQuery(getTransfers(new URLSearchParams({ limit: "5" }), true))).data;

const timestampSchema: SchemaObject = {
    anyOf: [
        { type: "number" },
        { type: "string", format: "date" },
        { type: "string", format: "date-time" }
    ]
};
const timestampExamples: ExampleObject = {
    unix: { summary: `Unix Timestamp (seconds)` },
    date: { summary: `Full-date notation`, value: '2023-10-18' },
    datetime: { summary: `Date-time notation`, value: '2023-10-18T00:00:00Z' },
}

const parameterString = (name: string = "address", required = false) => ({
    name,
    in: "query",
    description: `Filter by ${name}`,
    required,
    schema: { type: "string" },
} as ParameterObject);

const parameterLimit: ParameterObject = {
    name: "limit",
    in: "query",
    description: "Maximum number of records to return per query.",
    required: false,
    schema: { type: "number", maximum: config.maxLimit, minimum: 1 },
}

const parameterOffset: ParameterObject = {
    name: "page",
    in: "query",
    description: "Page index for results pagination.",
    required: false,
    schema: { type: "number", minimum: 1 },
}

const timestampFilter = timestampExamplesArrayFilter.map(name => {
    return {
        name,
        in: "query",
        description: "Filter " + name.replace(/_/g, " "),
        required: false,
        schema: timestampSchema,
        examples: timestampExamples,
    } as ParameterObject
})

const blockFilter = blockExamplesArrayFilter.map(name => {
    return {
        name,
        in: "query",
        description: "Filter " + name.replace(/_/g, " "),
        required: false,
        schema: { type: "number" },
    } as ParameterObject
})

const amountFilter = amountExamplesArrayFilter.map(name => {
    return {
        name,
        in: "query",
        description: "Filter " + name.replace(/_/g, " "),
        required: false,
        schema: { type: "number" },
    } as ParameterObject
})

export default new OpenApiBuilder()
    .addInfo({
        title: pkg.name,
        version: pkg.version,
        description: pkg.description,
        license: { name: `License: ${pkg.license}`, url: `${pkg.homepage}/blob/main/LICENSE` },
    })
    .addExternalDocs({ url: pkg.homepage, description: "Homepage" })
    .addSecurityScheme("auth-key", { type: "http", scheme: "bearer" })
    .addPath("/supply", {
        get: {
            tags: [TAGS.USAGE],
            summary: "Antelope tokens latest finalized supply",
            parameters: [
                parameterString("contract"),
                parameterString("issuer"),
                parameterString("symbol"),
                ...amountFilter,
                ...timestampFilter,
                ...blockFilter,
                parameterLimit,
                parameterOffset,
            ],
            responses: {
                200: { description: "Latest finalized supply", content: { "application/json": { example: supply_example, schema: { type: "array" } } } },
                400: { description: "Bad request" },
            },
        },
    })
    .addPath("/balance", {
        get: {
            tags: [TAGS.USAGE],
            summary: "Antelope tokens latest finalized balance change",
            parameters: [
                parameterString("account"),
                parameterString("contract"),
                ...amountFilter,
                ...timestampFilter,
                ...blockFilter,
                parameterLimit,
                parameterOffset,
            ],
            responses: {
                200: { description: "Latest finalized balance change", content: { "application/json": { example: balance_example, schema: { type: "array" } } } },
                400: { description: "Bad request" },
            },
        },
    }).addPath("/transfers", {
        get: {
            tags: [TAGS.USAGE],
            summary: "Antelope tokens transfers",
            parameters: [
                parameterString("contract"),
                parameterString("from"),
                parameterString("to"),
                parameterString("transaction_id"),
                ...amountFilter,
                ...timestampFilter,
                ...blockFilter,
                parameterLimit,
                parameterOffset,
            ],
            responses: {
                200: { description: "Array of transfers", content: { "application/json": { example: transfers_example, schema: { type: "array" } } } },
                400: { description: "Bad request" },
            },
        },
    })
    .addPath("/health", {
        get: {
            tags: [TAGS.HEALTH],
            summary: "Performs health checks and checks if the database is accessible",
            responses: { 200: { description: "OK", content: { "text/plain": { example: "OK" } } } },
        },
    })
    .addPath("/metrics", {
        get: {
            tags: [TAGS.MONITORING],
            summary: "Prometheus metrics",
            responses: { 200: { description: "Prometheus metrics", content: { "text/plain": { example: await registry.metrics(), schema: { type: "string" } } } } },
        },
    })
    .addPath("/openapi", {
        get: {
            tags: [TAGS.DOCS],
            summary: "OpenAPI JSON specification",
            responses: { 200: { description: "OpenAPI JSON specification", content: { "application/json": {} } } },
        },
    })
    .addPath("/version", {
        get: {
            tags: [TAGS.DOCS],
            summary: "API version",
            responses: { 200: { description: "API version and commit hash", content: { "application/json": {} } } },
        },
    })
    .getSpecAsJson();