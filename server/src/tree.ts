export interface Node {
  ETag: string;
  children?: Array<string>;
  id?: string;
}

export type Tree = Record<string, Node>;

export function setNode(tree: Tree, path: string, node: Node) {
  const [, ...nodes] = path.split("/");

  const name = nodes.pop();

  // let parent;

  // let c = '/'

  for (let i = 0; i < nodes.length; i++) {
    const branchName = `/${nodes[i]}/`;
    let branch = tree[branchName];
    //FIXME error if leaf
    if (!branch) {
      branch = tree[branchName] = {
        children: [],
        ETag: Math.random()
          .toString()
          .substr(2),
      };
    } else {
      branch.ETag = (+branch.ETag + 1).toString();
    }

    if (i === nodes.length - 1) {
      branch.children.push(name);
    }
  }

  tree[path] = node;
}

export function removeNode(tree: Tree, path: string) {
  const [, ...nodes] = path.split("/");

  const name = nodes.pop();

  // let parent;

  // let c = '/'

  for (let i = 0; i < nodes.length; i++) {
    const branchName = `/${nodes[i]}/`;
    let branch = tree[branchName];
    branch.ETag = (+branch.ETag + 1).toString();

    if (i === nodes.length - 1) {
      branch.children = branch.children.filter(
        (child: string) => child !== name,
      );
    }
  }

  delete tree[path];
}

export function getNode(tree: Tree, path: string): Node {
  return tree[path];
}
