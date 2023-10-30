import "dotenv/config";
import { z } from 'zod';
import { Option, program } from "commander";

import pkg from "../package.json";

export const DEFAULT_PORT = "8080";
export const DEFAULT_HOSTNAME = "localhost";
export const DEFAULT_HOST = "http://localhost:8123";
export const DEFAULT_DATABASE = "default";
export const DEFAULT_TABLE = "blocks";
export const DEFAULT_USERNAME = "default";
export const DEFAULT_PASSWORD = "";
export const DEFAULT_MAX_LIMIT = 500;
export const DEFAULT_VERBOSE = false;
export const APP_NAME = pkg.name;
export const DEFAULT_SORT_BY = "DESC";

// parse command line options
const opts = program
    .name(pkg.name)
    .version(pkg.version)
    .description(pkg.description)
    .showHelpAfterError()
    .addOption(new Option("-p, --port <number>", "HTTP port on which to attach the API").env("PORT").default(DEFAULT_PORT))
    .addOption(new Option("-v, --verbose <boolean>", "Enable verbose logging").choices(["true", "false"]).env("VERBOSE").default(DEFAULT_VERBOSE))
    .addOption(new Option("--hostname <string>", "Server listen on HTTP hostname").env("HOSTNAME").default(DEFAULT_HOSTNAME))
    .addOption(new Option("--host <string>", "Database HTTP hostname").env("HOST").default(DEFAULT_HOST))
    .addOption(new Option("--username <string>", "Database user").env("USERNAME").default(DEFAULT_USERNAME))
    .addOption(new Option("--password <string>", "Password associated with the specified username").env("PASSWORD").default(DEFAULT_PASSWORD))
    .addOption(new Option("--database <string>", "The database to use inside ClickHouse").env("DATABASE").default(DEFAULT_DATABASE))
    .addOption(new Option("--table <string>", "Clickhouse table name").env("TABLE").default(DEFAULT_TABLE))
    .addOption(new Option("--max-limit <number>", "Maximum LIMIT queries").env("MAX_LIMIT").default(DEFAULT_MAX_LIMIT))
    .parse()
    .opts();

export const config = z.object({
    port: z.string(),
    hostname: z.string(),
    host: z.string(),
    table: z.string(),
    database: z.string(),
    username: z.string(),
    password: z.string(),
    maxLimit: z.coerce.number(),
    verbose: z.coerce.boolean(),
}).parse(opts);
