import { describe, it, expect, vi } from "vitest";
import { optimize } from "../src/index.js";
import type {
  Policy,
  TransformEngine,
  StorageAdapter,
  PixEngineInput,
  PolicyContext,
} from "../src/index.js";

describe("optimize()", () => {
  it("should orchestrate image optimization with policy", async () => {
    // Given: Mock engine and storage
    const mockEngine: TransformEngine = {
      probe: vi.fn().mockResolvedValue({
        width: 800,
        height: 600,
        format: "jpeg",
      }),
      transform: vi.fn().mockResolvedValue({
        bytes: new Uint8Array([10, 20, 30]),
        width: 200,
        height: 150,
        format: "webp",
      }),
    };

    const mockStorage: StorageAdapter = {
      put: vi.fn().mockResolvedValue({
        url: "http://test.com/image.jpg",
      }),
    };

    const policy: Policy = () => ({
      variants: [{ width: 200, format: "webp", quality: 80 }],
    });

    const input: PixEngineInput = {
      filename: "test.jpg",
      bytes: new Uint8Array([1, 2, 3, 4, 5]),
      contentType: "image/jpeg",
    };

    // When: execute optimize
    const manifest = await optimize({
      input,
      policy,
      engine: mockEngine,
      storage: mockStorage,
    });

    // Then: Verify manifest structure
    expect(manifest.original).toEqual({
      width: 800,
      height: 600,
      format: "jpeg",
      bytes: 5,
    });

    expect(manifest.variants).toHaveLength(1);
    expect(manifest.variants[0]).toMatchObject({
      width: 200,
      height: 150,
      format: "webp",
    });

    // Verify mock calls
    expect(mockEngine.probe).toHaveBeenCalledWith(input);
    expect(mockEngine.transform).toHaveBeenCalledWith({
      input,
      width: 200,
      format: "webp",
      quality: 80,
    });
  });

  it("should call policy with correct context", async () => {
    // Given
    const mockEngine: TransformEngine = {
      probe: vi.fn().mockResolvedValue({
        width: 1920,
        height: 1080,
        format: "png",
      }),
      transform: vi.fn().mockResolvedValue({
        bytes: new Uint8Array([1]),
        width: 100,
        height: 100,
        format: "webp",
      }),
    };

    const mockStorage: StorageAdapter = {
      put: vi.fn().mockResolvedValue({ url: "http://test.com/img" }),
    };

    const policyMock = vi.fn().mockReturnValue({
      variants: [{ width: 100, format: "webp" as const }],
    });

    const input: PixEngineInput = {
      filename: "large.png",
      bytes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      contentType: "image/png",
    };

    // When
    await optimize({
      input,
      policy: policyMock,
      engine: mockEngine,
      storage: mockStorage,
    });

    // Then: Verify policy is called with correct context
    expect(policyMock).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
      format: "png",
      bytes: 10,
      filename: "large.png",
      contentType: "image/png",
      metadata: {
        width: 1920,
        height: 1080,
        format: "png",
      },
    });
  });

  it("should pass metadata to policy for content-aware decisions", async () => {
    // Given: Engine returns rich metadata
    const mockEngine: TransformEngine = {
      probe: vi.fn().mockResolvedValue({
        width: 4000,
        height: 3000,
        format: "jpeg",
        space: "srgb",
        hasAlpha: false,
        density: 300,
      }),
      transform: vi.fn().mockResolvedValue({
        bytes: new Uint8Array([1]),
        width: 800,
        height: 600,
        format: "webp",
      }),
    };

    const mockStorage: StorageAdapter = {
      put: vi.fn().mockResolvedValue({ url: "http://test.com/img" }),
    };

    // Policy that uses metadata for decisions
    const smartPolicy: Policy = (ctx: PolicyContext) => {
      if (ctx.metadata.hasAlpha) {
        return { variants: [{ width: 800, format: "png" as const }] };
      }
      return { variants: [{ width: 800, format: "webp" as const, quality: 85 }] };
    };

    const input: PixEngineInput = {
      filename: "photo.jpg",
      bytes: new Uint8Array(1000),
      contentType: "image/jpeg",
    };

    // When
    const manifest = await optimize({
      input,
      policy: smartPolicy,
      engine: mockEngine,
      storage: mockStorage,
    });

    // Then: Should pick webp since hasAlpha is false
    expect(manifest.variants).toHaveLength(1);
    expect(manifest.variants[0].format).toBe("webp");
  });

  it("should generate multiple variants based on policy", async () => {
    // Given
    const mockEngine: TransformEngine = {
      probe: vi.fn().mockResolvedValue({
        width: 1000,
        height: 1000,
        format: "jpeg",
      }),
      transform: vi
        .fn()
        .mockResolvedValueOnce({
          bytes: new Uint8Array([1, 2]),
          width: 200,
          height: 200,
          format: "webp",
        })
        .mockResolvedValueOnce({
          bytes: new Uint8Array([3, 4, 5]),
          width: 400,
          height: 400,
          format: "avif",
        }),
    };

    const mockStorage: StorageAdapter = {
      put: vi.fn().mockResolvedValue({ url: "http://test.com/img" }),
    };

    const policy: Policy = () => ({
      variants: [
        { width: 200, format: "webp", quality: 80 },
        { width: 400, format: "avif", quality: 70 },
      ],
    });

    const input: PixEngineInput = {
      filename: "multi.jpg",
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/jpeg",
    };

    // When
    const manifest = await optimize({
      input,
      policy,
      engine: mockEngine,
      storage: mockStorage,
    });

    // Then: Verify 2 variants are generated
    expect(manifest.variants).toHaveLength(2);
    expect(manifest.variants[0].format).toBe("webp");
    expect(manifest.variants[1].format).toBe("avif");
  });
});
