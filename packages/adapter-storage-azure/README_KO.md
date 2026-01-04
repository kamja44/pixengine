# @pixengine/adapter-storage-azure

[English](README.md) | **한국어**

PixEngine을 위한 Azure Blob Storage 어댑터입니다.

## 설치

```bash
npm install @pixengine/adapter-storage-azure @pixengine/core
# 또는
pnpm add @pixengine/adapter-storage-azure @pixengine/core
# 또는
yarn add @pixengine/adapter-storage-azure @pixengine/core
```

## 빠른 시작

```typescript
import { AzureStorage } from '@pixengine/adapter-storage-azure';
import { optimize } from '@pixengine/core';
import { SharpEngine } from '@pixengine/adapter-engine-sharp';

const storage = new AzureStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
  containerName: 'my-images',
  baseUrl: 'https://myaccount.blob.core.windows.net/my-images',
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
// https://myaccount.blob.core.windows.net/my-images/variants/photo_400w.webp
```

## API

### `new AzureStorage(config)`

새로운 Azure Blob Storage 어댑터 인스턴스를 생성합니다.

#### 설정

```typescript
interface AzureStorageConfig {
  connectionString: string;    // 필수: Azure Storage 연결 문자열
  containerName: string;       // 필수: Blob 컨테이너 이름
  baseUrl: string;             // 필수: 생성된 URL의 기본 URL
}
```

**필수:**
- `connectionString: string` - Azure Storage 계정 연결 문자열
- `containerName: string` - 이미지가 저장될 Blob 컨테이너 이름
- `baseUrl: string` - 이미지 URL 생성을 위한 기본 URL (Blob Storage URL 또는 CDN URL)

#### 메서드

```typescript
async put(args: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
  meta: { width: number; height: number; format: string };
}): Promise<{ url: string }>
```

Azure Blob Storage에 파일을 업로드하고 공개 URL을 반환합니다.

## 모범 사례

### 환경 변수 사용

코드에 자격 증명을 하드코딩하지 마세요:

```typescript
const storage = new AzureStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
  containerName: process.env.AZURE_CONTAINER_NAME!,
  baseUrl: process.env.AZURE_BASE_URL!,
});
```

Azure Blob Storage 설정, 컨테이너 생성, 액세스 키, SAS 토큰, CDN 구성에 대해서는 [Azure Blob Storage 문서](https://docs.microsoft.com/ko-kr/azure/storage/blobs/)를 참조하세요.

## 에러 처리

어댑터는 다음 경우에 에러를 발생시킵니다:

- **필수 설정 누락**: `connectionString`, `containerName`, 또는 `baseUrl`이 제공되지 않음
- **Azure API 에러**: 업로드 실패, 인증 에러, 권한 에러 등

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
  console.error('Azure 업로드 실패:', error);
}
```

## 요구사항

- **Node.js**: >= 18.0.0
- **Azure 계정**: Blob Storage 액세스 필요
- **Azure SDK**: @azure/storage-blob (의존성으로 포함)
- **PixEngine Core**: @pixengine/core

## 라이선스

MIT © PixEngine Team
