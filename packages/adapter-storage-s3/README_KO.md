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

## 주요 기능

- ✅ **AWS S3 통합**: S3 버킷에 이미지를 직접 업로드
- 🔐 **유연한 인증**: 액세스 키 또는 IAM 역할 지원
- 🌐 **CDN 지원**: CloudFront 또는 다른 CDN을 위한 커스텀 baseUrl 설정
- 🚀 **AWS SDK v3**: 모듈식 아키텍처를 가진 최신 AWS SDK 사용
- 📦 **타입 안전성**: 완벽한 TypeScript 지원
- ⚡ **비동기 업로드**: S3에 논블로킹 파일 업로드

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

## 사용 예제

### 액세스 키를 사용한 기본 사용법

```typescript
import { S3Storage } from '@pixengine/adapter-storage-s3';

const storage = new S3Storage({
  bucket: 'my-images',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: 'https://my-images.s3.amazonaws.com',
});
```

### IAM 역할 사용 (EC2, Lambda, ECS)

AWS 인프라에서 실행할 때는 자격 증명을 생략하고 IAM 역할을 사용할 수 있습니다:

```typescript
import { S3Storage } from '@pixengine/adapter-storage-s3';

const storage = new S3Storage({
  bucket: 'my-images',
  region: 'us-east-1',
  baseUrl: 'https://my-images.s3.amazonaws.com',
});
```

### CloudFront CDN 사용

```typescript
import { S3Storage } from '@pixengine/adapter-storage-s3';

const storage = new S3Storage({
  bucket: 'my-images',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: 'https://d1234567890.cloudfront.net',
});
```

### Express 미들웨어와 함께 사용

```typescript
import express from 'express';
import multer from 'multer';
import { pixEngineMiddleware } from '@pixengine/middleware-express';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';
import { S3Storage } from '@pixengine/adapter-storage-s3';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post(
  '/upload',
  upload.single('image'),
  pixEngineMiddleware({
    engine: new SharpEngine(),
    storage: new S3Storage({
      bucket: 'my-images',
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      baseUrl: 'https://d1234567890.cloudfront.net',
    }),
  })
);

app.listen(3000);
```

### Next.js와 함께 사용

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
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    baseUrl: 'https://d1234567890.cloudfront.net',
  }),
});
```

### 환경 변수

```typescript
import { S3Storage } from '@pixengine/adapter-storage-s3';

const storage = new S3Storage({
  bucket: process.env.S3_BUCKET!,
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: process.env.S3_BASE_URL!,
});
```

**.env 파일:**
```bash
S3_BUCKET=my-images
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BASE_URL=https://d1234567890.cloudfront.net
```

## AWS 설정

### 1. S3 버킷 생성

```bash
aws s3 mb s3://my-images --region us-east-1
```

### 2. 버킷 정책 설정 (공개 읽기)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-images/*"
    }
  ]
}
```

### 3. CORS 설정 (필요한 경우)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 4. IAM 사용자 생성 (액세스 키용)

다음 정책을 가진 IAM 사용자를 생성하세요:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::my-images/*"
    }
  ]
}
```

## CloudFront 설정

### 1. CloudFront 배포 생성

- **Origin Domain**: `my-images.s3.amazonaws.com`
- **Origin Path**: (비어있음)
- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Allowed HTTP Methods**: GET, HEAD
- **Cache Policy**: CachingOptimized

### 2. CloudFront URL 사용

```typescript
const storage = new S3Storage({
  bucket: 'my-images',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  baseUrl: 'https://d1234567890.cloudfront.net', // CloudFront URL
});
```

## 모범 사례

### 1. 환경 변수 사용

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

### 2. AWS에서 IAM 역할 사용

AWS(EC2, Lambda, ECS)에서 실행할 때는 액세스 키 대신 IAM 역할을 사용하세요:

```typescript
const storage = new S3Storage({
  bucket: process.env.S3_BUCKET!,
  region: process.env.AWS_REGION!,
  baseUrl: process.env.S3_BASE_URL!,
  // 자격 증명 없음 - IAM 역할 사용
});
```

### 3. CDN으로 CloudFront 사용

CloudFront를 사용하여 전 세계적으로 이미지를 더 빠르게 제공하세요:

```typescript
const storage = new S3Storage({
  bucket: 'my-images',
  region: 'us-east-1',
  baseUrl: 'https://d1234567890.cloudfront.net', // CloudFront URL
});
```

### 4. 적절한 버킷 권한 설정

- 공개 읽기 액세스를 위해 버킷 정책 사용
- 특정 IAM 사용자/역할로 쓰기 액세스 제한
- 중요한 이미지를 위해 버전 관리 활성화
- 오래된 이미지를 보관하기 위한 수명 주기 규칙 설정

### 5. 비용 모니터링

- CloudWatch를 사용하여 S3 스토리지 및 대역폭 모니터링
- 청구 알림 설정
- 비용 최적화를 위해 S3 Intelligent-Tiering 사용 고려
- S3 데이터 전송 비용을 줄이기 위해 CloudFront 사용

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

## Local Storage와 비교

| 기능 | S3 Storage | Local Storage |
|------|-----------|--------------|
| 확장성 | ✅ 무제한 | ❌ 디스크 제한 |
| CDN 통합 | ✅ CloudFront | ❌ 설정 필요 |
| 내구성 | ✅ 99.999999999% | ❌ 단일 장애점 |
| 비용 | 💰 사용량 기반 | ✅ 무료 (호스팅 비용) |
| 설정 | ⚙️ AWS 계정 필요 | ✅ 간단 |
| 속도 (같은 리전) | ⚡ 빠름 | ⚡ 매우 빠름 |
| 속도 (글로벌) | ⚡ CDN으로 빠름 | ❌ 느림 |

## 요구사항

- **Node.js**: >= 18.0.0
- **AWS 계정**: S3 액세스 필요
- **AWS SDK**: @aws-sdk/client-s3 (의존성으로 포함)
- **PixEngine Core**: @pixengine/core

## 라이선스

MIT © PixEngine Team

## 링크

- [PixEngine Core](https://www.npmjs.com/package/@pixengine/core)
- [Sharp Engine Adapter](https://www.npmjs.com/package/@pixengine/adapter-engine-sharp)
- [Local Storage Adapter](https://www.npmjs.com/package/@pixengine/adapter-storage-local)
- [Express Middleware](https://www.npmjs.com/package/@pixengine/middleware-express)
- [Next.js Middleware](https://www.npmjs.com/package/@pixengine/middleware-nextjs)
- [AWS S3 문서](https://docs.aws.amazon.com/ko_kr/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [GitHub Repository](https://github.com/pixengine/pixengine)
- [Issue Tracker](https://github.com/pixengine/pixengine/issues)
