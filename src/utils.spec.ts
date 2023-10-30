import { expect, test } from "bun:test";
import { parseBlockId, parseLimit, parseTimestamp } from "./utils.js";
import { DEFAULT_MAX_LIMIT } from "./config.js";

test("parseBlockId", () => {
    expect(parseBlockId()).toBeUndefined();
    expect(parseBlockId(null)).toBeUndefined();
    expect(parseBlockId("00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc")).toBe("00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc");
    expect(parseBlockId("0x00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc")).toBe("00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc");
});

test("parseLimit", () => {
    expect(parseLimit()).toBe(1);
    expect(parseLimit(null)).toBe(1);
    expect(parseLimit("10")).toBe(10);
    expect(parseLimit(10)).toBe(10);
    expect(parseLimit(999999)).toBe(DEFAULT_MAX_LIMIT);
});

test("parseTimestamp", () => {
    const seconds = 1672531200;
    expect(parseTimestamp()).toBeUndefined();
    expect(parseTimestamp(null)).toBeUndefined();
    expect(parseTimestamp(1672531200000)).toBe(seconds); // Milliseconds (13 digits) => Seconds (10 digits)
    expect(parseTimestamp("1672531200")).toBe(seconds);
    expect(parseTimestamp(1672531200000)).toBe(seconds);
    expect(parseTimestamp("2023-01-01T00:00:00.000Z")).toBe(seconds);
    expect(parseTimestamp("2023-01-01T00:00:00.000")).toBe(seconds);
    expect(parseTimestamp("2023-01-01 00:00:00")).toBe(seconds); // Datetime
    expect(parseTimestamp("2023-01-01T00:00:00Z")).toBe(seconds); // ISO
    expect(parseTimestamp("2023-01-01T00:00:00")).toBe(seconds);
    expect(parseTimestamp("2023-01-01")).toBe(seconds);
    expect(parseTimestamp("2023-01")).toBe(seconds);
    expect(parseTimestamp(Number(new Date("2023")))).toBe(seconds);

    // errors
    expect(() => parseTimestamp(10)).toThrow("Invalid timestamp");
    expect(() => parseTimestamp("10")).toThrow("Invalid timestamp");
});


