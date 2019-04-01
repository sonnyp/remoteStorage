import { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import { join } from "path";
import { promisify } from "util";
import uuid from "uuid/v4";
import { setNode, getNode, removeNode, Tree, createTree } from "./tree";
import stream from "stream";
import { EventEmitter } from "events";
import { RemoteStorage } from "./RemoteStorage";
import { CRC32Stream } from "crc32-stream";

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
  public root: string;

  public constructor({ root }: FSRemoteStorageInit) {
    super();
    this.root = root;
  }

  public async load(): Promise<void> {
    await mkdir(join(this.root, "files"), { recursive: true });
  }

  public async unload(): Promise<void> {}

  private async _getTree(): Promise<Tree> {
    try {
      const data = await readFile(join(this.root, "tree.json"), {
        encoding: "utf8",
      });
      const tree = JSON.parse(data);
      return tree;
    } catch (err) {
      return createTree();
    }
  }

  private async _writeTree(tree: Tree): Promise<void> {
    return writeFile(
      join(this.root, "tree.json"),
      JSON.stringify(tree, null, 2),
      {
        encoding: "utf8",
      },
    );
  }

  public async getFolder(
    path: string,
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    const items = node.children.reduce(
      (acc: Record<string, Record<string, string>>, item: string) => {
        const node = getNode(tree, path + item);
        if (item.endsWith("/")) {
          acc[item] = {
            ETag: node.ETag,
          };
        } else {
          acc[item] = {
            "Content-Type": node["Content-Type"],
            "Content-Length": node["Content-Length"],
            "Last-Modified": node["Last-Modified"],
            ETag: node["ETag"],
          };
        }

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

  public async putDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const tree = await this._getTree();

    const id = uuid();
    const date = new Date().toUTCString();

    const checksum = new CRC32Stream();

    await pipeline(
      req,
      checksum,
      fs.createWriteStream(join(this.root, "files", id), {
        flags: "w",
      }),
    );

    const ETag = '"' + checksum.hex() + '"';

    const node = {
      "Content-Type": req.headers["content-type"],
      "Content-Length": req.headers["content-length"],
      "Last-Modified": date,
      ETag,
      id,
    };

    const wasSet = setNode(tree, path, node);
    if (!wasSet) {
      res.statusCode = 409;
      return;
    }
    await this._writeTree(tree);

    res.statusCode = 200;
    res.setHeader("ETag", ETag);
    // FIXME not in the spec
    // https://github.com/remotestorage/spec/issues/173
    res.setHeader("Last-Modified", date);
  }

  public async getDocument(
    path: string,
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    res.statusCode = 200;
    ["Content-Length", "Last-Modified", "ETag", "Content-Type"].forEach(
      header => {
        const value = node[header];
        if (value) res.setHeader(header, value);
      },
    );

    await pipeline(fs.createReadStream(join(this.root, "files", node.id)), res);
  }

  public async deleteDocument(
    path: string,
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    const wasDeleted = removeNode(tree, path);
    if (!wasDeleted) {
      res.statusCode = 409;
      return;
    }
    await this._writeTree(tree);

    res.statusCode = 200;

    unlink(join(this.root, "files", node.id)).catch(err => {
      this.emit("error", err);
    });
  }

  public async headDocument(
    path: string,
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const tree = await this._getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    res.statusCode = 200;
    ["Content-Length", "Last-Modified", "ETag", "Content-Type"].forEach(
      header => {
        const value = node[header];
        if (value) res.setHeader(header, value);
      },
    );
  }

  public async headFolder(
    path: string,
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
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
