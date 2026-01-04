# @pixengine/adapter-storage-gcs

[English](README.md) | **한국어**

PixEngine을 위한 Google Cloud Storage 어댑터입니다.

## 설치

```bash
npm install @pixengine/adapter-storage-gcs @pixengine/core
# 또는
pnpm add @pixengine/adapter-storage-gcs @pixengine/core
# 또는
yarn add @pixengine/adapter-storage-gcs @pixengine/core
```

## 빠른 시작

```typescript
import { GCSStorage } from '@pixengine/adapter-storage-gcs';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new GCSStorage({
  bucket: 'my-images',
  baseUrl: 'https://storage.googleapis.com/my-images',
  projectId: 'my-project-id',
  keyFilename: '/path/to/service-account-key.json',
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
// https://storage.googleapis.com/my-images/variants/photo_400w.webp
```

## API

### `new GCSStorage(config)`

새로운 Google Cloud Storage 어댑터 인스턴스를 생성합니다.

#### 설정

```typescript
interface GCSStorageConfig {
  bucket: string;              // 필수: GCS 버킷 이름
  baseUrl: string;             // 필수: 생성된 URL의 기본 URL
  projectId?: string;          // 선택: GCP 프로젝트 ID
  keyFilename?: string;        // 선택: 서비스 계정 키 파일 경로
  credentials?: {              // 선택: 서비스 계정 자격 증명
    client_email: string;
    private_key: string;
  };
}
```

**필수:**
- `bucket: string` - 이미지가 저장될 GCS 버킷 이름
- `baseUrl: string` - 이미지 URL 생성을 위한 기본 URL (GCS URL 또는 CDN URL)

**선택:**
- `projectId?: string` - Google Cloud 프로젝트 ID
- `keyFilename?: string` - 서비스 계정 키 JSON 파일 경로
- `credentials?: object` - 서비스 계정 자격 증명 객체 (keyFilename 대신 사용)

#### 메서드

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

GCS에 파일을 업로드하고 공개 URL을 반환합니다.

## 모범 사례

### 환경 변수 사용

코드에 자격 증명을 하드코딩하지 마세요:

```typescript
const storage = new GCSStorage({
  bucket: process.env.GCS_BUCKET!,
  baseUrl: process.env.GCS_BASE_URL!,
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILENAME,
});
```

Google Cloud Storage 설정, 버킷 생성, 서비스 계정, IAM 권한, CDN 구성에 대해서는 [Google Cloud Storage 문서](https://cloud.google.com/storage/docs?hl=ko)를 참조하세요.

## 에러 처리

어댑터는 다음 경우에 에러를 발생시킵니다:

- **필수 설정 누락**: `bucket` 또는 `baseUrl`이 제공되지 않음
- **GCS API 에러**: 업로드 실패, 인증 에러, 권한 에러 등

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
  console.error('GCS 업로드 실패:', error);
}
```

## 요구사항

- **Node.js**: >= 18.0.0
- **Google Cloud 계정**: GCS 액세스 필요
- **Google Cloud SDK**: @google-cloud/storage (의존성으로 포함)
- **PixEngine Core**: @pixengine/core

## 라이선스

MIT © PixEngine Team
