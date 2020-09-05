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

    const folderEtag = tree["/foo/"].ETag;

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

describe("removeNode", () => {
  test("removes the child from parent folders", () => {
    const tree = {
      "/": {
        children: ["public/"],
        ETag: '"6741893013153855"',
      },
      "/a/": {
        children: ["a/"],
        ETag: '"8321645986433857"',
      },
      "/a/b/": {
        children: ["foo", "bar"],
        ETag: '"1231231312312535"',
      },
      "/a/b/foo": {
        "Content-Type": "image/png",
        "Content-Length": "613335",
        "Last-Modified": "Mon, 01 Apr 2019 12:34:45 GMT",
        ETag: '"452BDB0F"',
        id: "94e2d126-48a6-4427-ae60-be7e54ed9306",
      },
      "/a/b/bar": {
        "Content-Type": "image/png",
        "Content-Length": "126005",
        "Last-Modified": "Mon, 01 Apr 2019 12:36:30 GMT",
        ETag: '"06835C66"',
        id: "8088965b-3a95-41d3-be75-3599c0156ca6",
      },
    };

    expect(tree["/a/b/"].children).toEqual(["foo", "bar"]);

    removeNode(tree, "/a/b/foo");

    expect(tree["/a/b/"].children).toEqual(["bar"]);
  });
});
