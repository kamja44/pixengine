# @pixengine/core

**English** | [한국어](README.ko.md)

Policy-based image optimization engine for modern web applications.

## Installation

```bash
npm install @pixengine/core
# or
pnpm add @pixengine/core
# or
yarn add @pixengine/core
```

## Quick Start

```typescript
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const manifest = await optimize({
  input: {
    filename: 'photo.jpg',
    bytes: imageBuffer,
    contentType: 'image/jpeg',
  },
  policy: (ctx) => ({
    variants: [
      { width: 400, format: 'webp', quality: 80 },
      { width: 800, format: 'webp', quality: 85 },
    ],
  }),
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './uploads',
    baseUrl: 'https://example.com/uploads',
  }),
});

console.log(manifest);
// {
//   original: { width: 1920, height: 1080, format: 'jpeg', bytes: 524288 },
//   variants: [
//     { key: 'variants/photo_400w.webp', url: '...', width: 400, ... },
//     { key: 'variants/photo_800w.webp', url: '...', width: 800, ... }
//   ]
// }
```

## Features

- 🎯 **Policy-First Architecture**: Define optimization strategies as executable functions
- 🔌 **Pluggable Adapters**: Swap engines and storage backends without code changes
- 📦 **Automatic Variant Management**: Generate multiple formats and sizes from single source
- 📊 **Comprehensive Metadata**: Full manifest with size, format, and URL information
- 🚀 **TypeScript Native**: Full type safety and IntelliSense support

## Core Concepts

### Policy

A policy is a function that determines what image variants to generate:

```typescript
import { Policy } from '@pixengine/core';

const responsivePolicy: Policy = (ctx) => {
  // ctx contains: width, height, bytes, format
  const variants = [];

  if (ctx.width > 1200) {
    variants.push({ width: 1200, format: 'webp', quality: 85 });
  }
  if (ctx.width > 800) {
    variants.push({ width: 800, format: 'webp', quality: 80 });
  }
  variants.push({ width: 400, format: 'webp', quality: 75 });

  return { variants };
};
```

### TransformEngine

Interface for image processing engines:

```typescript
interface TransformEngine {
  probe(input: PixEngineInput): Promise<{
    width: number;
    height: number;
    format: string;
  }>;

  transform(args: {
    input: PixEngineInput;
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
  }): Promise<{
    bytes: Uint8Array;
    width: number;
    height: number;
    format: string;
  }>;
}
```

### StorageAdapter

Interface for storage backends:

```typescript
interface StorageAdapter {
  put(args: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    meta: { width: number; height: number; format: string };
  }): Promise<{ url: string }>;
}
```

## API Reference

### `optimize(options)`

Main orchestration function.

**Parameters:**

- `input: PixEngineInput` - Source image data
  - `filename: string` - Original filename
  - `bytes: Uint8Array` - Image data
  - `contentType: string` - MIME type
- `policy: Policy` - Optimization strategy function
- `engine: TransformEngine` - Image processing engine
- `storage: StorageAdapter` - Storage backend

**Returns:** `Promise<Manifest>`

- `original` - Original image metadata
- `variants` - Array of generated variants with URLs

## Adapters

### Official Adapters

- [`@pixengine/adapter-engine-sharp`](https://www.npmjs.com/package/@pixengine/adapter-engine-sharp) - Sharp-based image processing
- [`@pixengine/adapter-storage-local`](https://www.npmjs.com/package/@pixengine/adapter-storage-local) - Local filesystem storage

### Coming Soon

- `@pixengine/adapter-storage-s3` - AWS S3 storage
- `@pixengine/middleware-express` - Express.js middleware
- `@pixengine/middleware-nextjs` - Next.js middleware

## Examples

See the [examples directory](https://github.com/pixengine/pixengine/tree/main/examples) for complete working examples.

## License

MIT © PixEngine Team

## Links

- [GitHub Repository](https://github.com/pixengine/pixengine)
- [Issue Tracker](https://github.com/pixengine/pixengine/issues)
- [Changelog](https://github.com/pixengine/pixengine/blob/main/CHANGELOG.md)
