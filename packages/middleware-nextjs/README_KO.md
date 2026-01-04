# @pixengine/middleware-nextjs

[English](README.md) | **한국어**

PixEngine 이미지 최적화를 위한 Next.js App Router 핸들러입니다.

## 설치

```bash
npm install @pixengine/middleware-nextjs @pixengine/core
# 또는
pnpm add @pixengine/middleware-nextjs @pixengine/core
# 또는
yarn add @pixengine/middleware-nextjs @pixengine/core
```

## 빠른 시작

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

export const POST = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
  }),
});
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
      "url": "/uploads/variants/photo_400w.webp",
      "width": 400,
      "height": 225,
      "format": "webp",
      "bytes": 8420
    },
    {
      "key": "variants/photo_800w.webp",
      "url": "/uploads/variants/photo_800w.webp",
      "width": 800,
      "height": 450,
      "format": "webp",
      "bytes": 24680
    },
    {
      "key": "variants/photo_1200w.webp",
      "url": "/uploads/variants/photo_1200w.webp",
      "width": 1200,
      "height": 675,
      "format": "webp",
      "bytes": 48920
    }
  ]
}
```

## 주요 기능

- 🚀 **Next.js App Router**: Next.js 14+ App Router를 위해 설계됨
- 📤 **FormData 지원**: 네이티브 FormData 파일 업로드와 작동
- 🎨 **자동 최적화**: 반응형 이미지 변형을 자동으로 생성
- 📦 **기본 정책**: 합리적인 기본값 (400w, 800w, 1200w WebP 이미지)
- ⚙️ **커스터마이징**: 커스텀 이미지 변형을 위한 정책 오버라이드
- 🔒 **타입 안전성**: 완벽한 TypeScript 지원
- ✅ **자동 JSON 응답**: manifest를 클라이언트에 직접 반환
- ⚡ **Edge Runtime 호환**: Edge Runtime과 호환 (호환 가능한 어댑터 사용 시)

## API

### `pixEngineHandler(config)`

이미지 최적화를 위한 Next.js Route Handler를 생성하는 팩토리 함수입니다.

#### 파라미터

```typescript
interface PixEngineHandlerConfig {
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

`(request: Request) => Promise<Response>` - Next.js Route Handler 함수

### 기본 정책

핸들러는 기본 반응형 이미지 정책을 제공합니다:

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
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

export const POST = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
  }),
});
```

### 커스텀 정책

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

export const POST = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
  }),
  policy: (ctx) => ({
    variants: [
      { width: 200, format: 'webp', quality: 75 },
      { width: 600, format: 'webp', quality: 80 },
      { width: 1000, format: 'jpeg', quality: 85 },
    ],
  }),
});
```

### 컨텍스트 기반 정책

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

export const POST = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
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
});
```

### 클라이언트 측 업로드 예제

```typescript
// app/upload/page.tsx
'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [manifest, setManifest] = useState(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setManifest(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" name="image" accept="image/*" />
        <button type="submit">업로드</button>
      </form>

      {manifest && (
        <div>
          <h2>최적화된 이미지:</h2>
          {manifest.variants.map((variant) => (
            <img key={variant.url} src={variant.url} alt="최적화됨" />
          ))}
        </div>
      )}
    </div>
  );
}
```

## 에러 처리

핸들러는 에러를 자동으로 처리합니다:

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

핸들러를 래핑하여 커스텀 에러 처리를 추가할 수 있습니다:

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const handler = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
  }),
});

export async function POST(request: Request) {
  try {
    return await handler(request);
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}
```

## 요구사항

- **Node.js**: >= 18.0.0
- **Next.js**: ^14.0.0 || ^15.0.0
- **PixEngine Core**: @pixengine/core
- **Transform Engine**: 예: @pixengine/adapter-engine-sharp
- **Storage Adapter**: 예: @pixengine/adapter-storage-local

## 작동 방식

1. **클라이언트가 파일 업로드** FormData를 통해
2. **Next.js Route Handler**가 Request를 받음
3. **파일 추출** FormData에서
4. **`optimize()` 호출** 설정된 engine, storage, policy와 함께
5. **manifest를 JSON Response로 자동 반환**

```
클라이언트 → FormData → Next.js Route Handler → optimize() → Storage → JSON 응답
```

## 다른 스토리지 어댑터와 통합

### AWS S3 Storage

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { S3Storage } from '@pixengine/adapter-storage-s3';

export const POST = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new S3Storage({
    bucket: 'my-images',
    region: 'us-east-1',
    baseUrl: 'https://cdn.example.com',
  }),
});
```

### Cloudflare R2

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { R2Storage } from '@pixengine/adapter-storage-r2';

export const POST = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new R2Storage({
    accountId: 'your-account-id',
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: 'my-images',
  }),
});
```

## 모범 사례

### 1. 환경 변수 사용

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

export const POST = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: process.env.UPLOAD_DIR || './public/uploads',
    baseUrl: process.env.BASE_URL || '/uploads',
  }),
});
```

### 2. 파일 크기 제한 추가

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const handler = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
  }),
});

export async function POST(request: Request) {
  const contentLength = request.headers.get('content-length');
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > MAX_SIZE) {
    return Response.json(
      { error: '파일이 너무 큽니다', maxSize: '10MB' },
      { status: 413 }
    );
  }

  return handler(request);
}
```

### 3. 파일 타입 검증

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const handler = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
  }),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('image');

  if (!file || !(file instanceof File)) {
    return Response.json({ error: '파일이 업로드되지 않았습니다' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: '유효하지 않은 파일 타입입니다', allowedTypes },
      { status: 400 }
    );
  }

  return handler(request);
}
```

### 4. 적절한 CORS 헤더 설정

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { LocalStorage } from '@pixengine/adapter-storage-local';

const handler = pixEngineHandler({
  engine: new SharpEngine(),
  storage: new LocalStorage({
    baseDir: './public/uploads',
    baseUrl: '/uploads',
  }),
});

export async function POST(request: Request) {
  const response = await handler(request);

  // 필요한 경우 CORS 헤더 추가
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

  return response;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

### 5. Edge Runtime 사용 (호환 가능한 어댑터와 함께)

```typescript
// app/api/upload/route.ts
import { pixEngineHandler } from '@pixengine/middleware-nextjs';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { S3Storage } from '@pixengine/adapter-storage-s3';

export const runtime = 'edge';

export const POST = pixEngineHandler({
  engine: new SharpEngine(), // 참고: Sharp는 Edge에서 작동하지 않을 수 있습니다. 호환 가능한 엔진을 사용하세요
  storage: new S3Storage({
    bucket: 'my-images',
    region: 'us-east-1',
    baseUrl: 'https://cdn.example.com',
  }),
});
```

## Express 미들웨어와 비교

| 기능 | Next.js Handler | Express Middleware |
|------|----------------|-------------------|
| API | Route Handler | 미들웨어 함수 |
| Request 타입 | Web API `Request` | Express `Request` |
| Response 타입 | Web API `Response` | Express `Response` |
| 파일 업로드 | FormData | Multer |
| 런타임 | Node.js / Edge | Node.js만 |
| 프레임워크 | Next.js 14+ | Express 4+ / 5+ |

## 라이선스

MIT © PixEngine Team

## 링크

- [PixEngine Core](https://www.npmjs.com/package/@pixengine/core)
- [Sharp Engine Adapter](https://www.npmjs.com/package/@pixengine/adapter-engine-sharp)
- [Local Storage Adapter](https://www.npmjs.com/package/@pixengine/adapter-storage-local)
- [Express Middleware](https://www.npmjs.com/package/@pixengine/middleware-express)
- [GitHub Repository](https://github.com/pixengine/pixengine)
- [Issue Tracker](https://github.com/pixengine/pixengine/issues)
