import { SharpEngine } from "../src";
import sharp from "sharp";
import { describe, it, expect } from "vitest";

describe("SharpEngine Quality Scoring", () => {
  it("should calculate BPP and SSIM for transformed image", async () => {
    const engine = new SharpEngine();

    // Create a 200x200 complex image (noise) to ensure meaningful SSIM/BBP
    // Using noise because flat color compresses too well and might have perfect SSIM trivially.
    const inputBytes = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        noise: {
          type: "gaussian",
          mean: 128,
          sigma: 30,
        },
      },
    })
      .png()
      .toBuffer();

    const input = {
      filename: "test.png",
      bytes: new Uint8Array(inputBytes),
      contentType: "image/png",
    };

    const result = await engine.transform({
      input,
      width: 100,
      height: 100,
      format: "jpeg",
      quality: 80,
    });

    expect(result.metrics).toBeDefined();
    expect(result.metrics?.bpp).toBeGreaterThan(0);
    // SSIM should be high for decent quality but not 1 (since it's lossy jpeg)
    expect(result.metrics?.ssim).toBeGreaterThan(0.5);
    expect(result.metrics?.ssim).toBeLessThanOrEqual(1.0);
  });

  it("should have lower SSIM for lower quality", async () => {
    const engine = new SharpEngine();

    // Create a detailed image
    const inputBytes = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        noise: {
          type: "gaussian",
          mean: 128,
          sigma: 30,
        },
      },
    })
      .png()
      .toBuffer();

    const input = {
      filename: "test.png",
      bytes: new Uint8Array(inputBytes),
      contentType: "image/png",
    };

    const highQuality = await engine.transform({
      input,
      width: 100,
      height: 100,
      format: "jpeg",
      quality: 90,
    });

    const lowQuality = await engine.transform({
      input,
      width: 100,
      height: 100,
      format: "jpeg",
      quality: 10,
    });

    // Low quality should calculate successfully
    expect(lowQuality.metrics?.ssim).toBeDefined();
    // High quality SSIM should be better than Low quality SSIM
    // Note: SSIM isn't always perfectly linear with 'quality' setting for noise, but typically it holds.
    // If this flakes, we can adjust the test image to be a photo.
    expect(highQuality.metrics?.ssim).toBeGreaterThan(lowQuality.metrics?.ssim!);
  });
});
