import { makeQuery } from "./clickhouse/makeQuery.js";
import { APIErrorResponse } from "./utils.js";

import type { Context } from "hono";
import type { AdditionalQueryParams, EndpointReturnTypes, UsageEndpoints, UsageResponse, ValidUserParams } from "./types/api.js";
import { config } from "./config.js";

export async function makeUsageQuery(ctx: Context, endpoint: UsageEndpoints, user_params: ValidUserParams<typeof endpoint>) {
    type EndpointElementReturnType = EndpointReturnTypes<typeof endpoint>[number];

    let { page, ...query_params } = user_params;

    if (!query_params.limit)
        query_params.limit = 10;

    if (!page)
        page = 1;

    let filters = "";
    // Don't add `limit` and `block_range` to WHERE clause
    for (const k of Object.keys(query_params).filter(k => k !== "limit" && k !== "block_range" && k !== "chain"))
        filters += ` (${k} = {${k}: String}) AND`;
    filters = filters.substring(0, filters.lastIndexOf(' ')); // Remove last item ` AND`

    if (filters.length)
        filters = `WHERE ${filters}`

    let query = "";
    let additional_query_params: AdditionalQueryParams = {};
    let database = config.database;

    if (endpoint !== "/chains") {
        // TODO: Document required database setup
        const q = query_params as ValidUserParams<typeof endpoint>;
        database = `${q.chain}_tokens_v1`
    }

    if (endpoint == "/{chain}/balance" || endpoint == "/{chain}/supply") {
        // Need to narrow the type of `query_params` explicitly to access properties based on endpoint value
        // See https://github.com/microsoft/TypeScript/issues/33014
        const q = query_params as ValidUserParams<typeof endpoint>;
        if (q.block_num) {
            query +=
                `SELECT *`
                + ` FROM ${endpoint == "/{chain}/balance" ? `${database}.balance_change_events` : `${database}.supply_change_events`}`;
            
            query += ` ${filters} ORDER BY action_index DESC`;
            query_params.limit = 1;
        } else {
            query +=
                `SELECT *, updated_at_block_num AS block_num, updated_at_timestamp AS timestamp`
                + ` FROM ${endpoint == "/{chain}/balance" ? `${database}.account_balances` : `${database}.token_supplies`}`
                + ` FINAL`;

            query += ` ${filters} ORDER BY block_num DESC`;
        }
    } else if (endpoint == "/{chain}/transfers") {
        query += `SELECT * FROM `;

        const q = query_params as ValidUserParams<typeof endpoint>;
        // Find all incoming and outgoing transfers from single account
        if (q.from && q.to && q.from === q.to)
            filters = filters.replace(
                "(from = {from: String}) AND (to = {to: String})",
                "((from = {from: String}) OR (to = {to: String}))",
            )

        if (q.block_range) {
            query += `${database}.transfers_block_num`;
            console.log(q.block_range);
            if (q.block_range[0] && q.block_range[1]) {
                filters += "AND (block_num >= {min_block: int} AND block_num <= {max_block: int})"
                // Use Min/Max to account for any ordering of parameters
                additional_query_params.min_block = Math.min(q.block_range[0], q.block_range[1]);
                additional_query_params.max_block = Math.max(q.block_range[0], q.block_range[1]);
            } else if (q.block_range[0]) {
                filters += "AND (block_num >= {min_block: int})"
                additional_query_params.min_block = q.block_range[0];
            }
        } else if (q.from) {
            query += `${database}.transfers_from`;
        } else if (q.to) {
            query += `${database}.transfers_to`;
        } else if (q.contract || q.symcode) {
            query += `${database}.transfers_contract`;
        } else {
            query += `${database}.transfers_block_num`;
        }

        query += ` ${filters} ORDER BY block_num DESC`;
    } else if (endpoint == "/{chain}/holders") {
        query += `SELECT account, value FROM (SELECT account, MAX(updated_at_block_num) AS last_updated FROM ${database}.account_balances ${filters} GROUP BY account) AS x INNER JOIN ${database}.account_balances AS y ON y.account = x.account AND y.updated_at_block_num = x.last_updated ${filters} ORDER BY value DESC`;
    } else if (endpoint == "/chains") {
        // TODO: More flexible to account for different chains ?
        query +=
            `SELECT 'wax' as chain, MAX(block_num) as block_num`
            + ` FROM wax_tokens_v1.cursors GROUP BY id`
            + ` UNION ALL`
            + ` SELECT 'eos' as chain, MAX(block_num) as block_num`
            + ` FROM eos_tokens_v1.cursors GROUP BY id`
    } else if (endpoint == "/{chain}/transfers/{trx_id}") {
        query += `SELECT * FROM ${database}.transfer_events ${filters} ORDER BY action_index`;
    } else if (endpoint == "/{chain}/tokens") {
        query += `SELECT *, updated_at_block_num AS block_num FROM ${database}.token_supplies FINAL ${filters} ORDER BY block_num DESC`;
    }

    query += " LIMIT {limit: int}";
    query += " OFFSET {offset: int}";

    let query_results;
    additional_query_params.offset = query_params.limit * (page - 1);
    try {
        query_results = await makeQuery<EndpointElementReturnType>(query, { ...query_params, ...additional_query_params });
    } catch (err) {
        return APIErrorResponse(ctx, 500, "bad_database_response", err);
    }

    // Always have a least one total page
    const total_pages = Math.max(Math.ceil((query_results.rows_before_limit_at_least ?? 0) / query_params.limit), 1);

    if (page > total_pages)
        return APIErrorResponse(ctx, 400, "bad_query_input", `Requested page (${page}) exceeds total pages (${total_pages})`);

    /* Solving the `data` type issue:
    type A = string[] | number[]; // This is union of array types
    type B = A[number][]; // This is array of elements of union type

    let t: A;
    let v: B;

    t = v; // Error
    */

    return ctx.json<UsageResponse, 200>({
        // @ts-ignore        
        data: query_results.data,
        meta: {
            statistics: query_results.statistics ?? null,
            next_page: (page * query_params.limit >= (query_results.rows_before_limit_at_least ?? 0)) ? page : page + 1,
            previous_page: (page <= 1) ? page : page - 1,
            total_pages,
            total_results: query_results.rows_before_limit_at_least ?? 0
        }
    });
}

