# @pixengine/adapter-storage-azure

**English** | [한국어](README_KO.md)

Azure Blob Storage adapter for PixEngine.

## Installation

```bash
npm install @pixengine/adapter-storage-azure @pixengine/core
# or
pnpm add @pixengine/adapter-storage-azure @pixengine/core
# or
yarn add @pixengine/adapter-storage-azure @pixengine/core
```

## Quick Start

```typescript
import { AzureStorage } from '@pixengine/adapter-storage-azure';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new AzureStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
  containerName: 'my-images',
  baseUrl: 'https://myaccount.blob.core.windows.net/my-images',
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
// https://myaccount.blob.core.windows.net/my-images/variants/photo_400w.webp
```

## API

### `new AzureStorage(config)`

Creates a new Azure Blob Storage adapter instance.

#### Configuration

```typescript
interface AzureStorageConfig {
  connectionString: string;    // Required: Azure Storage connection string
  containerName: string;       // Required: Blob container name
  baseUrl: string;             // Required: Base URL for generated URLs
}
```

**Required:**
- `connectionString: string` - Azure Storage account connection string
- `containerName: string` - Blob container name where images will be stored
- `baseUrl: string` - Base URL for generating image URLs (Blob Storage URL or CDN URL)

#### Methods

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

Uploads a file to Azure Blob Storage and returns the public URL.

## Best Practices

### Use Environment Variables

Never hardcode credentials in your code:

```typescript
const storage = new AzureStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
  containerName: process.env.AZURE_CONTAINER_NAME!,
  baseUrl: process.env.AZURE_BASE_URL!,
});
```

For Azure Blob Storage setup, container creation, access keys, SAS tokens, and CDN configuration, please refer to the [Azure Blob Storage Documentation](https://docs.microsoft.com/azure/storage/blobs/)

## Error Handling

The adapter will throw errors in these cases:

- **Missing required config**: `connectionString`, `containerName`, or `baseUrl` not provided
- **Azure API errors**: Upload failures, authentication errors, permission errors, etc.

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
  console.error('Azure upload failed:', error);
}
```

## Requirements

- **Node.js**: >= 18.0.0
- **Azure Account**: Required for Blob Storage access
- **Azure SDK**: @azure/storage-blob (included as dependency)
- **PixEngine Core**: @pixengine/core

## License

MIT © PixEngine Team
