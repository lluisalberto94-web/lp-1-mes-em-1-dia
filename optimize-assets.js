const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = __dirname;
const assets = path.join(root, "assets");
const htmlPath = path.join(root, "index.html");

async function makeResponsiveHero() {
  const src = path.join(assets, "hero-oficial.png");
  const outputs = {};
  for (const width of [720, 1320]) {
    const webp = path.join(assets, "hero-oficial-" + width + ".webp");
    const avif = path.join(assets, "hero-oficial-" + width + ".avif");
    await sharp(src)
      .resize({ width: width, withoutEnlargement: true })
      .webp({ quality: 78, alphaQuality: 84, effort: 5 })
      .toFile(webp);
    await sharp(src)
      .resize({ width: width, withoutEnlargement: true })
      .avif({ quality: 52, effort: 4, chromaSubsampling: "4:4:4" })
      .toFile(avif);
    outputs[width] = await sharp(webp).metadata();
  }
  return outputs;
}

async function optimizeLogo() {
  const src = path.join(assets, "logo-oficial.png");
  const out = path.join(assets, "logo-oficial-360.webp");
  await sharp(src)
    .resize({ width: 360, withoutEnlargement: true })
    .webp({ lossless: true, effort: 5 })
    .toFile(out);
  return sharp(out).metadata();
}

async function optimizeProofs() {
  const result = {};
  for (let i = 1; i <= 5; i++) {
    const src = path.join(assets, "resultado-real-" + i + ".png");
    const out = path.join(assets, "resultado-real-" + i + ".webp");
    await sharp(src)
      .resize({ width: 820, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(out);
    result[i] = await sharp(out).metadata();
  }
  return result;
}

async function optimizePoster() {
  const src = path.join(assets, "imersao-1-mes-em-1-dia-poster.jpg");
  if (!fs.existsSync(src)) return null;
  const out = path.join(assets, "imersao-1-mes-em-1-dia-poster.webp");
  await sharp(src)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(out);
  return sharp(out).metadata();
}

async function getMeta(file) {
  return sharp(path.join(assets, file)).metadata();
}

function withDims(html, src, meta) {
  if (!meta || !meta.width || !meta.height) return html;
  const escaped = src.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const re = new RegExp('<img([^>]*?)src=["\\']' + escaped + '["\\']([^>]*)>', "g");
  return html.replace(re, function(tag) {
    let next = tag
      .replace(/\swidth=["'][^"']*["']/g, "")
      .replace(/\sheight=["'][^"']*["']/g, "");
    return next.replace(/>$/, ' width="' + meta.width + '" height="' + meta.height + '">');
  });
}

function fileKb(name) {
  const p = path.join(assets, name);
  return fs.existsSync(p) ? Math.round(fs.statSync(p).size / 1024) : 0;
}

(async () => {
  try {
    console.log("Otimizando imagens para PageSpeed...");
    const hero = await makeResponsiveHero();
    const logo = await optimizeLogo();
    const proofs = await optimizeProofs();
    const poster = await optimizePoster();
    const lauro = await getMeta("lauro-renata-original.webp");
    const samuel = await getMeta("samuel-original.webp");

    let html = fs.readFileSync(htmlPath, "utf8");
    html = withDims(html, "/assets/logo-oficial-360.webp", logo);
    html = withDims(html, "/assets/hero-oficial-1320.webp", hero[1320]);
    for (let i = 1; i <= 5; i++) {
      html = withDims(html, "/assets/resultado-real-" + i + ".webp", proofs[i]);
    }
    html = withDims(html, "/assets/lauro-renata-original.webp", lauro);
    html = withDims(html, "/assets/samuel-original.webp", samuel);
    fs.writeFileSync(htmlPath, html);

    console.log(
      "Hero:",
      "720 WebP", fileKb("hero-oficial-720.webp") + " KB,",
      "720 AVIF", fileKb("hero-oficial-720.avif") + " KB,",
      "1320 WebP", fileKb("hero-oficial-1320.webp") + " KB,",
      "1320 AVIF", fileKb("hero-oficial-1320.avif") + " KB"
    );
    console.log("Logo:", fileKb("logo-oficial-360.webp") + " KB");
    console.log("Poster:", poster ? fileKb("imersao-1-mes-em-1-dia-poster.webp") + " KB" : "não gerado");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();