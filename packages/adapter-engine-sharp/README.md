# @pixengine/adapter-engine-sharp

**English** | [한국어](README.ko.md)

Sharp-based image processing adapter for PixEngine.

## Installation

```bash
npm install @pixengine/adapter-engine-sharp sharp
# or
pnpm add @pixengine/adapter-engine-sharp sharp
# or
yarn add @pixengine/adapter-engine-sharp sharp
```

**Note:** `sharp` is a peer dependency and must be installed separately.

## Usage

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
      { width: 800, format: 'avif', quality: 85 },
    ],
  }),
  engine: new SharpEngine(), // ✨ Use Sharp for processing
  storage: new LocalStorage({
    baseDir: './uploads',
    baseUrl: 'https://example.com/uploads',
  }),
});
```

## Features

- ✨ **High Performance**: Built on [Sharp](https://sharp.pixelplumbing.com/), the fastest Node.js image processing library
- 🎨 **Multiple Formats**: WebP, AVIF, JPEG, PNG support
- 📏 **Smart Resizing**: Automatic aspect ratio preservation
- 🎛️ **Quality Control**: Per-format quality settings
- 🔍 **Metadata Extraction**: Probe image dimensions and format

## Supported Formats

### Input Formats

- JPEG
- PNG
- WebP
- AVIF
- GIF
- SVG
- TIFF

### Output Formats

- **WebP**: Modern format with excellent compression
- **AVIF**: Next-gen format with superior compression
- **JPEG**: Universal compatibility
- **PNG**: Lossless compression

## API

### `SharpEngine`

Implements the `TransformEngine` interface from `@pixengine/core`.

#### Methods

##### `probe(input: PixEngineInput)`

Extract image metadata without processing.

```typescript
const engine = new SharpEngine();
const metadata = await engine.probe({
  filename: 'photo.jpg',
  bytes: imageBuffer,
  contentType: 'image/jpeg',
});

console.log(metadata);
// { width: 1920, height: 1080, format: 'jpeg' }
```

##### `transform(args)`

Process and transform an image.

```typescript
const result = await engine.transform({
  input: {
    filename: 'photo.jpg',
    bytes: imageBuffer,
    contentType: 'image/jpeg',
  },
  width: 800,
  format: 'webp',
  quality: 80,
});

console.log(result);
// {
//   bytes: Uint8Array(...),
//   width: 800,
//   height: 450,
//   format: 'webp'
// }
```

**Parameters:**

- `input: PixEngineInput` - Source image
- `width?: number` - Target width (aspect ratio preserved)
- `height?: number` - Target height (aspect ratio preserved)
- `format?: 'webp' | 'avif' | 'jpeg' | 'png'` - Output format
- `quality?: number` - Quality (1-100)

## Performance

Sharp is built on libvips, which is 4-5x faster than ImageMagick and GraphicsMagick. It:

- Uses streaming and parallel processing
- Requires minimal memory
- Supports SIMD operations
- Is production-ready and battle-tested

## Requirements

- Node.js >= 18.0.0
- sharp >= 0.33.0

## License

MIT © PixEngine Team

## Links

- [PixEngine Core](https://www.npmjs.com/package/@pixengine/core)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [GitHub Repository](https://github.com/pixengine/pixengine)
- [Issue Tracker](https://github.com/pixengine/pixengine/issues)
