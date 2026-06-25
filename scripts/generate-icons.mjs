import sharp from "sharp"
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(resolve(__dirname, "..", "src", "app", "icon.svg"))

async function main() {
  // Apple icon 180x180
  const applePng = await sharp(svg).resize(180, 180).png().toBuffer()
  writeFileSync(resolve(__dirname, "..", "src", "app", "apple-icon.png"), applePng)

  // Favicon 32x32
  const faviconPng = await sharp(svg).resize(32, 32).png().toBuffer()
  writeFileSync(resolve(__dirname, "..", "src", "app", "favicon.ico"), faviconPng)

  console.log("✅ Icons generated: apple-icon.png, favicon.ico")
}

main().catch(console.error)
