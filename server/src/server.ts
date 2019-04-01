import { createSecureServer } from "http2";
import { createRequestHandler as createRemoteStorageRequestHandler } from "./RemoteStorage";
import FSRemoteStorage from "./FlatFS";
import { join } from "path";
import pino, { final } from "pino";
import pinoHttp from "pino-http";
import { createRequestHandler as createWebFingerRequestHandler } from "./WebFinger";
import { readFileSync } from "fs";

const logger = pino();
const httplogger = pinoHttp({ logger });

const root = join(__dirname, "..", "..", "storage");

const domain = "foobar";

const remoteStorage = new FSRemoteStorage({
  root,
});
remoteStorage.on("error", err => {
  pino.error(err, "remoteStorage");
});

const remoteStorageRequestHandler = createRemoteStorageRequestHandler(
  remoteStorage,
);
const webFingerRequestHandler = createWebFingerRequestHandler({
  domain,
});

const server = createSecureServer(
  {
    key: readFileSync(join(__dirname, "../../certs/server-key.pem")),
    cert: readFileSync(join(__dirname, "../../certs/server-cert.pem")),
    allowHTTP1: true,
  },
  (req, res) => {
    httplogger(req, res);

    const { pathname, searchParams } = new URL(req.url, `http://${domain}`);
    // @ts-ignore
    req.pathname = pathname;

    if (pathname === "/.well-known/webfinger") {
      webFingerRequestHandler(req, res).catch(err =>
        logger.error(err, "WebFinger error"),
      );
    } else if (pathname.startsWith("/storage/")) {
      req.url = req.url.substr(8);
      remoteStorageRequestHandler(req, res).catch(err =>
        logger.error(err, "RemoteStorage error"),
      );
    } else if (pathname.startsWith("/oauth/")) {
      // const clientId = searchParams.get("client_id");
      const redirectUri = searchParams.get("redirect_uri");
      // const responseType = searchParams.get("response_type");
      // const scope = searchParams.get("scope");

      const redirectURL = new URL(redirectUri);
      redirectURL.searchParams.set("access_token", "foobar");
      redirectURL.searchParams.set("token_type", "bearer");
      redirectURL.hash = redirectURL.search.substr(1);
      redirectURL.search = "";

      res.statusCode = 302;
      res.setHeader("Location", redirectURL.toString());
      res.end();
    } else {
      res.statusCode = 404;
      res.end();
    }
  },
);

(async () => {
  await remoteStorage.load();

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
