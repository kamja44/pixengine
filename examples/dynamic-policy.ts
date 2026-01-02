import { optimize, type Policy } from "@pixengine/core";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";
import sharp from "sharp";

const smartPolicy: Policy = (ctx) => {
  console.log(`Analyzing: ${ctx.width}x${ctx.height}, ${ctx.bytes} bytes`);

  if (ctx.width > 2000) {
    console.log("→ Large image: generating 3 variants\n");
    return {
      variants: [
        { width: 400, format: "webp", quality: 80 },
        { width: 800, format: "webp", quality: 85 },
        { width: 1200, format: "avif", quality: 75 },
      ],
    };
  }

  if (ctx.width > 1000) {
    console.log("→ Medium image: generating 2 variants\n");
    return {
      variants: [
        { width: 400, format: "webp", quality: 80 },
        { width: 800, format: "webp", quality: 85 },
      ],
    };
  }

  console.log("→ Small image: generating 1 variant\n");
  return {
    variants: [{ width: 400, format: "webp", quality: 80 }],
  };
};

async function main() {
  console.log("PixEngine - Dynamic Policy Example\n");

  // Test 1: Small
  console.log("=== Test 1: Small (800x600) ===");
  const small = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 100, g: 100, b: 100 },
    },
  })
    .jpeg()
    .toBuffer();
  await optimize({
    input: {
      filename: "small.jpg",
      bytes: new Uint8Array(small),
      contentType: "image/jpeg",
    },
    policy: smartPolicy,
    engine: new SharpEngine(),
    storage: new LocalStorage({ baseDir: "./output", baseUrl: "/images" }),
  });

  // Test 2: Large
  console.log("\n=== Test 2: Large (2400x1800) ===");
  const large = await sharp({
    create: {
      width: 2400,
      height: 1800,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  })
    .jpeg()
    .toBuffer();
  const manifest = await optimize({
    input: {
      filename: "large.jpg",
      bytes: new Uint8Array(large),
      contentType: "image/jpeg",
    },
    policy: smartPolicy,
    engine: new SharpEngine(),
    storage: new LocalStorage({ baseDir: "./output", baseUrl: "/images" }),
  });

  console.log(`Large image generated ${manifest.variants.length} variants`);
}

main().catch(console.error);
