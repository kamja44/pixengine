import { describe, it, expect, vi } from "vitest";
import { jitMiddleware, type SourceResolver } from "../src/index";
import { signUrl } from "@pixengine/core";
import { type TransformEngine, type ImageMetadata } from "@pixengine/core";
import express from "express";
import request from "supertest";

// Mock Engine
const mockEngine: TransformEngine = {
  probe: async () => ({}) as ImageMetadata,
  transform: vi.fn(),
};

// Mock Source
const mockSource: SourceResolver = async () => ({
  bytes: new Uint8Array([0]),
  contentType: "image/jpeg",
});

describe("JIT Middleware Security", () => {
  const SECRET = "test-secret";

  const app = express();
  app.get(
    "/img/*",
    jitMiddleware({
      engine: mockEngine,
      source: mockSource,
      security: { secret: SECRET },
    }),
  );

  it("should block requests without signature", async () => {
    const res = await request(app).get("/img/test.jpg?w=100");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Invalid signature");
  });

  it("should block requests with invalid signature", async () => {
    const res = await request(app).get("/img/test.jpg?w=100&s=invalid");
    expect(res.status).toBe(403);
  });

  it("should allow requests with valid signature", async () => {
    // Note: express supertest uses the full URL in request
    // We need to sign exactly what express receives as originalUrl
    const path = "/img/test.jpg?w=100";
    const signedPath = signUrl(path, SECRET);

    const res = await request(app).get(signedPath);
    expect(res.status).toBe(200);
  });

  it("should allow requests if security config is missing", async () => {
    const insecureApp = express();
    insecureApp.get("/img/*", jitMiddleware({ engine: mockEngine, source: mockSource }));

    const res = await request(insecureApp).get("/img/test.jpg?w=100");
    expect(res.status).toBe(200);
  });
});
