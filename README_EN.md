# 🌌 PixEngine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: Active Development](https://img.shields.io/badge/Status-Active%20Development-orange.svg)](#)

**PixEngine** is a high-performance, **policy-first image optimization engine** designed for modern web applications. It empowers developers to orchestrate image processing through explicit logic rather than relying on black-box defaults.

> "Optimization is not just about making pixels smaller; it's about making decisions based on context."

---

## 🗺️ Table of Contents
- [Core Philosophy](#-core-philosophy)
- [How It Works](#%EF%B8%8F-how-it-works)
- [Key Features](#-key-features)
- [Policy-First Approach](#-policy-first-approach)
- [Architecture](#-architecture)
- [Benchmarks](#-benchmarks)
- [Roadmap](#-roadmap)
- [Getting Started](#-getting-started)

---

## 💡 Core Philosophy

Most image optimization tools focus solely on the *how* (the compression algorithm). PixEngine focuses on the **When, Why, and Where**.

1.  **Policy over Config**: Decisions are made by evaluatable policies, not static config files.
2.  **Explicit Orchestration**: Every variant, every resize, and every format change is a result of a conscious policy decision.
3.  **Infrastructure Agnostic**: Whether you use S3, local storage, Sharp, or a cloud engine, PixEngine glues them together seamlessly.

---

## ⚙️ How It Works

PixEngine operates as a pipeline governed by your policies.

```text
[ Raw Image ] ───▶ [ Policy Evaluator ] ───▶ [ Transformation Engine ] ───▶ [ Storage Adapter ]
      │                    │                         │                         │
  User Upload        Does it need            Sharp / Libvips /           Local / S3 /
  or Fetch           thumbnails?             WebP conversion             Cloudinary
```

1.  **Ingestion**: An image enters the system.
2.  **Evaluation**: PixEngine runs the image through your `Policy`.
3.  **Execution**: The `Engine Adapter` performs transformations (resize, convert, etc.) based on the evaluation result.
4.  **Persistence**: The `Storage Adapter` saves the original and any generated variants.
5.  **Manifesting**: A JSON manifest is returned, describing all created versions and their metadata.

---

## ✨ Key Features

-   **🎯 Precision Optimization**: Apply different rules for different categories (e.g., "User Avatar" vs "Product Gallery").
-   **🔌 Plug-and-Play**: Swap out Sharp for another engine, or Local Storage for S3, without changing your business logic.
-   **📦 Variant Management**: Automatically manage multiple formats (WebP, AVIF) and sizes for every image.
-   **🛠️ Framework Ready**: Built-in support for Express and Next.js, but usable in any Node.js environment.

---

## 📜 Policy-First Approach

In PixEngine, a **Policy** is a first-class citizen. It's where your business logic lives.

### Example Policy Logic
```typescript
// A conceptual look at a PixEngine Policy
const ProductImagePolicy = {
  name: "product-gallery",
  onUpload: (image) => {
    return {
      variants: [
        { suffix: "thumb", width: 200, format: "webp" },
        { suffix: "large", width: 1200, format: "avif" }
      ],
      stripMetadata: true,
      quality: image.size > 1024 * 1024 ? 75 : 85 // Dynamic quality based on size
    };
  }
};
```

---

## 🏗️ Architecture

The repository is structured as a monorepo to ensure clean boundaries:

-   **`@pixengine/core`**: The brain. Handles policy evaluation, orchestration, and HTML markup generation.
-   **`@pixengine/adapter-engine-sharp`**: Sharp-based image processing engine with rich metadata extraction.
-   **`@pixengine/adapter-storage-local`**: Local filesystem storage.
-   **`@pixengine/adapter-storage-s3`**: AWS S3 storage.
-   **`@pixengine/adapter-storage-r2`**: Cloudflare R2 storage.
-   **`@pixengine/adapter-storage-gcs`**: Google Cloud Storage.
-   **`@pixengine/adapter-storage-azure`**: Azure Blob Storage.
-   **`@pixengine/middleware-express`**: Express.js upload middleware integration.
-   **`@pixengine/middleware-nextjs`**: Next.js App Router handler integration.
-   **`@pixengine/middleware-jit`**: On-demand (JIT) image transformation middleware.

---

## 📊 Benchmarks

PixEngine achieves **79.4% average file size reduction** across comprehensive testing.

### Quick Results
- **WebP**: 84.5% average reduction (best all-around)
- **AVIF**: 83.0% average reduction (excellent for gradients)
- **Thumbnails (200px)**: 96.1% reduction
- **Quality Sweet Spot**: 70-85 for optimal balance

**For detailed benchmarks, methodology, and format comparisons**: See [**Benchmarks Documentation**](docs/BENCHMARKS.md)

---

## 🚀 Roadmap

### Phase 1: Foundation ✅ Completed
- [x] Core Orchestration Logic
- [x] Sharp Engine Adapter
- [x] Local Storage Adapter
- [x] TDD-based Development & E2E Tests

### Phase 2: Ecosystem ✅ Completed
- [x] Cloud Storage Adapters (AWS S3, Cloudflare R2, Google Cloud Storage, Azure Blob Storage)
- [x] Express.js Middleware
- [x] Next.js App Router Handler
- [x] Rich Metadata Extraction (color space, alpha, density, EXIF)
- [x] Extended Policy Context (filename, contentType, metadata)

### Phase 3: Developer Experience ✅ Completed
- [x] On-demand (JIT) image transformation middleware
- [x] HTML `<picture>` markup generation (`generatePicture()`)
- [x] CI/CD with GitHub Actions
- [x] ESLint + Prettier code quality tooling

### Phase 4: Advanced Optimization
- [ ] Smart Cropping (Face Detection)
- [ ] Image "Lighthouse" score prediction
- [ ] CDN Integration & Cache Management

---

## 🚀 Getting Started

### Installation

```bash
# Using pnpm workspace (monorepo)
pnpm install
```

### Quick Start

```typescript
import { optimize } from "@pixengine/core";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";
import { readFile } from "fs/promises";

// Load image
const imageBytes = await readFile("./photo.jpg");

// Run optimization
const manifest = await optimize({
  input: {
    filename: "photo.jpg",
    bytes: new Uint8Array(imageBytes),
    contentType: "image/jpeg",
  },

  // Policy: Generate 2 WebP variants
  policy: () => ({
    variants: [
      { width: 200, format: "webp", quality: 80 },  // Thumbnail
      { width: 800, format: "webp", quality: 85 },  // Medium size
    ],
  }),

  // Use Sharp engine
  engine: new SharpEngine(),

  // Save to local filesystem
  storage: new LocalStorage({
    baseDir: "./uploads",
    baseUrl: "http://localhost:3000/images",
  }),
});

console.log(manifest);
// {
//   original: { width: 1920, height: 1080, format: "jpeg", bytes: 245678 },
//   variants: [
//     { key: "variants/photo_200w.webp", url: "...", width: 200, height: 112, ... },
//     { key: "variants/photo_800w.webp", url: "...", width: 800, height: 450, ... }
//   ]
// }
```

---

## 📚 API Documentation

### `optimize(options)`

Executes the image optimization pipeline.

**Parameters:**
- `input: PixEngineInput` - Input image
  - `filename: string` - File name
  - `bytes: Uint8Array` - Image byte data
  - `contentType: string` - MIME type
- `policy: Policy` - Optimization policy function
- `engine: TransformEngine` - Image processing engine
- `storage: StorageAdapter` - Storage adapter

**Returns:** `Promise<Manifest>`
- `original` - Original image metadata
- `variants` - List of generated variants

### Policy

A function that dynamically determines optimization strategy. Receives full image context including metadata:

```typescript
type PolicyContext = {
  width: number;
  height: number;
  bytes: number;
  format: string;
  filename: string;
  contentType: string;
  metadata: ImageMetadata; // Rich metadata from engine (space, hasAlpha, density, exif, etc.)
};

type Policy = (ctx: PolicyContext) => PolicyDecision;

type PolicyDecision = {
  variants: Array<{
    width: number;
    format: "webp" | "avif" | "jpeg" | "png";
    quality?: number;
  }>;
};
```

**Example: Content-Aware Policy**

```typescript
const smartPolicy: Policy = (ctx) => {
  // Transparent images: Use PNG to preserve alpha
  if (ctx.metadata.hasAlpha) {
    return {
      variants: [
        { width: 400, format: "png" },
        { width: 800, format: "png" },
      ],
    };
  }

  // Large photos: Generate multiple modern formats
  if (ctx.width > 2000) {
    return {
      variants: [
        { width: 400, format: "webp", quality: 80 },
        { width: 800, format: "webp", quality: 80 },
        { width: 400, format: "avif", quality: 70 },
        { width: 800, format: "avif", quality: 70 },
      ],
    };
  }

  // Small images: Keep it simple
  return {
    variants: [{ width: 400, format: "webp" }],
  };
};
```

### `generatePicture(manifest, options)`

Converts a `Manifest` into a responsive `<picture>` HTML string.

**Parameters:**
- `manifest: Manifest` - Result from `optimize()`
- `options: PictureOptions`
  - `alt: string` - Alt text (required)
  - `sizes?: string` - Responsive sizes attribute
  - `className?: string` - CSS class name
  - `loading?: "lazy" | "eager"` - Loading strategy (default: `"lazy"`)
  - `decoding?: "async" | "sync" | "auto"` - Decoding hint (default: `"async"`)
  - `fallbackFormat?: string` - Format for `<img>` fallback

**Returns:** `string` (HTML)

```typescript
import { optimize, generatePicture } from "@pixengine/core";

const manifest = await optimize({ /* ... */ });

const html = generatePicture(manifest, {
  alt: "Product photo",
  sizes: "(max-width: 800px) 100vw, 800px",
  className: "product-image",
});

// Output:
// <picture>
//   <source type="image/avif" srcset="/img/photo_400w.avif 400w, /img/photo_800w.avif 800w" sizes="...">
//   <source type="image/webp" srcset="/img/photo_400w.webp 400w, /img/photo_800w.webp 800w" sizes="...">
//   <img src="/img/photo_800w.jpeg" srcset="..." alt="Product photo" loading="lazy" ...>
// </picture>
```

### Adapters

#### SharpEngine

Sharp library-based image processing:

```typescript
import { SharpEngine } from "@pixengine/adapter-engine-sharp";

const engine = new SharpEngine();
```

**Supported Formats:** WebP, AVIF, JPEG, PNG

#### LocalStorage

Local filesystem storage:

```typescript
import { LocalStorage } from "@pixengine/adapter-storage-local";

const storage = new LocalStorage({
  baseDir: "./public/uploads",
  baseUrl: "https://example.com/uploads",
});
```

---

## 🧪 Compression Quality Tests

We conducted comprehensive tests with 20 different image types to validate real-world compression quality. The tests intentionally include the **hardest-to-compress elements**: dense text, UI components, smooth gradients, and fine-grained details.

### Test Methodology

1. **Image Generation**: Created 20 test images covering various scenarios:
   - Text-heavy images (5 images)
   - UI/Icons (5 images)
   - Gradients (5 images)
   - Detail/Texture images (5 images)

2. **Format Testing**: Each image tested in both JPG and PNG formats

3. **Output Formats**: Converted to WebP and AVIF at quality 80

4. **Real Package Testing**: Used published npm packages (`@pixengine/core`, `@pixengine/adapter-engine-sharp`, `@pixengine/adapter-storage-local`)

### Key Results

#### Average Compression Rates
- **JPG → WebP**: 86.3% reduction
- **JPG → AVIF**: 87.2% reduction
- **PNG → WebP**: 68.0% reduction
- **PNG → AVIF**: 76.6% reduction

#### Best Performance by Image Type

| Image Type | Best Format | Avg Compression | Use Case |
|------------|-------------|-----------------|----------|
| **Text-Heavy** | WebP | 68-80% | Documentation, articles, text overlays |
| **UI/Icons** | WebP | 76-82% | Buttons, icons, interface elements |
| **Gradients** | AVIF | 89-97% | Backgrounds, hero sections, sky |
| **Detail/Texture** | AVIF | 83-98% | Photos, nature, complex patterns |
| **Mixed Content** | AVIF | 85-93% | Landing pages, cards with images+text |

### Format Recommendations

#### When to use WebP:
- ✅ Text-heavy images with sharp edges
- ✅ UI components and icons
- ✅ Images requiring pixel-perfect text
- ✅ Scenarios needing broader browser support

**Why:** WebP excels at preserving text clarity and sharp edges with minimal artifacts.

#### When to use AVIF:
- ✅ Photographs and natural images
- ✅ Smooth gradients and backgrounds
- ✅ Images without critical text
- ✅ Maximum compression priority

**Why:** AVIF provides superior gradient handling and better compression for photographic content.

### Extreme Test Case

The **extreme-test** image (combining TEXT + UI + GRADIENT + DETAIL):
- Original JPG: 104.0 KB → WebP: 6.8 KB (**93.4% reduction**)
- Original PNG: 50.5 KB → WebP: 6.8 KB (**86.6% reduction**)

Even under this extreme scenario, the optimized images retain strong perceptual quality with **no visible blocking, ringing, or color banding**.

### Policy-First Advantage in Action

PixEngine's policy-first approach allows you to apply different strategies based on image characteristics:

```typescript
const smartPolicy = (ctx) => {
  // Text/UI-heavy images: Use WebP
  if (ctx.filename.includes('ui') || ctx.filename.includes('text')) {
    return {
      variants: [
        { width: 800, format: "webp", quality: 85 }
      ]
    };
  }

  // Photos and gradients: Use AVIF
  if (ctx.filename.includes('photo') || ctx.filename.includes('gradient')) {
    return {
      variants: [
        { width: 800, format: "avif", quality: 80 }
      ]
    };
  }

  // Mixed content: Generate both
  return {
    variants: [
      { width: 800, format: "webp", quality: 85 },
      { width: 800, format: "avif", quality: 80 }
    ]
  };
};
```

### Important Note

While our tests show excellent results for lossy compression, **images with dense UI/text are preserved well, though lossless formats (PNG) are still recommended when pixel-perfect fidelity is absolutely required** (e.g., design mockups, technical diagrams).

> 📊 **Full Test Results**: See detailed compression data in [docs/tests/compression-quality/results/TEST_RESULTS.md](docs/tests/compression-quality/results/TEST_RESULTS.md)

---

## 🤝 Contributing

We are in the early stages and would love your input on:
-   Policy DSL design
-   Adapter interface definitions
-   Real-world use cases

Please check `CONTRIBUTING.md` (coming soon) for more details.

---

## 📄 License

MIT © 2025 PixEngine Team
