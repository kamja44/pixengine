# @pixengine/adapter-storage-s3

[English](README.md) | **한국어**

PixEngine을 위한 AWS S3 스토리지 어댑터입니다.

## 설치

```bash
npm install @pixengine/adapter-storage-s3 @pixengine/core
# 또는
pnpm add @pixengine/adapter-storage-s3 @pixengine/core
# 또는
yarn add @pixengine/adapter-storage-s3 @pixengine/core
```

## 빠른 시작

```typescript
import { S3Storage } from '@pixengine/adapter-storage-s3';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new S3Storage({
  bucket: 'my-images',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: 'https://my-images.s3.amazonaws.com',
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
// https://my-images.s3.amazonaws.com/variants/photo_400w.webp
```

## API

### `new S3Storage(config)`

새로운 S3 스토리지 어댑터 인스턴스를 생성합니다.

#### 설정

```typescript
interface S3StorageConfig {
  bucket: string;              // 필수: S3 버킷 이름
  region: string;              // 필수: AWS 리전 (예: 'us-east-1')
  accessKeyId?: string;        // 선택: AWS 액세스 키 ID
  secretAccessKey?: string;    // 선택: AWS 시크릿 액세스 키
  baseUrl: string;             // 필수: 생성된 URL의 기본 URL
}
```

**필수:**
- `bucket: string` - 이미지가 저장될 S3 버킷 이름
- `region: string` - AWS 리전 (예: `'us-east-1'`, `'ap-northeast-2'`)
- `baseUrl: string` - 이미지 URL 생성을 위한 기본 URL (S3 URL 또는 CDN URL)

**선택:**
- `accessKeyId?: string` - AWS 액세스 키 ID (제공되지 않으면 IAM 역할 사용)
- `secretAccessKey?: string` - AWS 시크릿 액세스 키 (제공되지 않으면 IAM 역할 사용)

#### 메서드

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

S3에 파일을 업로드하고 공개 URL을 반환합니다.

## 모범 사례

### 환경 변수 사용

코드에 자격 증명을 하드코딩하지 마세요:

```typescript
const storage = new S3Storage({
  bucket: process.env.S3_BUCKET!,
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: process.env.S3_BASE_URL!,
});
```

AWS 설정, 버킷 정책, IAM 역할, CloudFront 구성에 대해서는 [AWS S3 문서](https://docs.aws.amazon.com/ko_kr/s3/)를 참조하세요.

## 에러 처리

어댑터는 다음 경우에 에러를 발생시킵니다:

- **필수 설정 누락**: `bucket`, `region`, 또는 `baseUrl`이 제공되지 않음
- **AWS API 에러**: S3 업로드 실패, 인증 에러 등

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
  console.error('S3 업로드 실패:', error);
}
```

## 요구사항

- **Node.js**: >= 18.0.0
- **AWS 계정**: S3 액세스 필요
- **AWS SDK**: @aws-sdk/client-s3 (의존성으로 포함)
- **PixEngine Core**: @pixengine/core

## 라이선스

MIT © PixEngine Team
