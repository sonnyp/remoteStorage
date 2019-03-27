import { etag, createTree, getNode, setNode, removeNode, Node } from "./tree";

describe("createTree", () => {
  test("returns an empty tree with a root", () => {
    const tree = createTree();
    expect(tree).toEqual({
      "/": {
        children: [],
        ETag: tree["/"].ETag,
      },
    });
  });
});

describe("getNode", () => {
  test("returns undefined if the node does not exist", () => {
    expect(getNode({}, "/")).toBe(undefined);
    expect(getNode({}, "/foo")).toBe(undefined);
    expect(getNode({}, "/foo/bar")).toBe(undefined);
  });

  test("returns the root if it exist", () => {
    const tree = {
      "/": {
        children: [],
        ETag: "foo",
      },
    };

    expect(getNode(tree, "/")).toBe(tree["/"]);
  });
});

describe("setNode", () => {
  test("returns true and sets the node", () => {
    const tree = createTree();

    const node = {
      ETag: etag(),
      foo: "bar",
    };

    expect(setNode(tree, "/foo", node)).toBe(true);
    expect(tree["/foo"]).toBe(node);
  });

  test("creates missing intermediary branch nodes", () => {
    const tree = createTree();

    const node = {
      ETag: etag(),
      foo: "bar",
    };

    expect(setNode(tree, "/foo/bar", node)).toBe(true);

    const ETag = tree["/foo/"].ETag;
    expect(tree["/foo/"]).toEqual({ ETag, children: ["bar"] });

    expect(tree["/foo/bar"]).toBe(node);
  });

  test("updates existing intermediary branch nodes", () => {
    const tree = createTree();

    const foo = {
      ETag: etag(),
      value: "foo",
    };

    expect(setNode(tree, "/foo/bar", foo)).toBe(true);

    let folderEtag = tree["/foo/"].ETag;

    const bar = {
      ETag: etag(),
      value: "bar",
    };

    expect(setNode(tree, "/foo/bar", bar)).toBe(true);

    const ETag = tree["/foo/"].ETag;
    expect(ETag).not.toBe(folderEtag);
    expect(tree["/foo/"]).toEqual({ ETag, children: ["bar"] });

    expect(tree["/foo/bar"]).toBe(bar);
  });
});
