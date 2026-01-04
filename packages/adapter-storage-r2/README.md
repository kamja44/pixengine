# @pixengine/adapter-storage-r2

**English** | [한국어](README_KO.md)

Cloudflare R2 storage adapter for PixEngine.

## Installation

```bash
npm install @pixengine/adapter-storage-r2 @pixengine/core
# or
pnpm add @pixengine/adapter-storage-r2 @pixengine/core
# or
yarn add @pixengine/adapter-storage-r2 @pixengine/core
```

## Quick Start

```typescript
import { R2Storage } from '@pixengine/adapter-storage-r2';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new R2Storage({
  accountId: 'your-account-id',
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucket: 'my-images',
  baseUrl: 'https://pub-xxxxx.r2.dev',
});

const engine = new SharpEngine();

const manifest = await optimize({
  input: {
    filename: 'photo.jpg',
    bytes: imageBytes,
    contentType: 'image/jpeg',
  },
  policy: (ctx) => ({
    variants: [
      { width: 400, format: 'webp', quality: 80 },
      { width: 800, format: 'webp', quality: 85 },
    ],
  }),
  engine,
  storage,
});

console.log(manifest.variants[0].url);
// https://pub-xxxxx.r2.dev/variants/photo_400w.webp
```

## API

### `new R2Storage(config)`

Creates a new R2 storage adapter instance.

#### Configuration

```typescript
interface R2StorageConfig {
  accountId: string;           // Required: Cloudflare account ID
  accessKeyId: string;         // Required: R2 access key ID
  secretAccessKey: string;     // Required: R2 secret access key
  bucket: string;              // Required: R2 bucket name
  baseUrl: string;             // Required: Base URL for generated URLs
}
```

**Required:**
- `accountId: string` - Your Cloudflare account ID
- `accessKeyId: string` - R2 API token access key ID
- `secretAccessKey: string` - R2 API token secret access key
- `bucket: string` - R2 bucket name where images will be stored
- `baseUrl: string` - Base URL for generating image URLs (R2.dev domain or custom domain)

#### Methods

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

Uploads a file to R2 and returns the public URL.

## Best Practices

### Use Environment Variables

Never hardcode credentials:

```typescript
const storage = new R2Storage({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucket: process.env.R2_BUCKET!,
  baseUrl: process.env.R2_BASE_URL!,
});
```

For Cloudflare R2 setup, bucket creation, API tokens, public access, and custom domains, please refer to the [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

## Error Handling

The adapter will throw errors in these cases:

- **Missing required config**: `accountId`, `bucket`, or `baseUrl` not provided
- **R2 API errors**: Upload failures, authentication errors, etc.

```typescript
try {
  const result = await storage.put({
    key: 'uploads/image.jpg',
    bytes: imageBytes,
    contentType: 'image/jpeg',
    meta: { width: 1920, height: 1080, format: 'jpeg' },
  });
  console.log('Uploaded:', result.url);
} catch (error) {
  console.error('R2 upload failed:', error);
}
```

## Requirements

- **Node.js**: >= 18.0.0
- **Cloudflare Account**: Required for R2 access
- **AWS SDK**: @aws-sdk/client-s3 (included as dependency)
- **PixEngine Core**: @pixengine/core

## License

MIT © PixEngine Team
