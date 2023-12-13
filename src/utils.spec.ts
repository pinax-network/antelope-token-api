import { expect, test } from "bun:test";
import { parseBlockId, parseTimestamp } from "./utils.js";

test("parseBlockId", () => {
    expect(parseBlockId("0x123") as string).toBe("123");
});

test("parseTimestamp", () => {
    expect(parseTimestamp("1697587100")).toBe(1697587100);
    expect(parseTimestamp("1697587100000")).toBe(1697587100);
    expect(parseTimestamp("awdawd")).toBeNaN();
    expect(parseTimestamp(null)).toBeUndefined();
});
