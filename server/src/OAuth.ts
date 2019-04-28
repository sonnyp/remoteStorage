import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";

interface Options {
  domain: string;
  prefix: string;
  authorize: (req, res) => Promise<void>;
  grant: (req, res) => Promise<void>;
}

export function createRequestHandler({
  domain,
  // authenticate,
  prefix,
  authorize,
  grant,
}: Options): (
  req: IncomingMessage | Http2ServerRequest,
  res: ServerResponse | Http2ServerResponse,
) => Promise<void> {
  return async function OAuthRequestHandler(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
  ): Promise<void> {
    const { method, url } = req;

    if (method === "POST") {
      await grant(req, res);
      return;
    }

    if (method !== "GET") {
      res.statusCode = 405;
      res.end();
      return;
    }

    await authorize(req, res);

    // const sufix = url.substr((prefix || "").length);
    // const username = decodeURI(parse(sufix).pathname);

    // const token = await authenticate(username);
    // if (!token) {
    //   res.statusCode = 401;
    //   res.end();
    //   return;
    // }

    // const { searchParams } = new URL(req.url, `http://${domain}`);

    // // const clientId = searchParams.get("client_id");
    // const redirectUri = searchParams.get("redirect_uri");
    // // const responseType = searchParams.get("response_type");
    // // const scope = searchParams.get("scope");

    // const authorized = await authorize(username, searchParams);
    // if (!authorized) {
    //   res.statusCode = 403;
    //   res.end();
    //   return;
    // }

    // const redirectURL = new URL(redirectUri);
    // redirectURL.searchParams.set("access_token", token);
    // redirectURL.searchParams.set("token_type", "bearer");
    // redirectURL.hash = redirectURL.search.substr(1);
    // redirectURL.search = "";

    // res.statusCode = 302;
    // res.setHeader("Location", redirectURL.toString());
    // res.end();
  };
}
