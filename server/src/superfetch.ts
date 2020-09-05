import { createServer } from "http";
import https from "https";
import fetch, { RequestInit, Response } from "node-fetch";

export function serverAddress(
  app: any,
  path: string,
  host: string = "127.0.0.1",
): string {
  const addr = app.address();
  if (!addr) app.listen(0);

  const port = app.address().port;
  const protocol = app instanceof https.Server ? "https" : "http";
  return protocol + "://" + host + ":" + port + path;
}

export default async function superfetch(
  app: any,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  app = typeof app === "function" ? createServer(app) : app;

  if (!app.listening) {
    await new Promise((resolve) => app.listen(0, resolve));
  }

  const url = serverAddress(app, path);
  const req = await fetch(url, init);

  await new Promise((resolve) => app.close(resolve));

  return req;
}
