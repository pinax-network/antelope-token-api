import { Query } from "../clickhouse/makeQuery.js";

export function toJSON(data: any, status: number = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export function addMetadata(response: Query<any>, req_limit: number, req_page: number) {
    // TODO: Catch page number greater than total_pages and return error
    return {
        data: response.data,
        meta: {
            statistics: response.statistics,
            "next_page": (req_page * req_limit >= response.rows_before_limit_at_least) ? req_page : req_page + 1,
            "previous_page": (req_page <= 1) ? req_page : req_page - 1,
            "total_pages": Math.ceil( response.rows_before_limit_at_least / req_limit),
            "total_results": response.rows_before_limit_at_least
        }
    }
}