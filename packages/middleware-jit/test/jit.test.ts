import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TransformEngine } from "@pixengine/core";
import { jitMiddleware } from "../src/index.js";
import type { JitConfig, SourceResolver } from "../src/index.js";

// --- Mock helpers ---

function createMockEngine(): TransformEngine {
  return {
    probe: vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: "jpeg",
    }),
    transform: vi.fn().mockResolvedValue({
      bytes: new Uint8Array([10, 20, 30]),
      width: 300,
      height: 225,
      format: "webp",
    }),
  };
}

function createMockSource(): SourceResolver {
  return vi.fn().mockResolvedValue({
    bytes: new Uint8Array([1, 2, 3, 4, 5]),
    contentType: "image/jpeg",
  });
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res;
}

function createMockReq(params: Record<string, string>, query: Record<string, string> = {}) {
  return {
    params,
    query,
    headers: {},
  };
}

// --- Tests ---

describe("jitMiddleware", () => {
  let mockEngine: TransformEngine;
  let mockSource: SourceResolver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine = createMockEngine();
    mockSource = createMockSource();
  });

  describe("factory validation", () => {
    it("should throw if engine is missing", () => {
      expect(() =>
        jitMiddleware({ source: mockSource } as unknown as JitConfig),
      ).toThrow("engine is required");
    });

    it("should throw if source is missing", () => {
      expect(() =>
        jitMiddleware({ engine: mockEngine } as unknown as JitConfig),
      ).toThrow("source is required");
    });

    it("should accept valid config", () => {
      expect(() =>
        jitMiddleware({ engine: mockEngine, source: mockSource }),
      ).not.toThrow();
    });
  });

  describe("request handling", () => {
    it("should return 400 if no image key provided", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({});
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "No image key provided" });
    });

    it("should return 404 if source returns null", async () => {
      const nullSource = vi.fn().mockResolvedValue(null);
      const handler = jitMiddleware({ engine: mockEngine, source: nullSource });
      const req = createMockReq({ key: "missing.jpg" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Image not found" });
    });

    it("should serve original image when no transform params provided", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(mockEngine.transform).not.toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith("Content-Type", "image/jpeg");
      expect(res.send).toHaveBeenCalled();
    });

    it("should transform image with width param", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" }, { w: "300" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(mockEngine.transform).toHaveBeenCalledWith(
        expect.objectContaining({ width: 300, quality: 80 }),
      );
      expect(res.set).toHaveBeenCalledWith("Content-Type", "image/webp");
      expect(res.send).toHaveBeenCalled();
    });

    it("should transform image with format param", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" }, { format: "avif" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(mockEngine.transform).toHaveBeenCalledWith(
        expect.objectContaining({ format: "avif", quality: 80 }),
      );
    });

    it("should transform with all params", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" }, { w: "400", h: "300", format: "webp", q: "75" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(mockEngine.transform).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          height: 300,
          format: "webp",
          quality: 75,
        }),
      );
    });

    it("should use wildcard route param when key param is not available", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ "0": "subdir/photo.jpg" }, { w: "200" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(mockSource).toHaveBeenCalledWith("subdir/photo.jpg");
    });
  });

  describe("parameter validation", () => {
    it("should return 400 for invalid width", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" }, { w: "abc" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid width" });
    });

    it("should return 400 for width exceeding max", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource, maxWidth: 2000 });
      const req = createMockReq({ key: "photo.jpg" }, { w: "3000" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Width exceeds maximum of 2000" });
    });

    it("should return 400 for disallowed format", async () => {
      const handler = jitMiddleware({
        engine: mockEngine,
        source: mockSource,
        allowedFormats: ["webp", "jpeg"],
      });
      const req = createMockReq({ key: "photo.jpg" }, { format: "avif" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Format not allowed. Use: webp, jpeg",
      });
    });

    it("should return 400 for invalid quality", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" }, { q: "200" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Quality must be 1-100" });
    });
  });

  describe("cache headers", () => {
    it("should set default cache-control header", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.set).toHaveBeenCalledWith(
        "Cache-Control",
        "public, max-age=31536000, immutable",
      );
    });

    it("should set custom cache-control header", async () => {
      const handler = jitMiddleware({
        engine: mockEngine,
        source: mockSource,
        cacheControl: "public, max-age=3600",
      });
      const req = createMockReq({ key: "photo.jpg" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.set).toHaveBeenCalledWith("Cache-Control", "public, max-age=3600");
    });

    it("should set ETag header", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.set).toHaveBeenCalledWith("ETag", expect.stringMatching(/^"[a-f0-9]+"$/));
    });

    it("should return 304 when ETag matches", async () => {
      const handler = jitMiddleware({ engine: mockEngine, source: mockSource });

      // First request to get ETag
      const res1 = createMockRes();
      await handler(
        createMockReq({ key: "photo.jpg" }) as never,
        res1 as never,
        vi.fn(),
      );

      const etagCall = (res1.set as ReturnType<typeof vi.fn>).mock.calls.find(
        (c: string[]) => c[0] === "ETag",
      );
      const etag = etagCall?.[1] as string;

      // Second request with matching ETag
      const req2 = { params: { key: "photo.jpg" }, query: {}, headers: { "if-none-match": etag } };
      const res2 = createMockRes();

      await handler(req2 as never, res2 as never, vi.fn());

      expect(res2.status).toHaveBeenCalledWith(304);
      expect(res2.end).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return 500 when transform fails", async () => {
      const failEngine = createMockEngine();
      (failEngine.transform as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Sharp crashed"),
      );
      const handler = jitMiddleware({ engine: failEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" }, { w: "300" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Image transformation failed",
        message: "Sharp crashed",
      });
    });

    it("should handle non-Error exceptions", async () => {
      const failEngine = createMockEngine();
      (failEngine.transform as ReturnType<typeof vi.fn>).mockRejectedValue("string error");
      const handler = jitMiddleware({ engine: failEngine, source: mockSource });
      const req = createMockReq({ key: "photo.jpg" }, { w: "300" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Image transformation failed",
        message: "Unknown error",
      });
    });
  });

  describe("config options", () => {
    it("should use defaultFormat when format not specified in params", async () => {
      const handler = jitMiddleware({
        engine: mockEngine,
        source: mockSource,
        defaultFormat: "avif",
      });
      const req = createMockReq({ key: "photo.jpg" }, { w: "300" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(mockEngine.transform).toHaveBeenCalledWith(
        expect.objectContaining({ format: "avif" }),
      );
    });

    it("should use defaultQuality when quality not specified", async () => {
      const handler = jitMiddleware({
        engine: mockEngine,
        source: mockSource,
        defaultQuality: 90,
      });
      const req = createMockReq({ key: "photo.jpg" }, { w: "300" });
      const res = createMockRes();

      await handler(req as never, res as never, vi.fn());

      expect(mockEngine.transform).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 90 }),
      );
    });
  });
});
