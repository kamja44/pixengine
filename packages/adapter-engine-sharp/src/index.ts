import type {
  CropStrategy,
  ImageMetadata,
  PixEngineInput,
  TransformEngine,
  QualityMetrics,
} from "@pixengine/core";
import sharp from "sharp";
import ssim from "ssim.js";

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
    metrics?: QualityMetrics;
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
    const resultWidth = resultMetadata.width ?? 0;
    const resultHeight = resultMetadata.height ?? 0;

    // Calculate BPP (Bits Per Pixel)
    const bits = buffer.length * 8;
    const pixels = resultWidth * resultHeight;
    const bpp = pixels > 0 ? parseFloat((bits / pixels).toFixed(3)) : 0;

    // Calculate SSIM (Structural Similarity) using ssim.js
    // We need to compare specific raw pixel data.
    // Optimizing SSIM calculation:
    // 1. Get raw buffer of original image RESIZED to target dimensions (reference)
    // 2. Get raw buffer of transformed image (distorted)
    // 3. Compare with ssim.js
    let ssimScore: number | undefined;

    try {
      // 1. Prepare reference: Resize original to target dimensions, output raw
      // Use 'fast' shrinkage for reference generation speed
      const { data: refData, info: refInfo } = await sharp(args.input.bytes)
        .resize({
          width: resultWidth,
          height: resultHeight,
          fit: "fill", // Force exact match to result dimensions for pixel comparison
        })
        .raw() // Get raw pixel data
        .toBuffer({ resolveWithObject: true });

      // 2. Prepare distorted: Decode result buffer to raw
      const { data: distData, info: distInfo } = await sharp(buffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      // 3. Compare using ssim.js
      // Default to 1.0 if calculation fails or dimensions mismatch (though they shouldn't)
      if (refInfo.width === distInfo.width && refInfo.height === distInfo.height) {
        const result = ssim(
          {
            data: new Uint8Array(refData),
            width: refInfo.width,
            height: refInfo.height,
            channels: refInfo.channels,
          },
          {
            data: new Uint8Array(distData),
            width: distInfo.width,
            height: distInfo.height,
            channels: distInfo.channels,
          },
        );
        ssimScore = parseFloat(result.mssim.toFixed(3));
      }
    } catch (err) {
      console.warn("Failed to calculate SSIM:", err);
      // Fallback or ignore
    }

    return {
      bytes: new Uint8Array(buffer),
      width: resultWidth,
      height: resultHeight,
      format: targetFormat,
      metrics: {
        bpp,
        ssim: ssimScore,
      },
    };
  }
}
