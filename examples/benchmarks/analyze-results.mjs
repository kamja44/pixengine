import { readFile } from "fs/promises";

async function analyzeResults() {
  const data = JSON.parse(await readFile("./benchmark-results.json", "utf-8"));

  console.log("📊 PixEngine Benchmark Analysis\n");
  console.log("=".repeat(70));

  // 1. Overall Statistics
  console.log("\n📈 OVERALL STATISTICS");
  console.log("-".repeat(70));
  console.log(`Total tests performed: ${data.length}`);
  console.log(`Unique images tested: ${new Set(data.map(d => d.image)).size}`);

  const avgReduction = (data.reduce((sum, d) => sum + d.reductionPercent, 0) / data.length).toFixed(1);
  console.log(`Average reduction across all tests: ${avgReduction}%`);

  // 2. Format Comparison
  console.log("\n\n🎨 FORMAT COMPARISON (Quality 85, 800px)");
  console.log("-".repeat(70));

  const formatTests = data.filter(d => d.testType === "format");
  const formats = ["webp", "avif", "jpeg", "png"];

  console.log("\nFormat    | Avg Reduction | Min    | Max    | Avg Size");
  console.log("-".repeat(70));

  for (const format of formats) {
    const formatData = formatTests.filter(d => d.format === format);
    if (formatData.length === 0) continue;

    const reductions = formatData.map(d => d.reductionPercent);
    const sizes = formatData.map(d => d.outputBytes);

    const avg = (reductions.reduce((a, b) => a + b, 0) / reductions.length).toFixed(1);
    const min = Math.min(...reductions).toFixed(1);
    const max = Math.max(...reductions).toFixed(1);
    const avgSize = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);

    console.log(
      `${format.toUpperCase().padEnd(10)}| ${avg.padStart(12)}% | ${min.padStart(5)}% | ${max.padStart(5)}% | ${(avgSize / 1024).toFixed(1).padStart(6)} KB`
    );
  }

  // 3. Quality Impact (WebP only)
  console.log("\n\n⚙️  QUALITY IMPACT (WebP @ 800px)");
  console.log("-".repeat(70));

  const qualityTests = data.filter(d => d.testType === "quality");
  const qualities = [50, 70, 85, 95];

  console.log("\nQuality | Avg Reduction | Avg Size   | Size vs Q85");
  console.log("-".repeat(70));

  const q85Data = qualityTests.filter(d => d.quality === 85);
  const q85AvgSize = q85Data.reduce((sum, d) => sum + d.outputBytes, 0) / q85Data.length;

  for (const quality of qualities) {
    const qData = qualityTests.filter(d => d.quality === quality);
    if (qData.length === 0) continue;

    const avgReduction = (qData.reduce((sum, d) => sum + d.reductionPercent, 0) / qData.length).toFixed(1);
    const avgSize = qData.reduce((sum, d) => sum + d.outputBytes, 0) / qData.length;
    const vsQ85 = (((avgSize - q85AvgSize) / q85AvgSize) * 100).toFixed(1);
    const vsQ85Str = vsQ85 > 0 ? `+${vsQ85}%` : `${vsQ85}%`;

    console.log(
      `${quality.toString().padStart(7)} | ${avgReduction.padStart(12)}% | ${(avgSize / 1024).toFixed(1).padStart(9)} KB | ${vsQ85Str.padStart(11)}`
    );
  }

  // 4. Size Impact
  console.log("\n\n📐 SIZE IMPACT (WebP Quality 85)");
  console.log("-".repeat(70));

  const sizeTests = data.filter(d => d.testType === "size");
  const sizes = [200, 500, 800, 1200];

  console.log("\nWidth  | Avg Reduction | Avg Output Size | Avg Dimensions");
  console.log("-".repeat(70));

  for (const width of sizes) {
    const sizeData = sizeTests.filter(d => d.width === width);
    if (sizeData.length === 0) continue;

    const avgReduction = (sizeData.reduce((sum, d) => sum + d.reductionPercent, 0) / sizeData.length).toFixed(1);
    const avgSize = sizeData.reduce((sum, d) => sum + d.outputBytes, 0) / sizeData.length;
    const avgWidth = Math.round(sizeData.reduce((sum, d) => sum + d.outputWidth, 0) / sizeData.length);
    const avgHeight = Math.round(sizeData.reduce((sum, d) => sum + d.outputHeight, 0) / sizeData.length);

    console.log(
      `${width.toString().padStart(5)}px | ${avgReduction.padStart(12)}% | ${(avgSize / 1024).toFixed(1).padStart(14)} KB | ${avgWidth}x${avgHeight}`
    );
  }

  // 5. Best Performers by Image Type
  console.log("\n\n🏆 TOP PERFORMERS BY IMAGE TYPE");
  console.log("-".repeat(70));

  const imageTypes = new Set(data.map(d => d.image));

  for (const image of imageTypes) {
    const imageData = data.filter(d => d.image === image && d.testType === "format");
    if (imageData.length === 0) continue;

    const bestFormat = imageData.reduce((best, curr) =>
      curr.reductionPercent > best.reductionPercent ? curr : best
    );

    const worstFormat = imageData.reduce((worst, curr) =>
      curr.reductionPercent < worst.reductionPercent ? curr : worst
    );

    console.log(`\n${image}`);
    console.log(`  Best:  ${bestFormat.format.toUpperCase()} - ${bestFormat.reductionPercent}% reduction (${(bestFormat.outputBytes / 1024).toFixed(1)} KB)`);
    console.log(`  Worst: ${worstFormat.format.toUpperCase()} - ${worstFormat.reductionPercent}% reduction (${(worstFormat.outputBytes / 1024).toFixed(1)} KB)`);
  }

  // 6. Key Insights
  console.log("\n\n💡 KEY INSIGHTS");
  console.log("-".repeat(70));

  // Best overall format
  const formatAvgs = formats.map(format => {
    const formatData = formatTests.filter(d => d.format === format);
    return {
      format,
      avg: formatData.length > 0 ? formatData.reduce((sum, d) => sum + d.reductionPercent, 0) / formatData.length : 0
    };
  }).sort((a, b) => b.avg - a.avg);

  console.log(`\n1. Best Overall Format: ${formatAvgs[0].format.toUpperCase()} (${formatAvgs[0].avg.toFixed(1)}% avg reduction)`);

  // Quality sweet spot
  const q70Data = qualityTests.filter(d => d.quality === 70);
  const q70Avg = q70Data.reduce((sum, d) => sum + d.reductionPercent, 0) / q70Data.length;
  console.log(`\n2. Quality Sweet Spot: Quality 85 offers best balance`);
  console.log(`   - Quality 70: ${q70Avg.toFixed(1)}% reduction`);
  console.log(`   - Quality 85: ${(q85Data.reduce((sum, d) => sum + d.reductionPercent, 0) / q85Data.length).toFixed(1)}% reduction`);

  // Size impact
  const size200 = sizeTests.filter(d => d.width === 200);
  const size200Avg = size200.reduce((sum, d) => sum + d.reductionPercent, 0) / size200.length;
  console.log(`\n3. Thumbnails (200px) achieve highest reduction: ${size200Avg.toFixed(1)}%`);

  // Format-specific insights
  console.log(`\n4. Format-Specific Recommendations:`);

  // Find images where WebP > AVIF
  const webpBetter = [];
  const avifBetter = [];

  for (const image of imageTypes) {
    const webpData = formatTests.find(d => d.image === image && d.format === "webp");
    const avifData = formatTests.find(d => d.image === image && d.format === "avif");

    if (webpData && avifData) {
      if (webpData.outputBytes < avifData.outputBytes) {
        webpBetter.push(image);
      } else {
        avifBetter.push(image);
      }
    }
  }

  console.log(`   - WebP performed better on ${webpBetter.length}/${imageTypes.size} images`);
  console.log(`   - AVIF performed better on ${avifBetter.length}/${imageTypes.size} images`);

  console.log("\n" + "=".repeat(70));
  console.log("\n✅ Analysis complete!\n");
}

analyzeResults().catch(console.error);
