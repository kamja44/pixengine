# @pixengine/adapter-storage-r2

[English](README.md) | **한국어**

PixEngine을 위한 Cloudflare R2 스토리지 어댑터입니다.

## 설치

```bash
npm install @pixengine/adapter-storage-r2 @pixengine/core
# 또는
pnpm add @pixengine/adapter-storage-r2 @pixengine/core
# 또는
yarn add @pixengine/adapter-storage-r2 @pixengine/core
```

## 빠른 시작

```typescript
import { R2Storage } from '@pixengine/adapter-storage-r2';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new R2Storage({
  accountId: 'your-account-id',
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucket: 'my-images',
  baseUrl: 'https://pub-xxxxx.r2.dev',
});

const engine = new SharpEngine();

const manifest = await optimize({
  input: {
    filename: 'photo.jpg',
    bytes: imageBytes,
    contentType: 'image/jpeg',
  },
  policy: (ctx) => ({
    variants: [
      { width: 400, format: 'webp', quality: 80 },
      { width: 800, format: 'webp', quality: 85 },
    ],
  }),
  engine,
  storage,
});

console.log(manifest.variants[0].url);
// https://pub-xxxxx.r2.dev/variants/photo_400w.webp
```

## API

### `new R2Storage(config)`

새로운 R2 스토리지 어댑터 인스턴스를 생성합니다.

#### 설정

```typescript
interface R2StorageConfig {
  accountId: string;           // 필수: Cloudflare 계정 ID
  accessKeyId: string;         // 필수: R2 액세스 키 ID
  secretAccessKey: string;     // 필수: R2 시크릿 액세스 키
  bucket: string;              // 필수: R2 버킷 이름
  baseUrl: string;             // 필수: 생성된 URL의 기본 URL
}
```

**필수:**
- `accountId: string` - Cloudflare 계정 ID
- `accessKeyId: string` - R2 API 토큰 액세스 키 ID
- `secretAccessKey: string` - R2 API 토큰 시크릿 액세스 키
- `bucket: string` - 이미지가 저장될 R2 버킷 이름
- `baseUrl: string` - 이미지 URL 생성을 위한 기본 URL (R2.dev 도메인 또는 커스텀 도메인)

#### 메서드

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

R2에 파일을 업로드하고 공개 URL을 반환합니다.

## 모범 사례

### 환경 변수 사용

자격 증명을 하드코딩하지 마세요:

```typescript
const storage = new R2Storage({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucket: process.env.R2_BUCKET!,
  baseUrl: process.env.R2_BASE_URL!,
});
```

Cloudflare R2 설정, 버킷 생성, API 토큰, 공개 액세스, 커스텀 도메인에 대해서는 [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)를 참조하세요.

## 에러 처리

어댑터는 다음 경우에 에러를 발생시킵니다:

- **필수 설정 누락**: `accountId`, `bucket`, 또는 `baseUrl`이 제공되지 않음
- **R2 API 에러**: 업로드 실패, 인증 에러 등

```typescript
try {
  const result = await storage.put({
    key: 'uploads/image.jpg',
    bytes: imageBytes,
    contentType: 'image/jpeg',
    meta: { width: 1920, height: 1080, format: 'jpeg' },
  });
  console.log('업로드됨:', result.url);
} catch (error) {
  console.error('R2 업로드 실패:', error);
}
```

## 요구사항

- **Node.js**: >= 18.0.0
- **Cloudflare 계정**: R2 액세스 필요
- **AWS SDK**: @aws-sdk/client-s3 (의존성으로 포함)
- **PixEngine Core**: @pixengine/core

## 라이선스

MIT © PixEngine Team
