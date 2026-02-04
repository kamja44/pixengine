# @pixengine/middleware-jit

**English** | [한국어](README_KR.md)

On-demand (Just-In-Time) image transformation middleware for PixEngine. This package allows you to generate image variants on-the-fly when they are requested by the user, rather than pre-generating all possible variants at upload time.

## 🌟 Features

- **Lazy Generation**: Create variants only when they are first accessed.
- **Storage Backed**: Generated variants are saved to your storage adapter (S3, Local, etc.) for future hits.
- **Secure**: URL signing mechanism to prevent Denial of Service (DoS) attacks via resource exhaustion.
- **Seamless Integration**: Works with existing PixEngine policies and adapters.

## 📦 Installation

```bash
npm install @pixengine/middleware-jit
# or
pnpm add @pixengine/middleware-jit
```

## 🚀 Usage

### Basic Setup (Express Example)

```typescript
import express from "express";
import { createJitMiddleware } from "@pixengine/middleware-jit";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";

const app = express();

const jitMiddleware = createJitMiddleware({
  secret: "your-secure-signing-secret",
  engine: new SharpEngine(),
  storage: new LocalStorage({ baseDir: "./uploads" }),
  // Define allowed transformations or policy
  policy: (ctx) => {
    // Return allowed variant/decision for the requested context
    return {
      // ...
    };
  },
});

// Mount at a specific path
app.use("/images", jitMiddleware);

app.listen(3000);
```

## 🔒 Security

JIT transformation endpoints are vulnerable to abuse if not secured. This middleware uses **HMAC signatures** to verify that a requested transformation is authorized.

URLs must be signed using the provided utility:

```typescript
import { signUrl } from "@pixengine/middleware-jit";

const url = signUrl({
  path: "/images/original.jpg",
  modifiers: { width: 400, format: "webp" },
  secret: "your-secure-signing-secret",
});
// -> /images/original.jpg?w=400&f=webp&s=abc123signature...
```

## License

MIT © PixEngine Team
