/**
 * @jest-environment jsdom
 */

import { getParentPath } from "./RemoteStorage";

test("getParentPath", () => {
  expect(getParentPath("/")).toBe(null);
  expect(getParentPath("/foo")).toBe("/");
  expect(getParentPath("/foo/")).toBe("/");
  expect(getParentPath("/foo/bar")).toBe("/foo/");
  expect(getParentPath("/foo/bar/")).toBe("/foo/");
});
