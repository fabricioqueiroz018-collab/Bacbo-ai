import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.LYNX_API_KEY;
const BASE = "https://api.lynxmetrics.com/v1/bacbo-live";

const mime = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json",
  ".webmanifest":"application/manifest+json", ".svg":"image/svg+xml"
};

async function api(path) {
  if (!API_KEY) throw new Error("Configure LYNX_API_KEY no servidor.");
  const r = await fetch(`${BASE}${path}`, {
    headers: { "x-api-key": API_KEY, "accept": "application/json" },
    signal: AbortSignal.timeout(12000)
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`LynxMetrics HTTP ${r.status}: ${body.slice(0,250)}`);
  return JSON.parse(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/health") {
    res.writeHead(200, {"content-type":"application/json"});
    return res.end(JSON.stringify({ok:true, keyConfigured:!!API_KEY}));
  }

  if (url.pathname === "/api/latest" || url.pathname === "/api/results" || url.pathname === "/api/stats") {
    try {
      const path = url.pathname.replace("/api", "");
      const params = new URLSearchParams(url.search);
      const data = await api(path + (params.size ? `?${params}` : ""));
      res.writeHead(200, {"content-type":"application/json","cache-control":"no-store"});
      return res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(502, {"content-type":"application/json"});
      return res.end(JSON.stringify({error:e.message}));
    }
  }

  // Server-side SSE relay: API key never reaches the iPhone/browser.
  if (url.pathname === "/api/stream") {
    try {
      if (!API_KEY) throw new Error("Configure LYNX_API_KEY no servidor.");
      const upstream = await fetch(`${BASE}/stream`, {
        headers: {"x-api-key":API_KEY, "accept":"text/event-stream"},
        signal: AbortSignal.timeout(30000)
      });
      if (!upstream.ok || !upstream.body) throw new Error(`Stream HTTP ${upstream.status}`);
      res.writeHead(200, {
        "content-type":"text/event-stream; charset=utf-8",
        "cache-control":"no-cache, no-transform",
        "connection":"keep-alive",
        "x-accel-buffering":"no"
      });
      const reader = upstream.body.getReader();
      req.on("close", () => reader.cancel().catch(()=>{}));
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        if (!res.write(Buffer.from(value))) await new Promise(resolve=>res.once("drain",resolve));
      }
      return res.end();
    } catch (e) {
      if (!res.headersSent) res.writeHead(502, {"content-type":"text/plain"});
      return res.end(`event: error\ndata: ${JSON.stringify({error:e.message})}\n\n`);
    }
  }

  let pathname = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (pathname === "/" || pathname === ".") pathname = "/index.html";
  try {
    const path = join(process.cwd(), "public", pathname);
    const content = await readFile(path);
    res.writeHead(200, {"content-type":mime[extname(path)] || "application/octet-stream"});
    res.end(content);
  } catch {
    res.writeHead(404, {"content-type":"text/plain; charset=utf-8"});
    res.end("Not found");
  }
});

server.listen(PORT, () => console.log(`BAC BO AI ouvindo na porta ${PORT}`));