import { BlobServiceClient } from "@azure/storage-blob";
import type { StorageAdapter } from "@pixengine/core";

export interface AzureStorageConfig {
  connectionString: string;
  containerName: string;
  baseUrl: string;
}

export class AzureStorage implements StorageAdapter {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;
  private baseUrl: string;

  constructor(config: AzureStorageConfig) {
    if (!config.connectionString) {
      throw new Error("AzureStorage: connectionString is required");
    }
    if (!config.containerName) {
      throw new Error("AzureStorage: containerName is required");
    }
    if (!config.baseUrl) {
      throw new Error("AzureStorage: baseUrl is required");
    }

    this.containerName = config.containerName;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
  }

  async put(args: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    meta: { width: number; height: number; format: string };
  }): Promise<{ url: string }> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(args.key);

    await blockBlobClient.upload(args.bytes, args.bytes.length, {
      blobHTTPHeaders: {
        blobContentType: args.contentType,
      },
      metadata: {
        width: args.meta.width.toString(),
        height: args.meta.height.toString(),
        format: args.meta.format,
      },
    });

    const url = `${this.baseUrl}/${args.key}`;
    return { url };
  }
}
