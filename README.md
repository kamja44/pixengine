# 🌌 PixEngine

[English](README_EN.md) | [한국어](README_KR.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: Active Development](https://img.shields.io/badge/Status-Active%20Development-orange.svg)](#)

**PixEngine** is a high-performance, **policy-first image optimization engine** designed to optimize images through explicit orchestration. Unlike traditional "black-box" tools, PixEngine puts your business logic at the center of the image pipeline.

---

## 🔥 Why PixEngine?

- **Policy-First**: Decisions are driven by testable policies, not opaque configurations.
- **Explicit Orchestration**: You control _when_ and _how_ images are transformed and where they are stored.
- **Pluggable Architecture**: Easily swap storage providers (S3, Local) and processing engines (Sharp).
- **Zero-Vendor Lock-in**: Works with your existing infrastructure, no proprietary CDN required.

---

## 🏗️ Architecture at a Glance

```text
pixengine/
├─ packages/
│  ├─ core/                       # Brain: Policy evaluation & orchestration
│  ├─ adapter-engine-sharp/       # Sharp-based transformation engine
│  ├─ adapter-storage-local/      # Local filesystem storage
│  ├─ adapter-storage-s3/         # AWS S3 storage
│  ├─ adapter-storage-r2/         # Cloudflare R2 storage
│  ├─ adapter-storage-gcs/        # Google Cloud Storage
│  ├─ adapter-storage-azure/      # Azure Blob Storage
│  ├─ middleware-express/         # Express.js upload middleware
│  ├─ middleware-nextjs/          # Next.js App Router handler
│  └─ middleware-jit/             # On-demand (JIT) image transformation
└─ examples/                      # Reference implementations
```

---

## ⚙️ Core Concepts

1.  **Policies**: Code-based rules that inspect image metadata and decide which variants (sizes, formats) to generate.
2.  **Adapters**: Standardized interfaces for storage and engines, making the core logic infrastructure-agnostic.
3.  **Variants**: Managed versions of a single source image (e.g., `original`, `thumbnail.webp`, `banner.avif`).

---

## 🚀 Status & Roadmap

PixEngine is currently in **Active Development (Alpha)**.

- [x] Monorepo structure & Core orchestration
- [x] Sharp Engine Adapter
- [x] Storage Adapters (Local, S3, R2, GCS, Azure)
- [x] Express.js & Next.js Middleware
- [x] Rich Metadata Extraction & Policy Context
- [x] On-demand (JIT) Image Transformation Middleware
- [x] HTML `<picture>` Markup Generation
- [x] CI/CD (GitHub Actions)
- [x] Policy DSL Specification
- [x] CDN Integration & Cache Management
- [ ] **Secure URL Signing (HMAC)**
- [ ] **Observability (OpenTelemetry)**
- [ ] **React/Vue Components**

---

## 🤝 Community

For detailed documentation, please refer to:

- [English Documentation (Details)](README_EN.md)
- [한국어 문서 (상세)](README_KR.md)

---

## 📄 License

MIT © 2025 PixEngine Team
