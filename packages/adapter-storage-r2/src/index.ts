import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { StorageAdapter } from "@pixengine/core";

export interface R2StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  baseUrl: string;
}

export class R2Storage implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private baseUrl: string;

  constructor(config: R2StorageConfig) {
    this.validateConfig(config);

    this.bucket = config.bucket;
    this.baseUrl = config.baseUrl.endsWith("/")
      ? config.baseUrl.slice(0, -1)
      : config.baseUrl;

    // R2 uses S3-compatible API with custom endpoint
    const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: "auto", // R2 uses 'auto' as region
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private validateConfig(config: R2StorageConfig): void {
    if (!config.accountId) {
      throw new Error("R2Storage: accountId is required");
    }
    if (!config.bucket) {
      throw new Error("R2Storage: bucket is required");
    }
    if (!config.baseUrl) {
      throw new Error("R2Storage: baseUrl is required");
    }
  }

  async put(args: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    meta: { width: number; height: number; format: string };
  }): Promise<{ url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: args.key,
      Body: args.bytes,
      ContentType: args.contentType,
    });

    await this.client.send(command);

    return { url: `${this.baseUrl}/${args.key}` };
  }
}
