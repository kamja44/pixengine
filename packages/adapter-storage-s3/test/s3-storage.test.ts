import { describe, it, expect, vi, beforeEach } from "vitest";
import { S3Storage } from "../src/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

describe("S3Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should throw error if bucket is not provided", () => {
      expect(() => {
        // @ts-ignore Testing missing bucket
        new S3Storage({
          region: "us-east-1",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          baseUrl: "https://test.s3.amazonaws.com",
        });
      }).toThrow("S3Storage: bucket is required");
    });

    it("should throw error if region is not provided", () => {
      expect(() => {
        // @ts-ignore Testing missing region
        new S3Storage({
          bucket: "test-bucket",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
          baseUrl: "https://test.s3.amazonaws.com",
        });
      }).toThrow("S3Storage: region is required");
    });

    it("should throw error if baseUrl is not provided", () => {
      expect(() => {
        // @ts-ignore Testing missing baseUrl
        new S3Storage({
          bucket: "test-bucket",
          region: "us-east-1",
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
        });
      }).toThrow("S3Storage: baseUrl is required");
    });
  });

  describe("put()", () => {
    it("should upload file to S3 with correct parameters", async () => {
      const storage = new S3Storage({
        bucket: "test-bucket",
        region: "us-east-1",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        baseUrl: "https://test-bucket.s3.amazonaws.com",
      });

      const bytes = new Uint8Array([1, 2, 3, 4]);
      const key = "uploads/test.jpg";
      const contentType = "image/jpeg";

      await storage.put({
        key: key,
        bytes: bytes,
        contentType: contentType,
        meta: { width: 100, height: 100, format: "jpeg" },
      });

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: key,
        Body: bytes,
        ContentType: contentType,
      });
    });

    it("should return correct URL after upload", async () => {
      const storage = new S3Storage({
        bucket: "test-bucket",
        region: "us-east-1",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        baseUrl: "https://cdn.example.com",
      });

      const bytes = new Uint8Array([1, 2, 3, 4]);
      const key = "uploads/test.jpg";
      const contentType = "image/jpeg";

      const url = await storage.put({
        key: key,
        bytes: bytes,
        contentType: contentType,
        meta: { width: 100, height: 100, format: "jpeg" },
      });

      expect(url).toEqual({ url: "https://cdn.example.com/uploads/test.jpg" });
    });

    it("should handle baseUrl with trailing slash", async () => {
      const storage = new S3Storage({
        bucket: "test-bucket",
        region: "us-east-1",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        baseUrl: "https://cdn.example.com/",
      });

      const bytes = new Uint8Array([1, 2, 3, 4]);
      const key = "uploads/test.jpg";
      const contentType = "image/jpeg";

      const url = await storage.put({
        key: key,
        bytes: bytes,
        contentType: contentType,
        meta: { width: 100, height: 100, format: "jpeg" },
      });

      expect(url).toEqual({ url: "https://cdn.example.com/uploads/test.jpg" });
    });
  });
});
