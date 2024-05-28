import { makeQuery } from "./clickhouse/makeQuery.js";
import { APIErrorResponse } from "./utils.js";

import type { Context } from "hono";
import type { EndpointReturnTypes, UsageEndpoints, UsageResponse, ValidUserParams } from "./types/api.js";

export async function makeUsageQuery(ctx: Context, endpoint: UsageEndpoints, user_params: ValidUserParams<typeof endpoint>) {
    type EndpointElementReturnType = EndpointReturnTypes<typeof endpoint>[number];

    let { page, ...query_params } = user_params;

    if (!query_params.limit)
        query_params.limit = 10;

    if (!page)
        page = 1;

    let query = "";
    if (endpoint == "/balance" || endpoint == "/supply") {
        // Need to narrow the type of `query_params` explicitly to access properties based on endpoint value
        // See https://github.com/microsoft/TypeScript/issues/33014
        const q = query_params as ValidUserParams<typeof endpoint>;
        if (q.block_num)
            query +=
                `SELECT *`
                + ` FROM ${endpoint == "/balance" ? "balance_change_events" : "supply_change_events"}`
                + ` FINAL`;
        else
            query +=
                `SELECT *, updated_at_block_num AS block_num, updated_at_timestamp AS timestamp`
                + ` FROM ${endpoint == "/balance" ? "account_balances" : "token_supplies"}`
                + ` FINAL`;
    } else if (endpoint == "/transfers") {
        query += `SELECT * FROM `;

        const q = query_params as ValidUserParams<typeof endpoint>;
        if (q.block_range) {
            query += `transfers_block_num `;
        } else if (q.from) {
            query += `transfers_from `;
        } else if (q.to) {
            query += `transfers_to `;
        } else if (q.contract || q.symcode) {
            query += `transfers_contract `;
        } else {
            query += `transfer_events `;
        }

        // FINAL increases ClickHouse query response time significantly when lots of data needs merging
        // Drop it for now
        //query += `FINAL`;
    } else if (endpoint == "/holders") {
        query += `SELECT DISTINCT account, value FROM eos_tokens_v1.account_balances FINAL WHERE value > 0`;
    } else if (endpoint == "/head") {
        query += `SELECT block_num FROM cursors`
    } else if (endpoint == "/transfers/{trx_id}") {
        query += `SELECT * FROM transfer_events FINAL`;
    } else {
        query += `SELECT DISTINCT *, updated_at_block_num AS block_num FROM eos_tokens_v1.token_supplies FINAL`;
    }

    query += endpoint == "/holders" ? " AND" : " WHERE";
    for (const k of Object.keys(query_params).filter(k => k !== "limit")) // Don't add limit to WHERE clause
        query += ` ${k} == {${k}: String} AND`;
    query = query.substring(0, query.lastIndexOf(' ')); // Remove last item ` AND`

    query += endpoint == "/holders" ? "  ORDER BY value DESC" : " ORDER BY block_num DESC";
    query += " LIMIT {limit: int}";
    query += " OFFSET {offset: int}";

    let query_results;
    try {
        query_results = await makeQuery<EndpointElementReturnType>(query, { ...query_params, offset: query_params.limit * (page - 1) });
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

