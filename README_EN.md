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

-   **`@pixengine/core`**: The brain. Handles policy evaluation and orchestrates the adapters.
-   **`@pixengine/adapter-engine-sharp`**: Sharp-based image processing engine.
-   **`@pixengine/adapter-storage-local`**: Local filesystem storage.
-   **`@pixengine/adapter-storage-s3`**: AWS S3 storage.
-   **`@pixengine/adapter-storage-r2`**: Cloudflare R2 storage.
-   **`@pixengine/adapter-storage-gcs`**: Google Cloud Storage.
-   **`@pixengine/adapter-storage-azure`**: Azure Blob Storage.
-   **`@pixengine/middleware-express`**: Express.js middleware integration.
-   **`@pixengine/middleware-nextjs`**: Next.js App Router handler integration.

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
- [ ] Metadata Extraction (EXIF, Color Palette)

### Phase 3: Advanced Optimization
- [ ] Smart Cropping (Face Detection)
- [ ] Image "Lighthouse" score prediction
- [ ] On-demand (JIT) delivery adapter
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

A function that dynamically determines optimization strategy:

```typescript
type Policy = (ctx: {
  width: number;
  height: number;
  bytes: number;
  format: string;
}) => PolicyDecision;

type PolicyDecision = {
  variants: Array<{
    width: number;
    format: "webp" | "avif" | "jpeg" | "png";
    quality?: number;
  }>;
};
```

**Example: Dynamic Policy**

```typescript
const smartPolicy: Policy = (ctx) => {
  // Large images: Generate more variants
  if (ctx.width > 2000) {
    return {
      variants: [
        { width: 400, format: "webp" },
        { width: 800, format: "webp" },
        { width: 1200, format: "avif" },
      ],
    };
  }

  // Small images: Keep it simple
  return {
    variants: [
      { width: 400, format: "webp" },
    ],
  };
};
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

## 🤝 Contributing

We are in the early stages and would love your input on:
-   Policy DSL design
-   Adapter interface definitions
-   Real-world use cases

Please check `CONTRIBUTING.md` (coming soon) for more details.

---

## 📄 License

MIT © 2025 PixEngine Team
