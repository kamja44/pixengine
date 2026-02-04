declare module "ssim.js" {
  export interface SSIMOptions {
    data: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
    channels?: number;
  }

  export interface SSIMResult {
    mssim: number;
    ssim_map?: unknown;
  }

  function ssim(image1: SSIMOptions, image2: SSIMOptions): SSIMResult;
  export default ssim;
}
