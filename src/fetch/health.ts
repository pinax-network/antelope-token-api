import client from "../clickhouse/createClient.js";
import { logger } from "../logger.js";
import * as prometheus from "../prometheus.js";

// TODO: Add log entry
export default async function (_req: Request) {
    try {
        const response = await client.ping();
    
        if (response.success === false) throw new Error(response.error.message);
        if (response.success === true) return new Response("OK");
    
        return new Response("Unknown response from ClickHouse");
    } catch (e: any) {
        logger.error(e);
        prometheus.request_error.inc({ pathname: "/health", status: 500 });
    
        return new Response(e.message, { status: 500 });
    }
}