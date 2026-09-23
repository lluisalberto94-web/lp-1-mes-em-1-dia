const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function copyFileIfExists(name) {
  const src = path.join(root, name);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dist, name));
}

copyFileIfExists("index.html");
copyFileIfExists("obrigado.html");

const assetsSrc = path.join(root, "assets");
const assetsDest = path.join(dist, "assets");
if (!fs.existsSync(assetsSrc)) throw new Error("Pasta assets não encontrada.");
fs.cpSync(assetsSrc, assetsDest, { recursive: true });

fs.writeFileSync(
  path.join(dist, "_headers"),
  `/
  Cache-Control: no-cache, no-store, must-revalidate

/index.html
  Cache-Control: no-cache, no-store, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`
);

console.log("Build Cloudflare pronto em dist/");
