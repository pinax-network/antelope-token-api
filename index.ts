import client from './src/clickhouse/client.js';
import openapi from "./tsp-output/@typespec/openapi3/openapi.json";

import { Hono } from "hono";
import { z } from 'zod';
import { paths } from './src/types/zod.gen.js';
import { APP_VERSION } from "./src/config.js";
import { logger } from './src/logger.js';
import * as prometheus from './src/prometheus.js';
import { makeUsageQuery } from "./src/usage.js";
import { APIErrorResponse } from "./src/utils.js";
// import { fixEndpointParametersCoercion } from "./src/types/api.js";

import type { Context } from "hono";
import type { EndpointReturnTypes, UsageEndpoints, ValidPathParams, ValidUserParams } from "./src/types/api.js";

function AntelopeTokenAPI() {
    const app = new Hono();

    app.use(async (ctx: Context, next) => {
        const pathname = ctx.req.path;
        logger.trace(`Incoming request: [${pathname}]`);
        prometheus.request.inc({ pathname });

        await next();
    });

    app.get(
        "/",
        async (_) => new Response(Bun.file("./swagger/index.html"))
    );

    app.get(
        "/favicon.ico",
        async (_) => new Response(Bun.file("./swagger/favicon.ico"))
    );

    app.get(
        "/openapi",
        async (ctx: Context) => ctx.json<{ [key: string]: EndpointReturnTypes<"/openapi">; }, 200>(openapi)
    );

    app.get(
        "/version",
        async (ctx: Context) => ctx.json<EndpointReturnTypes<"/version">, 200>(APP_VERSION)
    );

    app.get(
        "/health",
        async (ctx: Context) => {
            const response = await client.ping();

            if (!response.success) {
                return APIErrorResponse(ctx, 500, "bad_database_response", response.error.message);
            }

            return new Response("OK");
        }
    );

    app.get(
        "/metrics",
        async (_) => new Response(await prometheus.registry.metrics(), { headers: { "Content-Type": prometheus.registry.contentType } })
    );

    const createUsageEndpoint = (endpoint: UsageEndpoints) => app.get(
        // Hono using different syntax than OpenAPI for path parameters
        // `/{path_param}` (OpenAPI) VS `/:path_param` (Hono)
        endpoint.replace(/{([^}]+)}/g, ":$1"),
        async (ctx: Context) => {
            // Use `unknown` for undefined schemas definitions in `zod.gen.ts`
            const path_params_schema = paths[endpoint]["get"]["parameters"]["path"] ?? z.unknown();
            const query_params_schema = paths[endpoint]["get"]["parameters"]["query"] ?? z.unknown();
            const path_params = path_params_schema.safeParse(ctx.req.param());
            const query_params = query_params_schema.safeParse(ctx.req.query());
            
            if (path_params.success && query_params.success) {
                return makeUsageQuery(
                    ctx,
                    endpoint,
                    {
                        ...path_params.data as ValidPathParams<typeof endpoint>,
                        ...query_params.data
                    } as ValidUserParams<typeof endpoint>
                );
            } else {
                return APIErrorResponse(ctx, 400, "bad_query_input", { ...path_params.error, ...query_params.error });
            }
        }
    );

    createUsageEndpoint("/{chain}/balance");
    createUsageEndpoint("/chains");
    createUsageEndpoint("/{chain}/holders");
    createUsageEndpoint("/{chain}/supply");
    createUsageEndpoint("/{chain}/tokens");
    createUsageEndpoint("/{chain}/transfers");
    createUsageEndpoint("/{chain}/transfers/{trx_id}");

    app.notFound((ctx: Context) => APIErrorResponse(ctx, 404, "route_not_found", `Path not found: ${ctx.req.method} ${ctx.req.path}`));

    return app;
}

export default AntelopeTokenAPI();