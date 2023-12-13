import pkg from "../../package.json" assert { type: "json" };

import { OpenApiBuilder, SchemaObject, ExampleObject, ParameterObject } from "openapi3-ts/oas31";
import { config } from "../config.js";
import { registry } from "../prometheus.js";
import { supportedChainsQuery } from "./chains.js";
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

const chains = await supportedChainsQuery();
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

const parameterChain: ParameterObject = {
  name: "chain",
  in: "query",
  description: "Filter by chain",
  required: false,
  schema: { enum: chains },
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
  description: "Used to specify the number of records to return.",
  required: false,
  schema: { type: "number", maximum: config.maxLimit, minimum: 1 },
}

const parameterOffset: ParameterObject = {
  name: "offset",
  in: "query",
  description: "Used to offset data. Combined with limit can be used for pagination.",
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
    license: { name: pkg.license, url: `${pkg.homepage}/blob/main/LICENSE` },
  })
  .addExternalDocs({ url: pkg.homepage, description: "Extra documentation" })
  .addSecurityScheme("auth-key", { type: "http", scheme: "bearer" })
  .addPath("/chains", {
    get: {
      tags: [TAGS.USAGE],
      summary: 'Supported chains',
      responses: {
        200: {
          description: "Array of chains",
          content: {
            "application/json": {
              schema: { type: "array" },
              example: chains,
            }
          },
        },
      },
    },
  })
  .addPath("/supply", {
    get: {
      tags: [TAGS.USAGE],
      summary: "Antelope Tokens total supply",
      parameters: [
        parameterChain,
        parameterString("contract"),
        parameterString("issuer"),
        parameterString("symbol"),
        ...timestampFilter,
        ...blockFilter,
        parameterLimit,
        parameterOffset,
      ],
      responses: {
        200: { description: "Array of supply", content: { "application/json": { example: supply_example, schema: { type: "array" } } } },
        400: { description: "Bad request" },
      },
    },
  })
  .addPath("/balance", {
    get: {
      tags: [TAGS.USAGE],
      summary: "Antelope Tokens balance changes",
      parameters: [
        parameterChain,
        parameterString("account"),
        parameterString("contract"),
        ...timestampFilter,
        ...blockFilter,
        parameterLimit,
        parameterOffset,
      ],
      responses: {
        200: { description: "Array of balance changes", content: { "application/json": { example: balance_example, schema: { type: "array" } } } },
        400: { description: "Bad request" },
      },
    },
  }).addPath("/transfers", {
    get: {
      tags: [TAGS.USAGE],
      summary: "Antelope Tokens Transfers",
      parameters: [
        parameterChain,
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
        200: { description: "Array of supply", content: { "application/json": { example: transfers_example, schema: { type: "array" } } } },
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
      summary: "OpenAPI specification",
      responses: { 200: { description: "OpenAPI JSON Specification", content: { "application/json": { schema: { type: "string" } } } } },
    },
  })
  .getSpecAsJson();