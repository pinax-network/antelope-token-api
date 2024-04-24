import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getTransfers } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { addMetadata, toJSON } from "./utils.js";
import { parseLimit, parsePage } from "../utils.js";

export default async function (req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        logger.info({ searchParams: Object.fromEntries(Array.from(searchParams)) });
        
        const query = getTransfers(searchParams);
        const response = await makeQuery(query)
        
        return toJSON(
            addMetadata(
                response,
                parseLimit(searchParams.get("limit")),
                parsePage(searchParams.get("page"))
            )
        );
    } catch (e: any) {
        logger.error(e);
        prometheus.request_error.inc({ pathname: "/transfers", status: 400 });
        
        return new Response(e.message, { status: 400 });
    }
}