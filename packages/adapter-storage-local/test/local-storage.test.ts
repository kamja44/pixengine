import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalStorage } from "../src/index.js";
import { rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

describe("LocalStorage", () => {
  const testDir = "./test-uploads";
  const baseUrl = "http://localhost:3000/uploads";

  beforeEach(async () => {
    // 테스트 전 정리
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // 테스트 후 정리
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  it("should save file to local filesystem", async () => {
    // Given
    const storage = new LocalStorage({
      baseDir: testDir,
      baseUrl,
    });

    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    // When
    const result = await storage.put({
      key: "test/image.png",
      bytes: testData,
      contentType: "image/png",
      meta: {
        width: 100,
        height: 100,
        format: "png",
      },
    });

    // Then
    expect(result.url).toBe(`${baseUrl}/test/image.png`);

    // 파일이 실제로 저장되었는지 확인
    const savedData = await readFile(`${testDir}/test/image.png`);
    expect(new Uint8Array(savedData)).toEqual(testData);
  });

  it("should create nested directories automatically", async () => {
    // Given
    const storage = new LocalStorage({
      baseDir: testDir,
      baseUrl,
    });

    // When
    await storage.put({
      key: "a/b/c/deep.png",
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
      meta: { width: 1, height: 1, format: "png" },
    });

    // Then
    expect(existsSync(`${testDir}/a/b/c/deep.png`)).toBe(true);
  });

  it("should handle files without directory path", async () => {
    // Given
    const storage = new LocalStorage({
      baseDir: testDir,
      baseUrl,
    });

    // When
    const result = await storage.put({
      key: "root.png",
      bytes: new Uint8Array([9, 8, 7]),
      contentType: "image/png",
      meta: { width: 1, height: 1, format: "png" },
    });

    // Then
    expect(result.url).toBe(`${baseUrl}/root.png`);
    expect(existsSync(`${testDir}/root.png`)).toBe(true);
  });
});
