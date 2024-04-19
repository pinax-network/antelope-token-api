import { expect, test } from "bun:test";
import { parseBlockId, parseLimit, parsePage, parseTimestamp } from "./utils.js";
import { config } from "./config.js";

test("parseBlockId", () => {
    expect(parseBlockId("0x123") as string).toBe("123");
});

test("parseLimit", () => {
    expect(parseLimit("1")).toBe(1);
    expect(parseLimit("0")).toBe(1);
    expect(parseLimit(10)).toBe(10);
    expect(parseLimit(config.maxLimit + 1)).toBe(config.maxLimit);
});

test("parsePage", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage(10)).toBe(10);
});

test("parseTimestamp", () => {
    expect(parseTimestamp("1697587100")).toBe(1697587100);
    expect(parseTimestamp("1697587100000")).toBe(1697587100);
    expect(parseTimestamp("awdawd")).toBeNaN();
    expect(parseTimestamp(null)).toBeUndefined();
});