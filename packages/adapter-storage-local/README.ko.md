# @pixengine/adapter-storage-local

[English](README.md) | **한국어**

PixEngine을 위한 로컬 파일시스템 스토리지 어댑터입니다.

## 설치

```bash
npm install @pixengine/adapter-storage-local
# 또는
pnpm add @pixengine/adapter-storage-local
# 또는
yarn add @pixengine/adapter-storage-local
```

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
      { width: 800, format: 'webp', quality: 85 },
    ],
  }),
  engine: new SharpEngine(),
  storage: new LocalStorage({ // ✨ 로컬 디스크에 저장
    baseDir: './public/uploads',
    baseUrl: 'https://example.com/uploads',
  }),
});

console.log(manifest.variants[0].url);
// 'https://example.com/uploads/variants/photo_400w.webp'
```

## 주요 기능

- 💾 **로컬 파일시스템**: 디스크에 직접 이미지 저장
- 📁 **자동 디렉토리 생성**: 필요에 따라 중첩 디렉토리 생성
- 🔗 **URL 생성**: 저장된 이미지의 공개 URL 생성
- ⚡ **간단하고 빠름**: 외부 의존성이나 서비스 불필요

## API

### `LocalStorage`

`@pixengine/core`의 `StorageAdapter` 인터페이스를 구현합니다.

#### 생성자

```typescript
new LocalStorage(config: {
  baseDir: string;
  baseUrl: string;
})
```

**매개변수:**

- `baseDir: string` - 파일 저장을 위한 루트 디렉토리
  - 예: `'./public/uploads'`
  - 예: `'/var/www/static/images'`
- `baseUrl: string` - 저장된 파일 접근을 위한 기본 URL
  - 예: `'https://example.com/uploads'`
  - 예: `'http://localhost:3000/static/images'`

#### 메서드

##### `put(args)`

로컬 파일시스템에 이미지를 저장합니다.

```typescript
const result = await storage.put({
  key: 'variants/photo_800w.webp',
  bytes: imageBytes,
  contentType: 'image/webp',
  meta: {
    width: 800,
    height: 600,
    format: 'webp',
  },
});

console.log(result);
// { url: 'https://example.com/uploads/variants/photo_800w.webp' }
```

**매개변수:**

- `key: string` - `baseDir` 기준 상대 파일 경로
- `bytes: Uint8Array` - 이미지 데이터
- `contentType: string` - MIME 타입
- `meta` - 이미지 메타데이터 (향후 사용)

**반환값:** `Promise<{ url: string }>`

## 파일 구조

LocalStorage는 파일을 자동으로 구성합니다:

```
baseDir/
├── original/
│   └── photo.jpg          # 원본 이미지
└── variants/
    ├── photo_400w.webp    # 생성된 변형들
    └── photo_800w.webp
```

## 예제

### Express.js 통합

```typescript
import express from 'express';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';
import multer from 'multer';

const app = express();
const upload = multer();

app.post('/upload', upload.single('image'), async (req, res) => {
  const manifest = await optimize({
    input: {
      filename: req.file.originalname,
      bytes: new Uint8Array(req.file.buffer),
      contentType: req.file.mimetype,
    },
    policy: (ctx) => ({
      variants: [
        { width: 400, format: 'webp', quality: 80 },
        { width: 800, format: 'webp', quality: 85 },
      ],
    }),
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: './public/uploads',
      baseUrl: `${req.protocol}://${req.get('host')}/uploads`,
    }),
  });

  res.json(manifest);
});

// 정적 파일 제공
app.use('/uploads', express.static('./public/uploads'));

app.listen(3000);
```

### Next.js 통합

```typescript
// app/api/upload/route.ts
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('image') as File;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const manifest = await optimize({
    input: {
      filename: file.name,
      bytes,
      contentType: file.type,
    },
    policy: (ctx) => ({
      variants: [
        { width: 400, format: 'webp', quality: 80 },
        { width: 800, format: 'webp', quality: 85 },
      ],
    }),
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: './public/uploads',
      baseUrl: '/uploads',
    }),
  });

  return Response.json(manifest);
}
```

## 프로덕션 고려사항

### 보안

- **파일 경로 검증**: `baseDir`이 적절히 샌드박스화되었는지 확인
- **파일 크기 제한**: 업로드 크기 제한 사용
- **파일명 정제**: 특수 문자 제거

### 성능

- **CDN 사용**: 더 나은 성능을 위해 CDN을 통해 파일 제공
- **캐싱 설정**: 적절한 캐시 헤더 구성
- **객체 스토리지 고려**: 대규모 애플리케이션의 경우 S3 호환 스토리지 고려

### 파일 시스템

- **디스크 공간**: 사용 가능한 디스크 공간 모니터링
- **백업**: 스토리지 디렉토리의 정기적인 백업
- **권한**: 적절한 파일/디렉토리 권한 확인

## 사용 시기

LocalStorage가 이상적인 경우:

- ✅ 개발 및 테스트
- ✅ 소규모~중규모 애플리케이션
- ✅ 단일 서버 배포
- ✅ 예측 가능한 스토리지 요구사항을 가진 애플리케이션

클라우드 스토리지(S3 등)를 고려해야 하는 경우:

- ❌ 대규모 애플리케이션
- ❌ 다중 서버 배포
- ❌ CDN 통합이 필요한 애플리케이션
- ❌ 분산 시스템

## 요구사항

- Node.js >= 18.0.0
- `baseDir`에 대한 쓰기 권한

## 라이선스

MIT © PixEngine Team

## 링크

- [PixEngine Core](https://www.npmjs.com/package/@pixengine/core)
- [GitHub 저장소](https://github.com/pixengine/pixengine)
- [이슈 트래커](https://github.com/pixengine/pixengine/issues)
