# @pixengine/adapter-engine-sharp

[English](README.md) | **한국어**

PixEngine을 위한 Sharp 기반 이미지 처리 어댑터입니다.

## 설치

```bash
npm install @pixengine/adapter-engine-sharp sharp
# 또는
pnpm add @pixengine/adapter-engine-sharp sharp
# 또는
yarn add @pixengine/adapter-engine-sharp sharp
```

**참고:** `sharp`는 peer dependency이므로 별도로 설치해야 합니다.

## 사용법

```typescript
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const manifest = await optimize({
  input: {
    filename: 'photo.jpg',
    bytes: imageBuffer,
    contentType: 'image/jpeg',
  },
  policy: (ctx) => ({
    variants: [
      { width: 400, format: 'webp', quality: 80 },
      { width: 800, format: 'avif', quality: 85 },
    ],
  }),
  engine: new SharpEngine(), // ✨ Sharp를 사용한 처리
  storage: new LocalStorage({
    baseDir: './uploads',
    baseUrl: 'https://example.com/uploads',
  }),
});
```

## 주요 기능

- ✨ **고성능**: Node.js에서 가장 빠른 이미지 처리 라이브러리인 [Sharp](https://sharp.pixelplumbing.com/) 기반
- 🎨 **다양한 포맷**: WebP, AVIF, JPEG, PNG 지원
- 📏 **스마트 리사이징**: 자동 종횡비 유지
- 🎛️ **품질 제어**: 포맷별 품질 설정
- 🔍 **메타데이터 추출**: 이미지 크기 및 포맷 탐지

## 지원 포맷

### 입력 포맷

- JPEG
- PNG
- WebP
- AVIF
- GIF
- SVG
- TIFF

### 출력 포맷

- **WebP**: 우수한 압축률을 가진 현대적 포맷
- **AVIF**: 뛰어난 압축률을 가진 차세대 포맷
- **JPEG**: 범용 호환성
- **PNG**: 무손실 압축

## API

### `SharpEngine`

`@pixengine/core`의 `TransformEngine` 인터페이스를 구현합니다.

#### 메서드

##### `probe(input: PixEngineInput)`

처리 없이 이미지 메타데이터를 추출합니다.

```typescript
const engine = new SharpEngine();
const metadata = await engine.probe({
  filename: 'photo.jpg',
  bytes: imageBuffer,
  contentType: 'image/jpeg',
});

console.log(metadata);
// { width: 1920, height: 1080, format: 'jpeg' }
```

##### `transform(args)`

이미지를 처리하고 변환합니다.

```typescript
const result = await engine.transform({
  input: {
    filename: 'photo.jpg',
    bytes: imageBuffer,
    contentType: 'image/jpeg',
  },
  width: 800,
  format: 'webp',
  quality: 80,
});

console.log(result);
// {
//   bytes: Uint8Array(...),
//   width: 800,
//   height: 450,
//   format: 'webp'
// }
```

**매개변수:**

- `input: PixEngineInput` - 소스 이미지
- `width?: number` - 목표 너비 (종횡비 유지)
- `height?: number` - 목표 높이 (종횡비 유지)
- `format?: 'webp' | 'avif' | 'jpeg' | 'png'` - 출력 포맷
- `quality?: number` - 품질 (1-100)

## 성능

Sharp는 libvips를 기반으로 하며, ImageMagick 및 GraphicsMagick보다 4-5배 빠릅니다:

- 스트리밍 및 병렬 처리 사용
- 최소한의 메모리 요구
- SIMD 연산 지원
- 프로덕션 환경에서 검증됨

## 요구사항

- Node.js >= 18.0.0
- sharp >= 0.33.0

## 라이선스

MIT © PixEngine Team

## 링크

- [PixEngine Core](https://www.npmjs.com/package/@pixengine/core)
- [Sharp 문서](https://sharp.pixelplumbing.com/)
- [GitHub 저장소](https://github.com/pixengine/pixengine)
- [이슈 트래커](https://github.com/pixengine/pixengine/issues)
