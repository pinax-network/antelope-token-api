import client from "../clickhouse/createClient.js";
import { APIError } from "./utils.js";

// TODO: Add log entry
export default async function (req: Request) {
    const response = await client.ping();

    if (!response.success) {
        return APIError(new URL(req.url).pathname, 503, "failed_ping_database", response.error.message);
    }
    
    return new Response("OK");
}