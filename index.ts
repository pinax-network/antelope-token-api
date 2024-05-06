import { config } from "./src/config.js";
import { logger } from "./src/logger.js";
import GET from "./src/fetch/GET.js";
import { APIError } from "./src/fetch/utils.js";

const app = Bun.serve({
    hostname: config.hostname,
    port: config.port,
    fetch(req: Request) {
        let pathname = new URL(req.url).pathname;
        if (req.method === "GET") return GET(req);
        return APIError(pathname, 405, "invalid_request_method", "Invalid request method, only GET allowed");
    }
});

logger.info(`Server listening on http://${app.hostname}:${app.port}`);