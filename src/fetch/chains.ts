import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import * as prometheus from "../prometheus.js";
import { getChain } from "../queries.js";

export async function supportedChainsQuery() {
  const response = await makeQuery<{chain: string}>(getChain());
  return response.data.map((r) => r.chain);
}

export default async function (req: Request) {
  try {
    const chains = await supportedChainsQuery();
    return new Response(JSON.stringify(chains), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({pathname: "/chains", status: 400});
    return new Response(e.message, { status: 400 });
  }
}