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
-   **`@pixengine/adapter-engine-*`**: Implementations for image processing (e.g., Sharp).
-   **`@pixengine/adapter-storage-*`**: Where the results live (Local, AWS S3, etc.).
-   **`@pixengine/middleware-*`**: Easy integration layers for your favorite frameworks.

---

## 🚀 Roadmap

### Phase 1: Foundation (Current)
- [x] Core Orchestration Logic
- [x] Sharp Engine Adapter
- [x] Local Storage Adapter
- [ ] Basic Policy DSL

### Phase 2: Ecosystem
- [ ] AWS S3 Storage Adapter
- [ ] Express.js / Next.js Middleware
- [ ] Metadata Extraction (EXIF, Color Palette)

### Phase 3: Advanced Optimization
- [ ] Smart Cropping (Face Detection)
- [ ] Image "Lighthouse" score prediction
- [ ] On-demand (JIT) delivery adapter

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
