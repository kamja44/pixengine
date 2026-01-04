import {
  optimize,
  type TransformEngine,
  type StorageAdapter,
  type Policy,
} from "@pixengine/core";

export interface PixEngineHandlerConfig {
  engine: TransformEngine;
  storage: StorageAdapter;
  policy?: Policy;
}

export const defaultPolicy: Policy = (ctx) => ({
  variants: [
    { width: 400, format: "webp", quality: 80 },
    { width: 800, format: "webp", quality: 85 },
    { width: 1200, format: "webp", quality: 90 },
  ],
});

function validateConfig(config: PixEngineHandlerConfig): void {
  if (!config.engine) {
    throw new Error("PixEngineHandler: engine is required");
  }
  if (!config.storage) {
    throw new Error("PixEngineHandler: storage is required");
  }
}

export function pixEngineHandler(
  config: PixEngineHandlerConfig,
): (request: Request) => Promise<Response> {
  validateConfig(config);
  const policy = config.policy || defaultPolicy;

  return async (request: Request): Promise<Response> => {
    try {
      // @ts-ignore - formData() is supported in Next.js runtime
      const formData = await request.formData();
      const file = formData.get("image");

      if (!file || !(file instanceof File)) {
        return Response.json({ error: "No file uploaded" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const input = {
        filename: file.name,
        bytes,
        contentType: file.type,
      };

      const manifest = await optimize({
        input,
        policy,
        engine: config.engine,
        storage: config.storage,
      });

      return Response.json(manifest);
    } catch (error) {
      return Response.json(
        {
          error: "Image optimization failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  };
}
