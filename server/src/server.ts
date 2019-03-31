import { createServer } from "http";
import { createRequestHandler as createRemoteStorageRequestHandler } from "./RemoteStorage";
import FSRemoteStorage from "./stores/FlatFS";
import { join } from "path";
import pino, { final } from "pino";
import pinoHttp from "pino-http";
import { createRequestHandler as createWebFingerRequestHandler } from "./WebFinger";

const logger = pino();
const httplogger = pinoHttp({ logger });

const root = join(__dirname, "..", "..", "storage");

const remoteStorage = new FSRemoteStorage({
  root,
});
remoteStorage.on("error", err => {
  pino.error(err, "remoteStorage");
});

const remoteStorageRequestHandler = createRemoteStorageRequestHandler(
  remoteStorage,
);
const webFingerRequestHandler = createWebFingerRequestHandler();

const server = createServer({}, (req, res) => {
  httplogger(req, res);

  if (req.url.startsWith("/.well-known/webfinger")) {
    webFingerRequestHandler(req, res).catch(err =>
      logger.error(err, "WebFinger error"),
    );
  } else if (req.url.startsWith("/storage/")) {
    req.url = req.url.substr(8);
    remoteStorageRequestHandler(req, res).catch(err =>
      logger.error(err, "RemoteStorage error"),
    );
  } else {
    res.statusCode = 404;
    res.end();
  }
});

(async () => {
  await remoteStorage.load();

  server.listen(9090, () => {
    console.log("http://localhost:9090");
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
