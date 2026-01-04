# @pixengine/adapter-storage-s3

**English** | [한국어](README_KO.md)

AWS S3 storage adapter for PixEngine.

## Installation

```bash
npm install @pixengine/adapter-storage-s3 @pixengine/core
# or
pnpm add @pixengine/adapter-storage-s3 @pixengine/core
# or
yarn add @pixengine/adapter-storage-s3 @pixengine/core
```

## Quick Start

```typescript
import { S3Storage } from '@pixengine/adapter-storage-s3';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new S3Storage({
  bucket: 'my-images',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: 'https://my-images.s3.amazonaws.com',
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
// https://my-images.s3.amazonaws.com/variants/photo_400w.webp
```

## API

### `new S3Storage(config)`

Creates a new S3 storage adapter instance.

#### Configuration

```typescript
interface S3StorageConfig {
  bucket: string;              // Required: S3 bucket name
  region: string;              // Required: AWS region (e.g., 'us-east-1')
  accessKeyId?: string;        // Optional: AWS access key ID
  secretAccessKey?: string;    // Optional: AWS secret access key
  baseUrl: string;             // Required: Base URL for generated URLs
}
```

**Required:**
- `bucket: string` - S3 bucket name where images will be stored
- `region: string` - AWS region (e.g., `'us-east-1'`, `'ap-northeast-2'`)
- `baseUrl: string` - Base URL for generating image URLs (S3 URL or CDN URL)

**Optional:**
- `accessKeyId?: string` - AWS access key ID (uses IAM role if not provided)
- `secretAccessKey?: string` - AWS secret access key (uses IAM role if not provided)

#### Methods

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

Uploads a file to S3 and returns the public URL.

## Best Practices

### Use Environment Variables

Never hardcode credentials in your code:

```typescript
const storage = new S3Storage({
  bucket: process.env.S3_BUCKET!,
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: process.env.S3_BASE_URL!,
});
```

For AWS setup, bucket policies, IAM roles, and CloudFront configuration, please refer to the [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

## Error Handling

The adapter will throw errors in these cases:

- **Missing required config**: `bucket`, `region`, or `baseUrl` not provided
- **AWS API errors**: S3 upload failures, authentication errors, etc.

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
  console.error('S3 upload failed:', error);
}
```

## Requirements

- **Node.js**: >= 18.0.0
- **AWS Account**: Required for S3 access
- **AWS SDK**: @aws-sdk/client-s3 (included as dependency)
- **PixEngine Core**: @pixengine/core

## License

MIT © PixEngine Team
