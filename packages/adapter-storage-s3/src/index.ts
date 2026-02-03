import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { StorageAdapter } from "@pixengine/core";

export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  baseUrl: string;
}

export class S3Storage implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private baseUrl: string;

  constructor(config: S3StorageConfig) {
    this.validateConfig(config);

    this.bucket = config.bucket;
    this.baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl.slice(0, -1) : config.baseUrl;

    this.client = new S3Client({
      region: config.region,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    });
  }

  private validateConfig(config: S3StorageConfig): void {
    if (!config.bucket) {
      throw new Error("S3Storage: bucket is required");
    }
    if (!config.region) {
      throw new Error("S3Storage: region is required");
    }
    if (!config.baseUrl) {
      throw new Error("S3Storage: baseUrl is required");
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
