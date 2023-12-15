import { DEFAULT_SORT_BY } from "./config.js";
import { parseLimit, parseTimestamp } from "./utils.js";

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
    const contract = searchParams.get("contract");
    const chain = searchParams.get("chain");
    const symbol = searchParams.get("symbol");
    const issuer = searchParams.get("issuer");

    let query = 'SELECT * FROM stats';

    if (!example) {
        // WHERE statements
        const where = [];

        if (chain) where.push(`chain == '${chain}'`);
        if (contract) where.push(`contract == '${contract}'`);
        if (symbol) where.push(`symcode == '${symbol}'`);
        if (issuer) where.push(`issuer == '${issuer}'`);

        addTimestampBlockFilter(searchParams, where);

        if (where.length) query += ` WHERE(${where.join(' AND ')})`;

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
    const chain = searchParams.get("chain");
    const contract = searchParams.get("contract");
    const account = searchParams.get("account");

    let table = 'accounts';
    let contractTable;
    let mvOwnerTable = "mv_balance_changes_owner";
    let mvContractTable = "mv_balance_changes_contract";
    let query = "";

    /*if (contract && owner) query += balance_changes_owner_contract_query(mvOwnerTable);
    else if (!contract && owner) query += balance_changes_owner_query(mvContractTable);
    else if (contract && !owner) query += balance_changes_contract_query(mvContractTable);
    else */query += `SELECT * FROM ${table}`;

    if (!example) {
        // WHERE statements
        const where = [];

        if (chain) where.push(`chain == '${chain}'`);
        if (account) where.push(`account == '${account}'`);
        if (contract) where.push(`contract == '${contract}'`);

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
    const chain = searchParams.get("chain");
    const transaction_id = searchParams.get("transaction_id");

    // SQL Query
    let table = "transfers";
    let mvFromTable = "mv_transfers_from";
    let mvToTable = "mv_transfers_to";
    let mvContractTable = "mv_transfers_contract";

    let query = `SELECT
    from,
    to,
    value as amount,
    symcode,
    trx_id as transaction_id,
    block_number,
    timestamp,
    chain`;

    /*if (contract) query += ` FROM ${mvContractTable}`
    else if (!contract && from && !to) query += ` FROM ${mvFromTable}`
    else if (!contract && !from && to) query += ` FROM ${mvToTable}`
    else if (!contract && from && to) query += ` FROM ${mvFromTable}`
    else */query += ` FROM ${table}`;

    if (!example) {
        // WHERE statements
        const where = [];

        if (chain) where.push(`chain == '${chain}'`);
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

export function getChain() {
    return `SELECT DISTINCT chain FROM module_hashes`;
}
