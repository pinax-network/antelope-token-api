import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getTotalSupply } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { APIError, addMetadata, toJSON } from "./utils.js";
import { parseLimit, parsePage } from "../utils.js";

function verifyParams(searchParams: URLSearchParams) {
    const contract = searchParams.get("contract");
    const issuer = searchParams.get("issuer");

    if (!issuer && !contract) throw new Error("issuer or contract is required");
}

export default async function (req: Request) {
    try {
        const { pathname, searchParams } = new URL(req.url);
        logger.info({ searchParams: Object.fromEntries(Array.from(searchParams)) });

        try {
            verifyParams(searchParams);
        } catch (e: any) {
            return APIError(pathname, 400, "bad_query_input", e.message);
        }

        const query = getTotalSupply(searchParams);
        let response;

        try {
            response = await makeQuery(query);
        } catch (e: any) {
            return APIError(pathname, 500, "failed_database_query", e.message);
        }

        return toJSON(
            addMetadata(
                response,
                parseLimit(searchParams.get("limit")),
                parsePage(searchParams.get("page"))
            )
        );
    } catch (e: any) {
        logger.error(e);
        prometheus.request_error.inc({ pathname: "/supply", status: 400 });

        return new Response(e.message, { status: 400 });
    }
}