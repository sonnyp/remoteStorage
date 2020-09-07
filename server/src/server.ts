import {
  createSecureServer,
  Http2ServerRequest,
  Http2ServerResponse,
} from "http2";
import { createRequestHandler as createRemoteStorageRequestHandler } from "./RemoteStorage";
import FSRemoteStorage from "./FlatFS";
import { join } from "path";
import pino, { final } from "pino";
import pinoHttp from "pino-http";
import { createRequestHandler as createWebFingerRequestHandler } from "./WebFinger";
import { readFileSync } from "fs";
import { createRequestHandler as createOAuthRequestHandler } from "./OAuth";

const { DOMAIN, PORT, KEY, CERT } = process.env;

const logger = pino();
const httplogger = pinoHttp({ logger });

const remoteStoragePrefix = "/storage";
const OAuthPrefix = "/oauth";

const storage = new FSRemoteStorage({
  root: join(__dirname, "..", "..", "storage"),
});
storage.on("error", (err) => {
  pino.error(err, "remoteStorage");
});

const tokens = new Map([["foobar", { scope: "*", username: "sonny" }]]);

const remoteStorage = createRemoteStorageRequestHandler({
  storage,
  prefix: remoteStoragePrefix,
  authorize: async (token: string, path: string) => {
    return !!tokens.get(token);
  },
});
const webFinger = createWebFingerRequestHandler(async (resource) => {
  return {
    subject: resource,
    links: [
      {
        href: `https://${DOMAIN}:${PORT}/storage`,
        rel: "http://tools.ietf.org/id/draft-dejong-remotestorage",
        properties: {
          "http://remotestorage.io/spec/version":
            "draft-dejong-remotestorage-12",
          "http://tools.ietf.org/html/rfc6749#section-4.2": `https://${DOMAIN}:${PORT}/oauth/sonny`,
        },
      },
    ],
  };
});

async function authorize(req, res): Promise<void> {
  const { searchParams } = new URL(req.url, `http://${DOMAIN}`);

  const responseType = searchParams.get("response_type");
  if (responseType !== "token") {
    res.statusCode = 400;
    res.end();
    return;
  }

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");

  if (!clientId || !redirectUri || !scope) {
    res.statusCode = 400;
    res.end();
    return;
  }

  const accessDeniedURL = new URL(redirectUri);
  accessDeniedURL.searchParams.set("error", "access_denied");
  accessDeniedURL.hash = accessDeniedURL.search.substr(1);
  accessDeniedURL.search = "";

  res.statusCode = 200;
  res.end(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
      </head>
      <body>
        <p>
          ${clientId} requiring ${scope}
        </p>

        <form action="/oauth" method="post">
          <p>
            <label for="username">Username:</label>
            <input type="text" name="username" required>
          </p>

          <p>
            <label for="password">Password:</label>
            <input type="password" name="password" required>
          </p>

          <input type="hidden" name="client_id" value="${clientId}"/>
          <input type="hidden" name="redirect_uri" value="${redirectUri}"/>
          <input type="hidden" name="scope" value="${scope}"/>

          <input type="submit" value="Allow"/>
          <a href="${accessDeniedURL}"><button>Deny</button></a>
        </form>
      </body>
    </html>
  `);
}
async function grant(req, res): Promise<void> {
  const { headers } = req;
  if (headers["content-type"] !== "application/x-www-form-urlencoded") {
    res.statusCode = 415;
    res.end();
    return;
  }

  async function readStream(req): Promise<string> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        resolve(body);
      });
    });
  }

  const body = await readStream(req);
  const searchParams = new URLSearchParams(body);

  const username = searchParams.get("username");
  const password = searchParams.get("password");

  if (username !== "sonny" || password !== "foobar") {
    res.statusCode = 401;
    res.end();
    return;
  }

  // const clientId = searchParams.get("client_id");
  const scope = searchParams.get("scope");
  const redirectUri = searchParams.get("redirect_uri");

  const token = Math.random().toString().substr(2);

  tokens.set(token, {
    scope,
    username,
  });

  const redirectURL = new URL(redirectUri);
  redirectURL.searchParams.set("access_token", token);
  redirectURL.searchParams.set("token_type", "bearer");
  redirectURL.hash = redirectURL.search.substr(1);
  redirectURL.search = "";

  res.statusCode = 302;
  res.setHeader("Location", redirectURL.toString());
  res.end();
}

const OAuth = createOAuthRequestHandler({
  domain: DOMAIN,
  // authenticate,
  authorize,
  grant,
  prefix: OAuthPrefix,
});

function requestHandler(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
): void {
  httplogger(req, res);

  const { url } = req;

  if (url.startsWith(`${remoteStoragePrefix}/`)) {
    remoteStorage(req, res).catch((err) => {
      logger.error(err, "RemoteStorage error");
      res.statusCode = 500;
      res.end();
    });
    return;
  }

  if (url.startsWith("/.well-known/webfinger")) {
    webFinger(req, res).catch((err) => {
      logger.error(err, "WebFinger error");
      res.statusCode = 500;
      res.end();
    });
    return;
  }

  if (url.startsWith(OAuthPrefix)) {
    OAuth(req, res).catch((err) => {
      logger.error(err, "OAuth error");
      res.statusCode = 500;
      res.end();
    });
    return;
  }

  res.statusCode = 404;
  res.end();
}

const server = createSecureServer(
  {
    key: readFileSync(join(__dirname, KEY)),
    cert: readFileSync(join(__dirname, CERT)),
    allowHTTP1: true,
  },
  requestHandler,
);

(async () => {
  await storage.load();

  server.listen(PORT, () => {
    console.log(`https://${DOMAIN}:${PORT}/`);
  });
})();

process.on(
  "uncaughtException",
  final(logger, (err, finalLogger) => {
    finalLogger.error(err, "uncaughtException");
    process.exit(1);
  }),
);

process.on(
  "unhandledRejection",
  final(logger, (err, finalLogger) => {
    finalLogger.error(err, "unhandledRejection");
    process.exit(1);
  }),
);
