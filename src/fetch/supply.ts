import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getTotalSupply } from "../queries.js";
import { APIError, addMetadata, toJSON } from "./utils.js";
import { parseLimit, parsePage } from "../utils.js";

function verifyParams(searchParams: URLSearchParams) {
    const contract = searchParams.get("contract");
    const issuer = searchParams.get("issuer");

    if (!issuer && !contract) throw new Error("issuer or contract is required");
}

export default async function (req: Request) {
    const { pathname, searchParams } = new URL(req.url);
    logger.trace("<supply>\n", { searchParams: Object.fromEntries(Array.from(searchParams)) });

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

    try {
        return toJSON(
            addMetadata(
                response,
                parseLimit(searchParams.get("limit")),
                parsePage(searchParams.get("page"))
            )
        );
    } catch (e: any) {
        return APIError(pathname, 500, "failed_response", e.message);
    }
}