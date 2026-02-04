import { describe, expect, it } from "vitest";
import { SharpEngine } from "../src/index.js";

describe("SharpEngine", () => {
  describe("probe()", () => {
    it("should extract metadata from PNG image", async () => {
      // Given: 1x1 red png
      const redPixelPNG = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
        "base64",
      );

      const input = {
        filename: "test.png",
        bytes: new Uint8Array(redPixelPNG),
        contentType: "image/png",
      };

      // When
      const engine = new SharpEngine();
      const result = await engine.probe(input);

      // Then
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
      expect(result.format).toBe("png");
    });

    it("should extract rich metadata including color space and alpha", async () => {
      // Given: 1x1 red png (RGBA with alpha channel)
      const redPixelPNG = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
        "base64",
      );

      const input = {
        filename: "test.png",
        bytes: new Uint8Array(redPixelPNG),
        contentType: "image/png",
      };

      // When
      const engine = new SharpEngine();
      const result = await engine.probe(input);

      // Then: Should include extended metadata
      expect(result.space).toBeDefined();
      expect(result.channels).toBeDefined();
      expect(typeof result.hasAlpha).toBe("boolean");
    });
  });

  describe("transform()", () => {
    it("should convert PNG to WebP", async () => {
      // Given
      const redPixelPNG = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
        "base64",
      );

      const input = {
        filename: "test.png",
        bytes: new Uint8Array(redPixelPNG),
        contentType: "image/png",
      };

      // When
      const engine = new SharpEngine();
      const result = await engine.transform({
        input,
        format: "webp",
        quality: 80,
      });

      // Then
      expect(result.format).toBe("webp");
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.bytes.length).toBeGreaterThan(0);
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });

    it("should resize image", async () => {
      // Given 2x2 red PNG
      const redPixel2x2 = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVR4nGP4z8DwH4QZYAwAR8oH+WdZbrcAAAAASUVORK5CYII=",
        "base64",
      );

      const input = {
        filename: "test.png",
        bytes: new Uint8Array(redPixel2x2),
        contentType: "image/png",
      };

      // When downscale to 1 pixel
      const engine = new SharpEngine();
      const result = await engine.transform({
        input,
        width: 1,
        format: "png",
      });

      // Then
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });
  });
});
