import { DEFAULT_SORT_BY, config } from './config.js';
import { parseBlockId, parseLimit, parseTimestamp } from './utils.js';

export interface Block {
    block_number: number;
    block_id: string;
    timestamp: string;
    chain: string;
}

export function getBlock(searchParams: URLSearchParams) {
    // TO-DO: Modulo block number (ex: search by every 1M blocks)

    // SQL Query
    let query = `SELECT * FROM ${config.table}`;
    const where = [];

    // Clickhouse Operators
    // https://clickhouse.com/docs/en/sql-reference/operators
    const operators = [
        ["greater_or_equals", ">="],
        ["greater", ">"],
        ["less_or_equals", "<="],
        ["less", "<"],
    ]
    for ( const [key, operator] of operators ) {
        const block_number = searchParams.get(`${key}_by_block_number`);
        const timestamp = parseTimestamp(searchParams.get(`${key}_by_timestamp`));
        if (block_number) where.push(`block_number ${operator} ${block_number}`);
        if (timestamp) where.push(`toUnixTimestamp(timestamp) ${operator} ${timestamp}`);
    }

    // equals
    const chain = searchParams.get("chain");
    const block_id = parseBlockId(searchParams.get("block_id"));
    const block_number = searchParams.get('block_number');
    const timestamp = parseTimestamp(searchParams.get('timestamp'));
    if (chain) where.push(`chain == '${chain}'`);
    if (block_id) where.push(`block_id == '${block_id}'`);
    if (block_number) where.push(`block_number == '${block_number}'`);
    if (timestamp) where.push(`toUnixTimestamp(timestamp) == ${timestamp}`);

    // Join WHERE statements with AND
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;

    // Sort and Limit
    const limit = parseLimit(searchParams.get("limit"));
    const sort_by = searchParams.get("sort_by");
    query += ` ORDER BY block_number ${sort_by ?? DEFAULT_SORT_BY}`
    query += ` LIMIT ${limit}`
    return query;
}

export function getChain() {
    return `SELECT DISTINCT chain FROM module_hashes`;
}
