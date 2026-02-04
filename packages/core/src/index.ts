export type PixEngineInput = {
  filename: string;
  bytes: Uint8Array;
  contentType: string;
};

export type ImageMetadata = {
  width: number;
  height: number;
  format: string;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: Record<string, unknown>;
};

export type Variant = {
  key: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export type Manifest = {
  original: { width: number; height: number; format: string; bytes: number };
  variants: Variant[];
};

export interface StorageAdapter {
  put(args: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    meta: { width: number; height: number; format: string };
  }): Promise<{ url: string }>;
}

export interface TransformEngine {
  probe(input: PixEngineInput): Promise<ImageMetadata>;

  transform(args: {
    input: PixEngineInput;
    width?: number;
    height?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
    quality?: number;
  }): Promise<{
    bytes: Uint8Array;
    width: number;
    height: number;
    format: string;
  }>;
}

export type PolicyDecision = {
  variants: Array<{
    width: number;
    format: "webp" | "avif" | "jpeg" | "png";
    quality?: number;
  }>;
};

export type PolicyContext = {
  width: number;
  height: number;
  bytes: number;
  format: string;
  filename: string;
  contentType: string;
  metadata: ImageMetadata;
};

export type Policy = (ctx: PolicyContext) => PolicyDecision;

export async function optimize(args: {
  input: PixEngineInput;
  policy: Policy;
  engine: TransformEngine;
  storage: StorageAdapter;
}): Promise<Manifest> {
  const { input, policy, engine, storage } = args;

  // 1. Analyze original image (probe)
  const metadata = await engine.probe(input);

  // 2. Evaluate policy
  const decision = policy({
    width: metadata.width,
    height: metadata.height,
    bytes: input.bytes.length,
    format: metadata.format,
    filename: input.filename,
    contentType: input.contentType,
    metadata,
  });

  // 3. Save original
  const originalKey = `original/${input.filename}`;
  await storage.put({
    key: originalKey,
    bytes: input.bytes,
    contentType: input.contentType,
    meta: metadata,
  });

  // 4. Generate variants
  const variants: Variant[] = [];

  for (const variantSpec of decision.variants) {
    // Perform transformation
    const transformed = await engine.transform({
      input,
      width: variantSpec.width,
      format: variantSpec.format,
      quality: variantSpec.quality,
    });

    // Generate variant key (e.g., "variants/test_200w.webp")
    const baseFilename = input.filename.replace(/\.[^.]+$/, "");
    const variantKey = `variants/${baseFilename}_${variantSpec.width}w.${variantSpec.format}`;

    // Save
    const variantResult = await storage.put({
      key: variantKey,
      bytes: transformed.bytes,
      contentType: `image/${variantSpec.format}`,
      meta: {
        width: transformed.width,
        height: transformed.height,
        format: transformed.format,
      },
    });

    // Add variant info
    variants.push({
      key: variantKey,
      url: variantResult.url,
      width: transformed.width,
      height: transformed.height,
      format: transformed.format,
      bytes: transformed.bytes.length,
    });
  }

  // 5. Return manifest
  return {
    original: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      bytes: input.bytes.length,
    },
    variants,
  };
}
