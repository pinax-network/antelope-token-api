import { expect, test } from "bun:test";
import { formatAddress, checkValidAddress, getAddress, parseBlockId, parseTimestamp } from "./utils.js";
const address = "0xdac17f958d2ee523a2206206994597c13d831ec7";
test("formatAddress", () => {
    expect(formatAddress(address)).toBe("dac17f958d2ee523a2206206994597c13d831ec7")
});


test("checkValidAddress", () => {
    checkValidAddress(address)
    expect(() => checkValidAddress(address)).not.toThrow();
    expect(() => checkValidAddress("foobar")).toThrow("Invalid address");
});

test("parseBlockId", () => {
    expect(parseBlockId("0x123") as string).toBe("123");
});

test("parseTimestamp", () => {
    expect(parseTimestamp("1697587100")).toBe(1697587100);
    expect(parseTimestamp("1697587100000")).toBe(1697587100);
    expect(parseTimestamp("awdawd")).toBeNaN();
    expect(parseTimestamp(null)).toBeUndefined();
});


test("getAddress", () => {
    expect(() => getAddress(new URLSearchParams({ address: address }), "address", false)).not.toThrow();
    expect(() => getAddress(new URLSearchParams({ address: address }), "address", true)).not.toThrow();
    expect(() => getAddress(new URLSearchParams({ address: "" }), "address", true)).toThrow("Missing [address] parameter");
    expect(() => getAddress(new URLSearchParams({ address: "foobar" }), "address")).toThrow("Invalid address");
});
