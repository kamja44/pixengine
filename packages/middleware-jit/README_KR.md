# @pixengine/middleware-jit

[English](README.md) | **한국어**

PixEngine을 위한 온디맨드(Just-In-Time) 이미지 변환 미들웨어입니다. 이 패키지를 사용하면 업로드 시점에 모든 변형을 미리 생성하는 대신, 사용자가 이미지를 요청할 때 실시간으로 생성할 수 있습니다.

## 🌟 주요 기능

- **지연 생성 (Lazy Generation)**: 처음 액세스될 때만 변형을 생성하여 스토리지 비용을 절약합니다.
- **스토리지 캐싱**: 생성된 변형은 자동으로 스토리지 어댑터(S3, Local 등)에 저장되어 이후 요청 시 빠르게 제공됩니다.
- **보안**: 리소스 고갈을 통한 DoS(서비스 거부) 공격을 방지하기 위한 URL 서명 메커니즘을 제공합니다.
- **원활한 통합**: 기존 PixEngine 정책 및 어댑터와 완벽하게 작동합니다.

## 📦 설치

```bash
npm install @pixengine/middleware-jit
# 또는
pnpm add @pixengine/middleware-jit
```

## 🚀 사용법

### 기본 설정 (Express 예제)

```typescript
import express from "express";
import { createJitMiddleware } from "@pixengine/middleware-jit";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";

const app = express();

const jitMiddleware = createJitMiddleware({
  secret: "your-secure-signing-secret", // 보안을 위한 서명 키
  engine: new SharpEngine(),
  storage: new LocalStorage({ baseDir: "./uploads" }),
  // 허용된 변환 또는 정책 정의
  policy: (ctx) => {
    // 요청된 컨텍스트에 대한 결정 반환
    return {
      // ...
    };
  },
});

// 특정 경로에 마운트
app.use("/images", jitMiddleware);

app.listen(3000);
```

## 🔒 보안

JIT 변환 엔드포인트는 보안이 설정되지 않을 경우 악용될 수 있습니다. 이 미들웨어는 **HMAC 서명**을 사용하여 요청된 변환이 승인되었는지 확인합니다.

URL은 제공된 유틸리티를 사용하여 서명되어야 합니다:

```typescript
import { signUrl } from "@pixengine/middleware-jit";

const url = signUrl({
  path: "/images/original.jpg",
  modifiers: { width: 400, format: "webp" },
  secret: "your-secure-signing-secret",
});
// -> /images/original.jpg?w=400&f=webp&s=abc123signature...
```

## 라이선스

MIT © PixEngine Team
