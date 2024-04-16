import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getTotalSupply } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { toJSON } from "./utils.js";

function verifyParams(searchParams: URLSearchParams) {
    const contract = searchParams.get("contract");
    const issuer = searchParams.get("issuer");

    if (!issuer && !contract) throw new Error("issuer or contract is required");
}

export default async function (req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        logger.info({ searchParams: Object.fromEntries(Array.from(searchParams)) });

        verifyParams(searchParams);
        const query = getTotalSupply(searchParams);
        const response = await makeQuery(query)

        return toJSON(response.data);
    } catch (e: any) {
        logger.error(e);
        prometheus.request_error.inc({ pathname: "/supply", status: 400 });

        return new Response(e.message, { status: 400 });
    }
}