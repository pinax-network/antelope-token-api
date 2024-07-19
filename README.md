# Antelope Token API

[![.github/workflows/bun-test.yml](https://github.com/pinax-network/antelope-token-api/actions/workflows/bun-test.yml/badge.svg)](https://github.com/pinax-network/antelope-token-api/actions/workflows/bun-test.yml)

> Tokens information from the Antelope blockchains, powered by [Substreams](https://substreams.streamingfast.io/)

<a href="https://pinax.network/en/chain/eos"><img src="https://img.shields.io/badge/EOS-grey?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iNjciIGhlaWdodD0iMTAxIiB2aWV3Qm94PSIwIDAgNjcgMTAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzY2XzI5KSI+DQo8cGF0aCBkPSJNMzMuMzUwOCAwLjIyMTE5MUw5Ljk1MDg2IDMyLjQyMTJMMC4xNTA4NzkgODAuMDIxMkwzMy4zNTA4IDEwMC4yMjFMNjYuNTUwOCA4MC4wMjEyTDU2LjU1MDggMzIuMjIxMkwzMy4zNTA4IDAuMjIxMTkxWk01LjU1MDg3IDc3LjgyMTJMMTIuOTUwOSA0MS42MjEyTDI5Ljc1MDggOTIuNjIxMkw1LjU1MDg3IDc3LjgyMTJaTTE1LjM1MDkgMzMuNDIxMkwzMy4zNTA4IDguNjIxMTlMNTEuMzUwOCAzMy40MjEyTDMzLjM1MDggODcuODIxMkwxNS4zNTA5IDMzLjQyMTJaTTM2Ljc1MDggOTIuNjIxMkw1My41NTA4IDQxLjYyMTJMNjAuOTUwOCA3Ny44MjEyTDM2Ljc1MDggOTIuNjIxMloiIGZpbGw9IndoaXRlIi8+DQo8L2c+DQo8ZGVmcz4NCjxjbGlwUGF0aCBpZD0iY2xpcDBfNjZfMjkiPg0KPHJlY3Qgd2lkdGg9IjY2LjM5OTkiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4xNTA4NzkgMC4yMjExOTEpIi8+DQo8L2NsaXBQYXRoPg0KPC9kZWZzPg0KPC9zdmc+DQo=&logoSize=auto" height="30" /></a>
<a href="https://pinax.network/en/chain/wax"><img src="https://img.shields.io/badge/WAX-grey?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTAxIiBoZWlnaHQ9IjEwMSIgdmlld0JveD0iMCAwIDEwMSAxMDEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI%2BDQo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfNjdfOSkiPg0KPHBhdGggZD0iTTUwLjEzOTQgMTAwLjIyMUM3Ny43NTM2IDEwMC4yMjEgMTAwLjEzOSA3Ny44MzU0IDEwMC4xMzkgNTAuMjIxMkMxMDAuMTM5IDIyLjYwNyA3Ny43NTM2IDAuMjIxMTkxIDUwLjEzOTQgMC4yMjExOTFDMjIuNTI1MiAwLjIyMTE5MSAwLjEzOTQwNCAyMi42MDcgMC4xMzk0MDQgNTAuMjIxMkMwLjEzOTQwNCA3Ny44MzU0IDIyLjUyNTIgMTAwLjIyMSA1MC4xMzk0IDEwMC4yMjFaIiBmaWxsPSIjRjg5MDIyIi8%2BDQo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTg3LjYzOTUgNTkuNDc3Mkg4MC4yNTJMNzUuMDExNCA1NC45ODk3TDY5Ljc4OTUgNTkuNDU4NEg2My41NDU4TDYwLjU2MTQgNTUuODMzNEg1MC4yNzM5TDUyLjg3NyA1Mi42MTc4SDU3LjkzNjRMNTQuMDgzMyA0Ny45MDUzTDQwLjYzMDIgNjQuMjgzNEgzNC4zODk1TDM4LjI4MzMgNTkuNTI3MkgzMS43ODAyTDI4LjI2NDUgNDkuNjcwOUwyNC43NzcgNTkuNDUyMkgxOC4xODAyTDEyLjYzOTUgNDQuMDk5MUgxNy43MDJMMjEuNDI3IDU0LjU1NTNMMjUuMTM5NSA0NC4xNDU5SDMxLjM4OTVMMzUuMDkyNyA1NC41MzM0TDM4Ljc5MjcgNDQuMTQyOEg0My44NzA4TDM4LjI4MzMgNTkuNTI3MkwzOS41MjcgNTguMDA4NEw1MC45Mzk1IDQ0LjExNzhINTcuMjIwOEw2Ni43MTc3IDU1LjcwNTNMNzEuMjg2NCA1MS43NzcyTDU2LjgyNyAzOS4yODM0SDY0LjI0ODlMODcuNjM5NSA1OS40NzcyWk04MC4zMTE0IDUwLjE4OTdMNzYuODI3IDQ3LjIwMjJMODAuMzA1MiA0NC4yMzk3TDg3LjMzNjQgNDQuMjQ1OUw4MC4zMTE0IDUwLjE4OTdaIiBmaWxsPSJ3aGl0ZSIvPg0KPC9nPg0KPGRlZnM%2BDQo8Y2xpcFBhdGggaWQ9ImNsaXAwXzY3XzkiPg0KPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjEzOTQwNCAwLjIyMTE5MSkiLz4NCjwvY2xpcFBhdGg%2BDQo8L2RlZnM%2BDQo8L3N2Zz4NCg%3D%3D&logoSize=auto" height="30" /></a>

## REST API

### Usage

| Method | Path | Description |
| :---: | --- | --- |
| GET <br>`text/html` | `/` | [Swagger](https://swagger.io/) API playground |
| GET <br>`application/json` | `/chains` | Information about the chains and latest head block in the database |
| GET <br>`application/json` | `/{chain}/balance` | Balances of an account. |
| GET <br>`application/json` | `/{chain}/holders` | List of holders of a token |
| GET <br>`application/json` | `/{chain}/supply` | Total supply for a token |
| GET <br>`application/json` | `/{chain}/tokens` | List of available tokens |
| GET <br>`application/json` | `/{chain}/transfers` | All transfers related to a token |
| GET <br>`application/json` | `/{chain}/transfers/{trx_id}` | Specific transfer related to a token |

### Docs

| Method | Path | Description |
| :---: | --- | --- |
| GET <br>`application/json` | `/openapi` | [OpenAPI](https://www.openapis.org/) specification |
| GET <br>`application/json` | `/version` | API version and Git short commit hash |

### Monitoring

| Method | Path | Description |
| :---: | --- | --- |
| GET <br>`text/plain` | `/health` | Checks database connection |
| GET <br>`text/plain` | `/metrics` | [Prometheus](https://prometheus.io/) metrics |

## Requirements

- [ClickHouse](clickhouse.com/), databases should follow a `{chain}_tokens_{version}` naming scheme. Tables can be created using the [`schema.sql`](./schema.sql) definitions.
- A [Substream sink](https://substreams.streamingfast.io/reference-and-specs/glossary#sink) for loading data into ClickHouse. We recommend [Substreams Sink ClickHouse](https://github.com/pinax-network/substreams-sink-clickhouse/) or [Substreams Sink SQL](https://github.com/streamingfast/substreams-sink-sql). You should use the generated [`protobuf` files](tsp-output/@typespec/protobuf) to build your substream. This Token API makes use of the [`substreams-antelope-tokens`](https://github.com/pinax-network/substreams-antelope-tokens/) substream.

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

> [!WARNING]
> Linux x86 only

```console
$ wget https://github.com/pinax-network/antelope-token-api/releases/download/v3.0.0/antelope-token-api
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