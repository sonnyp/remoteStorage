import { createServer } from "http";
import { createRequestHandler } from "./RemoteStorage";
import FSRemoteStorage from "./stores/FlatFS";
import { join } from "path";

const root = join(__dirname, "..", "..", "storage");

const remoteStorage = new FSRemoteStorage({
  root,
});
remoteStorage.on("error", err => {
  console.error(err);
});

const handler = createRequestHandler(remoteStorage);

const server = createServer({}, handler);

(async () => {
  await remoteStorage.load();

  // await rs.load();
  server.listen(9090, () => {
    console.log("http://localhost:9090");
  });
})().catch(console.error);
