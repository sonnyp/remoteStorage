import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";

interface Options {
  domain: string;
}

export function createRequestHandler({
  domain,
}: Options): (
  req: IncomingMessage | Http2ServerRequest,
  res: ServerResponse | Http2ServerResponse,
) => Promise<void> {
  return async function webFingerRequestHandler(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
  ): Promise<void> {
    const { method } = req;
    const url = new URL(req.url, `https://${domain}`);

    res.setHeader("Access-Control-Allow-Origin", "*");

    const resource = url.searchParams.get("resource");
    if (!resource) {
      res.statusCode = 400;
      res.end();
      return;
    }

    if (method !== "GET") {
      res.statusCode = 405;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/jrd+json");
    res.end(
      JSON.stringify({
        subject: resource,
        links: [
          {
            href: `https://${domain}/storage`,
            rel: "http://tools.ietf.org/id/draft-dejong-remotestorag\
e",
            properties: {
              "http://remotestorage.io/spec/version":
                "draft-dejong-remotestorage-12",
              "http://tools.ietf.org/html/rfc6749#section-4.2": `https://${domain}/oauth/sonny`,
            },
          },
        ],
      }),
    );
  };
}
