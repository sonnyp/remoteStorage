import { IncomingMessage, ServerResponse } from "http";

export function createRequestHandler(): (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void> {
  return async function webFingerRequestHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const { method } = req;
    const url = new URL(req.url, "http://localhost");

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
            href: "localhost:9090/",
            rel: "http://tools.ietf.org/id/draft-dejong-remotestorag\
e",
            properties: {
              "http://remotestorage.io/spec/version":
                "draft-dejong-remotestorage-12",
              "http://tools.ietf.org/html/rfc6749#section-4.2":
                "localhost:9090/oauth/sonny",
            },
          },
        ],
      }),
    );
  };
}
