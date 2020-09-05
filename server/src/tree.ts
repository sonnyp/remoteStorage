export function etag(): string {
  return '"' + Math.random().toString().substr(2) + '"';
}

export interface Node {
  ETag: string;
  children?: string[];
  id?: string;
}

export type Tree = Record<string, Node>;

export function createTree(): Tree {
  return {
    "/": {
      children: [],
      ETag: etag(),
    },
  };
}

export function getNode(tree: Tree, path: string): Node {
  return tree[path];
}

export function setNode(tree: Tree, path: string, node: Node): boolean {
  const [, ...branches] = path.split("/");
  const name = branches.pop();
  let cursor = "/";

  for (let i = 0; i <= branches.length; i++) {
    let branch = tree[cursor];
    if (!branch) {
      branch = tree[cursor] = {
        children: [],
        ETag: etag(),
      };
    } else {
      if (!branch.children) {
        return false;
      }
      branch.ETag = etag();
    }

    const branchName = branches[i];
    if (i === branches.length) {
      if (!branch.children.includes(name)) {
        branch.children.push(name);
      }
    } else {
      if (!branch.children.includes(branchName + "/")) {
        branch.children.push(branchName + "/");
      }
    }

    cursor += branchName + "/";
  }

  tree[path] = node;
  return true;
}

export function removeNode(tree: Tree, path: string): boolean {
  const [, ...branches] = path.split("/");
  const name = branches.pop();
  let cursor = "/";

  for (let i = 0; i <= branches.length; i++) {
    const branch = tree[cursor];

    if (!branch || !branch.children) {
      return false;
    }

    branch.ETag = etag();

    const branchName = branches[i];
    if (i === branches.length) {
      branch.children = branch.children.filter((node) => node !== name);
    }

    cursor += branchName + "/";
  }

  delete tree[path];
  return true;
}
