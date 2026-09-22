const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawnSync } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const sourceUrl = "https://1mesemumdia.com/wp-content/uploads/2025/07/Trazer-2-Prosperidade-Plena-.mov";
const assetsDir = path.join(__dirname, "assets");
const sourcePath = path.join("/tmp", "imersao-source.mov");
const outputPath = path.join(assetsDir, "imersao-1-mes-em-1-dia.mp4");

fs.mkdirSync(assetsDir, { recursive: true });

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("Muitos redirecionamentos ao baixar o vídeo."));
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(dest, () => {});
        return resolve(download(new URL(res.headers.location, url).toString(), dest, redirects + 1));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error("Falha ao baixar vídeo. HTTP " + res.statusCode));
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    });
    req.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  try {
    console.log("Baixando vídeo original...");
    await download(sourceUrl, sourcePath);

    console.log("Convertendo vídeo para MP4/H.264 otimizado para web...");
    const result = spawnSync(ffmpegPath, [
      "-y",
      "-i", sourcePath,
      "-vf", "scale=1920:-2",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "24",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputPath
    ], { stdio: "inherit" });

    if (result.status !== 0) {
      throw new Error("FFmpeg terminou com código " + result.status);
    }

    const sizeMb = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
    console.log("Vídeo pronto: " + outputPath + " (" + sizeMb + " MB)");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    try { fs.unlinkSync(sourcePath); } catch (_) {}
  }
})();