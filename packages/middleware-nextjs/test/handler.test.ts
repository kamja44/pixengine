import { describe, it, expect, vi, beforeEach } from "vitest";
import { pixEngineHandler, defaultPolicy } from "../src/index.js";
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

describe("pixEngineHandler factory", () => {
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

  it("should throw error if engine is not provided", () => {
    expect(() => {
      // @ts-ignore Testing missing engine
      pixEngineHandler({ storage: mockStorage });
    }).toThrow("PixEngineHandler: engine is required");
  });

  it("should throw error if storage is not provided", () => {
    expect(() => {
      // @ts-ignore Testing missing storage
      pixEngineHandler({ engine: mockEngine });
    }).toThrow("PixEngineHandler: storage is required");
  });

  it("should accept valid configuration with engine and storage", () => {
    expect(() => {
      pixEngineHandler({
        engine: mockEngine,
        storage: mockStorage,
      });
    }).not.toThrow();
  });

  it("should use default policy when policy is not provided", () => {
    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    expect(handler).toBeDefined();
    expect(typeof handler).toBe("function");
  });

  it("should accept custom policy", () => {
    const customPolicy = vi.fn(() => ({
      variants: [{ width: 200, format: "webp" as const, quality: 75 }],
    }));

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
      policy: customPolicy,
    });

    expect(handler).toBeDefined();
  });
});

describe("handler request processing", () => {
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

  it("should return 400 when no file is in FormData", async () => {
    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const formData = new FormData();
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "No file uploaded" });
  });

  it("should process uploaded file and call optimize()", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    await handler(request);

    expect(optimize).toHaveBeenCalledTimes(1);
  });

  it("should pass correct PixEngineInput to optimize()", async () => {
    const mockManifest: Manifest = {
      original: { width: 1920, height: 1080, format: "jpeg", bytes: 1024 },
      variants: [],
    };

    vi.mocked(optimize).mockResolvedValue(mockManifest);

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    await handler(request);

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

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    await handler(request);

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

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
      policy: customPolicy,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    await handler(request);

    const callArgs = vi.mocked(optimize).mock.calls[0][0];
    expect(callArgs.policy).toBe(customPolicy);
  });
});

describe("handler response", () => {
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

  it("should return Response with manifest JSON", async () => {
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

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockManifest);
  });
});

describe("handler error handling", () => {
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

  it("should return 500 when optimize() throws error", async () => {
    vi.mocked(optimize).mockRejectedValue(new Error("Optimization failed"));

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Image optimization failed",
      message: "Optimization failed",
    });
  });

  it("should include error message in 500 response", async () => {
    const errorMessage = "Custom error message";
    vi.mocked(optimize).mockRejectedValue(new Error(errorMessage));

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handler(request);
    const data = await response.json();

    expect(data).toEqual(
      expect.objectContaining({
        message: errorMessage,
      }),
    );
  });

  it("should handle non-Error exceptions", async () => {
    vi.mocked(optimize).mockRejectedValue("String error");

    const handler = pixEngineHandler({
      engine: mockEngine,
      storage: mockStorage,
    });

    const file = new File(["fake-image-data"], "test.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Image optimization failed",
      message: "Unknown error",
    });
  });
});
