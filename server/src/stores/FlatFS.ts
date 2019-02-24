import { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import { join } from "path";
import { promisify } from "util";
import uuid from "uuid/v4";
import { setNode, getNode, removeNode, Tree } from "../tree";
import stream from "stream";
import { EventEmitter } from "events";
import { RemoteStorage } from "../RemoteStorage";

const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const pipeline = promisify(stream.pipeline);
const unlink = promisify(fs.unlink);

interface FSRemoteStorageInit {
  root: string;
}

export default class FSRemoteStorage extends EventEmitter
  implements RemoteStorage {
  root: string;

  constructor({ root }: FSRemoteStorageInit) {
    super();
    this.root = root;
  }

  async load() {
    await mkdir(join(this.root, "files"), { recursive: true });
  }

  async unload() {}

  async _getTree(): Promise<Tree> {
    try {
      const data = await readFile(join(this.root, "tree.json"), {
        encoding: "utf8",
      });
      const tree = JSON.parse(data);
      return tree;
    } catch (err) {
      return {
        "/": {
          children: [],
          ETag: Math.random()
            .toString()
            .substr(2),
        },
      };
    }
  }

  async _writeTree(tree: any) {
    return writeFile(
      join(this.root, "tree.json"),
      JSON.stringify(tree, null, 2),
      {
        encoding: "utf8",
      },
    );
  }

  async getFolder(path: string, _req: IncomingMessage, res: ServerResponse) {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    // if (!node.children) {
    //   res.statusCode = 404;
    //   return;
    // }

    const items = node.children.reduce(
      (acc: Record<string, any>, item: string) => {
        const node = getNode(tree, path + item);
        acc[item] = node;
        return acc;
      },
      {},
    );

    res.setHeader("ETag", node.ETag);
    res.setHeader("Content-Type", "application/ld+json");
    res.statusCode = 200;
    res.write(
      JSON.stringify({
        items,
        "@context": "http://remotestorage.io/spec/folder-description",
      }),
    );
  }

  async putDocument(path: string, req: IncomingMessage, res: ServerResponse) {
    const tree = await this._getTree();

    const id = uuid();
    const ETag = Math.random()
      .toString()
      .substr(2);
    const node = {
      "Content-Type": req.headers["content-type"],
      "Content-Length": req.headers["content-length"],
      "Last-Modified": new Date().toUTCString(),
      ETag,
      id,
    };

    await pipeline(
      req,
      fs.createWriteStream(join(this.root, "files", id), {
        flags: "w",
      }),
    );

    setNode(tree, path, node);
    await this._writeTree(tree);

    res.statusCode = 200;
    res.setHeader("ETag", ETag);
  }

  async getDocument(path: string, _req: IncomingMessage, res: ServerResponse) {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    res.statusCode = 200;
    ["Content-Length", "Last-Modified", "ETag", "Content-Type"].forEach(
      header => {
        res.setHeader(header, node[header]);
      },
    );

    await pipeline(fs.createReadStream(join(this.root, "files", node.id)), res);
  }

  async deleteDocument(
    path: string,
    _req: IncomingMessage,
    res: ServerResponse,
  ) {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    removeNode(tree, path);
    await this._writeTree(tree);

    res.statusCode = 200;

    unlink(join(this.root, "files", node.id)).catch(err => {
      this.emit("error", err);
    });
  }

  async headDocument(path: string, _req: IncomingMessage, res: ServerResponse) {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    res.statusCode = 200;
    ["Content-Length", "Last-Modified", "ETag", "Content-Type"].forEach(
      header => {
        res.setHeader(header, node[header]);
      },
    );
  }

  async headFolder(path: string, _req: IncomingMessage, res: ServerResponse) {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    const { ETag } = node;

    res.statusCode = 200;
    res.setHeader("ETag", ETag);
  }
}
