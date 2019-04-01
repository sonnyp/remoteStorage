// import { createServer } from "http";
// import { parse } from "url";
// import * as next from "next";
import * as fastify from "fastify";
import * as fastifyNext from "fastify-nextjs";

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   createServer((req, res) => {
//     const parsedUrl = parse(req.url, true);
//     const { pathname, query } = parsedUrl;

//     if (pathname === "/oauth") {
//       app.render(req, res, "/a", query);
//     } else if (pathname === "/a") {
//       app.render(req, res, "/a", query);
//     } else if (pathname === "/b") {
//       app.render(req, res, "/b", query);
//     } else {
//       handle(req, res, parsedUrl);
//     }
//   }).listen(port, () => {
//     console.log(`> Ready on http://localhost:${port}`);
//   });
// });

const server = fastify();

server.register(fastifyNext, { dev }).after(() => {
  // @ts-ignore
  server.next("/");
  // @ts-ignore
  server.next("/a");
  // @ts-ignore
  server.next("/b");

  server.next("/oauth/:username", async (app, req, reply) => {
    const { username } = req.params;
    app.render(req.raw, reply.res, "/oauth", {
      ...req.query,
      username,
    });
  });
});

server.listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
