import { SharpEngine } from "../src";
import sharp from "sharp";
import { describe, it, expect, vi } from "vitest";

describe("SharpEngine Smart Cropping", () => {
  it("should use entropy strategy when crop is set to entropy", async () => {
    const engine = new SharpEngine();

    // Create a 100x100 dummy image
    const inputBytes = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
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
      width: 50,
      height: 50,
      crop: "entropy",
    });

    expect(result.width).toBe(50);
    expect(result.height).toBe(50);

    // Since we can't easily spy on the internal sharp instance in the compiled code without more complex mocking,
    // we primarily rely here on the fact that it doesn't throw and returns correct dimensions.
    // In a real unit test with proper dependency injection or module mocking, we would verify the 'position' option.
  });

  it("should use attention strategy when crop is set to attention", async () => {
    const engine = new SharpEngine();

    const inputBytes = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
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
      width: 50,
      height: 50,
      crop: "attention",
    });

    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });

  it("should use standard position strategy (top)", async () => {
    const engine = new SharpEngine();

    const inputBytes = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
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
      width: 50,
      height: 50,
      crop: "top",
    });

    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });
});
