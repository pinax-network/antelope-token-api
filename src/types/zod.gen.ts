import { z } from "zod";


export const apiErrorSchema = z.object({ "status": z.union([z.literal(500), z.literal(504), z.literal(400), z.literal(401), z.literal(403), z.literal(404), z.literal(405)]), "code": z.enum(["bad_database_response", "bad_header", "missing_required_header", "bad_query_input", "database_timeout", "forbidden", "internal_server_error", "method_not_allowed", "route_not_found", "unauthorized"]), "message": z.coerce.string() });
export type ApiErrorSchema = z.infer<typeof apiErrorSchema>;


export const balanceSchema = z.object({ "last_updated_block": z.coerce.number().int(), "contract": z.coerce.string(), "symcode": z.coerce.string(), "balance": z.coerce.number() });
export type BalanceSchema = z.infer<typeof balanceSchema>;


export const balanceChangeSchema = z.object({ "trx_id": z.coerce.string(), "action_index": z.coerce.number().int(), "contract": z.coerce.string(), "symcode": z.coerce.string(), "precision": z.coerce.number().int(), "amount": z.coerce.number().int(), "value": z.coerce.number(), "block_num": z.coerce.number().int(), "timestamp": z.coerce.string(), "account": z.coerce.string(), "balance": z.coerce.string(), "balance_delta": z.coerce.number().int() });
export type BalanceChangeSchema = z.infer<typeof balanceChangeSchema>;


export const blockRangeSchema = z.array(z.coerce.number().int()).max(2);
export type BlockRangeSchema = z.infer<typeof blockRangeSchema>;


export const holderSchema = z.object({ "account": z.coerce.string(), "balance": z.coerce.number() });
export type HolderSchema = z.infer<typeof holderSchema>;


export const modelsScopeSchema = z.object({ "contract": z.coerce.string(), "symcode": z.coerce.string() });
export type ModelsScopeSchema = z.infer<typeof modelsScopeSchema>;


export const paginationSchema = z.object({ "next_page": z.coerce.number().int(), "previous_page": z.coerce.number().int(), "total_pages": z.coerce.number().int(), "total_results": z.coerce.number().int() });
export type PaginationSchema = z.infer<typeof paginationSchema>;


export const queryStatisticsSchema = z.object({ "elapsed": z.coerce.number(), "rows_read": z.coerce.number().int(), "bytes_read": z.coerce.number().int() });
export type QueryStatisticsSchema = z.infer<typeof queryStatisticsSchema>;


export const responseMetadataSchema = z.object({ "statistics": z.lazy(() => queryStatisticsSchema).nullable(), "next_page": z.coerce.number().int(), "previous_page": z.coerce.number().int(), "total_pages": z.coerce.number().int(), "total_results": z.coerce.number().int() });
export type ResponseMetadataSchema = z.infer<typeof responseMetadataSchema>;


export const supplySchema = z.object({ "trx_id": z.coerce.string(), "action_index": z.coerce.number().int(), "contract": z.coerce.string(), "symcode": z.coerce.string(), "precision": z.coerce.number().int(), "amount": z.coerce.number().int(), "value": z.coerce.number(), "block_num": z.coerce.number().int(), "timestamp": z.coerce.string(), "issuer": z.coerce.string(), "max_supply": z.coerce.string(), "supply": z.coerce.string(), "supply_delta": z.coerce.number().int() });
export type SupplySchema = z.infer<typeof supplySchema>;


export const transferSchema = z.object({ "trx_id": z.coerce.string(), "action_index": z.coerce.number().int(), "contract": z.coerce.string(), "symcode": z.coerce.string(), "precision": z.coerce.number().int(), "amount": z.coerce.number().int(), "value": z.coerce.number(), "block_num": z.coerce.number().int(), "timestamp": z.coerce.string(), "from": z.coerce.string(), "to": z.coerce.string(), "quantity": z.coerce.string(), "memo": z.coerce.string() });
export type TransferSchema = z.infer<typeof transferSchema>;


export const versionSchema = z.object({ "version": z.coerce.string().regex(new RegExp("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$")), "commit": z.coerce.string().regex(new RegExp("^[0-9a-f]{7}$")) });
export type VersionSchema = z.infer<typeof versionSchema>;


export const usageBalanceQueryParamsSchema = z.object({ "account": z.coerce.string(), "contract": z.coerce.string().optional(), "symcode": z.coerce.string().optional(), "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() });
export type UsageBalanceQueryParamsSchema = z.infer<typeof usageBalanceQueryParamsSchema>;
/**
 * @description Array of balances.
 */
export const usageBalance200Schema = z.object({ "data": z.array(z.lazy(() => balanceSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageBalance200Schema = z.infer<typeof usageBalance200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageBalanceErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageBalanceErrorSchema = z.infer<typeof usageBalanceErrorSchema>;
/**
 * @description Array of balances.
 */
export const usageBalanceQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => balanceSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageBalanceQueryResponseSchema = z.infer<typeof usageBalanceQueryResponseSchema>;


export const usageBalanceHistoricalQueryParamsSchema = z.object({ "account": z.coerce.string(), "block_num": z.coerce.number().int(), "contract": z.coerce.string().optional(), "symcode": z.coerce.string().optional(), "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() });
export type UsageBalanceHistoricalQueryParamsSchema = z.infer<typeof usageBalanceHistoricalQueryParamsSchema>;
/**
 * @description Array of balances.
 */
export const usageBalanceHistorical200Schema = z.object({ "data": z.array(z.lazy(() => balanceChangeSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageBalanceHistorical200Schema = z.infer<typeof usageBalanceHistorical200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageBalanceHistoricalErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageBalanceHistoricalErrorSchema = z.infer<typeof usageBalanceHistoricalErrorSchema>;
/**
 * @description Array of balances.
 */
export const usageBalanceHistoricalQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => balanceChangeSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageBalanceHistoricalQueryResponseSchema = z.infer<typeof usageBalanceHistoricalQueryResponseSchema>;


export const usageHeadQueryParamsSchema = z.object({ "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() }).optional();
export type UsageHeadQueryParamsSchema = z.infer<typeof usageHeadQueryParamsSchema>;
/**
 * @description Head block information.
 */
export const usageHead200Schema = z.object({ "data": z.array(z.object({ "block_num": z.coerce.number().int(), "block_id": z.coerce.string() })), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageHead200Schema = z.infer<typeof usageHead200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageHeadErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageHeadErrorSchema = z.infer<typeof usageHeadErrorSchema>;
/**
 * @description Head block information.
 */
export const usageHeadQueryResponseSchema = z.object({ "data": z.array(z.object({ "block_num": z.coerce.number().int(), "block_id": z.coerce.string() })), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageHeadQueryResponseSchema = z.infer<typeof usageHeadQueryResponseSchema>;

 /**
 * @description OK or ApiError.
 */
export const monitoringHealth200Schema = z.coerce.string();
export type MonitoringHealth200Schema = z.infer<typeof monitoringHealth200Schema>;
/**
 * @description An unexpected error response.
 */
export const monitoringHealthErrorSchema = z.lazy(() => apiErrorSchema);
export type MonitoringHealthErrorSchema = z.infer<typeof monitoringHealthErrorSchema>;
/**
 * @description OK or ApiError.
 */
export const monitoringHealthQueryResponseSchema = z.coerce.string();
export type MonitoringHealthQueryResponseSchema = z.infer<typeof monitoringHealthQueryResponseSchema>;


export const usageHoldersQueryParamsSchema = z.object({ "contract": z.coerce.string(), "symcode": z.coerce.string(), "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() });
export type UsageHoldersQueryParamsSchema = z.infer<typeof usageHoldersQueryParamsSchema>;
/**
 * @description Array of accounts.
 */
export const usageHolders200Schema = z.object({ "data": z.array(z.lazy(() => holderSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageHolders200Schema = z.infer<typeof usageHolders200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageHoldersErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageHoldersErrorSchema = z.infer<typeof usageHoldersErrorSchema>;
/**
 * @description Array of accounts.
 */
export const usageHoldersQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => holderSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageHoldersQueryResponseSchema = z.infer<typeof usageHoldersQueryResponseSchema>;

 /**
 * @description Metrics as text.
 */
export const monitoringMetrics200Schema = z.coerce.string();
export type MonitoringMetrics200Schema = z.infer<typeof monitoringMetrics200Schema>;
/**
 * @description An unexpected error response.
 */
export const monitoringMetricsErrorSchema = z.lazy(() => apiErrorSchema);
export type MonitoringMetricsErrorSchema = z.infer<typeof monitoringMetricsErrorSchema>;
/**
 * @description Metrics as text.
 */
export const monitoringMetricsQueryResponseSchema = z.coerce.string();
export type MonitoringMetricsQueryResponseSchema = z.infer<typeof monitoringMetricsQueryResponseSchema>;

 /**
 * @description The OpenAPI JSON spec
 */
export const docsOpenapi200Schema = z.any();
export type DocsOpenapi200Schema = z.infer<typeof docsOpenapi200Schema>;
/**
 * @description An unexpected error response.
 */
export const docsOpenapiErrorSchema = z.lazy(() => apiErrorSchema);
export type DocsOpenapiErrorSchema = z.infer<typeof docsOpenapiErrorSchema>;

 export const docsOpenapiQueryResponseSchema = z.any();
export type DocsOpenapiQueryResponseSchema = z.infer<typeof docsOpenapiQueryResponseSchema>;


export const usageSupplyQueryParamsSchema = z.object({ "block_num": z.coerce.number().int().optional(), "issuer": z.coerce.string().optional(), "contract": z.coerce.string(), "symcode": z.coerce.string(), "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() });
export type UsageSupplyQueryParamsSchema = z.infer<typeof usageSupplyQueryParamsSchema>;
/**
 * @description Array of supplies.
 */
export const usageSupply200Schema = z.object({ "data": z.array(z.lazy(() => supplySchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageSupply200Schema = z.infer<typeof usageSupply200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageSupplyErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageSupplyErrorSchema = z.infer<typeof usageSupplyErrorSchema>;
/**
 * @description Array of supplies.
 */
export const usageSupplyQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => supplySchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageSupplyQueryResponseSchema = z.infer<typeof usageSupplyQueryResponseSchema>;


export const usageTokensQueryParamsSchema = z.object({ "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() }).optional();
export type UsageTokensQueryParamsSchema = z.infer<typeof usageTokensQueryParamsSchema>;
/**
 * @description Array of token identifier.
 */
export const usageTokens200Schema = z.object({ "data": z.array(z.lazy(() => modelsScopeSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTokens200Schema = z.infer<typeof usageTokens200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageTokensErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageTokensErrorSchema = z.infer<typeof usageTokensErrorSchema>;
/**
 * @description Array of token identifier.
 */
export const usageTokensQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => modelsScopeSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTokensQueryResponseSchema = z.infer<typeof usageTokensQueryResponseSchema>;


export const usageTransfersQueryParamsSchema = z.object({ "block_range": z.lazy(() => blockRangeSchema).optional(), "contract": z.coerce.string(), "symcode": z.coerce.string(), "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() });
export type UsageTransfersQueryParamsSchema = z.infer<typeof usageTransfersQueryParamsSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransfers200Schema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransfers200Schema = z.infer<typeof usageTransfers200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageTransfersErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageTransfersErrorSchema = z.infer<typeof usageTransfersErrorSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransfersQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransfersQueryResponseSchema = z.infer<typeof usageTransfersQueryResponseSchema>;


export const usageTransfersAccountQueryParamsSchema = z.object({ "account": z.coerce.string(), "block_range": z.lazy(() => blockRangeSchema).optional(), "from": z.coerce.string().optional(), "to": z.coerce.string().optional(), "contract": z.coerce.string().optional(), "symcode": z.coerce.string().optional(), "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() });
export type UsageTransfersAccountQueryParamsSchema = z.infer<typeof usageTransfersAccountQueryParamsSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransfersAccount200Schema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransfersAccount200Schema = z.infer<typeof usageTransfersAccount200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageTransfersAccountErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageTransfersAccountErrorSchema = z.infer<typeof usageTransfersAccountErrorSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransfersAccountQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransfersAccountQueryResponseSchema = z.infer<typeof usageTransfersAccountQueryResponseSchema>;


export const usageTransferIdQueryParamsSchema = z.object({ "trx_id": z.coerce.string(), "limit": z.coerce.number().int().default(10).optional(), "page": z.coerce.number().int().default(1).optional() });
export type UsageTransferIdQueryParamsSchema = z.infer<typeof usageTransferIdQueryParamsSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransferId200Schema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransferId200Schema = z.infer<typeof usageTransferId200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageTransferIdErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageTransferIdErrorSchema = z.infer<typeof usageTransferIdErrorSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransferIdQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransferIdQueryResponseSchema = z.infer<typeof usageTransferIdQueryResponseSchema>;

 /**
 * @description The Api version and commit hash.
 */
export const docsVersion200Schema = z.lazy(() => versionSchema);
export type DocsVersion200Schema = z.infer<typeof docsVersion200Schema>;
/**
 * @description An unexpected error response.
 */
export const docsVersionErrorSchema = z.lazy(() => apiErrorSchema);
export type DocsVersionErrorSchema = z.infer<typeof docsVersionErrorSchema>;
/**
 * @description The Api version and commit hash.
 */
export const docsVersionQueryResponseSchema = z.lazy(() => versionSchema);
export type DocsVersionQueryResponseSchema = z.infer<typeof docsVersionQueryResponseSchema>;

 export const operations = { "Usage_balance": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageBalanceQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageBalanceQueryResponseSchema,
            default: usageBalanceQueryResponseSchema
        },
        errors: {}
    }, "Usage_balanceHistorical": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageBalanceHistoricalQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageBalanceHistoricalQueryResponseSchema,
            default: usageBalanceHistoricalQueryResponseSchema
        },
        errors: {}
    }, "Usage_head": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageHeadQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageHeadQueryResponseSchema,
            default: usageHeadQueryResponseSchema
        },
        errors: {}
    }, "Monitoring_health": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: monitoringHealthQueryResponseSchema,
            default: monitoringHealthQueryResponseSchema
        },
        errors: {}
    }, "Usage_holders": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageHoldersQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageHoldersQueryResponseSchema,
            default: usageHoldersQueryResponseSchema
        },
        errors: {}
    }, "Monitoring_metrics": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: monitoringMetricsQueryResponseSchema,
            default: monitoringMetricsQueryResponseSchema
        },
        errors: {}
    }, "Docs_openapi": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: docsOpenapiQueryResponseSchema,
            default: docsOpenapiQueryResponseSchema
        },
        errors: {}
    }, "Usage_supply": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageSupplyQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageSupplyQueryResponseSchema,
            default: usageSupplyQueryResponseSchema
        },
        errors: {}
    }, "Usage_tokens": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageTokensQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageTokensQueryResponseSchema,
            default: usageTokensQueryResponseSchema
        },
        errors: {}
    }, "Usage_transfers": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageTransfersQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageTransfersQueryResponseSchema,
            default: usageTransfersQueryResponseSchema
        },
        errors: {}
    }, "Usage_transfersAccount": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageTransfersAccountQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageTransfersAccountQueryResponseSchema,
            default: usageTransfersAccountQueryResponseSchema
        },
        errors: {}
    }, "Usage_transferId": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageTransferIdQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageTransferIdQueryResponseSchema,
            default: usageTransferIdQueryResponseSchema
        },
        errors: {}
    }, "Docs_version": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: docsVersionQueryResponseSchema,
            default: docsVersionQueryResponseSchema
        },
        errors: {}
    } } as const;
export const paths = { "/balance": {
        get: operations["Usage_balance"]
    }, "/balance/historical": {
        get: operations["Usage_balanceHistorical"]
    }, "/head": {
        get: operations["Usage_head"]
    }, "/health": {
        get: operations["Monitoring_health"]
    }, "/holders": {
        get: operations["Usage_holders"]
    }, "/metrics": {
        get: operations["Monitoring_metrics"]
    }, "/openapi": {
        get: operations["Docs_openapi"]
    }, "/supply": {
        get: operations["Usage_supply"]
    }, "/tokens": {
        get: operations["Usage_tokens"]
    }, "/transfers": {
        get: operations["Usage_transfers"]
    }, "/transfers/account": {
        get: operations["Usage_transfersAccount"]
    }, "/transfers/id": {
        get: operations["Usage_transferId"]
    }, "/version": {
        get: operations["Docs_version"]
    } } as const;