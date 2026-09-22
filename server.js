const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const port = process.env.PORT || 3000;
const root = __dirname;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4"
};

function cacheFor(urlPath, ext) {
  if (ext === ".html") return "no-cache, no-store, must-revalidate";
  if (urlPath.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  return "public, max-age=86400";
}

function sendFile(req, res, filePath, stat, urlPath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = types[ext] || "application/octet-stream";
  const cacheControl = cacheFor(urlPath, ext);

  if (ext === ".mp4" && req.headers.range) {
    const range = req.headers.range.replace(/bytes=/, "").split("-");
    const start = parseInt(range[0], 10);
    const requestedEnd = range[1] ? parseInt(range[1], 10) : stat.size - 1;
    const end = Math.min(requestedEnd, stat.size - 1);

    if (Number.isNaN(start) || start >= stat.size || end < start) {
      res.writeHead(416, { "Content-Range": "bytes */" + stat.size });
      return res.end();
    }

    res.writeHead(206, {
      "Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": type,
      "Cache-Control": cacheControl
    });
    return fs.createReadStream(filePath, { start, end }).pipe(res);
  }

  const isText = [".html", ".css", ".js", ".svg"].includes(ext);
  const accept = req.headers["accept-encoding"] || "";
  const headers = {
    "Content-Type": type,
    "Cache-Control": cacheControl,
    "Vary": isText ? "Accept-Encoding" : undefined,
    ...(ext === ".mp4" ? { "Accept-Ranges": "bytes" } : {})
  };
  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);

  if (isText && accept.includes("br")) {
    res.writeHead(200, { ...headers, "Content-Encoding": "br" });
    return fs.createReadStream(filePath)
      .pipe(zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } }))
      .pipe(res);
  }

  if (isText && accept.includes("gzip")) {
    res.writeHead(200, { ...headers, "Content-Encoding": "gzip" });
    return fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
  }

  res.writeHead(200, { ...headers, "Content-Length": stat.size });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  let filePath = path.join(root, urlPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      filePath = path.join(root, "index.html");
      return fs.stat(filePath, (fallbackErr, fallbackStat) => {
        if (fallbackErr) {
          res.writeHead(404);
          return res.end("Not found");
        }
        sendFile(req, res, filePath, fallbackStat, "/index.html");
      });
    }

    sendFile(req, res, filePath, stat, urlPath);
  });
}).listen(port, "0.0.0.0", () => {
  console.log("LP rodando na porta " + port);
});