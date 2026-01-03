import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { pixEngineMiddleware, defaultPolicy } from "../src/index.js";
import type {} from "multer";

import type {
  TransformEngine,
  StorageAdapter,
  Manifest,
} from "@pixengine/core";

// Mock optimize function from core
vi.mock("@pixengine/core", async () => {
  const actual = await vi.importActual("@pixengine/core");
  return {
    ...actual,
    optimize: vi.fn(),
  };
});

import { optimize } from "@pixengine/core";

describe("pixEngineMiddleware factory", () => {
  const mockEngine: TransformEngine = {
    probe: vi.fn(),
    transform: vi.fn(),
  };

  const mockStorage: StorageAdapter = {
    put: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if storage is not provided", () => {
    expect(() => {
      // @ts-ignore Testing missing storage
      pixEngineMiddleware({ engine: mockEngine });
    }).toThrow("PixEngineMiddleware: storage is required");
  });

  it("should accept valid configuration with engine and storage", () => {
    expect(() => {
      pixEngineMiddleware({
        engine: mockEngine,
        storage: mockStorage,
      }).not.toThrow();
    });
  });

  it("should use default policy when policy is not provided", () => {
    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe("function");
  });

  it("should accept custom policy", () => {
    const customPolicy = vi.fn(() => ({
      variants: [{ width: 200, format: "webp" as const, quality: 75 }],
    }));

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
      policy: customPolicy,
    });

    expect(middleware).toBeDefined();
  });
});

describe("middleware request handling", () => {
  const mockEngine: TransformEngine = {
    probe: vi.fn(),
    transform: vi.fn(),
  };

  const mockStorage: StorageAdapter = {
    put: vi.fn(),
  };

  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      file: {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
        size: 1024,
      },
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it("should return 400 Bad Request when no file is uploaded", async () => {
    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    mockReq.file = undefined;

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "No file uploaded" });
  });

  it("should process uploaded file and call optimize()", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(optimize).toHaveBeenCalledTimes(1);
  });

  it("should pass correct PixEngineInput to optimize()", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(optimize).toHaveBeenCalledWith({
      input: {
        filename: "test.jpg",
        bytes: expect.any(Uint8Array),
        contentType: "image/jpeg",
      },
      policy: expect.any(Function),
      engine: mockEngine,
      storage: mockStorage,
    });
  });

  it("should use default policy when none provided", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const callArgs = vi.mocked(optimize).mock.calls[0][0];
    expect(callArgs.policy).toBe(defaultPolicy);
  });

  it("should use custom policy when provided", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const customPolicy = vi.fn(() => ({
      variants: [{ width: 200, format: "webp" as const, quality: 75 }],
    }));

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
      policy: customPolicy,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    const callArgs = vi.mocked(optimize).mock.calls[0][0];
    expect(callArgs.policy).toBe(customPolicy);
  });
});

describe("middleware response handling", () => {
  const mockEngine: TransformEngine = {
    probe: vi.fn(),
    transform: vi.fn(),
  };

  const mockStorage: StorageAdapter = {
    put: vi.fn(),
  };

  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      file: {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
        size: 1024,
      },
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it("should call res.json() with manifest from optimize()", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [
        {
          key: "variants/test_400w.webp",
          url: "http://example.com/variants/test_400w.webp",
          width: 400,
          height: 225,
          format: "webp",
          bytes: 512,
        },
      ],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(mockManifest);
  });

  it("should not call next() on success", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe("middleware error handling", () => {
  const mockEngine: TransformEngine = {
    probe: vi.fn(),
    transform: vi.fn(),
  };

  const mockStorage: StorageAdapter = {
    put: vi.fn(),
  };

  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      file: {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
        size: 1024,
      },
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it("should return 500 when optimize() throws error", async () => {
    vi.mocked(optimize).mockRejectedValue(new Error("Optimization failed"));

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Image optimization failed",
      message: "Optimization failed",
    });
  });

  it("should include error message in 500 response", async () => {
    const errorMessage = "Custom error message";
    vi.mocked(optimize).mockRejectedValue(new Error(errorMessage));

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: errorMessage,
      }),
    );
  });

  it("should handle non-Error exceptions", async () => {
    vi.mocked(optimize).mockRejectedValue("String error");

    const middleware = pixEngineMiddleware({
      engine: mockEngine,
      storage: mockStorage,
    });

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Image optimization failed",
      message: "Unknown error",
    });
  });
});
