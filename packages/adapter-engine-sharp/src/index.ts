import type { CropStrategy, ImageMetadata, PixEngineInput, TransformEngine } from "@pixengine/core";
import sharp from "sharp";

function parseExif(exifBuffer: Buffer | undefined): Record<string, unknown> | undefined {
  if (!exifBuffer || exifBuffer.length === 0) return undefined;
  return { raw: `${exifBuffer.length} bytes` };
}

export class SharpEngine implements TransformEngine {
  async probe(input: PixEngineInput): Promise<ImageMetadata> {
    const image = sharp(input.bytes);
    const metadata = await image.metadata();

    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? "unknown",
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      exif: parseExif(metadata.exif),
    };
  }

  async transform(args: {
    input: PixEngineInput;
    width?: number;
    height?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
    quality?: number;
    crop?: CropStrategy;
  }): Promise<{
    bytes: Uint8Array;
    format: string;
    width: number;
    height: number;
  }> {
    let pipeline = sharp(args.input.bytes);

    // Resize (only if options are present)
    if (args.width || args.height) {
      const resizeOptions: sharp.ResizeOptions = {
        width: args.width,
        height: args.height,
        withoutEnlargement: true,
      };

      if (args.crop) {
        // Cropping requires 'cover' fit
        resizeOptions.fit = "cover";

        if (args.crop === "entropy") {
          resizeOptions.position = sharp.strategy.entropy;
        } else if (args.crop === "attention") {
          resizeOptions.position = sharp.strategy.attention;
        } else {
          // Map directional strings directly (center, top, right, etc.)
          // Sharp supports: top, right, bottom, left, center, northeast, southeast, southwest, northwest
          // Our policies usually use standard 5 positions, which map directly.
          resizeOptions.position = args.crop;
        }
      } else {
        // Default behavior: fit inside (no crop)
        resizeOptions.fit = "inside";
      }

      pipeline = pipeline.resize(resizeOptions);
    }

    // Format conversion
    const targetFormat = args.format ?? "jpeg";
    const quality = args.quality ?? 80;

    switch (targetFormat) {
      case "webp":
        pipeline = pipeline.webp({ quality });
        break;
      case "avif":
        pipeline = pipeline.avif({ quality });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({ quality });
        break;
      case "png":
        pipeline = pipeline.png({ quality });
        break;
    }

    // Execute transformation
    const buffer = await pipeline.toBuffer();

    // Check result metadata
    const resultMetadata = await sharp(buffer).metadata();

    return {
      bytes: new Uint8Array(buffer),
      width: resultMetadata.width ?? 0,
      height: resultMetadata.height ?? 0,
      format: targetFormat,
    };
  }
}
