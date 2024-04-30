import { addMetadata, toJSON } from "./utils.js"; 
import { makeQuery } from "../clickhouse/makeQuery.js";

export default async function (req: Request) {
	return toJSON(
		addMetadata(
			await makeQuery("SELECT block_num FROM cursors ORDER BY block_num DESC LIMIT 1")
		)
	);
}