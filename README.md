# Antelope Token API

[![.github/workflows/bun-test.yml](https://github.com/pinax-network/antelope-token-api/actions/workflows/bun-test.yml/badge.svg)](https://github.com/pinax-network/antelope-token-api/actions/workflows/bun-test.yml)

> Token prices from the Antelope blockchains

## REST API

| Pathname                                  | Description           |
|-------------------------------------------|-----------------------|
| GET `/chains`                             | Available `chains`
| GET `/health`                             | Health check
| GET `/metrics`                            | Prometheus metrics
| GET `/openapi`                            | [OpenAPI v3 JSON](https://spec.openapis.org/oas/v3.0.0)

## Requirements

- [ClickHouse](clickhouse.com/)
- [Substreams Sink ClickHouse](https://github.com/pinax-network/substreams-sink-clickhouse/)

## Quickstart

```console
$ bun install
$ bun dev
```

## [`Bun` Binary Releases](https://github.com/pinax-network/substreams-sink-websockets/releases)

> Linux Only

```console
$ wget https://github.com/pinax-network/antelope-token-api/releases/download/v0.1.0/antelope-token-api
$ chmod +x ./antelope-token-api
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

## Help

```console

```

## Docker environment

Pull from GitHub Container registry
```bash
docker pull ghcr.io/pinax-network/antelope-token-api:latest
```

Build from source
```bash
docker build -t antelope-token-api .
```

Run with `.env` file
```bash
docker run -it --rm --env-file .env ghcr.io/pinax-network/antelope-token-api
```
