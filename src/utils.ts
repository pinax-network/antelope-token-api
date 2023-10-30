import { config } from "./config.js";

export function parseLimit(limit?: string|null|number) {
    let value = 1; // default 1
    if (limit) {
        if (typeof limit === "string") value = parseInt(limit);
        if (typeof limit === "number") value = limit;
    }
    // limit must be between 1 and maxLimit
    if ( value > config.maxLimit ) value = config.maxLimit;
    return value;
}

export function parseBlockId(block_id?: string|null) {
    return block_id ? block_id.replace("0x", "") : undefined;
}

export function parseTimestamp(timestamp?: string|null|number) {
    if (timestamp !== undefined && timestamp !== null) {
        if (typeof timestamp === "string") {
            if (/^[0-9]+$/.test(timestamp)) {
                return parseTimestamp(parseInt(timestamp));
            }
            // append "Z" to timestamp if it doesn't have it
            if (!timestamp.endsWith("Z")) timestamp += "Z";
            return Math.floor(Number(new Date(timestamp)) / 1000);
        }
        if (typeof timestamp === "number") {
            const length = timestamp.toString().length;
            if ( length === 10 ) return timestamp; // seconds
            if ( length === 13 ) return Math.floor(timestamp / 1000); // convert milliseconds to seconds
            throw new Error("Invalid timestamp");
        }
    }
    return undefined;
}
