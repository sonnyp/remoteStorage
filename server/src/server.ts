import { createServer } from "http";
import { createRequestHandler } from "./RemoteStorage";
import FSRemoteStorage from "./stores/FlatFS";
import { join } from "path";
import pino, { final } from "pino";
import pinoHttp from "pino-http";

const logger = pino();
const httplogger = pinoHttp({ logger });

const root = join(__dirname, "..", "..", "storage");

const remoteStorage = new FSRemoteStorage({
  root,
});
remoteStorage.on("error", err => {
  pino.error(err, "remoteStorage");
});

const handler = createRequestHandler(remoteStorage);

const server = createServer({}, (req, res) => {
  httplogger(req, res);
  handler(req, res);
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
