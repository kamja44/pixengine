import { describe, it, expect, beforeEach, vi } from "vitest";
import { AzureStorage } from "../src/index.js";

vi.mock("@azure/storage-blob", () => {
  const mockUpload = vi.fn().mockResolvedValue({});

  class MockBlockBlobClient {
    upload = mockUpload;
    constructor() {}
  }

  class MockContainerClient {
    getBlockBlobClient = vi.fn(() => new MockBlockBlobClient());
    constructor() {}
  }

  class MockBlobServiceClient {
    getContainerClient = vi.fn(() => new MockContainerClient());
    constructor() {}
    static fromConnectionString = vi.fn(() => new MockBlobServiceClient());
  }

  return {
    BlobServiceClient: MockBlobServiceClient,
  };
});

describe("AzureStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should throw error if connectionString is not provided", () => {
      expect(
        () =>
          new AzureStorage({
            connectionString: "",
            containerName: "images",
            baseUrl: "https://myaccount.blob.core.windows.net/images",
          }),
      ).toThrow("AzureStorage: connectionString is required");
    });

    it("should throw error if containerName is not provided", () => {
      expect(
        () =>
          new AzureStorage({
            connectionString: "DefaultEndpointsProtocol=https;...",
            containerName: "",
            baseUrl: "https://myaccount.blob.core.windows.net/images",
          }),
      ).toThrow("AzureStorage: containerName is required");
    });

    it("should throw error if baseUrl is not provided", () => {
      expect(
        () =>
          new AzureStorage({
            connectionString: "DefaultEndpointsProtocol=https;...",
            containerName: "images",
            baseUrl: "",
          }),
      ).toThrow("AzureStorage: baseUrl is required");
    });

    it("should create instance with valid config", () => {
      const storage = new AzureStorage({
        connectionString: "DefaultEndpointsProtocol=https;...",
        containerName: "images",
        baseUrl: "https://myaccount.blob.core.windows.net/images",
      });
      expect(storage).toBeInstanceOf(AzureStorage);
    });
  });

  describe("put", () => {
    it("should upload file and return URL", async () => {
      const storage = new AzureStorage({
        connectionString: "DefaultEndpointsProtocol=https;...",
        containerName: "images",
        baseUrl: "https://myaccount.blob.core.windows.net/images",
      });

      const result = await storage.put({
        key: "uploads/test.jpg",
        bytes: new Uint8Array([1, 2, 3]),
        contentType: "image/jpeg",
        meta: { width: 800, height: 600, format: "jpeg" },
      });

      expect(result.url).toBe(
        "https://myaccount.blob.core.windows.net/images/uploads/test.jpg",
      );
    });

    it("should handle webp format", async () => {
      const storage = new AzureStorage({
        connectionString: "DefaultEndpointsProtocol=https;...",
        containerName: "images",
        baseUrl: "https://myaccount.blob.core.windows.net/images",
      });

      const result = await storage.put({
        key: "variants/photo_400w.webp",
        bytes: new Uint8Array([1, 2, 3]),
        contentType: "image/webp",
        meta: { width: 400, height: 300, format: "webp" },
      });

      expect(result.url).toBe(
        "https://myaccount.blob.core.windows.net/images/variants/photo_400w.webp",
      );
    });

    it("should handle custom baseUrl with CDN", async () => {
      const storage = new AzureStorage({
        connectionString: "DefaultEndpointsProtocol=https;...",
        containerName: "images",
        baseUrl: "https://cdn.example.com",
      });

      const result = await storage.put({
        key: "images/test.png",
        bytes: new Uint8Array([1, 2, 3]),
        contentType: "image/png",
        meta: { width: 1920, height: 1080, format: "png" },
      });

      expect(result.url).toBe("https://cdn.example.com/images/test.png");
    });
  });
});
