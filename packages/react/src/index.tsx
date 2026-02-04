import React, { useMemo } from "react";
import { generatePixUrl, generateSrcSet } from "./utils";

export interface PixImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  baseUrl: string;
  width?: number;
  height?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  quality?: number;
}

export const PixImage: React.FC<PixImageProps> = ({
  src,
  baseUrl,
  width,
  height,
  format,
  quality,
  style,
  srcSet,
  ...rest
}) => {
  const imageUrl = useMemo(() => {
    return generatePixUrl({ baseUrl, src, width, height, format, quality });
  }, [src, baseUrl, width, height, format, quality]);

  const generatedSrcSet = useMemo(() => {
    if (srcSet) return srcSet;
    return generateSrcSet({ baseUrl, src, width, height, format, quality }, imageUrl);
  }, [imageUrl, srcSet, width, height, baseUrl, src, format, quality]);

  return <img src={imageUrl} srcSet={generatedSrcSet} style={style} {...rest} />;
};
