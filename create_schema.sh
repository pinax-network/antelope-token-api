#!/usr/bin/env bash

# Helper script for generating the `schema.sql` ClickHouse tables definition
# Specify a cluster name to add `ON CLUSTER` directives

show_usage() {
    printf 'Usage: %s [(-o|--outfile) file (default: "schema.sql")] [(-c|--cluster) name (default: none)] [(-h|--help)]\n' "$(basename "$0")"
    exit 0
}

SCHEMA_FILE="./schema.sql"
CLUSTER_NAME=""
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -o|--outfile) SCHEMA_FILE="$2"; shift ;;
        -c|--cluster) CLUSTER_NAME="$2"; shift ;;
        -h|--help) show_usage ;;
        *) echo "Unknown parameter passed: $1"; show_usage; exit 1 ;;
    esac
    shift
done

ON_CLUSTER_DIRECTIVE=""
ENGINE_DEFAULT="ReplacingMergeTree()"
ENGINE_VER="ReplacingMergeTree(ver)"
ENGINE_VER_DELETE="ReplacingMergeTree(ver, has_null_balance)"
if [ -n "$CLUSTER_NAME" ]; then
    ON_CLUSTER_DIRECTIVE="ON CLUSTER \"$CLUSTER_NAME\""
    ENGINE_DEFAULT="ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')"
    ENGINE_VER="ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}', ver)"
    ENGINE_VER_DELETE="ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}', ver, has_null_balance)"
fi

cat > $SCHEMA_FILE <<- EOM
--------------------------------------
-- AUTO-GENERATED FILE, DO NOT EDIT --
--------------------------------------
-- This SQL file creates the required tables for a single Antelope chain.
-- You can use the ClickHouse client command to execute it:
-- $ cat schema.sql | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>

-------------------------------------------------
-- Meta tables to store Substreams information --
-------------------------------------------------

CREATE TABLE IF NOT EXISTS cursors $ON_CLUSTER_DIRECTIVE
(
    id        String,
    cursor    String,
    block_num Int64,
    block_id  String
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (id)
        ORDER BY (id);

-----------------------------------------------------------
-- Tables to store the raw events without any processing --
-----------------------------------------------------------

-- The table to store all transfers. This uses the trx_id as first primary key so we can use this table to do
-- transfer lookups based on a transaction id.
CREATE TABLE IF NOT EXISTS transfer_events $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,
    -- contract & scope --
    contract     String,
    symcode      String,
    -- data payload --
    from         String,
    to           String,
    quantity     String,
    memo         String,
    -- extras --
    precision    UInt32,
    amount       Int64,
    value        Float64,
    -- meta --
    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (trx_id, action_index)
        ORDER BY (trx_id, action_index);

-- The table to store all account balance changes from the database operations. This uses the account and block_num as
-- first primary keys so we can use this table to lookup the account balance from a certain block number.
CREATE TABLE IF NOT EXISTS balance_change_events $ON_CLUSTER_DIRECTIVE
(
    trx_id        String,
    action_index  UInt32,
    -- contract & scope --
    contract      String,
    symcode       String,
    -- data payload --
    account       String,
    balance       String,
    balance_delta Int64,
    -- extras --
    precision     UInt32,
    amount        Int64,
    value         Float64,
    -- meta --
    block_num     UInt64,
    timestamp     DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (account, block_num, trx_id, action_index)
        ORDER BY (account, block_num, trx_id, action_index);

-- The table to store all token supply changes from the database operations. This uses the account and block_num as
-- first primary keys so we can use this table to lookup token supplies from a certain block number.
CREATE TABLE IF NOT EXISTS supply_change_events $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,
    -- contract & scope --
    contract     String,
    symcode      String,
    -- data payload --
    issuer       String,
    max_supply   String,
    supply       String,
    supply_delta Int64,
    -- extras --
    precision    UInt32,
    amount       Int64,
    value        Float64,
    -- meta --
    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (contract, block_num, trx_id, action_index)
        ORDER BY (contract, block_num, trx_id, action_index);

-- Table to contain all 'eosio.token:issue' transactions
CREATE TABLE IF NOT EXISTS issue_events $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,
    -- contract & scope --
    contract     String,
    symcode      String,
    -- data payload --
    issuer       String,
    to           String,
    quantity     String,
    memo         String,
    -- extras --
    precision    UInt32,
    amount       Int64,
    value        Float64,
    -- meta --
    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (contract, symcode, to, amount, trx_id, action_index)
        ORDER BY (contract, symcode, to, amount, trx_id, action_index);

-- Table to contain all 'eosio.token:retire' transactions --
CREATE TABLE IF NOT EXISTS retire_events $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,
    -- contract & scope --
    contract     String,
    symcode      String,
    -- data payload --
    from         String,
    quantity     String,
    memo         String,
    -- extras --
    precision    UInt32,
    amount       Int64,
    value        Float64,
    -- meta --
    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (contract, symcode, amount, trx_id, action_index)
        ORDER BY (contract, symcode, amount, trx_id, action_index);

-- Table to contain all 'eosio.token:create' transactions
CREATE TABLE IF NOT EXISTS create_events $ON_CLUSTER_DIRECTIVE
(
    trx_id         String,
    action_index   UInt32,
    -- contract & scope --
    contract       String,
    symcode        String,
    -- data payload --
    issuer         String,
    maximum_supply String,
    -- extras --
    precision      UInt32,
    amount         Int64,
    value          Float64,
    -- meta --
    block_num      UInt64,
    timestamp      DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (contract, symcode, trx_id, action_index)
        ORDER BY (contract, symcode, trx_id, action_index);

-----------------------------------------------
-- Tables to store the extracted information --
-----------------------------------------------

-- Table to store up to date balances per account and token
CREATE TABLE IF NOT EXISTS account_balances $ON_CLUSTER_DIRECTIVE
(
    trx_id        String,
    action_index  UInt32,

    contract      String,
    symcode       String,

    account       String,
    balance       String,
    balance_delta Int64,

    precision     UInt32,
    amount        Int64,
    value         Float64,

    block_num     UInt64,
    timestamp     DateTime,
    ver           UInt64
)
    ENGINE = $ENGINE_VER
        PRIMARY KEY (account, contract, symcode)
        ORDER BY (account, contract, symcode);

CREATE MATERIALIZED VIEW IF NOT EXISTS account_balances_mv $ON_CLUSTER_DIRECTIVE
    TO account_balances
AS
SELECT *,
       (block_num + action_index) AS ver
FROM balance_change_events;

-- Table to store historical balances per account and token
CREATE TABLE IF NOT EXISTS historical_account_balances $ON_CLUSTER_DIRECTIVE
(
    trx_id        String,
    action_index  UInt32,

    contract      String,
    symcode       String,

    account       String,
    balance       String,
    balance_delta Int64,

    precision     UInt32,
    amount        Int64,
    value         Float64,

    block_num     UInt64,
    timestamp     DateTime,
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (block_num, account, contract, symcode)
        ORDER BY (block_num, account, contract, symcode);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_account_balances_mv $ON_CLUSTER_DIRECTIVE
    TO historical_account_balances
AS
SELECT *
FROM balance_change_events;

-- Table to store up to date positive balances per account and token for token holders
CREATE TABLE IF NOT EXISTS token_holders $ON_CLUSTER_DIRECTIVE
(
    action_index  UInt32,

    contract      String,
    symcode       String,

    account       String,
    value         Float64,

    block_num     UInt64,
    has_null_balance UInt8,
    ver                  UInt64
)
    ENGINE = $ENGINE_VER_DELETE
        PRIMARY KEY (has_null_balance, contract, symcode, account)
        ORDER BY (has_null_balance, contract, symcode, account);

CREATE MATERIALIZED VIEW IF NOT EXISTS token_holders_mv $ON_CLUSTER_DIRECTIVE
    TO token_holders
AS
SELECT action_index,
       contract,
       symcode,
       account,
       value,
       block_num,
       if(amount > 0, 0, 1) AS has_null_balance,
       (block_num + action_index) AS ver
FROM balance_change_events;

-- Table to store up to date token supplies
CREATE TABLE IF NOT EXISTS token_supplies $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    issuer       String,
    max_supply   String,
    supply       String,
    supply_delta Int64,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime,
    ver          UInt64
)
    ENGINE = $ENGINE_VER
        PRIMARY KEY (contract, symcode, issuer)
        ORDER BY (contract, symcode, issuer);

CREATE MATERIALIZED VIEW IF NOT EXISTS token_supplies_mv $ON_CLUSTER_DIRECTIVE
    TO token_supplies
AS
SELECT *,
       (block_num + action_index) AS ver
FROM supply_change_events;

-- Table to store historical token supplies per token
CREATE TABLE IF NOT EXISTS historical_token_supplies $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    issuer       String,
    max_supply   String,
    supply       String,
    supply_delta Int64,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime,
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (block_num, contract, symcode, issuer)
        ORDER BY (block_num, contract, symcode, issuer);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_token_supplies_mv $ON_CLUSTER_DIRECTIVE
    TO historical_token_supplies
AS
SELECT *
FROM supply_change_events;

-- Table to store token transfers primarily indexed by the 'contract' field --
CREATE TABLE IF NOT EXISTS transfers_contract $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    from         String,
    to           String,
    quantity     String,
    memo         String,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (contract, symcode, trx_id, action_index)
        ORDER BY (contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_contract_mv $ON_CLUSTER_DIRECTIVE
    TO transfers_contract
AS
SELECT trx_id,
       action_index,
       contract,
       symcode,
       from,
       to,
       quantity,
       memo,
       precision,
       amount,
       value,
       block_num,
       timestamp
FROM transfer_events;

-- Table to store token transfers primarily indexed by the 'from' field --
CREATE TABLE IF NOT EXISTS transfers_from $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    from         String,
    to           String,
    quantity     String,
    memo         String,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (from, to, contract, symcode, trx_id, action_index)
        ORDER BY (from, to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_from_mv $ON_CLUSTER_DIRECTIVE
    TO transfers_from
AS
SELECT trx_id,
       action_index,
       contract,
       symcode,
       from,
       to,
       quantity,
       memo,
       precision,
       amount,
       value,
       block_num,
       timestamp
FROM transfer_events;

-- Table to store historical token transfers 'from' address --
CREATE TABLE IF NOT EXISTS historical_transfers_from $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    from         String,
    to           String,
    quantity     String,
    memo         String,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (block_num, from, to, contract, symcode, trx_id, action_index)
        ORDER BY (block_num, from, to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_transfers_from_mv $ON_CLUSTER_DIRECTIVE
    TO historical_transfers_from
AS
SELECT trx_id,
       action_index,
       contract,
       symcode,
       from,
       to,
       quantity,
       memo,
       precision,
       amount,
       value,
       block_num,
       timestamp
FROM transfer_events;

-- Table to store token transfers primarily indexed by the 'to' field --
CREATE TABLE IF NOT EXISTS transfers_to $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    from         String,
    to           String,
    quantity     String,
    memo         String,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (to, contract, symcode, trx_id, action_index)
        ORDER BY (to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_to_mv $ON_CLUSTER_DIRECTIVE
    TO transfers_to
AS
SELECT trx_id,
       action_index,
       contract,
       symcode,
       from,
       to,
       quantity,
       memo,
       precision,
       amount,
       value,
       block_num,
       timestamp
FROM transfer_events;

-- Table to store historical token transfers 'to' address --
CREATE TABLE IF NOT EXISTS historical_transfers_to $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    from         String,
    to           String,
    quantity     String,
    memo         String,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (block_num, to, contract, symcode, trx_id, action_index)
        ORDER BY (block_num, to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_transfers_to_mv $ON_CLUSTER_DIRECTIVE
    TO historical_transfers_to
AS
SELECT trx_id,
       action_index,
       contract,
       symcode,
       from,
       to,
       quantity,
       memo,
       precision,
       amount,
       value,
       block_num,
       timestamp
FROM transfer_events;

-- Table to store token transfers primarily indexed by the 'block_num' field
CREATE TABLE IF NOT EXISTS transfers_block_num $ON_CLUSTER_DIRECTIVE
(
    trx_id       String,
    action_index UInt32,

    contract     String,
    symcode      String,

    from         String,
    to           String,
    quantity     String,
    memo         String,

    precision    UInt32,
    amount       Int64,
    value        Float64,

    block_num    UInt64,
    timestamp    DateTime
)
    ENGINE = $ENGINE_DEFAULT
        PRIMARY KEY (block_num, contract, symcode, trx_id, action_index)
        ORDER BY (block_num, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_block_num_mv $ON_CLUSTER_DIRECTIVE
    TO transfers_block_num
AS
SELECT trx_id,
       action_index,
       contract,
       symcode,
       from,
       to,
       quantity,
       memo,
       precision,
       amount,
       value,
       block_num,
       timestamp
FROM transfer_events;
EOM

echo "[+] Created '$SCHEMA_FILE'"
echo "[*] Run the following command to apply:"
echo "cat $SCHEMA_FILE | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>"
