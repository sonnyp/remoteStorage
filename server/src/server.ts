import { createSecureServer } from "http2";
import { createRequestHandler as createRemoteStorageRequestHandler } from "./RemoteStorage";
import FSRemoteStorage from "./FlatFS";
import { join } from "path";
import pino, { final } from "pino";
import pinoHttp from "pino-http";
import { createRequestHandler as createWebFingerRequestHandler } from "./WebFinger";
import { readFileSync } from "fs";
import { createRequestHandler as createOAuthRequestHandler } from "./OAuth";

const logger = pino();
const httplogger = pinoHttp({ logger });

const domain = "foobar";
const remoteStoragePrefix = "/storage";
const OAuthPrefix = "/oauth";

const storage = new FSRemoteStorage({
  root: join(__dirname, "..", "..", "storage"),
});
storage.on("error", err => {
  pino.error(err, "remoteStorage");
});

const remoteStorage = createRemoteStorageRequestHandler({
  storage,
  prefix: remoteStoragePrefix,
});
const webFinger = createWebFingerRequestHandler({
  domain,
});

async function authorize(req, res): Promise<void> {
  const { searchParams } = new URL(req.url, `http://${domain}`);

  const responseType = searchParams.get("response_type");
  if (responseType !== "token") {
    res.statusCode = 400;
    res.end();
    return;
  }

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");

  res.statusCode = 200;
  res.end(`
    <!doctype html>
    <html>
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

          <input type="submit" value="Grant"/>
        </form>
      </body>
    </html>
  `);

  // const clientId = searchParams.get("client_id");
  // const redirectUri = searchParams.get("redirect_uri");
  // const responseType = searchParams.get("response_type");
  // const scope = searchParams.get("scope");

  // if (user === "sonny") {
  //   return true;
  // } else {
  //   return false;
  // }
}
async function grant(req, res): Promise<void> {
  const { headers } = req;
  if (headers["content-type"] !== "application/x-www-form-urlencoded") {
    res.statusCode = 415;
    res.end();
    return;
  }

  async function readStream(req): Promise<string> {
    return new Promise(resolve => {
      let body = "";
      req.on("data", chunk => {
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
  const redirectUri = searchParams.get("redirect_uri");

  const redirectURL = new URL(redirectUri);
  redirectURL.searchParams.set("access_token", "foobar");
  redirectURL.searchParams.set("token_type", "bearer");
  redirectURL.hash = redirectURL.search.substr(1);
  redirectURL.search = "";

  res.statusCode = 302;
  res.setHeader("Location", redirectURL.toString());
  res.end();
}

const OAuth = createOAuthRequestHandler({
  domain,
  // authenticate,
  authorize,
  grant,
  prefix: OAuthPrefix,
});

const server = createSecureServer(
  {
    key: readFileSync(join(__dirname, "../../certs/server-key.pem")),
    cert: readFileSync(join(__dirname, "../../certs/server-cert.pem")),
    allowHTTP1: true,
  },
  (req, res) => {
    httplogger(req, res);

    const { url } = req;

    if (url.startsWith(`${remoteStoragePrefix}/`)) {
      remoteStorage(req, res).catch(err => {
        logger.error(err, "RemoteStorage error");
        res.statusCode = 500;
        res.end();
      });
      return;
    }

    if (url.startsWith("/.well-known/webfinger")) {
      webFinger(req, res).catch(err => {
        logger.error(err, "WebFinger error");
        res.statusCode = 500;
        res.end();
      });
      return;
    }

    if (url.startsWith(OAuthPrefix)) {
      OAuth(req, res).catch(err => {
        logger.error(err, "OAuth error");
        res.statusCode = 500;
        res.end();
      });
      return;
    }

    res.statusCode = 404;
    res.end();
  },
);

(async () => {
  await storage.load();

  server.listen(443, () => {
    console.log(`https://${domain}:443/`);
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
