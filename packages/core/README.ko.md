# @pixengine/core

[English](README.md) | **한국어**

현대적인 웹 애플리케이션을 위한 정책 기반 이미지 최적화 엔진입니다.

## 설치

```bash
npm install @pixengine/core
# 또는
pnpm add @pixengine/core
# 또는
yarn add @pixengine/core
```

## 빠른 시작

```typescript
import { optimize } from "@pixengine/core";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";

const manifest = await optimize({
  input: {
    filename: "photo.jpg",
    bytes: imageBuffer,
    contentType: "image/jpeg",
  },
  policy: (ctx) => ({
    variants: [
      { width: 400, format: "webp", quality: 80 },
      { width: 800, format: "webp", quality: 85 },
    ],
  }),
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: "./uploads",
    baseUrl: "https://example.com/uploads",
  }),
});

console.log(manifest);
// {
//   original: { width: 1920, height: 1080, format: 'jpeg', bytes: 524288 },
//   variants: [
//     { key: 'variants/photo_400w.webp', url: '...', width: 400, ... },
//     { key: 'variants/photo_800w.webp', url: '...', width: 800, ... }
//   ]
// }
```

## 주요 기능

- 🎯 **정책 우선 아키텍처**: 실행 가능한 함수로 최적화 전략 정의
- 🔌 **플러그형 어댑터**: 코드 변경 없이 엔진 및 스토리지 백엔드 교체
- 📦 **자동 변형 관리**: 단일 소스에서 여러 형식 및 크기 생성
- 📊 **포괄적인 메타데이터**: 크기, 형식, URL 정보가 포함된 전체 매니페스트
- 🚀 **TypeScript 네이티브**: 완전한 타입 안전성 및 IntelliSense 지원

## 핵심 개념

### 정책 (Policy)

정책은 생성할 이미지 변형을 결정하는 함수입니다. 이미지 메타데이터를 포함한 컨텍스트 객체를 전달받습니다:

```typescript
import { Policy } from "@pixengine/core";

const responsivePolicy: Policy = (ctx) => {
  // ctx 포함 정보:
  // - width, height, bytes, format: 기본 이미지 정보
  // - filename, contentType: 파일 정보
  // - metadata: 리치 메타데이터 (hasAlpha, space, density, exif 등)

  const variants = [];

  if (ctx.width > 1200) {
    variants.push({ width: 1200, format: "webp", quality: 85 });
  }
  if (ctx.width > 800) {
    variants.push({ width: 800, format: "webp", quality: 80 });
  }
  variants.push({ width: 400, format: "webp", quality: 75 });

  return { variants };
};
```

### TransformEngine

이미지 처리 엔진을 위한 인터페이스:

```typescript
interface TransformEngine {
  probe(input: PixEngineInput): Promise<{
    width: number;
    height: number;
    format: string;
    // ...기타 메타데이터
  }>;

  transform(args: {
    input: PixEngineInput;
    width?: number;
    height?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
    quality?: number;
  }): Promise<{
    bytes: Uint8Array;
    width: number;
    height: number;
    format: string;
  }>;
}
```

### StorageAdapter

스토리지 백엔드를 위한 인터페이스:

```typescript
interface StorageAdapter {
  put(args: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    meta: { width: number; height: number; format: string };
  }): Promise<{ url: string }>;
}
```

## API 레퍼런스

### `optimize(options)`

메인 오케스트레이션 함수입니다.

**매개변수:**

- `input: PixEngineInput` - 소스 이미지 데이터
  - `filename: string` - 원본 파일명
  - `bytes: Uint8Array` - 이미지 데이터
  - `contentType: string` - MIME 타입
- `policy: Policy` - 최적화 전략 함수
- `engine: TransformEngine` - 이미지 처리 엔진
- `storage: StorageAdapter` - 스토리지 백엔드

**반환값:** `Promise<Manifest>`

- `original` - 원본 이미지 메타데이터
- `variants` - URL이 포함된 생성된 변형 배열

### `generatePicture(manifest, options)`

`Manifest`를 반응형 `<picture>` HTML 문자열로 변환합니다.

**매개변수:**

- `manifest: Manifest` - `optimize()`의 결과물
- `options: PictureOptions`
  - `alt: string` - 대체 텍스트 (필수)
  - `sizes?: string` - 반응형 sizes 속성
  - `className?: string` - CSS 클래스명
  - `loading?: "lazy" | "eager"`
  - `decoding?: "async" | "sync" | "auto"`
  - `fallbackFormat?: string`

**반환값:** `string` (HTML)

## 생태계 (Ecosystem)

### 어댑터 (Adapters)

- [`@pixengine/adapter-engine-sharp`](https://www.npmjs.com/package/@pixengine/adapter-engine-sharp) - Sharp 기반 이미지 처리
- [`@pixengine/adapter-storage-local`](https://www.npmjs.com/package/@pixengine/adapter-storage-local) - 로컬 파일시스템 스토리지
- [`@pixengine/adapter-storage-s3`](https://www.npmjs.com/package/@pixengine/adapter-storage-s3) - AWS S3 스토리지
- `@pixengine/adapter-storage-r2` - Cloudflare R2 스토리지
- `@pixengine/adapter-storage-gcs` - Google Cloud Storage
- `@pixengine/adapter-storage-azure` - Azure Blob Storage

### 미들웨어 (Middleware)

- `@pixengine/middleware-express` - Express.js 미들웨어
- `@pixengine/middleware-nextjs` - Next.js App Router 핸들러
- `@pixengine/middleware-jit` - 온디맨드(JIT) 이미지 변환 미들웨어

## 예제

완전한 작동 예제는 [examples 디렉토리](https://github.com/pixengine/pixengine/tree/main/examples)를 참조하세요.

## 라이선스

MIT © PixEngine Team

## 링크

- [GitHub 저장소](https://github.com/pixengine/pixengine)
- [이슈 트래커](https://github.com/pixengine/pixengine/issues)
- [변경 로그](https://github.com/pixengine/pixengine/blob/main/CHANGELOG.md)
