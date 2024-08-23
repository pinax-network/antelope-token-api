--------------------------------------
-- AUTO-GENERATED FILE, DO NOT EDIT --
--------------------------------------
-- This SQL file creates the required tables for a single Antelope chain.
-- You can use the ClickHouse client command to execute it:
-- $ cat schema.sql | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>

-------------------------------------------------
-- Meta tables to store Substreams information --
-------------------------------------------------

CREATE TABLE IF NOT EXISTS cursors ON CLUSTER "antelope"
(
    id        String,
    cursor    String,
    block_num Int64,
    block_id  String
)
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (id)
        ORDER BY (id);

-----------------------------------------------------------
-- Tables to store the raw events without any processing --
-----------------------------------------------------------

-- The table to store all transfers. This uses the trx_id as first primary key so we can use this table to do
-- transfer lookups based on a transaction id.
CREATE TABLE IF NOT EXISTS transfer_events ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (trx_id, action_index)
        ORDER BY (trx_id, action_index);

-- The table to store all account balance changes from the database operations. This uses the account and block_num as
-- first primary keys so we can use this table to lookup the account balance from a certain block number.
CREATE TABLE IF NOT EXISTS balance_change_events ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (account, block_num, trx_id, action_index)
        ORDER BY (account, block_num, trx_id, action_index);

-- The table to store all token supply changes from the database operations. This uses the account and block_num as
-- first primary keys so we can use this table to lookup token supplies from a certain block number.
CREATE TABLE IF NOT EXISTS supply_change_events ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (contract, block_num, trx_id, action_index)
        ORDER BY (contract, block_num, trx_id, action_index);

-- Table to contain all 'eosio.token:issue' transactions
CREATE TABLE IF NOT EXISTS issue_events ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (contract, symcode, to, amount, trx_id, action_index)
        ORDER BY (contract, symcode, to, amount, trx_id, action_index);

-- Table to contain all 'eosio.token:retire' transactions --
CREATE TABLE IF NOT EXISTS retire_events ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (contract, symcode, amount, trx_id, action_index)
        ORDER BY (contract, symcode, amount, trx_id, action_index);

-- Table to contain all 'eosio.token:create' transactions
CREATE TABLE IF NOT EXISTS create_events ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (contract, symcode, trx_id, action_index)
        ORDER BY (contract, symcode, trx_id, action_index);

-----------------------------------------------
-- Tables to store the extracted information --
-----------------------------------------------

-- Table to store up to date balances per account and token
CREATE TABLE IF NOT EXISTS account_balances ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}', ver)
        PRIMARY KEY (account, contract, symcode)
        ORDER BY (account, contract, symcode);

CREATE MATERIALIZED VIEW IF NOT EXISTS account_balances_mv ON CLUSTER "antelope"
    TO account_balances
AS
SELECT *,
       (block_num + action_index) AS ver
FROM balance_change_events;

-- Table to store historical balances per account and token
CREATE TABLE IF NOT EXISTS historical_account_balances ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (block_num, account, contract, symcode)
        ORDER BY (block_num, account, contract, symcode);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_account_balances_mv ON CLUSTER "antelope"
    TO historical_account_balances
AS
SELECT *
FROM balance_change_events;

-- Table to store up to date positive balances per account and token for token holders
CREATE TABLE IF NOT EXISTS token_holders ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}', ver, has_null_balance)
        PRIMARY KEY (has_null_balance, contract, symcode, account)
        ORDER BY (has_null_balance, contract, symcode, account);

CREATE MATERIALIZED VIEW IF NOT EXISTS token_holders_mv ON CLUSTER "antelope"
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
CREATE TABLE IF NOT EXISTS token_supplies ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}', ver)
        PRIMARY KEY (contract, symcode, issuer)
        ORDER BY (contract, symcode, issuer);

CREATE MATERIALIZED VIEW IF NOT EXISTS token_supplies_mv ON CLUSTER "antelope"
    TO token_supplies
AS
SELECT *,
       (block_num + action_index) AS ver
FROM supply_change_events;

-- Table to store historical token supplies per token
CREATE TABLE IF NOT EXISTS historical_token_supplies ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (block_num, contract, symcode, issuer)
        ORDER BY (block_num, contract, symcode, issuer);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_token_supplies_mv ON CLUSTER "antelope"
    TO historical_token_supplies
AS
SELECT *
FROM supply_change_events;

-- Table to store token transfers primarily indexed by the 'contract' field --
CREATE TABLE IF NOT EXISTS transfers_contract ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (contract, symcode, trx_id, action_index)
        ORDER BY (contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_contract_mv ON CLUSTER "antelope"
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
CREATE TABLE IF NOT EXISTS transfers_from ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (from, to, contract, symcode, trx_id, action_index)
        ORDER BY (from, to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_from_mv ON CLUSTER "antelope"
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
CREATE TABLE IF NOT EXISTS historical_transfers_from ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (block_num, from, to, contract, symcode, trx_id, action_index)
        ORDER BY (block_num, from, to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_transfers_from_mv ON CLUSTER "antelope"
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
CREATE TABLE IF NOT EXISTS transfers_to ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (to, contract, symcode, trx_id, action_index)
        ORDER BY (to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_to_mv ON CLUSTER "antelope"
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
CREATE TABLE IF NOT EXISTS historical_transfers_to ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (block_num, to, contract, symcode, trx_id, action_index)
        ORDER BY (block_num, to, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS historical_transfers_to_mv ON CLUSTER "antelope"
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
CREATE TABLE IF NOT EXISTS transfers_block_num ON CLUSTER "antelope"
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
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
        PRIMARY KEY (block_num, contract, symcode, trx_id, action_index)
        ORDER BY (block_num, contract, symcode, trx_id, action_index);

CREATE MATERIALIZED VIEW IF NOT EXISTS transfers_block_num_mv ON CLUSTER "antelope"
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
