# @pixengine/middleware-express

[English](README.md) | **한국어**

PixEngine 이미지 최적화를 위한 Express.js 미들웨어입니다.

## 설치

```bash
npm install @pixengine/middleware-express @pixengine/core
# 또는
pnpm add @pixengine/middleware-express @pixengine/core
# 또는
yarn add @pixengine/middleware-express @pixengine/core
```

## 빠른 시작

```typescript
import express from 'express';
import multer from 'multer';
import { pixEngineMiddleware } from '@pixengine/middleware-express';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware({
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: './public/uploads',
      baseUrl: 'http://localhost:3000/uploads',
    }),
  })
);

app.use('/uploads', express.static('./public/uploads'));
app.listen(3000);
```

**응답:**
```json
{
  "original": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "bytes": 245760
  },
  "variants": [
    {
      "key": "variants/photo_400w.webp",
      "url": "http://localhost:3000/uploads/variants/photo_400w.webp",
      "width": 400,
      "height": 225,
      "format": "webp",
      "bytes": 8420
    },
    {
      "key": "variants/photo_800w.webp",
      "url": "http://localhost:3000/uploads/variants/photo_800w.webp",
      "width": 800,
      "height": 450,
      "format": "webp",
      "bytes": 24680
    },
    {
      "key": "variants/photo_1200w.webp",
      "url": "http://localhost:3000/uploads/variants/photo_1200w.webp",
      "width": 1200,
      "height": 675,
      "format": "webp",
      "bytes": 48920
    }
  ]
}
```

## 주요 기능

- 🚀 **손쉬운 통합**: 간단한 팩토리 함수 패턴
- 📤 **Multer 통합**: multer 파일 업로드와 완벽하게 작동
- 🎨 **자동 최적화**: 반응형 이미지 변형을 자동으로 생성
- 📦 **기본 정책**: 합리적인 기본값 (400w, 800w, 1200w WebP 이미지)
- ⚙️ **커스터마이징**: 커스텀 이미지 변형을 위한 정책 오버라이드
- 🔒 **타입 안전성**: 완벽한 TypeScript 지원
- ✅ **자동 JSON 응답**: manifest를 클라이언트에 직접 반환

## API

### `pixEngineMiddleware(config)`

이미지 최적화를 위한 Express 미들웨어를 생성하는 팩토리 함수입니다.

#### 파라미터

```typescript
interface PixEngineMiddlewareConfig {
  engine: TransformEngine;    // 필수: 이미지 처리 엔진
  storage: StorageAdapter;     // 필수: 스토리지 어댑터
  policy?: Policy;             // 선택: 커스텀 변형 정책
}
```

**필수:**
- `engine: TransformEngine` - 이미지 처리 엔진 (예: `SharpEngine`)
- `storage: StorageAdapter` - 스토리지 어댑터 (예: `LocalStorage`, S3 등)

**선택:**
- `policy?: Policy` - 이미지 변형을 정의하는 커스텀 정책 함수

#### 반환값

`RequestHandler` - Express 미들웨어 함수

### 기본 정책

미들웨어는 기본 반응형 이미지 정책을 제공합니다:

```typescript
export const defaultPolicy: Policy = (ctx) => ({
  variants: [
    { width: 400, format: 'webp', quality: 80 },
    { width: 800, format: 'webp', quality: 85 },
    { width: 1200, format: 'webp', quality: 90 },
  ],
});
```

반응형 웹 이미지에 적합한 세 가지 너비의 WebP 변형을 생성합니다.

## 사용 예제

### 기본 정책 사용

```typescript
import express from 'express';
import multer from 'multer';
import { pixEngineMiddleware } from '@pixengine/middleware-express';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware({
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: './public/uploads',
      baseUrl: 'http://localhost:3000/uploads',
    }),
  })
);

app.use('/uploads', express.static('./public/uploads'));
app.listen(3000);
```

### 커스텀 정책

```typescript
import { pixEngineMiddleware } from '@pixengine/middleware-express';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware({
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: './public/uploads',
      baseUrl: 'http://localhost:3000/uploads',
    }),
    policy: (ctx) => ({
      variants: [
        { width: 200, format: 'webp', quality: 75 },
        { width: 600, format: 'webp', quality: 80 },
        { width: 1000, format: 'jpeg', quality: 85 },
      ],
    }),
  })
);
```

### 컨텍스트 기반 정책

```typescript
app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware({
    engine: new SharpEngine(),
    storage: new LocalStorage({
      baseDir: './public/uploads',
      baseUrl: 'http://localhost:3000/uploads',
    }),
    policy: (ctx) => {
      // 원본 이미지 메타데이터 접근
      const { width, height, format } = ctx.original;

      // 원본 크기에 따라 변형 생성
      if (width > 2000) {
        return {
          variants: [
            { width: 800, format: 'webp', quality: 80 },
            { width: 1600, format: 'webp', quality: 85 },
            { width: 2400, format: 'webp', quality: 90 },
          ],
        };
      }

      // 작은 원본은 더 적은 변형 생성
      return {
        variants: [
          { width: 400, format: 'webp', quality: 80 },
          { width: 800, format: 'webp', quality: 85 },
        ],
      };
    },
  })
);
```

### TypeScript 사용

```typescript
import type { Request, Response, NextFunction } from 'express';
import { pixEngineMiddleware } from '@pixengine/middleware-express';
import type { PixEngineMiddlewareConfig } from '@pixengine/middleware-express';

const config: PixEngineMiddlewareConfig = {
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: 'http://localhost:3000/uploads',
  }),
};

app.post('/upload', upload.single('image'), pixEngineMiddleware(config));
```

## 에러 처리

미들웨어는 에러를 자동으로 처리합니다:

### 400 Bad Request
파일이 업로드되지 않았을 때 반환:

```json
{
  "error": "No file uploaded"
}
```

### 500 Internal Server Error
최적화가 실패했을 때 반환:

```json
{
  "error": "Image optimization failed",
  "message": "Unsupported image format"
}
```

### 커스텀 에러 처리

PixEngine 미들웨어 뒤에 자체 에러 처리 미들웨어를 추가할 수 있습니다:

```typescript
app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware(config),
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Upload error:', err);
    res.status(500).json({
      error: 'Upload failed',
      details: err.message,
    });
  }
);
```

## 요구사항

- **Node.js**: >= 18.0.0
- **Express**: ^4.18.0 || ^5.0.0
- **Multer**: 파일 업로드 처리용 (사용자 제공)
- **PixEngine Core**: @pixengine/core
- **Transform Engine**: 예: @pixengine/adapter-engine-sharp
- **Storage Adapter**: 예: @pixengine/adapter-storage-local

## 작동 방식

1. **사용자가 파일 업로드** multer 미들웨어를 통해
2. **PixEngine 미들웨어**가 `req.file`을 받음
3. **이미지 데이터 추출** (filename, bytes, contentType)
4. **`optimize()` 호출** 설정된 engine, storage, policy와 함께
5. **manifest를 JSON 응답으로 자동 반환**

```
클라이언트 → Multer → PixEngine 미들웨어 → optimize() → Storage → JSON 응답
```

## 다른 스토리지 어댑터와 통합

### AWS S3 Storage

```typescript
import { S3Storage } from '@pixengine/adapter-storage-s3';

app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware({
    engine: new SharpEngine(),
    storage: new S3Storage({
      bucket: 'my-images',
      region: 'us-east-1',
      baseUrl: 'https://cdn.example.com',
    }),
  })
);
```

### Cloudflare R2

```typescript
import { R2Storage } from '@pixengine/adapter-storage-r2';

app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware({
    engine: new SharpEngine(),
    storage: new R2Storage({
      accountId: 'your-account-id',
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: 'my-images',
    }),
  })
);
```

## 모범 사례

### 1. Multer에 메모리 스토리지 사용

```typescript
const upload = multer({ storage: multer.memoryStorage() });
```

업로드된 파일을 메모리에 유지하므로 PixEngine이 즉시 처리할 수 있습니다.

### 2. 파일 크기 제한 추가

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
```

### 3. 파일 타입 검증

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 허용됩니다'));
    }
  },
});
```

### 4. 적절한 baseUrl 설정

프로덕션에서는 CDN이나 도메인을 사용하세요:

```typescript
storage: new LocalStorage({
  baseDir: './public/uploads',
  baseUrl: process.env.CDN_URL || 'https://cdn.example.com/uploads',
})
```

### 5. 환경 변수 사용

```typescript
const config: PixEngineMiddlewareConfig = {
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: process.env.UPLOAD_DIR || './public/uploads',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000/uploads',
  }),
};
```

## 라이선스

MIT © PixEngine Team

## 링크

- [PixEngine Core](https://www.npmjs.com/package/@pixengine/core)
- [Sharp Engine Adapter](https://www.npmjs.com/package/@pixengine/adapter-engine-sharp)
- [Local Storage Adapter](https://www.npmjs.com/package/@pixengine/adapter-storage-local)
- [GitHub Repository](https://github.com/pixengine/pixengine)
- [Issue Tracker](https://github.com/pixengine/pixengine/issues)
