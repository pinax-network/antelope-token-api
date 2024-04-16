import { DEFAULT_SORT_BY } from "./config.js";
import { parseLimit, parseTimestamp } from "./utils.js";

// For reference on Clickhouse Database tables:
// https://raw.githubusercontent.com/pinax-network/substreams-antelope-tokens/main/schema.sql

export function addTimestampBlockFilter(searchParams: URLSearchParams, where: any[]) {
    const operators = [
        ["greater_or_equals", ">="],
        ["greater", ">"],
        ["less_or_equals", "<="],
        ["less", "<"],
    ];

    for (const [key, operator] of operators) {
        const block_number = searchParams.get(`${key}_by_block`);
        const timestamp = parseTimestamp(searchParams.get(`${key}_by_timestamp`));

        if (block_number) where.push(`block_number ${operator} ${block_number}`);
        if (timestamp) where.push(`toUnixTimestamp(timestamp) ${operator} ${timestamp}`);
    }
}

export function addAmountFilter(searchParams: URLSearchParams, where: any[]) {
    const operators = [
        ["greater_or_equals", ">="],
        ["greater", ">"],
        ["less_or_equals", "<="],
        ["less", "<"],
    ];

    for (const [key, operator] of operators) {
        const amount = searchParams.get(`amount_${key}`);

        if (amount) where.push(`amount ${operator} ${amount}`);
    }
}

export function getTotalSupply(searchParams: URLSearchParams, example?: boolean) {
    //const chain = searchParams.get("chain");
    const contract = searchParams.get("contract");
    const symbol = searchParams.get("symbol");
    const issuer = searchParams.get("issuer");

    let query = 'SELECT *, updated_at_block_num AS block_number, updated_at_timestamp AS timestamp FROM token_supplies';

    if (!example) {
        // WHERE statements
        const where = [];

        //if (chain) where.push(`chain == '${chain}'`);
        if (contract) where.push(`contract == '${contract}'`);
        if (symbol) where.push(`symcode == '${symbol}'`);
        if (issuer) where.push(`issuer == '${issuer}'`);

        addAmountFilter(searchParams, where);
        addTimestampBlockFilter(searchParams, where);

        if (where.length) query += ` FINAL WHERE(${where.join(' AND ')})`;

        const sort_by = searchParams.get("sort_by");
        query += ` ORDER BY block_number ${sort_by ?? DEFAULT_SORT_BY} `;
    }

    const limit = parseLimit(searchParams.get("limit"));
    query += ` LIMIT ${limit} `;
    
    const offset = searchParams.get("offset");
    if (offset) query += ` OFFSET ${offset} `;
    
    return query;
}

export function getBalanceChanges(searchParams: URLSearchParams, example?: boolean) {
    const contract = searchParams.get("contract");
    const account = searchParams.get("account");

    let query = 'SELECT *, updated_at_block_num AS block_number, updated_at_timestamp AS timestamp FROM account_balances';

    if (!example) {
        // WHERE statements
        const where = [];

        //if (chain) where.push(`chain == '${chain}'`);
        if (account) where.push(`account == '${account}'`);
        if (contract) where.push(`contract == '${contract}'`);

        addAmountFilter(searchParams, where);
        addTimestampBlockFilter(searchParams, where);

        if (where.length) query += ` WHERE(${where.join(' AND ')})`;

        if (contract && account) query += ` ORDER BY timestamp DESC`;
        //if (!contract && account) query += `GROUP BY (contract, account) ORDER BY timestamp DESC`;
        //if (contract && !account) query += `GROUP BY (contract, account) ORDER BY timestamp DESC`;
    }

    const limit = parseLimit(searchParams.get("limit"));
    query += ` LIMIT ${limit} `;

    const offset = searchParams.get("offset");
    if (offset) query += ` OFFSET ${offset} `;

    return query;
}

export function getTransfers(searchParams: URLSearchParams, example?: boolean) {
    const contract = searchParams.get("contract");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const transaction_id = searchParams.get("transaction_id");

    let query = "SELECT * FROM ";

    if (searchParams.get("greater_or_equals_by_block") && searchParams.get("less_or_equals_by_block")) query += "transfers_block_num"
    else if (from && !to) query += "transfers_from"
    else if (!from && to) query += "transfers_to"
    else query += "transfer_events"

    if (!example) {
        // WHERE statements
        const where = [];

        if (contract) where.push(`contract == '${contract}'`);
        if (from) where.push(`from == '${from}'`);
        if (to) where.push(`to == '${to}'`);
        if (transaction_id) where.push(`transaction == '${transaction_id}'`);

        addAmountFilter(searchParams, where);
        addTimestampBlockFilter(searchParams, where);

        if (where.length) query += ` WHERE(${where.join(' AND ')})`;

        query += ` ORDER BY timestamp DESC`;
    }

    const limit = parseLimit(searchParams.get("limit"), 100);
    query += ` LIMIT ${limit} `;

    const offset = searchParams.get("offset");
    if (offset) query += ` OFFSET ${offset} `;

    return query;
}
