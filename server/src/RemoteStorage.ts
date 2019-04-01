import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { parse } from "url";

export interface RemoteStorage {
  load(): Promise<void>;
  unload(): Promise<void>;
  getFolder(
    path: string,
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): Promise<void>;
  getDocument(
    path: string,
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): Promise<void>;
  putDocument(
    path: string,
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): Promise<void>;
  deleteDocument(
    path: string,
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): Promise<void>;
  headFolder(
    path: string,
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): Promise<void>;
  headDocument(
    path: string,
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): Promise<void>;
}

export function createRequestHandler(
  remoteStorage: RemoteStorage,
): (
  req: IncomingMessage | Http2ServerRequest,
  res: ServerResponse | Http2ServerResponse,
) => Promise<void> {
  function options(
    path: string,
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): void {
    // const requestHeaders = req.headers["access-control-request-headers"];
    // const requestMethod = req.headers["access-control-request-method"];

    const allowMethods = ["OPTIONS", "HEAD", "GET"];
    if (!path.endsWith("/")) {
      allowMethods.push("PUT", "DELETE");
    }

    const allowHeaders = [
      "Authorization",
      "Origin",
      "If-Match",
      "If-None-Match",
    ];
    if (!path.endsWith("/")) {
      allowHeaders.push(
        "Content-Length",
        // Content-Type is always allowed according to
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
        // but if it is included in the Access-Control-Request-Headers request header
        // then including it is required
        "Content-Type",
      );
    }

    res.statusCode = 200;
    // 10 minutes is the maximum for Chromium
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
    res.setHeader("Access-Control-Max-Age", "600");
    res.setHeader("Access-Control-Allow-Methods", allowMethods.join(", "));
    res.setHeader("Access-Control-Allow-Headers", allowHeaders.join(", "));
  }

  async function proceed(req, res): Promise<void> {
    const { method } = req;
    const path = decodeURI(parse(req.url).pathname);

    // FIXME Access-Control-Expose-Headers is not in the spec
    // https://github.com/remotestorage/spec/issues/172
    // `Content-Type` and `Last-Modified` are always allowed
    // according to https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers

    switch (method) {
      case "GET":
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, ETag");
        if (path.endsWith("/")) {
          await remoteStorage.getFolder(path, req, res);
        } else {
          await remoteStorage.getDocument(path, req, res);
        }
        break;
      case "PUT":
        if (path.endsWith("/")) {
          res.statusCode = 405;
        } else {
          res.setHeader("Access-Control-Expose-Headers", "ETag");
          await remoteStorage.putDocument(path, req, res);
        }
        break;
      case "DELETE":
        if (path.endsWith("/")) {
          res.statusCode = 405;
        } else {
          res.setHeader("Access-Control-Expose-Headers", "ETag");
          await remoteStorage.deleteDocument(path, req, res);
        }
        break;
      case "HEAD":
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, ETag");
        if (path.endsWith("/")) {
          await remoteStorage.headFolder(path, req, res);
        } else {
          await remoteStorage.headDocument(path, req, res);
        }
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
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse,
  ): Promise<void> {
    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
      await proceed(req, res);
    } catch (err) {
      res.statusCode = 500;
      throw err;
    } finally {
      res.end();
    }
  };
}
