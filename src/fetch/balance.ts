import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getBalanceChanges } from "../queries.js";
import { APIError, addMetadata, toJSON } from "./utils.js";
import { parseLimit, parsePage } from "../utils.js";

function verifyParams(searchParams: URLSearchParams) {
    const account = searchParams.get("account");
    const contract = searchParams.get("contract");

    if (!account && !contract) throw new Error("account or contract is required");
}

export default async function (req: Request) {
    const { pathname, searchParams } = new URL(req.url);
    logger.trace("<balance>\n", { searchParams: Object.fromEntries(Array.from(searchParams)) });

    try {
        verifyParams(searchParams);
    } catch (e: any) {
        return APIError(pathname, 400, "bad_query_input", e.message);
    }

    const query = getBalanceChanges(searchParams);
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