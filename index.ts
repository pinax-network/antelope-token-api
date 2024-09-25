import { Hono, type Context } from "hono";
import { type RootResolver, graphqlServer } from '@hono/graphql-server';
import { buildSchema } from 'graphql';
import { SafeParseSuccess, z } from 'zod';

import client from './src/clickhouse/client.js';
import openapi from "./static/@typespec/openapi3/openapi.json";
import * as prometheus from './src/prometheus.js';
import { APP_VERSION } from "./src/config.js";
import { logger } from './src/logger.js';
import { makeUsageQuery } from "./src/usage.js";
import { APIErrorResponse } from "./src/utils.js";
import { usageOperationsToEndpointsMap, type EndpointReturnTypes, type UsageEndpoints, type ValidPathParams, type ValidUserParams } from "./src/types/api.js";
import { paths, usageTransfersQueryParamsSchema } from './src/types/zod.gen.js';

async function AntelopeTokenAPI() {
    const app = new Hono();

    // Tracking all incoming requests
    app.use(async (ctx: Context, next) => {
        const pathname = ctx.req.path;
        logger.trace(`Incoming request: [${pathname}]`);
        prometheus.request.inc({ pathname });

        await next();
    });

    // ---------------
    // --- Swagger ---
    // ---------------

    app.get(
        "/",
        async (_) => new Response(Bun.file("./swagger/index.html"))
    );

    app.get(
        "/favicon.ico",
        async (_) => new Response(Bun.file("./swagger/favicon.ico"))
    );

    // ------------
    // --- Docs ---
    // ------------

    app.get(
        "/openapi",
        async (ctx: Context) => ctx.json<{ [key: string]: EndpointReturnTypes<"/openapi">; }, 200>(openapi)
    );

    app.get(
        "/version",
        async (ctx: Context) => ctx.json<EndpointReturnTypes<"/version">, 200>(APP_VERSION)
    );

    // ------------------
    // --- Monitoring ---
    // ------------------

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
        async () => new Response(await prometheus.registry.metrics())
    );

    // --------------------------
    // --- REST API endpoints ---
    // --------------------------

    const createUsageEndpoint = (endpoint: UsageEndpoints) => app.get(
        // Hono using different syntax than OpenAPI for path parameters
        // `/{path_param}` (OpenAPI) VS `/:path_param` (Hono)
        endpoint.replace(/{([^}]+)}/g, ":$1"),
        async (ctx: Context) => {
            // Use `unknown` for undefined schemas definitions in `zod.gen.ts`
            const path_params_schema = paths[endpoint]["get"]["parameters"]["path"] ?? z.unknown();
            const query_params_schema = z.preprocess(
                (q: any) => {
                    // Preprocess block ranges to array so Zod can parse it
                    if (q.block_range)
                        q.block_range = q.block_range.split(',');

                    return q;
                },
                paths[endpoint]["get"]["parameters"]["query"] ?? z.unknown()
            );

            const path_params = path_params_schema.safeParse(ctx.req.param());
            const query_params = query_params_schema.safeParse(ctx.req.query());
            
            if (path_params.success && query_params.success) {
                return makeUsageQuery(
                    ctx,
                    endpoint,
                    {
                        ...path_params.data as SafeParseSuccess<ValidPathParams<typeof endpoint>>,
                        ...query_params.data
                    } as ValidUserParams<typeof endpoint>
                );
            } else {
                // Merge path and query params errors into one `ZodError` instance
                const e = new z.ZodError([]);
                e.addIssues(path_params.error?.issues);
                e.addIssues(query_params.error?.issues);

                return APIErrorResponse(ctx, 400, "bad_query_input", e);
            }
        }
    );

    // Create all API endpoints interacting with DB
    Object.values(usageOperationsToEndpointsMap).forEach(e => createUsageEndpoint(e));

    // ------------------------
    // --- GraphQL endpoint ---
    // ------------------------

    // TODO: Make GraphQL endpoint use the same $SERVER parameter as Swagger if set ?
    const schema = buildSchema(await Bun.file("./static/@openapi-to-graphql/graphql/schema.graphql").text());
    const filterFields: Array<keyof typeof usageOperationsToEndpointsMap> = ['metrics'];

    // @ts-ignore Ignore private field warning for filtering out certain operations from the schema
    filterFields.forEach(f => delete schema._queryType._fields[f]);

    const rootResolver: RootResolver = async (ctx?: Context) => {
        if (ctx) {
            // GraphQL resolver uses the same SQL queries backend as the REST API (`makeUsageQuery`)
            const createGraphQLUsageResolver = (endpoint: UsageEndpoints) => 
                async (args: ValidUserParams<typeof endpoint>) => {
                    return await (await makeUsageQuery(ctx, endpoint, { ...args })).json();
                };

            
            return Object.keys(usageOperationsToEndpointsMap).reduce(
                // SQL queries endpoints
                (resolver, op) => Object.assign(
                    resolver,
                    {
                        [op]: createGraphQLUsageResolver(usageOperationsToEndpointsMap[op] as UsageEndpoints)
                    }
                ),
                // Other endpoints
                {
                    health: async () => {
                        const response = await client.ping();
                        return response.success ? "OK" : `[500] bad_database_response: ${response.error.message}`;
                    },
                    openapi: () => openapi,
                    metrics: async () => await prometheus.registry.metrics(),
                    version: () => APP_VERSION
                }
            );
        }
    };

    // TODO: Find way to log GraphQL queries (need to workaround middleware consuming Request)
    // See: https://github.com/honojs/middleware/issues/81
    //app.use('/graphql', async (ctx: Context) => logger.trace(await ctx.req.json()))

    app.use(
        '/graphql',
        graphqlServer({
            schema,
            rootResolver,
            graphiql: true, // if `true`, presents GraphiQL when the GraphQL endpoint is loaded in a browser.
        })
    );

    // -------------
    // --- Miscs ---
    // -------------

    app.notFound((ctx: Context) => APIErrorResponse(ctx, 404, "route_not_found", `Path not found: ${ctx.req.method} ${ctx.req.path}`));

    return app;
}

export default await AntelopeTokenAPI();