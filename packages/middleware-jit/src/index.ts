import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { TransformEngine, CacheAdapter } from "@pixengine/core";
import { verifyUrl } from "@pixengine/core";
import { createHash } from "crypto";
import { LRUCache } from "lru-cache";

// 1. Types & Interfaces
export type SourceResolver = (
  key: string,
) => Promise<{ bytes: Uint8Array; contentType: string } | null>;

export interface JitSecurityConfig {
  secret: string;
}

export interface JitConfig {
  engine: TransformEngine;
  source: SourceResolver;
  cache?: CacheAdapter;
  security?: JitSecurityConfig;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats?: Array<"webp" | "avif" | "jpeg" | "png">;
  defaultFormat?: "webp" | "avif" | "jpeg" | "png";
  defaultQuality?: number;
  cacheControl?: string;
  cacheTtl?: number;
}

interface TransformParams {
  width?: number;
  height?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  quality: number;
}

// 2. Constants
const DEFAULT_MAX_WIDTH = 4096;
const DEFAULT_MAX_HEIGHT = 4096;
const DEFAULT_ALLOWED_FORMATS: Array<"webp" | "avif" | "jpeg" | "png"> = [
  "webp",
  "avif",
  "jpeg",
  "png",
];
const DEFAULT_QUALITY = 80;
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";

// 3. Helper Classes
class MemoryCache implements CacheAdapter {
  private cache: LRUCache<string, Uint8Array>;

  constructor(ttl: number = 1000 * 60 * 5, max: number = 500) {
    this.cache = new LRUCache({
      max,
      ttl,
    });
  }

  async get(key: string): Promise<Uint8Array | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: Uint8Array, ttl?: number): Promise<void> {
    this.cache.set(key, value, { ttl });
  }
}

// 4. Helper Functions
function validateConfig(config: JitConfig): void {
  if (!config.engine) {
    throw new Error("JitMiddleware: engine is required");
  }
  if (!config.source) {
    throw new Error("JitMiddleware: source is required");
  }
}

function parseParams(
  query: Record<string, unknown>,
  config: JitConfig,
): TransformParams | { error: string } {
  const maxWidth = config.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = config.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const allowedFormats = config.allowedFormats ?? DEFAULT_ALLOWED_FORMATS;
  const defaultQuality = config.defaultQuality ?? DEFAULT_QUALITY;

  const params: TransformParams = { quality: defaultQuality };

  if (query.w !== undefined) {
    const w = Number(query.w);
    if (!Number.isInteger(w) || w <= 0) return { error: "Invalid width" };
    if (w > maxWidth) return { error: `Width exceeds maximum of ${maxWidth}` };
    params.width = w;
  }

  if (query.h !== undefined) {
    const h = Number(query.h);
    if (!Number.isInteger(h) || h <= 0) return { error: "Invalid height" };
    if (h > maxHeight) return { error: `Height exceeds maximum of ${maxHeight}` };
    params.height = h;
  }

  if (query.format !== undefined) {
    const fmt = query.format as string;
    if (!allowedFormats.includes(fmt as "webp" | "avif" | "jpeg" | "png")) {
      return { error: `Format not allowed. Use: ${allowedFormats.join(", ")}` };
    }
    params.format = fmt as "webp" | "avif" | "jpeg" | "png";
  }

  if (query.q !== undefined) {
    const q = Number(query.q);
    if (!Number.isInteger(q) || q < 1 || q > 100) return { error: "Quality must be 1-100" };
    params.quality = q;
  }

  return params;
}

function generateCacheKey(key: string, params: TransformParams): string {
  const parts = [key];
  if (params.width) parts.push(`w=${params.width}`);
  if (params.height) parts.push(`h=${params.height}`);
  if (params.format) parts.push(`fmt=${params.format}`);
  if (params.quality) parts.push(`q=${params.quality}`);
  return parts.join("?");
}

function generateETag(bytes: Uint8Array): string {
  const hash = createHash("md5").update(bytes).digest("hex").slice(0, 16);
  return `"${hash}"`;
}

// 5. Middleware Implementation
export function jitMiddleware(config: JitConfig): RequestHandler {
  validateConfig(config);

  const cacheControl = config.cacheControl ?? DEFAULT_CACHE_CONTROL;
  const defaultFormat = config.defaultFormat;
  const cacheTtl = config.cacheTtl ?? 1000 * 60 * 60; // Default 1 hour

  const cache = config.cache ?? new MemoryCache(cacheTtl);

  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // 0. Security Verification
      if (config.security?.secret) {
        // req.originalUrl includes the base path (e.g., /img/photo.jpg?w=100)
        // verifyUrl expects path + query
        const fullPath = req.originalUrl || req.url;
        const verified = verifyUrl(fullPath, config.security.secret);

        if (!verified) {
          res.status(403).json({ error: "Invalid signature" });
          return;
        }
      }

      // 1. Extract image key from URL path
      // Express routing: if mounted on /img, req.path is /photo.jpg
      const key = req.params[0] || req.params.key;

      if (!key) {
        res.status(400).json({ error: "No image key provided" });
        return;
      }

      // 2. Parse and validate query params
      const result = parseParams(req.query, config);
      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      const format = result.format ?? defaultFormat;

      // Determine transformation params
      const transformParams: TransformParams = {
        width: result.width,
        height: result.height,
        format,
        quality: result.quality,
      };

      // 3. Check Cache
      const cacheKey = generateCacheKey(key, transformParams);
      const cached = await cache.get(cacheKey);

      if (cached) {
        const etag = generateETag(cached);
        if (req.headers["if-none-match"] === etag) {
          res.status(304).end();
          return;
        }

        const contentType = transformParams.format
          ? `image/${transformParams.format}`
          : "application/octet-stream";

        res.set("Content-Type", contentType);
        res.set("Cache-Control", cacheControl);
        res.set("X-PixEngine-Cache", "HIT");
        res.set("ETag", etag);
        res.send(Buffer.from(cached));
        return;
      }

      // 4. Resolve source image (Cache Miss)
      const source = await config.source(key);
      if (!source) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      // 5. Check if transformation is needed
      const effectiveFormat = result.format ?? defaultFormat;
      const needsTransform = result.width || result.height || effectiveFormat;

      if (!needsTransform) {
        const etag = generateETag(source.bytes);
        if (req.headers["if-none-match"] === etag) {
          res.status(304).end();
          return;
        }
        res.set("Content-Type", source.contentType);
        res.set("Cache-Control", cacheControl);
        res.set("X-PixEngine-Cache", "MISS");
        res.set("ETag", etag);
        res.send(Buffer.from(source.bytes));
        return;
      }

      // 6. Transform
      const input = {
        filename: key,
        bytes: source.bytes,
        contentType: source.contentType,
      };

      const transformed = await config.engine.transform({
        input,
        width: result.width,
        height: result.height,
        format: effectiveFormat,
        quality: result.quality,
      });

      // 7. Save to Cache
      await cache.set(cacheKey, transformed.bytes, cacheTtl);

      // 8. Respond with transformed image
      const contentType = `image/${transformed.format}`;
      const etag = generateETag(transformed.bytes);

      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }

      res.set("Content-Type", contentType);
      res.set("Cache-Control", cacheControl);
      res.set("X-PixEngine-Cache", "MISS");
      res.set("ETag", etag);
      res.send(Buffer.from(transformed.bytes));
    } catch (error) {
      res.status(500).json({
        error: "Image transformation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
