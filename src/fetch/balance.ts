import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getBalanceChanges } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { toJSON } from "./utils.js";

function verifyParams(searchParams: URLSearchParams) {
    const account = searchParams.get("account");
    const contract = searchParams.get("contract");

    if (!account && !contract) throw new Error("account or contract is required");
}

export default async function (req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        logger.info({ searchParams: Object.fromEntries(Array.from(searchParams)) });

        verifyParams(searchParams);
        const query = getBalanceChanges(searchParams);
        const response = await makeQuery(query)

        return toJSON(response.data);
    } catch (e: any) {
        logger.error(e);
        prometheus.request_error.inc({ pathname: "/balance", status: 400 });

        return new Response(e.message, { status: 400 });
    }
}