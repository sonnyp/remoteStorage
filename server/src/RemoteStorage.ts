import { IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import { EventEmitter } from "events";

export interface RemoteStorage extends EventEmitter {
  load(): Promise<void>;
  unload(): Promise<void>;
  getFolder(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void>;
  getDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void>;
  putDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void>;
  deleteDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void>;
  headFolder(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void>;
  headDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void>;
}

export function createRequestHandler(
  remoteStorage: RemoteStorage,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  function getFolder(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    return remoteStorage.getFolder(path, req, res);
  }

  function getDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    return remoteStorage.getDocument(path, req, res);
  }

  function putDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    return remoteStorage.putDocument(path, req, res);
  }

  function deleteDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    return remoteStorage.deleteDocument(path, req, res);
  }

  function headFolder(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    return remoteStorage.headFolder(path, req, res);
  }

  function headDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    return remoteStorage.headDocument(path, req, res);
  }

  function get(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    res.setHeader("Cache-Control", "no-cache");
    if (path.endsWith("/")) {
      return getFolder(path, req, res);
    } else {
      return getDocument(path, req, res);
    }
  }

  async function put(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (path.endsWith("/")) {
      res.statusCode = 405;
      return;
    }

    return putDocument(path, req, res);
  }

  function remove(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (path.endsWith("/")) {
      res.statusCode = 405;
    } else {
      return deleteDocument(path, req, res);
    }
  }

  function head(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (path.endsWith("/")) {
      return headFolder(path, req, res);
    } else {
      return headDocument(path, req, res);
    }
  }

  function options(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): void {
    // const requestHeaders = req.headers["access-control-request-headers"];
    const requestMethod = req.headers["access-control-request-method"];

    const allowMethods = ["OPTIONS", "HEAD", "GET"];
    if (typeof requestMethod === "string") {
      allowMethods.push(requestMethod);
    }
    if (!path.endsWith("/")) {
      allowMethods.push("PUT", "DELETE");
    }

    const allowHeaders = [
      "Authorization",
      "Content-Length",
      "Content-Type",
      // is always allowed according to
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
      "Origin",
      "If-Match",
      "If-None-Match",
    ];

    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Methods", allowMethods.join(", "));
    res.setHeader("Access-Control-Allow-Headers", allowHeaders.join(", "));
  }

  async function proceed(req, res): Promise<void> {
    const { method } = req;
    const path = parse(req.url).pathname;

    // FIXME Access-Control-Expose-Headers is not in the spec
    // https://github.com/remotestorage/spec/issues/172
    // `Content-Type` and `Last-Modified` are always allowed

    switch (method) {
      case "GET":
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, ETag");
        await get(path, req, res);
        break;
      case "PUT":
        res.setHeader("Access-Control-Expose-Headers", "ETag");
        await put(path, req, res);
        break;
      case "DELETE":
        res.setHeader("Access-Control-Expose-Headers", "ETag");
        await remove(path, req, res);
        break;
      case "HEAD":
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, ETag");
        await head(path, req, res);
        break;
      case "OPTIONS":
        await options(path, req, res);
        break;
      default:
        res.statusCode = 405;
        return;
    }
  }

  return async function remoteStorageRequestHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    try {
      await proceed(req, res);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
    }

    res.end();
  };
}
