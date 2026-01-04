# @pixengine/adapter-storage-gcs

**English** | [한국어](README_KO.md)

Google Cloud Storage adapter for PixEngine.

## Installation

```bash
npm install @pixengine/adapter-storage-gcs @pixengine/core
# or
pnpm add @pixengine/adapter-storage-gcs @pixengine/core
# or
yarn add @pixengine/adapter-storage-gcs @pixengine/core
```

## Quick Start

```typescript
import { GCSStorage } from '@pixengine/adapter-storage-gcs';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new GCSStorage({
  bucket: 'my-images',
  baseUrl: 'https://storage.googleapis.com/my-images',
  projectId: 'my-project-id',
  keyFilename: '/path/to/service-account-key.json',
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
// https://storage.googleapis.com/my-images/variants/photo_400w.webp
```

## API

### `new GCSStorage(config)`

Creates a new Google Cloud Storage adapter instance.

#### Configuration

```typescript
interface GCSStorageConfig {
  bucket: string;              // Required: GCS bucket name
  baseUrl: string;             // Required: Base URL for generated URLs
  projectId?: string;          // Optional: GCP project ID
  keyFilename?: string;        // Optional: Path to service account key file
  credentials?: {              // Optional: Service account credentials
    client_email: string;
    private_key: string;
  };
}
```

**Required:**
- `bucket: string` - GCS bucket name where images will be stored
- `baseUrl: string` - Base URL for generating image URLs (GCS URL or CDN URL)

**Optional:**
- `projectId?: string` - Google Cloud project ID
- `keyFilename?: string` - Path to service account key JSON file
- `credentials?: object` - Service account credentials object (alternative to keyFilename)

#### Methods

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

Uploads a file to GCS and returns the public URL.

## Best Practices

### Use Environment Variables

Never hardcode credentials in your code:

```typescript
const storage = new GCSStorage({
  bucket: process.env.GCS_BUCKET!,
  baseUrl: process.env.GCS_BASE_URL!,
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILENAME,
});
```

For Google Cloud Storage setup, bucket creation, service accounts, IAM permissions, and CDN configuration, please refer to the [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)

## Error Handling

The adapter will throw errors in these cases:

- **Missing required config**: `bucket` or `baseUrl` not provided
- **GCS API errors**: Upload failures, authentication errors, permission errors, etc.

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
  console.error('GCS upload failed:', error);
}
```

## Requirements

- **Node.js**: >= 18.0.0
- **Google Cloud Account**: Required for GCS access
- **Google Cloud SDK**: @google-cloud/storage (included as dependency)
- **PixEngine Core**: @pixengine/core

## License

MIT © PixEngine Team
