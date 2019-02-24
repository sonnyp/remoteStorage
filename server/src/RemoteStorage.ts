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

export function createRequestHandler(remoteStorage: RemoteStorage) {
  function getFolder(path: string, req: IncomingMessage, res: ServerResponse) {
    return remoteStorage.getFolder(path, req, res);
  }

  function getDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    return remoteStorage.getDocument(path, req, res);
  }

  function putDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    return remoteStorage.putDocument(path, req, res);
  }

  function deleteDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    return remoteStorage.deleteDocument(path, req, res);
  }

  function headFolder(path: string, req: IncomingMessage, res: ServerResponse) {
    return remoteStorage.headFolder(path, req, res);
  }

  function headDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    return remoteStorage.headDocument(path, req, res);
  }

  function get(path: string, req: IncomingMessage, res: ServerResponse) {
    if (path.endsWith("/")) {
      return getFolder(path, req, res);
    } else {
      return getDocument(path, req, res);
    }
  }

  function put(path: string, req: IncomingMessage, res: ServerResponse) {
    if (path.endsWith("/")) {
      res.statusCode = 405;
    } else {
      return putDocument(path, req, res);
    }
  }

  function remove(path: string, req: IncomingMessage, res: ServerResponse) {
    if (path.endsWith("/")) {
      return (res.statusCode = 405);
    } else {
      return deleteDocument(path, req, res);
    }
  }

  function head(path: string, req: IncomingMessage, res: ServerResponse) {
    if (path.endsWith("/")) {
      return headFolder(path, req, res);
    } else {
      return headDocument(path, req, res);
    }
  }

  function options(path: string, req: IncomingMessage, res: ServerResponse) {
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
      "Origin",
      "If-Match",
      "If-None-Match",
    ];

    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Methods", allowMethods);
    res.setHeader("Access-Control-Allow-Headers", allowHeaders);
  }

  async function proceed(req, res) {
    const { method } = req;
    const path = parse(req.url).pathname;

    switch (method) {
      case "GET":
        await get(path, req, res);
        break;
      case "PUT":
        await put(path, req, res);
        break;
      case "DELETE":
        await remove(path, req, res);
        break;
      case "HEAD":
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
  ) {
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
