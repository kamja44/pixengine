import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { TransformEngine } from "@pixengine/core";
import { createHash } from "crypto";

export type SourceResolver = (
  key: string,
) => Promise<{ bytes: Uint8Array; contentType: string } | null>;

export interface JitConfig {
  engine: TransformEngine;
  source: SourceResolver;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats?: Array<"webp" | "avif" | "jpeg" | "png">;
  defaultFormat?: "webp" | "avif" | "jpeg" | "png";
  defaultQuality?: number;
  cacheControl?: string;
}

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

interface TransformParams {
  width?: number;
  height?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  quality: number;
}

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

function generateETag(bytes: Uint8Array): string {
  const hash = createHash("md5").update(bytes).digest("hex").slice(0, 16);
  return `"${hash}"`;
}

export function jitMiddleware(config: JitConfig): RequestHandler {
  validateConfig(config);

  const cacheControl = config.cacheControl ?? DEFAULT_CACHE_CONTROL;
  const defaultFormat = config.defaultFormat;

  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // 1. Extract image key from URL path
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

      // 3. Resolve source image
      const source = await config.source(key);
      if (!source) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      // 4. Determine output format
      const format = result.format ?? defaultFormat;

      // 5. Check if transformation is needed
      const needsTransform = result.width || result.height || format;

      if (!needsTransform) {
        // Serve original with cache headers
        const etag = generateETag(source.bytes);
        if (req.headers["if-none-match"] === etag) {
          res.status(304).end();
          return;
        }
        res.set("Content-Type", source.contentType);
        res.set("Cache-Control", cacheControl);
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
        format,
        quality: result.quality,
      });

      // 7. Respond with transformed image
      const contentType = `image/${transformed.format}`;
      const etag = generateETag(transformed.bytes);

      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }

      res.set("Content-Type", contentType);
      res.set("Cache-Control", cacheControl);
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
