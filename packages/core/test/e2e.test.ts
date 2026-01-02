import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { optimize } from "../src/index.js";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { Policy } from "../src/index.js";
import { SharpEngine } from "../../adapter-engine-sharp/src/index.js";
import { LocalStorage } from "../../adapter-storage-local/src/index.js";

describe("E2E: Full Image Optimization Pipeline", () => {
  const testOutputDir = "./test-output";
  const baseUrl = "http://localhost:3000/images";

  beforeEach(async () => {
    // 테스트 출력 디렉토리 정리
    if (existsSync(testOutputDir)) {
      await rm(testOutputDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // 테스트 후 정리
    if (existsSync(testOutputDir)) {
      await rm(testOutputDir, { recursive: true });
    }
  });

  it("should optimize image with real Sharp engine and LocalStorage", async () => {
    // Given: 실제 이미지 파일
    const imageBuffer = await readFile("test/fixtures/red-800x600.jpg");

    const input = {
      filename: "product.jpg",
      bytes: new Uint8Array(imageBuffer),
      contentType: "image/jpeg",
    };

    // 정책: 썸네일과 중간 크기 생성
    const policy: Policy = () => ({
      variants: [
        { width: 200, format: "webp", quality: 80 },
        { width: 400, format: "webp", quality: 85 },
      ],
    });

    // 실제 구현체 사용
    const engine = new SharpEngine();
    const storage = new LocalStorage({
      baseDir: testOutputDir,
      baseUrl,
    });

    // When: 최적화 실행
    const manifest = await optimize({
      input,
      policy,
      engine,
      storage,
    });

    // Then: Manifest 검증
    expect(manifest.original).toEqual({
      width: 800,
      height: 600,
      format: "jpeg",
      bytes: imageBuffer.length,
    });

    expect(manifest.variants).toHaveLength(2);

    // Variant 1: 200px WebP
    expect(manifest.variants[0]).toMatchObject({
      width: 200,
      height: 150, // 비율 유지(800:600 = 200:150)
      format: "webp",
    });

    // Variant 2: 400px WebP
    expect(manifest.variants[1]).toMatchObject({
      width: 400,
      height: 300, // 비율 유지
      format: "webp",
    });

    // 실제 파일이 생성되었는지 확인
    const variant1Path = `${testOutputDir}/variants/product_200w.webp`;
    const variant2Path = `${testOutputDir}/variants/product_400w.webp`;

    expect(existsSync(variant1Path)).toBe(true);
    expect(existsSync(variant2Path)).toBe(true);

    // 생성된 파일의 실제 내용 검증
    const variant1Data = await readFile(variant1Path);
    expect(variant1Data.length).toBeGreaterThan(0);
    expect(variant1Data.length).toBeLessThan(imageBuffer.length); // 최적화되어 더 작아야 함
  });

  it("should handle multiple format variants", async () => {
    // Given
    const imageBuffer = await readFile("test/fixtures/red-800x600.jpg");

    const input = {
      filename: "hero.jpg",
      bytes: new Uint8Array(imageBuffer),
      contentType: "image/jpeg",
    };

    // 정책: 다양한 포맷 생성
    const policy: Policy = () => ({
      variants: [
        { width: 300, format: "webp", quality: 80 },
        { width: 300, format: "avif", quality: 75 },
        { width: 300, format: "jpeg", quality: 85 },
      ],
    });

    const engine = new SharpEngine();
    const storage = new LocalStorage({
      baseDir: testOutputDir,
      baseUrl,
    });

    // When
    const manifest = await optimize({
      input,
      policy,
      engine,
      storage,
    });

    // Then: 3개의 다른 포맷이 생성되어야 함
    expect(manifest.variants).toHaveLength(3);

    const formats = manifest.variants.map((v) => v.format);
    expect(formats).toEqual(["webp", "avif", "jpeg"]);

    // 모든 파일이 실제로 존재하는지
    expect(existsSync(`${testOutputDir}/variants/hero_300w.webp`)).toBe(true);
    expect(existsSync(`${testOutputDir}/variants/hero_300w.avif`)).toBe(true);
    expect(existsSync(`${testOutputDir}/variants/hero_300w.jpeg`)).toBe(true);
  });

  it("should apply dynamic policy based in image size", async () => {
    // Given
    const imageBuffer = await readFile("test/fixtures/red-800x600.jpg");

    const input = {
      filename: "dynamic.jpg",
      bytes: new Uint8Array(imageBuffer),
      contentType: "image/jpeg",
    };

    // 동적 정책: 이미지 크기에 따라 다른 처리
    const policy: Policy = (ctx) => {
      if (ctx.width > 1000) {
        // 큰 이미지: 3개의 크기
        return {
          variants: [
            { width: 400, format: "webp" },
            { width: 800, format: "webp" },
            { width: 1200, format: "webp" },
          ],
        };
      } else {
        // 작은 이미지: 2개의 크기만
        return {
          variants: [
            { width: 200, format: "webp" },
            { width: 400, format: "webp" },
          ],
        };
      }
    };

    const engine = new SharpEngine();
    const storage = new LocalStorage({
      baseDir: testOutputDir,
      baseUrl,
    });

    // When
    const manifest = await optimize({
      input,
      policy,
      engine,
      storage,
    });

    // Then: 800px 이미지이므로 2개의 variant만 생성
    expect(manifest.variants).toHaveLength(2);
    expect(manifest.variants[0].width).toBe(200);
    expect(manifest.variants[1].width).toBe(400);
  });
});
