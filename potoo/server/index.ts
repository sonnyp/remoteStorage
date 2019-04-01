import Next from "next";
import Polka from "polka";
import fetch from "node-fetch";

// @ts-ignore
global.fetch = fetch;

const { PORT = 3000, NODE_ENV } = process.env;
const dev = NODE_ENV !== "production";

const next = Next({ dev });
const handle = next.getRequestHandler();
const polka = Polka();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

polka.get("/oauth/:username", (req, res, parsed) => {
  const { username } = req.params;
  next.render(req, res, "/oauth", { ...req.query, username }, parsed);
});

polka.get("/storage/*", (req, res, parsed) => {
  next.render(req, res, "/storage", { path: req.url.substr(8) }, parsed);
});

polka.get("*", handle);

next.prepare().then(() => {
  polka.listen(PORT, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
