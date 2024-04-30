# Antelope Token API

[![.github/workflows/bun-test.yml](https://github.com/pinax-network/antelope-token-api/actions/workflows/bun-test.yml/badge.svg)](https://github.com/pinax-network/antelope-token-api/actions/workflows/bun-test.yml)

> Token balances, supply and transfers from the Antelope blockchains

## REST API

| Method | Path | Description |
| :---: | --- | --- |
| GET <br>`text/html` | `/` | [Swagger](https://swagger.io/) API playground |
| GET <br>`application/json` | `/supply` | Antelope Tokens total supply |
| GET <br>`application/json` | `/balance` | Antelope Tokens balance changes |
| GET <br>`application/json` | `/transfers` | Antelope Tokens transfers |
| GET <br>`text/plain` | `/health` | Performs health checks and checks if the database is accessible |
| GET <br>`application/json` | `/head` | Information about the current head block in the database |
| GET <br>`text/plain` | `/metrics` | [Prometheus](https://prometheus.io/) metrics for the API |
| GET <br>`application/json` | `/openapi` | [OpenAPI](https://www.openapis.org/) specification |
| GET <br>`application/json` | `/version` | API version and commit hash |

## Requirements

- [ClickHouse](clickhouse.com/)
- (Optional) A [Substream sink](https://substreams.streamingfast.io/reference-and-specs/glossary#sink) for loading data into ClickHouse. We recommend [Substreams Sink ClickHouse](https://github.com/pinax-network/substreams-sink-clickhouse/) or [Substreams Sink SQL](https://github.com/streamingfast/substreams-sink-sql).

## Quick start

Install [Bun](https://bun.sh/)

```console
$ bun install
$ bun dev
```

**Tests**
```console
$ bun lint
$ bun test
```

## [`Bun` Binary Releases](https://github.com/pinax-network/antelope-token-api/releases)

> For Linux x86

```console
$ wget https://github.com/pinax-network/antelope-token-api/releases/download/v2.0.0/antelope-token-api
$ chmod +x ./antelope-token-api
$ ./antelope-token-api --help                                                                                                       
Usage: antelope-token-api [options]

Token balances, supply and transfers from the Antelope blockchains

Options:
  -V, --version            output the version number
  -p, --port <number>      HTTP port on which to attach the API (default: "8080", env: PORT)
  --hostname <string>      Server listen on HTTP hostname (default: "localhost", env: HOSTNAME)
  --host <string>          Database HTTP hostname (default: "http://localhost:8123", env: HOST)
  --database <string>      The database to use inside ClickHouse (default: "default", env: DATABASE)
  --username <string>      Database user (default: "default", env: USERNAME)
  --password <string>      Password associated with the specified username (default: "", env: PASSWORD)
  --max-limit <number>     Maximum LIMIT queries (default: 10000, env: MAX_LIMIT)
  -v, --verbose <boolean>  Enable verbose logging (choices: "true", "false", default: false, env: VERBOSE)
  -h, --help               display help for command
```

## `.env` Environment variables

```env
# API Server
PORT=8080
HOSTNAME=localhost

# Clickhouse Database
HOST=http://127.0.0.1:8123
DATABASE=default
USERNAME=default
PASSWORD=
TABLE=
MAX_LIMIT=500

# Logging
VERBOSE=true
```

## Docker environment

- Pull from GitHub Container registry

**For latest release**
```bash
docker pull ghcr.io/pinax-network/antelope-token-api:latest
```
**For head of `develop` branch**
```bash
docker pull ghcr.io/pinax-network/antelope-token-api:develop
```

- Build from source
```bash
docker build -t antelope-token-api .
```

- Run with `.env` file
```bash
docker run -it --rm --env-file .env ghcr.io/pinax-network/antelope-token-api
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).