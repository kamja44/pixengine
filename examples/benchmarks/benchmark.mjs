import { optimize } from "@pixengine/core";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";
import { readFile, readdir, mkdir, writeFile } from "fs/promises";
import { join } from "path";

const TEST_IMAGES_DIR = "./test-images-generated";
const OUTPUT_DIR = "./benchmark-output";
const RESULTS_FILE = "./benchmark-results.json";

// Test configurations
const QUALITY_TESTS = [50, 70, 85, 95];
const FORMAT_TESTS = ["webp", "avif", "jpeg", "png"];
const SIZE_TESTS = [200, 500, 800, 1200];

async function runBenchmark() {
  console.log("🚀 PixEngine Comprehensive Benchmark\n");
  console.log("=" .repeat(60));

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Get all test images
  const imageFiles = (await readdir(TEST_IMAGES_DIR))
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`\n📁 Found ${imageFiles.length} test images\n`);

  const allResults = [];

  for (const imageFile of imageFiles) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📸 Testing: ${imageFile}`);
    console.log('='.repeat(60));

    const imagePath = join(TEST_IMAGES_DIR, imageFile);
    const imageBytes = await readFile(imagePath);
    const contentType = imageFile.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Test 1: Quality comparison (WebP only, single size)
    console.log("\n1️⃣ Quality Comparison Test (WebP @ 800px)");
    console.log("-".repeat(60));

    for (const quality of QUALITY_TESTS) {
      try {
        const result = await optimize({
          input: {
            filename: imageFile,
            bytes: new Uint8Array(imageBytes),
            contentType,
          },
          policy: () => ({
            variants: [{ width: 800, format: "webp", quality }],
          }),
          engine: new SharpEngine(),
          storage: new LocalStorage({
            baseDir: join(OUTPUT_DIR, `quality-test-${imageFile}-q${quality}`),
            baseUrl: "http://localhost:3000",
          }),
        });

        const variant = result.variants[0];
        const reduction = ((1 - variant.bytes / result.original.bytes) * 100).toFixed(1);

        console.log(`   Quality ${quality}: ${variant.bytes.toLocaleString()} bytes (${reduction}% reduction)`);

        allResults.push({
          image: imageFile,
          testType: "quality",
          quality,
          format: "webp",
          width: 800,
          originalBytes: result.original.bytes,
          outputBytes: variant.bytes,
          reductionPercent: parseFloat(reduction),
        });
      } catch (error) {
        console.log(`   Quality ${quality}: ❌ Error - ${error.message}`);
      }
    }

    // Test 2: Format comparison (quality 85, single size)
    console.log("\n2️⃣ Format Comparison Test (Quality 85 @ 800px)");
    console.log("-".repeat(60));

    for (const format of FORMAT_TESTS) {
      try {
        const result = await optimize({
          input: {
            filename: imageFile,
            bytes: new Uint8Array(imageBytes),
            contentType,
          },
          policy: () => ({
            variants: [{ width: 800, format, quality: 85 }],
          }),
          engine: new SharpEngine(),
          storage: new LocalStorage({
            baseDir: join(OUTPUT_DIR, `format-test-${imageFile}-${format}`),
            baseUrl: "http://localhost:3000",
          }),
        });

        const variant = result.variants[0];
        const reduction = ((1 - variant.bytes / result.original.bytes) * 100).toFixed(1);

        console.log(`   ${format.toUpperCase().padEnd(5)}: ${variant.bytes.toLocaleString().padStart(12)} bytes (${reduction}% reduction)`);

        allResults.push({
          image: imageFile,
          testType: "format",
          quality: 85,
          format,
          width: 800,
          originalBytes: result.original.bytes,
          outputBytes: variant.bytes,
          reductionPercent: parseFloat(reduction),
        });
      } catch (error) {
        console.log(`   ${format.toUpperCase().padEnd(5)}: ❌ Error - ${error.message}`);
      }
    }

    // Test 3: Size comparison (WebP quality 85)
    console.log("\n3️⃣ Size Comparison Test (WebP Quality 85)");
    console.log("-".repeat(60));

    for (const width of SIZE_TESTS) {
      try {
        const result = await optimize({
          input: {
            filename: imageFile,
            bytes: new Uint8Array(imageBytes),
            contentType,
          },
          policy: () => ({
            variants: [{ width, format: "webp", quality: 85 }],
          }),
          engine: new SharpEngine(),
          storage: new LocalStorage({
            baseDir: join(OUTPUT_DIR, `size-test-${imageFile}-${width}px`),
            baseUrl: "http://localhost:3000",
          }),
        });

        const variant = result.variants[0];
        const reduction = ((1 - variant.bytes / result.original.bytes) * 100).toFixed(1);

        console.log(`   ${width}px: ${variant.bytes.toLocaleString().padStart(12)} bytes (${variant.width}x${variant.height}, ${reduction}% reduction)`);

        allResults.push({
          image: imageFile,
          testType: "size",
          quality: 85,
          format: "webp",
          width,
          originalBytes: result.original.bytes,
          outputBytes: variant.bytes,
          outputWidth: variant.width,
          outputHeight: variant.height,
          reductionPercent: parseFloat(reduction),
        });
      } catch (error) {
        console.log(`   ${width}px: ❌ Error - ${error.message}`);
      }
    }
  }

  // Save results to JSON
  await writeFile(RESULTS_FILE, JSON.stringify(allResults, null, 2));

  // Summary statistics
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 BENCHMARK SUMMARY");
  console.log("=".repeat(60));

  // Average reduction by format
  console.log("\n📈 Average Reduction by Format:");
  for (const format of FORMAT_TESTS) {
    const formatResults = allResults.filter(r => r.testType === "format" && r.format === format);
    if (formatResults.length > 0) {
      const avgReduction = (formatResults.reduce((sum, r) => sum + r.reductionPercent, 0) / formatResults.length).toFixed(1);
      console.log(`   ${format.toUpperCase().padEnd(5)}: ${avgReduction}% average reduction`);
    }
  }

  // Average reduction by quality
  console.log("\n📈 Average Reduction by Quality (WebP):");
  for (const quality of QUALITY_TESTS) {
    const qualityResults = allResults.filter(r => r.testType === "quality" && r.quality === quality);
    if (qualityResults.length > 0) {
      const avgReduction = (qualityResults.reduce((sum, r) => sum + r.reductionPercent, 0) / qualityResults.length).toFixed(1);
      console.log(`   Quality ${quality}: ${avgReduction}% average reduction`);
    }
  }

  // Best and worst performers
  console.log("\n🏆 Best Compression (by reduction %):");
  const topReductions = [...allResults]
    .sort((a, b) => b.reductionPercent - a.reductionPercent)
    .slice(0, 5);
  topReductions.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.image} - ${r.format} @ ${r.width}px Q${r.quality}: ${r.reductionPercent}%`);
  });

  console.log("\n💾 Results saved to:", RESULTS_FILE);
  console.log("📁 Output files saved to:", OUTPUT_DIR);
  console.log("\n✅ Benchmark complete!\n");
}

runBenchmark().catch(console.error);
