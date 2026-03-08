import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const landingDir = path.join(repoRoot, "landing");
const iconsDir = path.join(repoRoot, "public", "icons");
const outputDir = path.join(repoRoot, ".dist", "landing-pages");
const outputIconsDir = path.join(outputDir, "icons");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

cpSync(landingDir, outputDir, {
  recursive: true,
  filter: (source) => !source.endsWith(".DS_Store"),
});

if (existsSync(iconsDir)) {
  mkdirSync(outputIconsDir, { recursive: true });
  cpSync(iconsDir, outputIconsDir, {
    recursive: true,
    filter: (source) => !source.endsWith(".DS_Store"),
  });
}

const indexPath = path.join(outputDir, "index.html");
const indexHtml = readFileSync(indexPath, "utf8").replaceAll("../public/icons/", "./icons/");

writeFileSync(indexPath, indexHtml);
writeFileSync(path.join(outputDir, ".nojekyll"), "");

console.log(`GitHub Pages landing ready at ${outputDir}`);
