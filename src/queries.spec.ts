// from: https://github.com/pinax-network/substreams-clock-api/blob/main/src/queries.spec.ts

import { expect, test } from "bun:test";
import {
    getChain,
    getTotalSupply,
    getBalanceChanges,
    addTimestampBlockFilter,
    getTransfers,
    addAmountFilter,
} from "./queries.js";

const chain = "eth";
const address = "dac17f958d2ee523a2206206994597c13d831ec7";
const limit = "1";
const symbol = "usdt";
const name = "tether usd";
const greater_or_equals_by_timestamp = "1697587200";
const less_or_equals_by_timestamp = "1697587100";
const transaction_id =
    "ab3612eed62a184eed2ae86bcad766183019cf40f82e5316f4d7c4e61f4baa44";
const SQLTestQuery = new URLSearchParams({
    chain,
    address,
    symbol,
    greater_or_equals_by_timestamp,
    less_or_equals_by_timestamp,
    name,
    limit,
});

function formatSQL(query: string) {
    return query.replace(/\s+/g, "");
}

//Timestamp and Block Filter
test("addTimestampBlockFilter", () => {
    let where: any[] = [];
    const searchParams = new URLSearchParams({
        address: address,
        greater_or_equals_by_timestamp: "1697587200",
        less_or_equals_by_timestamp: "1697587100",
        greater_or_equals_by_block: "123",
        less_or_equals_by_block: "123",
    });
    addTimestampBlockFilter(searchParams, where);
    expect(where).toContain("block_number >= 123");
    expect(where).toContain("block_number <= 123");
    expect(where).toContain("toUnixTimestamp(timestamp) >= 1697587200");
    expect(where).toContain("toUnixTimestamp(timestamp) <= 1697587100");
});

//Test Amount Filter
test("addAmountFilter", () => {
    let where: any[] = [];
    const searchParams = new URLSearchParams({
        address: address,
        amount_greater_or_equals: "123123",
        amount_less_or_equals: "123123",
        amount_greater: "2323",
        amount_less: "2332",
    });
    addAmountFilter(searchParams, where);
    expect(where).toContain("amount >= 123123");
    expect(where).toContain("amount <= 123123");
    expect(where).toContain("amount > 2323");
    expect(where).toContain("amount < 2332");
});


// Test TotalSupply
test("getTotalSupply", () => {
    const parameters = new URLSearchParams({ chain, address });
    expect(formatSQL(getTotalSupply(parameters))).toContain(
        formatSQL(`SELECT
    TotalSupply.address as address,
        TotalSupply.supply as supply,
        TotalSupply.block_number,
        TotalSupply.chain as chain,
        Contracts.name as name,
        Contracts.symbol as symbol,
        Contracts.decimals as decimals,
        TotalSupply.timestamp`)
    );
    expect(formatSQL(getTotalSupply(parameters))).toContain(
        formatSQL(`FROM TotalSupply`)
    );


    expect(formatSQL(getTotalSupply(parameters))).toContain(
        formatSQL(`LEFT JOIN Contracts ON Contracts.address = TotalSupply.address`)
    );

    expect(formatSQL(getTotalSupply(parameters))).toContain(
        formatSQL(
            `WHERE(TotalSupply.chain == '${chain}' AND TotalSupply.address == '${address}')`
        )
    );

    expect(formatSQL(getTotalSupply(parameters))).toContain(
        formatSQL(`ORDER BY block_number DESC`)
    );

    expect(formatSQL(getTotalSupply(parameters))).toContain(formatSQL(`LIMIT 1`));
});

test("getTotalSupply with options", () => {
    const parameters = new URLSearchParams({
        chain,
        address,
        symbol,
        greater_or_equals_by_timestamp,
        less_or_equals_by_timestamp,
        name,
        limit,
    });
    expect(formatSQL(getTotalSupply(parameters))).toContain(
        formatSQL(
            `WHERE(TotalSupply.chain == '${chain}' AND TotalSupply.address == '${address}' AND toUnixTimestamp(timestamp) >= ${greater_or_equals_by_timestamp}  AND toUnixTimestamp(timestamp) <= ${less_or_equals_by_timestamp}  AND LOWER(symbol) == '${symbol}' AND LOWER(name) == '${name}')`
        )
    );
});

// Test Balance Change
test("getBalanceChange", () => {
    const parameters1 = new URLSearchParams({ chain, owner: address, contract: address });
    const parameters2 = new URLSearchParams({ chain, owner: address });
    const parameters3 = new URLSearchParams({ chain, contract: address });

    expect(formatSQL(getBalanceChanges(parameters1))).toContain(
        formatSQL(`SELECT
        contract as contract,
        owner as owner,
        newBalance as balance,
        toDateTime(timestamp) as timestamp,
        transaction as transaction_id,
        chain as chain,
        block_number`)
    );
    expect(formatSQL(getBalanceChanges(parameters2))).toContain(
        formatSQL(`SELECT
        owner,
        contract,
        toDateTime(last_value(timestamp)) AS timestamp,
        last_value(newBalance) AS balance`)
    );

    expect(formatSQL(getBalanceChanges(parameters3))).toContain(
        formatSQL(`SELECT
    owner,
    contract,
    toDateTime(last_value(timestamp)) as timestamp,
    last_value(newBalance) as balance`)
    );

    expect(formatSQL(getBalanceChanges(parameters1))).toContain(
        formatSQL(`FROM mv_balance_changes_owner`)
    );

    expect(formatSQL(getBalanceChanges(parameters2))).toContain(
        formatSQL(`FROM mv_balance_changes_contract`)
    );

    expect(formatSQL(getBalanceChanges(parameters3))).toContain(
        formatSQL(`FROM mv_balance_changes_contract`)
    );


    expect(formatSQL(getBalanceChanges(parameters1))).toContain(
        formatSQL(`WHERE(chain == '${chain}' AND owner == '${address}' AND contract == '${address}')`)
    );

    expect(formatSQL(getBalanceChanges(parameters1))).toContain(
        formatSQL(`ORDER BY timestamp DESC`)
    );

    expect(formatSQL(getBalanceChanges(parameters2))).toContain(
        formatSQL(`GROUP BY (contract, owner) ORDER BY timestamp DESC`)
    );

    expect(formatSQL(getBalanceChanges(parameters3))).toContain(
        formatSQL(`GROUP BY (contract, owner) ORDER BY timestamp DESC`)
    );


    expect(formatSQL(getBalanceChanges(parameters1))).toContain(
        formatSQL(`LIMIT 1`)
    );
});

test("getBalanceChanges with options", () => {
    const parameters = new URLSearchParams({
        chain,
        owner: address,
        transaction_id,
        greater_or_equals_by_timestamp,
        less_or_equals_by_timestamp,
        limit,
    });
    expect(formatSQL(getBalanceChanges(parameters))).toContain(
        formatSQL(
            `WHERE(chain == '${chain}' AND owner == '${address}' AND toUnixTimestamp(timestamp) >= ${greater_or_equals_by_timestamp} AND toUnixTimestamp(timestamp) <= ${less_or_equals_by_timestamp})`
        )
    );
});

// Test getTransfers

test("getTransfers", () => {
    const parameters1 = new URLSearchParams({ chain, contract: address });
    const parameters2 = new URLSearchParams({ chain, from: address });
    const parameters3 = new URLSearchParams({ chain, to: address });
    const parameters4 = new URLSearchParams({ chain, from: address, to: address });
    const parameters5 = new URLSearchParams({ chain, contract: address, from: address, to: address, transaction_id });
    expect(formatSQL(getTransfers(parameters1))).toContain(
        formatSQL(`SELECT
            address,
            from,
            to,
            value as amount,
            transaction as transaction_id,
            block_number,
            timestamp,
            chain`)

    );
    expect(formatSQL(getTransfers(parameters1))).toContain(
        formatSQL(`FROM mv_transfers_contract`)
    );

    expect(formatSQL(getTransfers(parameters2))).toContain(
        formatSQL(`FROM mv_transfers_from`)
    );

    expect(formatSQL(getTransfers(parameters3))).toContain(
        formatSQL(`FROM mv_transfers_to`)
    );

    expect(formatSQL(getTransfers(parameters4))).toContain(
        formatSQL(`FROM mv_transfers_from`)
    );





    expect(formatSQL(getTransfers(parameters5))).toContain(
        formatSQL(`WHERE(chain == '${chain}' AND address == '${address}' AND from == '${address}' AND to == '${address}' AND transaction == '${transaction_id}')`)
    );

    expect(formatSQL(getTransfers(parameters5))).toContain(
        formatSQL(`ORDER BY timestamp DESC`)
    );

    expect(formatSQL(getTransfers(parameters5))).toContain(
        formatSQL(`LIMIT 100`)
    );
});

test("getChain", () => {
    expect(getChain()).toBe(`SELECT DISTINCT chain FROM module_hashes`);
});
