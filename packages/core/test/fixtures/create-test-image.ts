import { writeFile } from "node:fs/promises";
import sharp from "sharp";

async function createTestImages() {
  // 800x600 빨간색 JPEG 이미지 생성
  const redImage = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg()
    .toBuffer();
  await writeFile("packages/core/test/fixtures/red-800x600.jpg", redImage);

  console.log("Test image created: red-800x600.jpg");
}

createTestImages();
