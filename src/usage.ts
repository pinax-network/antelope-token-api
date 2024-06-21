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

    let filters = "";
    for (const k of Object.keys(query_params).filter(k => k !== "limit")) // Don't add `limit` to WHERE clause
        filters += ` (${k} = {${k}: String}) AND`;
    filters = filters.substring(0, filters.lastIndexOf(' ')); // Remove last item ` AND`

    if (filters.length)
        filters = `WHERE ${filters}`

    let query = "";
    if (endpoint == "/balance" || endpoint == "/supply") {
        // Need to narrow the type of `query_params` explicitly to access properties based on endpoint value
        // See https://github.com/microsoft/TypeScript/issues/33014
        const q = query_params as ValidUserParams<typeof endpoint>;
        if (q.block_num) {
            query +=
                `SELECT *`
                + ` FROM ${endpoint == "/balance" ? "balance_change_events" : "supply_change_events"}`;
            
            query += ` ${filters} ORDER BY action_index DESC`;
            query_params.limit = 1;
        } else {
            query +=
                `SELECT *, updated_at_block_num AS block_num, updated_at_timestamp AS timestamp`
                + ` FROM ${endpoint == "/balance" ? "account_balances" : "token_supplies"}`
                + ` FINAL`;

            query += ` ${filters} ORDER BY block_num DESC`;
        }
    } else if (endpoint == "/transfers") {
        query += `SELECT * FROM `;

        const q = query_params as ValidUserParams<typeof endpoint>;
        if (q.from) {
            // Find all incoming and outgoing transfers from single account
            if (q.to && q.to === q.from)
                filters = filters.replace(
                    "(from = {from: String}) AND (to = {to: String})",
                    "((from = {from: String}) OR (to = {to: String}))",
                )

            query += `transfers_from`;
        } else if (q.to) {
            query += `transfers_to`;
        } else if (q.contract || q.symcode) {
            query += `transfers_contract`;
        } else {
            query += `transfers_block_num`;
        }

        query += ` ${filters} ORDER BY block_num DESC`;
    } else if (endpoint == "/holders") {
        query += `SELECT account, value FROM (SELECT account, MAX(updated_at_block_num) AS last_updated FROM eos_tokens_v1.account_balances ${filters} GROUP BY account) AS x INNER JOIN eos_tokens_v1.account_balances AS y ON y.account = x.account AND y.updated_at_block_num = x.last_updated ${filters} ORDER BY value DESC`;
    } else if (endpoint == "/head") {
        query += `SELECT MAX(block_num) as block_num FROM cursors ${filters} GROUP BY id`;
    } else if (endpoint == "/transfers/{trx_id}") {
        query += `SELECT * FROM transfer_events ${filters} ORDER BY action_index`;
    } else if (endpoint == "/tokens") {
        query += `SELECT *, updated_at_block_num AS block_num FROM eos_tokens_v1.token_supplies FINAL ${filters} ORDER BY block_num DESC`;
    }

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

