# 🌌 PixEngine (픽스엔진)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: Active Development](https://img.shields.io/badge/Status-Active%20Development-orange.svg)](#)

**PixEngine**은 현대적인 웹 애플리케이션을 위해 설계된 고성능 **정책 기반 이미지 최적화 엔진**입니다. 개발자가 블랙박스 같은 기본 설정에 의존하는 대신, 명시적인 로직을 통해 이미지 처리 과정을 직접 제어(Orchestration)할 수 있도록 돕습니다.

> "최적화는 단순히 픽셀을 줄이는 것이 아니라, 맥락에 따라 최선의 결정을 내리는 것입니다."

---

## 🗺️ 목차
- [핵심 철학](#-핵심-철학)
- [작동 원리](#%EF%B8%8F-작동-원리)
- [주요 특징](#-주요-특징)
- [정책 중심 접근 방식](#-정책-중심-접근-방식)
- [아키텍처](#-아키텍처)
- [로드맵](#-로드맵)
- [시작하기](#-시작하기)

---

## 💡 핵심 철학

대부분의 이미지 최적화 도구는 '어떻게(How)' 압축할 것인가에만 집중합니다. PixEngine은 **'언제(When), 왜(Why), 그리고 어디에(Where)'**에 집중합니다.

1.  **설정보다 정책 (Policy over Config)**: 단순한 정적 설정 파일이 아닌, 평가 가능한 '정책'이 결정을 내립니다.
2.  **명시적 오케스트레이션**: 모든 변환, 리사이징, 포맷 변경은 의도된 정책 결정의 결과입니다.
3.  **인프라 종속성 없음**: S3, 로컬 스토리지, Sharp 또는 클라우드 엔진 중 무엇을 사용하든 PixEngine은 이들을 완벽하게 연결하는 접착제 역할을 합니다.

---

## ⚙️ 작동 원리

PixEngine은 당신의 정책에 따라 제어되는 파이프라인으로 작동합니다.

```text
[ 원본 이미지 ] ───▶ [ 정책 평가기 ] ───▶ [ 변환 엔진 ] ───▶ [ 저장소 어댑터 ]
      │                    │                    │                     │
  사용자 업로드        썸네일이             Sharp / Libvips /        로컬 / S3 /
  또는 가져오기       필요한가?             WebP 변환 수행           클라우드
```

1.  **Ingestion (수집)**: 이미지가 시스템에 입력됩니다.
2.  **Evaluation (평가)**: PixEngine이 사용자가 정의한 `Policy`를 바탕으로 이미지를 분석합니다.
3.  **Execution (실행)**: `Engine Adapter`가 평가 결과에 따라 변환(리사이즈, 포맷 변경 등)을 수행합니다.
4.  **Persistence (저장)**: `Storage Adapter`가 원본과 생성된 모든 변체(Variant)를 저장합니다.
5.  **Manifesting (결과 반환)**: 생성된 모든 버전과 메타데이터를 설명하는 JSON 매니페스트를 반환합니다.

---

## ✨ 주요 특징

-   **🎯 정밀한 최적화**: 카테고리에 따라 다른 규칙을 적용할 수 있습니다 (예: "사용자 아바타" vs "상품 갤러리").
-   **🔌 플러그 앤 플레이**: 비즈니스 로직을 변경하지 않고도 Sharp 엔진을 다른 엔진으로 교체하거나, 로컬 저장소를 S3로 변경할 수 있습니다.
-   **📦 변체 관리**: 모든 이미지에 대해 WebP, AVIF 등 다양한 포맷과 크기를 자동으로 관리합니다.
-   **🛠️ 프레임워크 대응**: Express 및 Next.js를 기본 지원하며, 모든 Node.js 환경에서 사용 가능합니다.

---

## 📜 정책 중심 접근 방식 (Policy-First)

PixEngine에서 **정책(Policy)**은 일급 시민입니다. 당신의 비즈니스 로직이 살아 움직이는 곳입니다.

### 정책 로직 예시
```typescript
// PixEngine 정책의 개념적 예시
const ProductImagePolicy = {
  name: "product-gallery",
  onUpload: (image) => {
    return {
      variants: [
        { suffix: "thumb", width: 200, format: "webp" },
        { suffix: "large", width: 1200, format: "avif" }
      ],
      stripMetadata: true, // 메타데이터 제거
      quality: image.size > 1024 * 1024 ? 75 : 85 // 파일 크기에 따른 가변 품질 설정
    };
  }
};
```

---

## 🏗️ 아키텍처

깔끔한 경계 처리를 위해 모노레포 구조로 설계되었습니다:

-   **`@pixengine/core`**: 두뇌 역할. 정책을 평가하고 어댑터들을 조율합니다.
-   **`@pixengine/adapter-engine-*`**: 이미지 처리 구현체 (예: Sharp).
-   **`@pixengine/adapter-storage-*`**: 결과물이 저장되는 곳 (Local, AWS S3 등).
-   **`@pixengine/middleware-*`**: 선호하는 프레임워크를 위한 간편한 통합 레이어.

---

## 🚀 로드맵

### 1단계: 기반 구축 (진행 중)
- [x] 핵심 오케스트레이션 로직
- [x] Sharp 엔진 어댑터
- [x] 로컬 저장소 어댑터
- [ ] 기본 정책 DSL 설계

### 2단계: 생태계 확장
- [ ] AWS S3 저장소 어댑터
- [ ] Express.js / Next.js 미들웨어
- [ ] 메타데이터 추출 기능 (EXIF, 컬러 팔레트)

### 3단계: 고급 최적화
- [ ] 스마트 크로핑 (얼굴 인식 등)
- [ ] 이미지 "Lighthouse" 점수 예측
- [ ] 온디맨드(JIT) 실시간 변환 어댑터

---

## 🤝 기여하기

프로젝트 초기 단계로, 여러분의 소중한 의견을 기다리고 있습니다:
-   정책 DSL 디자인
-   어댑터 인터페이스 정의
-   실제 서비스 유즈케이스

자세한 내용은 곧 추가될 `CONTRIBUTING.md`를 확인해 주세요.

---

## 📄 라이선스

MIT © 2025 PixEngine Team
