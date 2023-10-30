import { registry } from "../prometheus.js";
import openapi from "./openapi.js";
import health from "./health.js";
import chains from "./chains.js";
import block from "./block.js";
import * as prometheus from "../prometheus.js";
import { logger } from "../logger.js";
import swaggerHtml from "../../swagger/index.html"
import swaggerFavicon from "../../swagger/favicon.png"

export default async function (req: Request) {
    const { pathname} = new URL(req.url);
    prometheus.request.inc({pathname});
    if ( pathname === "/" ) return new Response(Bun.file(swaggerHtml));
    if ( pathname === "/favicon.png" ) return new Response(Bun.file(swaggerFavicon));
    if ( pathname === "/health" ) return health(req);
    if ( pathname === "/metrics" ) return new Response(await registry.metrics(), {headers: {"Content-Type": registry.contentType}});
    if ( pathname === "/openapi" ) return new Response(openapi, {headers: {"Content-Type": "application/json"}});
    if ( pathname === "/chains" ) return chains(req);
    //if ( pathname === "/block" ) return block(req);
    logger.warn(`Not found: ${pathname}`);
    prometheus.request_error.inc({pathname, status: 404});
    return new Response("Not found", { status: 404 });
}
