import { Storage } from "@google-cloud/storage";
import type { StorageAdapter } from "@pixengine/core";

export interface GCSStorageConfig {
  bucket: string;
  baseUrl: string;
  projectId?: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

export class GCSStorage implements StorageAdapter {
  private storage: Storage;
  private bucket: string;
  private baseUrl: string;

  constructor(config: GCSStorageConfig) {
    if (!config.bucket) {
      throw new Error("GCSStorage: bucket is required");
    }
    if (!config.baseUrl) {
      throw new Error("GCSStorage: baseUrl is required");
    }

    this.bucket = config.bucket;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");

    const storageConfig: {
      projectId?: string;
      keyFilename?: string;
      credentials?: { client_email: string; private_key: string };
    } = {};

    if (config.projectId) {
      storageConfig.projectId = config.projectId;
    }
    if (config.keyFilename) {
      storageConfig.keyFilename = config.keyFilename;
    }
    if (config.credentials) {
      storageConfig.credentials = config.credentials;
    }

    this.storage = new Storage(storageConfig);
  }

  async put(args: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    meta: { width: number; height: number; format: string };
  }): Promise<{ url: string }> {
    const bucket = this.storage.bucket(this.bucket);
    const file = bucket.file(args.key);

    await file.save(Buffer.from(args.bytes), {
      contentType: args.contentType,
      metadata: {
        metadata: {
          width: args.meta.width.toString(),
          height: args.meta.height.toString(),
          format: args.meta.format,
        },
      },
    });

    const url = `${this.baseUrl}/${args.key}`;
    return { url };
  }
}
