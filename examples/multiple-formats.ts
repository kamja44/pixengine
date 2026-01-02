import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";
import { optimize } from "@pixengine/core";
import sharp from "sharp";

async function main() {
  console.log("PixEngine - Multiple Formats Example\n");

  const testImage = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: { r: 255, g: 100, b: 50 },
    },
  })
    .jpeg()
    .toBuffer();

  const manifest = await optimize({
    input: {
      filename: "hero.jpg",
      bytes: new Uint8Array(testImage),
      contentType: "image/jpeg",
    },
    policy: () => ({
      variants: [
        { width: 400, format: "webp", quality: 80 },
        { width: 400, format: "avif", quality: 75 },
        { width: 400, format: "jpeg", quality: 85 },
      ],
    }),
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: "./output",
      baseUrl: "/images",
    }),
  });

  console.log("Generated 3 different formats:\n");
  manifest.variants.forEach((v) => {
    console.log(`= ${v.format.toUpperCase()}: ${v.bytes} bytes (${v.key})`);
  });
}

main().catch(console.error);
