import { describe, it, expect } from "vitest";
import { generatePicture } from "../src/index.js";
import type { Manifest } from "../src/index.js";

describe("generatePicture()", () => {
  const baseManifest: Manifest = {
    original: { width: 1200, height: 800, format: "jpeg", bytes: 50000 },
    variants: [
      {
        key: "variants/photo_400w.webp",
        url: "/images/photo_400w.webp",
        width: 400,
        height: 267,
        format: "webp",
        bytes: 5000,
      },
      {
        key: "variants/photo_800w.webp",
        url: "/images/photo_800w.webp",
        width: 800,
        height: 533,
        format: "webp",
        bytes: 10000,
      },
      {
        key: "variants/photo_400w.jpeg",
        url: "/images/photo_400w.jpeg",
        width: 400,
        height: 267,
        format: "jpeg",
        bytes: 8000,
      },
      {
        key: "variants/photo_800w.jpeg",
        url: "/images/photo_800w.jpeg",
        width: 800,
        height: 533,
        format: "jpeg",
        bytes: 15000,
      },
    ],
  };

  it("should generate <picture> with <source> and <img>", () => {
    const html = generatePicture(baseManifest, { alt: "A photo" });

    expect(html).toContain("<picture>");
    expect(html).toContain("</picture>");
    expect(html).toContain("<source");
    expect(html).toContain("<img");
  });

  it("should use webp as <source> and jpeg as <img> fallback", () => {
    const html = generatePicture(baseManifest, { alt: "A photo" });

    expect(html).toContain('type="image/webp"');
    expect(html).toContain('src="/images/photo_800w.jpeg"');
  });

  it("should generate srcset with width descriptors", () => {
    const html = generatePicture(baseManifest, { alt: "A photo" });

    expect(html).toContain("/images/photo_400w.webp 400w");
    expect(html).toContain("/images/photo_800w.webp 800w");
    expect(html).toContain("/images/photo_400w.jpeg 400w");
    expect(html).toContain("/images/photo_800w.jpeg 800w");
  });

  it("should include sizes attribute when provided", () => {
    const html = generatePicture(baseManifest, {
      alt: "A photo",
      sizes: "(max-width: 800px) 100vw, 800px",
    });

    expect(html).toContain('sizes="(max-width: 800px) 100vw, 800px"');
  });

  it("should include className as class attribute", () => {
    const html = generatePicture(baseManifest, {
      alt: "A photo",
      className: "hero-image",
    });

    expect(html).toContain('class="hero-image"');
  });

  it("should default to lazy loading and async decoding", () => {
    const html = generatePicture(baseManifest, { alt: "A photo" });

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });

  it("should allow overriding loading and decoding", () => {
    const html = generatePicture(baseManifest, {
      alt: "A photo",
      loading: "eager",
      decoding: "sync",
    });

    expect(html).toContain('loading="eager"');
    expect(html).toContain('decoding="sync"');
  });

  it("should include width and height from original for CLS prevention", () => {
    const html = generatePicture(baseManifest, { alt: "A photo" });

    expect(html).toContain('width="1200"');
    expect(html).toContain('height="800"');
  });

  it("should respect fallbackFormat option", () => {
    const html = generatePicture(baseManifest, {
      alt: "A photo",
      fallbackFormat: "webp",
    });

    // webp should be in <img>, jpeg should be in <source>
    expect(html).toContain('type="image/jpeg"');
    expect(html).toContain('src="/images/photo_800w.webp"');
  });

  it("should order source formats by priority (avif > webp)", () => {
    const manifest: Manifest = {
      original: { width: 1200, height: 800, format: "jpeg", bytes: 50000 },
      variants: [
        {
          key: "v/photo_400w.avif",
          url: "/img/photo_400w.avif",
          width: 400,
          height: 267,
          format: "avif",
          bytes: 3000,
        },
        {
          key: "v/photo_400w.webp",
          url: "/img/photo_400w.webp",
          width: 400,
          height: 267,
          format: "webp",
          bytes: 5000,
        },
        {
          key: "v/photo_400w.jpeg",
          url: "/img/photo_400w.jpeg",
          width: 400,
          height: 267,
          format: "jpeg",
          bytes: 8000,
        },
      ],
    };

    const html = generatePicture(manifest, { alt: "A photo" });

    const avifPos = html.indexOf('type="image/avif"');
    const webpPos = html.indexOf('type="image/webp"');
    expect(avifPos).toBeLessThan(webpPos);
  });

  it("should return plain <img> when only one format exists", () => {
    const manifest: Manifest = {
      original: { width: 800, height: 600, format: "jpeg", bytes: 10000 },
      variants: [
        {
          key: "v/photo_400w.jpeg",
          url: "/img/photo_400w.jpeg",
          width: 400,
          height: 300,
          format: "jpeg",
          bytes: 5000,
        },
      ],
    };

    const html = generatePicture(manifest, { alt: "Single format" });

    expect(html).not.toContain("<picture>");
    expect(html).toContain("<img");
    expect(html).toContain('src="/img/photo_400w.jpeg"');
  });

  it("should return minimal <img> when no variants exist", () => {
    const manifest: Manifest = {
      original: { width: 800, height: 600, format: "jpeg", bytes: 10000 },
      variants: [],
    };

    const html = generatePicture(manifest, { alt: "No variants" });

    expect(html).toContain("<img");
    expect(html).toContain('alt="No variants"');
    expect(html).not.toContain("<picture>");
  });

  it("should sort variants by width within srcset", () => {
    const manifest: Manifest = {
      original: { width: 1200, height: 800, format: "jpeg", bytes: 50000 },
      variants: [
        {
          key: "v/photo_800w.webp",
          url: "/img/photo_800w.webp",
          width: 800,
          height: 533,
          format: "webp",
          bytes: 10000,
        },
        {
          key: "v/photo_200w.webp",
          url: "/img/photo_200w.webp",
          width: 200,
          height: 133,
          format: "webp",
          bytes: 2000,
        },
        {
          key: "v/photo_400w.webp",
          url: "/img/photo_400w.webp",
          width: 400,
          height: 267,
          format: "webp",
          bytes: 5000,
        },
      ],
    };

    const html = generatePicture(manifest, { alt: "Sorted" });

    // Verify order: 200w before 400w before 800w
    const srcsetMatch = html.match(/srcset="([^"]+)"/);
    expect(srcsetMatch).toBeTruthy();
    const srcset = srcsetMatch![1];
    const widths = srcset.split(", ").map((s) => parseInt(s.split(" ")[1]));
    expect(widths).toEqual([200, 400, 800]);
  });
});
