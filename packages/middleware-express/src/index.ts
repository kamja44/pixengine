import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Policy, TransformEngine, StorageAdapter } from "@pixengine/core";
import { optimize } from "@pixengine/core";

export interface PixEngineMiddlewareConfig {
  engine: TransformEngine;
  storage: StorageAdapter;
  policy?: Policy;
}

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const defaultPolicy: Policy = (_ctx) => ({
  variants: [
    { width: 400, format: "webp", quality: 80 },
    { width: 800, format: "webp", quality: 85 },
    { width: 1200, format: "webp", quality: 90 },
  ],
});

function validateConfig(config: PixEngineMiddlewareConfig): void {
  if (!config.engine) {
    throw new Error("PixEngineMiddleware: engine is required");
  }
  if (!config.storage) {
    throw new Error("PixEngineMiddleware: storage is required");
  }
}

export function pixEngineMiddleware(config: PixEngineMiddlewareConfig): RequestHandler {
  validateConfig(config);

  const policy = config.policy || defaultPolicy;

  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const multerReq = req as MulterRequest;

      // 파일 없으면 400
      if (!multerReq.file) {
        res.status(400).json({
          error: "No file uploaded",
        });
        return;
      }

      // 입력 준비
      const input = {
        filename: multerReq.file.originalname,
        bytes: new Uint8Array(multerReq.file.buffer),
        contentType: multerReq.file.mimetype,
      };

      // 최적화 실행
      const manifest = await optimize({
        input,
        policy,
        engine: config.engine,
        storage: config.storage,
      });

      // JSON 응답
      res.json(manifest);
    } catch (error) {
      res.status(500).json({
        error: "Image optimization failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
