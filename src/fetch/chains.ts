// from: https://github.com/pinax-network/substreams-clock-api/blob/main/src/fetch/chains.ts
import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import * as prometheus from "../prometheus.js";
import { getChain } from "../queries.js";
import { toJSON } from "./utils.js";

export async function supportedChainsQuery() {
  const response = await makeQuery<{ chain: string }>(getChain());
  return response.data.map((r) => r.chain);
}

export default async function (_req: Request) {
  try {
    const chains = await supportedChainsQuery();
    return toJSON(chains);
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({ pathname: "/chains", status: 400 });
    return new Response(e.message, { status: 400 });
  }
}