import { Query } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import * as prometheus from "../prometheus.js";

interface APIError {
    status: number,
    code?: string,
    detail?: string
}

export function APIError(pathname: string, status: number, code?: string, detail?: string) {
    const api_error: APIError = {
        status,
        code: code ? code : "unknown",
        detail: detail ? detail : ""
    }

    logger.error("<APIError>\n", api_error);
    prometheus.request_error.inc({ pathname, status });
    return toJSON(api_error, status);
}

export function toJSON(data: any, status: number = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export function addMetadata(response: Query<any>, req_limit?: number, req_page?: number) {
    // TODO: Catch page number greater than total_pages and return error
    if (typeof (req_limit) !== 'undefined' && typeof (req_page) !== 'undefined') {
        const total_pages = Math.ceil(response.rows_before_limit_at_least / req_limit);

        if (req_page > total_pages)
            throw Error("Requested page exceeds total pages")

        return {
            data: response.data,
            meta: {
                statistics: response.statistics,
                next_page: (req_page * req_limit >= response.rows_before_limit_at_least) ? req_page : req_page + 1,
                previous_page: (req_page <= 1) ? req_page : req_page - 1,
                total_pages,
                total_results: response.rows_before_limit_at_least
            }
        }
    } else {
        return {
            data: response.data,
            meta: {
                statistics: response.statistics,
            }
        }
    }
}