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

export type CropStrategy = "center" | "top" | "right" | "bottom" | "left" | "entropy" | "attention";

export type Variant = {
  key: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  crop?: CropStrategy;
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
    crop?: CropStrategy;
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
    crop?: CropStrategy;
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

export type PictureOptions = {
  alt: string;
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  fallbackFormat?: string;
};

const FORMAT_PRIORITY: Record<string, number> = {
  avif: 0,
  webp: 1,
  jpeg: 2,
  png: 3,
};

export function generatePicture(manifest: Manifest, options: PictureOptions): string {
  const { alt, sizes, className, loading = "lazy", decoding = "async", fallbackFormat } = options;

  if (manifest.variants.length === 0) {
    const attrs = [`alt="${alt}"`, `loading="${loading}"`, `decoding="${decoding}"`];
    if (className) attrs.push(`class="${className}"`);
    return `<img ${attrs.join(" ")}>`;
  }

  // Group variants by format, sorted by width within each group
  const byFormat = new Map<string, Variant[]>();
  for (const variant of manifest.variants) {
    const list = byFormat.get(variant.format) ?? [];
    list.push(variant);
    byFormat.set(variant.format, list);
  }
  for (const variants of byFormat.values()) {
    variants.sort((a, b) => a.width - b.width);
  }

  // Determine fallback: explicit option, or lowest-priority format
  const formats = [...byFormat.keys()];
  const fallback =
    fallbackFormat && byFormat.has(fallbackFormat)
      ? fallbackFormat
      : formats.sort((a, b) => (FORMAT_PRIORITY[b] ?? 99) - (FORMAT_PRIORITY[a] ?? 99))[0];

  // Sort source formats by priority (most modern first)
  const sourceFormats = formats
    .filter((f) => f !== fallback)
    .sort((a, b) => (FORMAT_PRIORITY[a] ?? 99) - (FORMAT_PRIORITY[b] ?? 99));

  // Build <source> elements
  const sources: string[] = [];
  for (const format of sourceFormats) {
    const variants = byFormat.get(format)!;
    const srcset = variants.map((v) => `${v.url} ${v.width}w`).join(", ");
    let source = `<source type="image/${format}" srcset="${srcset}"`;
    if (sizes) source += ` sizes="${sizes}"`;
    source += ">";
    sources.push(source);
  }

  // Build <img> fallback
  const fallbackVariants = byFormat.get(fallback)!;
  const imgSrc = fallbackVariants[fallbackVariants.length - 1].url;
  const imgSrcset = fallbackVariants.map((v) => `${v.url} ${v.width}w`).join(", ");

  const imgAttrs: string[] = [`src="${imgSrc}"`, `srcset="${imgSrcset}"`];
  if (sizes) imgAttrs.push(`sizes="${sizes}"`);
  imgAttrs.push(`alt="${alt}"`);
  if (className) imgAttrs.push(`class="${className}"`);
  imgAttrs.push(`loading="${loading}"`);
  imgAttrs.push(`decoding="${decoding}"`);
  imgAttrs.push(`width="${manifest.original.width}"`);
  imgAttrs.push(`height="${manifest.original.height}"`);

  const img = `<img ${imgAttrs.join(" ")}>`;

  if (sources.length === 0) {
    return img;
  }

  const lines = ["<picture>"];
  for (const source of sources) {
    lines.push(`  ${source}`);
  }
  lines.push(`  ${img}`);
  lines.push("</picture>");

  return lines.join("\n");
}

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
      crop: variantSpec.crop,
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
      crop: variantSpec.crop,
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

export * from "./dsl.js";
