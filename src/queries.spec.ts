import { expect, test } from "bun:test";
import {
    getChain,
    getTotalSupply,
    getBalanceChanges,
    addTimestampBlockFilter,
    getTransfers,
    addAmountFilter,
} from "./queries.js";

const chain = "eos";
const contract = "eosio.token";
const account = "push.sx";
const limit = "1";
const symbol = "EOS";
const issuer = "test";
const greater_or_equals_by_timestamp = "1697587200";
const less_or_equals_by_timestamp = "1697587100";
const transaction_id =
    "ab3612eed62a184eed2ae86bcad766183019cf40f82e5316f4d7c4e61f4baa44";

function formatSQL(query: string) {
    return query.replace(/\s+/g, "");
}

test("addTimestampBlockFilter", () => {
    let where: any[] = [];
    const searchParams = new URLSearchParams({
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

test("addAmountFilter", () => {
    let where: any[] = [];
    const searchParams = new URLSearchParams({
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

test("getTotalSupply", () => {
    const parameters = new URLSearchParams({ chain, contract });
    const query = formatSQL(getTotalSupply(parameters));

    expect(query).toContain(formatSQL('SELECT * FROM stats'));
    expect(query).toContain(
        formatSQL(
            `WHERE(chain == '${chain}' AND contract == '${contract}')`
        )
    );
    expect(query).toContain(formatSQL(`ORDER BY block_number DESC`));
    expect(query).toContain(formatSQL(`LIMIT 1`));
});

test("getTotalSupply with options", () => {
    const parameters = new URLSearchParams({
        chain,
        contract,
        symbol,
        greater_or_equals_by_timestamp,
        less_or_equals_by_timestamp,
        issuer,
        limit,
    });

    expect(formatSQL(getTotalSupply(parameters))).toContain(
        formatSQL(
            `WHERE(chain == '${chain}' AND contract == '${contract}' 
            AND symcode == '${symbol}' AND issuer == '${issuer}'
            AND toUnixTimestamp(timestamp) >= ${greater_or_equals_by_timestamp} 
            AND toUnixTimestamp(timestamp) <= ${less_or_equals_by_timestamp})`
        )
    );
});

test("getBalanceChange", () => {
    const parameters = new URLSearchParams({ chain, account, contract });
    const query = formatSQL(getBalanceChanges(parameters));

    expect(query).toContain(formatSQL(`SELECT * FROM accounts`));
    expect(query).toContain(
        formatSQL(
            `WHERE(chain == '${chain}' AND account == '${account}' AND contract == '${contract}')`
        )
    );
    expect(query).toContain(formatSQL(`ORDER BY timestamp DESC`));
    expect(query).toContain(formatSQL(`LIMIT 1`));
});

test("getBalanceChanges with options", () => {
    const parameters = new URLSearchParams({
        chain,
        account,
        transaction_id,
        greater_or_equals_by_timestamp,
        less_or_equals_by_timestamp,
        limit,
    });

    expect(formatSQL(getBalanceChanges(parameters))).toContain(
        formatSQL(
            `WHERE(chain == '${chain}' AND account == '${account}' 
            AND toUnixTimestamp(timestamp) >= ${greater_or_equals_by_timestamp} 
            AND toUnixTimestamp(timestamp) <= ${less_or_equals_by_timestamp})`
        )
    );
});

test("getTransfers", () => {
    const parameters = new URLSearchParams({ chain, contract, from: account, to: account, transaction_id });
    const query = formatSQL(getTransfers(parameters));

    expect(query).toContain(
        formatSQL(`SELECT *`)
    );
    expect(query).toContain(
        formatSQL(
            `WHERE(chain == '${chain}' AND contract == '${contract}' 
            AND from == '${account}' AND to == '${account}' AND transaction == '${transaction_id}')`
        )
    );
    expect(query).toContain(formatSQL(`ORDER BY timestamp DESC`));
    expect(query).toContain(formatSQL(`LIMIT 100`));
});

test("getChain", () => {
    expect(getChain()).toBe(`SELECT DISTINCT chain FROM module_hashes`);
});
