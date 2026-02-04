import { describe, it, expect, vi } from "vitest";
import { jitMiddleware, type SourceResolver } from "../src/index";
import type { TransformEngine, ImageMetadata, PixEngineInput, Variant } from "@pixengine/core";
import express from "express";
import request from "supertest";

// Mock Engine
const mockEngine: TransformEngine = {
  probe: async () => ({}) as ImageMetadata,
  transform: vi.fn().mockResolvedValue({
    bytes: new Uint8Array([1, 2, 3]),
    width: 100,
    height: 100,
    format: "webp",
  }),
};

// Mock Source
const mockSource: SourceResolver = async (key) => {
  if (key === "test.jpg") {
    return {
      bytes: new Uint8Array([0, 0, 0]),
      contentType: "image/jpeg",
    };
  }
  return null;
};

describe("JIT Middleware with Cache", () => {
  it("should cache transformed results", async () => {
    const app = express();
    app.get(
      "/img/*",
      jitMiddleware({
        engine: mockEngine,
        source: mockSource,
        cacheTtl: 1000,
      }),
    );

    // First Request (Miss)
    const res1 = await request(app).get("/img/test.jpg?w=100");
    expect(res1.status).toBe(200);
    expect(res1.headers["x-pixengine-cache"]).toBe("MISS");
    expect(mockEngine.transform).toHaveBeenCalledTimes(1);

    // Second Request (Hit)
    const res2 = await request(app).get("/img/test.jpg?w=100");
    expect(res2.status).toBe(200);
    expect(res2.headers["x-pixengine-cache"]).toBe("HIT");
    expect(mockEngine.transform).toHaveBeenCalledTimes(1); // Should not increase
  });

  it("should miss cache if params differ", async () => {
    const app = express();
    app.get(
      "/img/*",
      jitMiddleware({
        engine: mockEngine,
        source: mockSource,
      }),
    );

    // Request 1
    await request(app).get("/img/test.jpg?w=100");

    // Request 2 (Different params)
    const res = await request(app).get("/img/test.jpg?w=200");
    expect(res.status).toBe(200);
    expect(res.headers["x-pixengine-cache"]).toBe("MISS");
    expect(mockEngine.transform).toHaveBeenCalledTimes(3); // 1 (prev test) + 1 (req1) + 1 (req2) = 3
  });
});
