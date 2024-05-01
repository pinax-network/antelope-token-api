import { APIError, addMetadata, toJSON } from "./utils.js"; 
import { makeQuery } from "../clickhouse/makeQuery.js";

export default async function (req: Request) {
    let query = "SELECT block_num FROM cursors ORDER BY block_num DESC LIMIT 1";
    let response;

    try {
        response = await makeQuery(query);
    } catch (e: any) {
        return APIError(new URL(req.url).pathname, 500, "failed_database_query", e.message);
    }

    return toJSON(addMetadata(response));
}