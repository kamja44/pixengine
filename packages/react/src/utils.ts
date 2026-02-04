export interface PixUrlOptions {
  baseUrl: string;
  src: string;
  width?: number;
  height?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  quality?: number;
}

export function generatePixUrl(options: PixUrlOptions): string {
  const { baseUrl, src, width, height, format, quality } = options;
  const url = new URL(src, baseUrl);
  if (width) url.searchParams.set("w", width.toString());
  if (height) url.searchParams.set("h", height.toString());
  if (format) url.searchParams.set("format", format);
  if (quality) url.searchParams.set("q", quality.toString());
  return url.toString();
}

export function generateSrcSet(options: PixUrlOptions, imageUrl: string): string | undefined {
  const { width, height } = options;
  if (!width && !height) return undefined;

  const url1x = new URL(imageUrl);
  const url2x = new URL(imageUrl);

  if (width) url2x.searchParams.set("w", (width * 2).toString());
  if (height) url2x.searchParams.set("h", (height * 2).toString());

  return `${url1x.toString()} 1x, ${url2x.toString()} 2x`;
}
