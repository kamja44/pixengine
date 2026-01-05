import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const OUTPUT_DIR = "./test-images-generated";

async function generateTestImages() {
  console.log("🎨 Generating test images with Sharp...\n");

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  const images = [];

  // 1. Solid colors (good for compression)
  console.log("1️⃣ Generating solid color images...");
  for (let i = 0; i < 3; i++) {
    const colors = [
      { r: 255, g: 0, b: 0 },    // Red
      { r: 0, g: 128, b: 255 },  // Blue
      { r: 50, g: 205, b: 50 },  // Green
    ];
    const color = colors[i];
    const buffer = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: color,
      },
    })
      .jpeg()
      .toBuffer();

    const filename = `solid-color-${i + 1}.jpg`;
    await writeFile(join(OUTPUT_DIR, filename), buffer);
    images.push(filename);
    console.log(`   ✓ ${filename}`);
  }

  // 2. Gradients (challenging for compression - banding test)
  console.log("\n2️⃣ Generating gradient images...");
  for (let i = 0; i < 2; i++) {
    const svg = `
      <svg width="1920" height="1080">
        <defs>
          <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(${i === 0 ? '59,130,246' : '239,68,68'});stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(${i === 0 ? '147,51,234' : '251,191,36'});stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#grad${i})" />
      </svg>
    `;
    const buffer = await sharp(Buffer.from(svg))
      .jpeg()
      .toBuffer();

    const filename = `gradient-${i + 1}.jpg`;
    await writeFile(join(OUTPUT_DIR, filename), buffer);
    images.push(filename);
    console.log(`   ✓ ${filename}`);
  }

  // 3. Text overlays (hard for lossy compression)
  console.log("\n3️⃣ Generating images with text overlays...");
  for (let i = 0; i < 2; i++) {
    const texts = [
      "PIXEL PERFECT QUALITY",
      "Lorem ipsum dolor sit amet consectetur"
    ];
    const svg = `
      <svg width="1920" height="1080">
        <rect width="1920" height="1080" fill="#1e293b"/>
        <text x="960" y="540" font-family="Arial, sans-serif" font-size="${i === 0 ? 120 : 60}"
              fill="white" text-anchor="middle" font-weight="bold">
          ${texts[i]}
        </text>
      </svg>
    `;
    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    const filename = `text-overlay-${i + 1}.png`;
    await writeFile(join(OUTPUT_DIR, filename), buffer);
    images.push(filename);
    console.log(`   ✓ ${filename}`);
  }

  // 4. Noise patterns (worst case for compression)
  console.log("\n4️⃣ Generating noise pattern images...");
  const noiseBuffer = Buffer.alloc(1920 * 1080 * 3);
  for (let i = 0; i < noiseBuffer.length; i++) {
    noiseBuffer[i] = Math.floor(Math.random() * 256);
  }
  const noiseImage = await sharp(noiseBuffer, {
    raw: { width: 1920, height: 1080, channels: 3 },
  })
    .jpeg()
    .toBuffer();

  const noiseFilename = "noise-pattern.jpg";
  await writeFile(join(OUTPUT_DIR, noiseFilename), noiseImage);
  images.push(noiseFilename);
  console.log(`   ✓ ${noiseFilename}`);

  // 5. Checkerboard pattern (high frequency details)
  console.log("\n5️⃣ Generating checkerboard pattern...");
  const checkerSize = 40;
  const checkerboardSvg = `
    <svg width="1920" height="1080">
      ${Array.from({ length: Math.ceil(1080 / checkerSize) }, (_, row) =>
        Array.from({ length: Math.ceil(1920 / checkerSize) }, (_, col) => {
          const isBlack = (row + col) % 2 === 0;
          return `<rect x="${col * checkerSize}" y="${row * checkerSize}"
                       width="${checkerSize}" height="${checkerSize}"
                       fill="${isBlack ? 'black' : 'white'}" />`;
        }).join('')
      ).join('')}
    </svg>
  `;
  const checkerBuffer = await sharp(Buffer.from(checkerboardSvg))
    .png()
    .toBuffer();

  const checkerFilename = "checkerboard.png";
  await writeFile(join(OUTPUT_DIR, checkerFilename), checkerBuffer);
  images.push(checkerFilename);
  console.log(`   ✓ ${checkerFilename}`);

  // 6. Complex UI mockup (realistic test case)
  console.log("\n6️⃣ Generating complex UI mockup...");
  const uiSvg = `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="1920" height="1080" fill="#f8fafc"/>

      <!-- Header -->
      <rect width="1920" height="80" fill="#0f172a"/>
      <text x="40" y="50" font-family="Arial" font-size="28" fill="white" font-weight="bold">PixEngine Dashboard</text>

      <!-- Cards -->
      <rect x="40" y="120" width="560" height="300" rx="12" fill="white" stroke="#e2e8f0" stroke-width="2"/>
      <text x="60" y="160" font-family="Arial" font-size="20" fill="#1e293b" font-weight="bold">Analytics</text>
      <text x="60" y="200" font-family="Arial" font-size="48" fill="#3b82f6" font-weight="bold">12,458</text>
      <text x="60" y="240" font-family="Arial" font-size="16" fill="#64748b">Total Optimizations</text>

      <rect x="640" y="120" width="560" height="300" rx="12" fill="white" stroke="#e2e8f0" stroke-width="2"/>
      <text x="660" y="160" font-family="Arial" font-size="20" fill="#1e293b" font-weight="bold">Savings</text>
      <text x="660" y="200" font-family="Arial" font-size="48" fill="#10b981" font-weight="bold">94.2%</text>
      <text x="660" y="240" font-family="Arial" font-size="16" fill="#64748b">Average Reduction</text>

      <!-- Buttons -->
      <rect x="40" y="460" width="200" height="50" rx="8" fill="#3b82f6"/>
      <text x="140" y="492" font-family="Arial" font-size="16" fill="white" text-anchor="middle" font-weight="bold">Optimize</text>

      <rect x="260" y="460" width="200" height="50" rx="8" fill="white" stroke="#e2e8f0" stroke-width="2"/>
      <text x="360" y="492" font-family="Arial" font-size="16" fill="#475569" text-anchor="middle" font-weight="bold">Settings</text>
    </svg>
  `;
  const uiBuffer = await sharp(Buffer.from(uiSvg))
    .png()
    .toBuffer();

  const uiFilename = "ui-mockup.png";
  await writeFile(join(OUTPUT_DIR, uiFilename), uiBuffer);
  images.push(uiFilename);
  console.log(`   ✓ ${uiFilename}`);

  // 7. Mixed content (gradient + text)
  console.log("\n7️⃣ Generating mixed content image...");
  const mixedSvg = `
    <svg width="1920" height="1080">
      <defs>
        <linearGradient id="mixedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(99,102,241);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(168,85,247);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#mixedGrad)" />
      <text x="960" y="400" font-family="Arial" font-size="80" fill="white" text-anchor="middle" font-weight="bold">
        Image Optimization
      </text>
      <text x="960" y="500" font-family="Arial" font-size="40" fill="rgba(255,255,255,0.9)" text-anchor="middle">
        Policy-First Approach
      </text>
      <rect x="760" y="600" width="400" height="80" rx="40" fill="white" opacity="0.2"/>
      <text x="960" y="650" font-family="Arial" font-size="28" fill="white" text-anchor="middle" font-weight="bold">
        Get Started
      </text>
    </svg>
  `;
  const mixedBuffer = await sharp(Buffer.from(mixedSvg))
    .png()
    .toBuffer();

  const mixedFilename = "mixed-content.png";
  await writeFile(join(OUTPUT_DIR, mixedFilename), mixedBuffer);
  images.push(mixedFilename);
  console.log(`   ✓ ${mixedFilename}`);

  console.log(`\n✅ Generated ${images.length} test images in ${OUTPUT_DIR}/\n`);
  console.log("📊 Image types:");
  console.log("   - 3 Solid colors (easy compression)");
  console.log("   - 2 Gradients (banding test)");
  console.log("   - 2 Text overlays (sharp edges test)");
  console.log("   - 1 Noise pattern (worst case)");
  console.log("   - 1 Checkerboard (high frequency)");
  console.log("   - 1 UI mockup (realistic scenario)");
  console.log("   - 1 Mixed content (gradient + text)");
  console.log("\nTotal: 11 images");
}

generateTestImages().catch(console.error);
