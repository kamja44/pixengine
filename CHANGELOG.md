# Changelog

## 0.3.0 (2026-02-04)

### 🚀 Features

- **Security**: URL Signing (HMAC) support for preventing unauthorized transformations.
- **Monitoring**: OpenTelemetry tracing integration for performance monitoring.
- **UI Components**: New `@pixengine/react` package with `<PixImage />` component.
- **Documentation**: Comprehensive guides and API docs in `@pixengine/docs`.

### 📦 Packages

- Updated all packages to v0.2.0

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-03

### Added

#### Core Features

- **Policy-based image optimization engine** (`@pixengine/core`)
  - `optimize()` function for orchestrating image processing pipeline
  - Policy evaluation system for dynamic optimization strategies
  - Support for multiple variant generation from single source
  - Manifest generation with comprehensive metadata
  - Full TypeScript support with type definitions

#### Adapters

- **SharpEngine adapter** (`@pixengine/adapter-engine-sharp`)
  - `probe()` method for image metadata extraction
  - `transform()` method for image processing
  - Support for WebP, AVIF, JPEG, PNG formats
  - Intelligent resizing with aspect ratio preservation
  - Quality control per format

- **LocalStorage adapter** (`@pixengine/adapter-storage-local`)
  - `put()` method for local filesystem storage
  - Automatic nested directory creation
  - URL generation for stored images
  - Configurable base directory and URL

#### Development

- **Comprehensive test suite**
  - Unit tests for all core components
  - E2E integration tests
  - TDD methodology throughout development
  - 100% test coverage for critical paths

- **Documentation**
  - Quick Start guide (Korean)
  - Comprehensive API documentation
  - Working examples
    - Basic usage example
    - Multiple format generation
    - Dynamic policy demonstration
  - Installation guide

- **Examples**
  - `examples/basic.ts` - Simple optimization workflow
  - `examples/multiple-formats.ts` - Multi-format variant generation
  - `examples/dynamic-policy.ts` - Context-aware optimization

### Features

- 🎯 **Policy-First Architecture**: Define optimization strategies as executable functions
- 🔌 **Pluggable Adapters**: Swap engines and storage backends without code changes
- 📦 **Automatic Variant Management**: Generate multiple formats and sizes from single source
- 🧪 **TDD Development**: Full test coverage ensures reliability
- 📚 **Complete Documentation**: Quick start guides and API references
- 🚀 **Production Ready**: Tested, documented, and ready for real-world use

### Technical Details

- **Language**: TypeScript 5.9.3
- **Build System**: TypeScript Compiler
- **Package Manager**: pnpm 10.0.0 (workspace)
- **Module System**: ESM (ES Modules)
- **Testing**: Vitest
- **Image Processing**: Sharp 0.33.0

### Package Information

This release includes three npm packages:

- `@pixengine/core@0.1.0`
- `@pixengine/adapter-engine-sharp@0.1.0`
- `@pixengine/adapter-storage-local@0.1.0`

### Installation

```bash
pnpm add @pixengine/core @pixengine/adapter-engine-sharp @pixengine/adapter-storage-local
```

### Breaking Changes

None (initial release)

### Known Limitations

- S3 storage adapter not yet available
- Express/Next.js middleware not yet available
- No built-in caching mechanism
- Single-threaded processing (no worker pool)

### Credits

Developed with TDD methodology following Kent Beck principles.

## [0.2.0] - 2025-02-04

### Added

#### New Ecosystem Packages

- **Cloud Storage Adapters**
  - `@pixengine/adapter-storage-s3` (AWS S3)
  - `@pixengine/adapter-storage-r2` (Cloudflare R2)
  - `@pixengine/adapter-storage-gcs` (Google Cloud Storage)
  - `@pixengine/adapter-storage-azure` (Azure Blob Storage)
- **Framework Middleware**
  - `@pixengine/middleware-express`: Seamless integration with Express.js applications
  - `@pixengine/middleware-nextjs`: Next.js App Router API handler integration
- **On-Demand Transformation**
  - `@pixengine/middleware-jit`: "Just-In-Time" transformation middleware for on-the-fly image processing

#### Core Enhancements

- **Rich Metadata Extraction**: `ImageMetadata` interface used in PolicyContext now includes:
  - Color space information
  - Alpha channel presence
  - Pixel density (DPI)
  - EXIF data
- **HTML Helper**: `generatePicture()` function to create responsive `<picture>` tags from manifests
- **Expanded Policy Context**: Policy functions now receive filename and contentType

#### Developer Experience

- **CI/CD Pipelines**: Automated GitHub Actions for testing and publishing
- Code quality tooling with ESLint and Prettier
- Benchmarking suite for compression quality analysis

### Changed

- Updated `PolicyContext` signature to include `metadata` object

## [Unreleased]

### Planned

- Smart cropping (Face Detection)
- Image "Lighthouse" score prediction
- CDN Integration & Cache Management
- Worker pool for parallel processing (if needed)

### Roadmap

See [README.md](README.md#roadmap) for full roadmap.
