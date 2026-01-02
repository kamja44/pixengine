import { optimize } from "@pixengine/core";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";
import sharp from "sharp";

async function main() {
  console.log("🚀 PixEngine - Basic Usage Example\n");

  // 1. 테스트 이미지 생성
  const testImage = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 100, g: 150, b: 200 },
    },
  })
    .jpeg()
    .toBuffer();

  console.log("📸 Test image created: 800x600");

  // 2. 최적화
  const manifest = await optimize({
    input: {
      filename: "example.jpg",
      bytes: new Uint8Array(testImage),
      contentType: "image/jpeg",
    },
    policy: () => ({
      variants: [
        { width: 200, format: "webp", quality: 80 },
        { width: 400, format: "webp", quality: 85 },
      ],
    }),
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: "./output",
      baseUrl: "http://localhost:3000/images",
    }),
  });

  // 3. 결과 출력
  console.log("\nOptimization complete!\n");
  console.log("Original:", manifest.original);
  console.log("\nVariants:");
  manifest.variants.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.key}`);
    console.log(`     Size: ${v.width}x${v.height}`);
    console.log(`     Bytes: ${v.bytes}`);
    console.log(`     URL: ${v.url}\n`);
  });
}

main().catch(console.error);
