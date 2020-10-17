/**
 * @jest-environment jsdom
 */

import { getDomain } from "./WebFinger";

describe("getDomain", () => {
  test("with acct:", () => {
    expect(getDomain("acct:foo@bar")).toBe("bar");
    expect(getDomain(new URL("acct:foo@bar"))).toBe("bar");

    expect(getDomain("acct:foo@bar@example")).toBe("example");
    expect(getDomain(new URL("acct:foo@bar@example"))).toBe("example");
  });

  test("with http(s):", () => {
    expect(getDomain("http://foo")).toBe("foo");
    expect(getDomain(new URL("http://foo"))).toBe("foo");

    expect(getDomain("https://foo")).toBe("foo");
    expect(getDomain(new URL("https://foo"))).toBe("foo");

    expect(getDomain("https://foo/bar")).toBe("foo");
    expect(getDomain(new URL("https://foo/bar"))).toBe("foo");

    expect(getDomain("https://foo:1234/bar")).toBe("foo");
    expect(getDomain(new URL("https://foo:1234/bar"))).toBe("foo");
  });

  test("invalid uri", () => {
    expect(() => {
      getDomain("foo");
    }).toThrowError(new TypeError("Invalid URL: foo"));
  });
});
