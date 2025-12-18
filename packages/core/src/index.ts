export type PixEngineInput = {
  filename: string;
  bytes: Uint8Array;
  contentType: string;
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
  probe(input: PixEngineInput): Promise<{ width: number; height: number; format: string }>;
}

export type PolicyDecision = {
  variants: Array<{ width: number; format: "webp" | "avif" | "jpeg" | "png"; quality?: number }>;
};

export type Policy = (ctx: {
  width: number;
  height: number;
  bytes: number;
  format: string;
}) => PolicyDecision;

export async function optimize(_args: {
  input: PixEngineInput;
  policy: Policy;
  engine: TransformEngine;
  storage: StorageAdapter;
}): Promise<Manifest> {
  throw new Error("Not implemented yet");
}
