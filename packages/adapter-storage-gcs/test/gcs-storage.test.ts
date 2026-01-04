import { describe, it, expect, beforeEach, vi } from "vitest";
import { GCSStorage } from "../src/index.js";

vi.mock("@google-cloud/storage", () => {
  const mockSave = vi.fn().mockResolvedValue([]);
  const mockFile = vi.fn(() => ({
    save: mockSave,
  }));
  const mockBucket = vi.fn(() => ({
    file: mockFile,
  }));

  class MockStorage {
    bucket = mockBucket;
    constructor() {}
  }

  return {
    Storage: MockStorage,
  };
});

describe("GCSStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should throw error if bucket is not provided", () => {
      expect(
        () =>
          new GCSStorage({
            bucket: "",
            baseUrl: "https://storage.googleapis.com/my-bucket",
          }),
      ).toThrow("GCSStorage: bucket is required");
    });

    it("should throw error if baseUrl is not provided", () => {
      expect(
        () =>
          new GCSStorage({
            bucket: "my-bucket",
            baseUrl: "",
          }),
      ).toThrow("GCSStorage: baseUrl is required");
    });

    it("should create instance with valid config", () => {
      const storage = new GCSStorage({
        bucket: "my-bucket",
        baseUrl: "https://storage.googleapis.com/my-bucket",
      });
      expect(storage).toBeInstanceOf(GCSStorage);
    });

    it("should create instance with credentials", () => {
      const storage = new GCSStorage({
        bucket: "my-bucket",
        baseUrl: "https://storage.googleapis.com/my-bucket",
        projectId: "my-project",
        keyFilename: "/path/to/keyfile.json",
      });
      expect(storage).toBeInstanceOf(GCSStorage);
    });
  });

  describe("put", () => {
    it("should upload file and return URL", async () => {
      const storage = new GCSStorage({
        bucket: "my-bucket",
        baseUrl: "https://storage.googleapis.com/my-bucket",
      });

      const result = await storage.put({
        key: "uploads/test.jpg",
        bytes: new Uint8Array([1, 2, 3]),
        contentType: "image/jpeg",
        meta: { width: 800, height: 600, format: "jpeg" },
      });

      expect(result.url).toBe(
        "https://storage.googleapis.com/my-bucket/uploads/test.jpg",
      );
    });

    it("should handle webp format", async () => {
      const storage = new GCSStorage({
        bucket: "my-bucket",
        baseUrl: "https://storage.googleapis.com/my-bucket",
      });

      const result = await storage.put({
        key: "variants/photo_400w.webp",
        bytes: new Uint8Array([1, 2, 3]),
        contentType: "image/webp",
        meta: { width: 400, height: 300, format: "webp" },
      });

      expect(result.url).toBe(
        "https://storage.googleapis.com/my-bucket/variants/photo_400w.webp",
      );
    });

    it("should handle custom baseUrl with CDN", async () => {
      const storage = new GCSStorage({
        bucket: "my-bucket",
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
