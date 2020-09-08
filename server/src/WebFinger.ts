import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import url from "url";
import querystring from "querystring";

export function createRequestHandler(
  fn: (string) => Promise<any>,
): (
  req: IncomingMessage | Http2ServerRequest,
  res: ServerResponse | Http2ServerResponse,
) => Promise<void> {
  return async function webFingerRequestHandler(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
  ): Promise<void> {
    const { method } = req;

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (method !== "GET") {
      res.statusCode = 405;
      res.end();
      return;
    }

    const parsed = url.parse(req.url);
    const query = querystring.parse(parsed.query);

    const resource = query.resource;
    if (!resource) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const result = await fn(resource);
    if (!result) {
      res.statusCode = 400;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/jrd+json");
    res.end(JSON.stringify(result));
  };
}
