import { createRequestHandler } from "./WebFinger";
import { IncomingMessage, ServerResponse, createServer } from "http";
import fetch from "./superfetch";

const domain = "foobar";
const resource = "foo@bar";
const requestHandler = createRequestHandler({ domain });

describe("WebFinger", () => {
  test("sends Access-Control-Allow-Origin response header set to *", async () => {
    const res = await fetch(requestHandler, "/.well-known/webfinger");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  test("responds with 405 if method is not GET", async () => {
    async function getStatus(method: string): Promise<number> {
      return (await fetch(requestHandler, "/.well-known/webfinger", { method }))
        .status;
    }

    expect(await getStatus("PATCH")).toBe(405);
    expect(await getStatus("POST")).toBe(405);
    expect(await getStatus("PUT")).toBe(405);
    expect(await getStatus("HEAD")).toBe(405);
    expect(await getStatus("OPTIONS")).toBe(405);
    expect(await getStatus("DELETE")).toBe(405);
    // expect(await getStatus("CONNECT")).toBe(405);
    expect(await getStatus("TRACE")).toBe(405);
  });

  test("responds with 400 if resource url parameter is not defuned", async () => {
    async function getStatus(path: string): Promise<number> {
      return (await fetch(requestHandler, path)).status;
    }

    expect(await getStatus("/.well-known/webfinger")).toBe(400);
    expect(await getStatus("/.well-known/webfinger?")).toBe(400);
    expect(await getStatus("/.well-known/webfinger?resource")).toBe(400);
    expect(await getStatus("/.well-known/webfinger?resource=")).toBe(400);
  });

  test("responds with 200 and body if resource url parameter is defined", async () => {
    async function getStatus(path: string): Promise<number> {
      return (await fetch(requestHandler, path)).status;
    }

    expect(await getStatus("/.well-known/webfinger?resource=0")).toBe(200);
    expect(await getStatus("/.well-known/webfinger?resource=''")).toBe(200);

    const res = await fetch(
      requestHandler,
      `/.well-known/webfinger?resource=${resource}`,
    );

    expect(res.headers.get("Content-Type")).toBe("application/jrd+json");
    expect(await res.json()).toEqual({
      subject: resource,
      links: [
        {
          href: `https://${domain}/storage`,
          rel: "http://tools.ietf.org/id/draft-dejong-remotestorage",
          properties: {
            "http://remotestorage.io/spec/version":
              "draft-dejong-remotestorage-15",
            "http://tools.ietf.org/html/rfc6749#section-4.2": `https://${domain}/oauth/sonny`,
          },
        },
      ],
    });
  });
});
