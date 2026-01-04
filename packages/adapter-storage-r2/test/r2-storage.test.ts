import { describe, it, expect, vi, beforeEach } from "vitest";
import { R2Storage } from "../src/index.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

vi.mock("@aws-sdk/client-s3", () => {
  const mockSend = vi.fn().mockResolvedValue({});

  class MockS3Client {
    send = mockSend;
    constructor() {}
  }

  return {
    S3Client: MockS3Client,
    PutObjectCommand: vi.fn(),
  };
});

describe("R2Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should throw error if accountId is not provided", () => {
      expect(() => {
        // @ts-ignore Testing missing accountId
        new R2Storage({
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucket: "test-bucket",
          baseUrl: "https://pub-test.r2.dev",
        });
      }).toThrow("R2Storage: accountId is required");
    });

    it("should throw error if bucket is not provided", () => {
      expect(() => {
        // @ts-ignore Testing missing bucket
        new R2Storage({
          accountId: "test-account",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          baseUrl: "https://pub-test.r2.dev",
        });
      }).toThrow("R2Storage: bucket is required");
    });

    it("should throw error if baseUrl is not provided", () => {
      expect(() => {
        // @ts-ignore Testing missing baseUrl
        new R2Storage({
          accountId: "test-account",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          bucket: "test-bucket",
        });
      }).toThrow("R2Storage: baseUrl is required");
    });
  });

  describe("put()", () => {
    it("should upload file to R2 with correct paramenters", async () => {
      const storage = new R2Storage({
        accountId: "test-account",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "test-bucket",
        baseUrl: "https://pub-test.r2.dev",
      });
      const bytes = new Uint8Array([1, 2, 3, 4]);

      await storage.put({
        key: "uploads/test.jpg",
        bytes,
        contentType: "image/jpeg",
        meta: { width: 100, height: 100, format: "jpeg" },
      });

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "uploads/test.jpg",
        Body: bytes,
        ContentType: "image/jpeg",
      });
    });

    it("should return correct URL after upload", async () => {
      const storage = new R2Storage({
        accountId: "test-account",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "test-bucket",
        baseUrl: "https://pub-test.r2.dev",
      });

      const bytes = new Uint8Array([1, 2, 3, 4]);

      const result = await storage.put({
        key: "uploads/test.jpg",
        bytes,
        contentType: "image/jpeg",
        meta: { width: 100, height: 100, format: "jpeg" },
      });

      expect(result).toEqual({
        url: "https://pub-test.r2.dev/uploads/test.jpg",
      });
    });

    it("should handle baseUrl with trailing slash", async () => {
      const storage = new R2Storage({
        accountId: "test-account",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "test-bucket",
        baseUrl: "https://pub-test.r2.dev/",
      });

      const bytes = new Uint8Array([1, 2, 3, 4]);

      const result = await storage.put({
        key: "uploads/test.jpg",
        bytes,
        contentType: "image/jpeg",
        meta: { width: 100, height: 100, format: "jpeg" },
      });

      expect(result).toEqual({
        url: "https://pub-test.r2.dev/uploads/test.jpg",
      });
    });
  });
});
