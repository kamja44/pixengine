import type { StorageAdapter } from "@pixengine/core";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export class LocalStorage implements StorageAdapter {
  constructor(
    private config: {
      baseDir: string; // 예: './uploads'
      baseUrl: string; // 예: 'http://localhost:3000/uploads
    },
  ) {}

  async put(args: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    meta: { width: number; height: number; format: string };
  }): Promise<{ url: string }> {
    // 전체 파일 경로 생성
    const filePath = join(this.config.baseDir, args.key);

    // 디렉토리 경로 추출
    const dir = dirname(filePath);

    // 디렉토리 생성 (재귀적으로, 이미 있으면 무시)
    await mkdir(dir, { recursive: true });

    // 파일 저장
    await writeFile(filePath, args.bytes);

    // URL 생성 및 반환
    const url = `${this.config.baseUrl}/${args.key}`;

    return {
      url,
    };
  }
}
