import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getTransfers } from "../queries.js";
import { APIError, addMetadata, toJSON } from "./utils.js";
import { parseLimit, parsePage } from "../utils.js";

export default async function (req: Request) {
    const { pathname, searchParams } = new URL(req.url);
    logger.trace("<transfers>\n", { searchParams: Object.fromEntries(Array.from(searchParams)) });

    const query = getTransfers(searchParams);
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