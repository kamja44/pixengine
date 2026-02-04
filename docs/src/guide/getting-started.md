# Getting Started

## Installation

Install the core package and necessary adapters.

```bash
pnpm add @pixengine/core @pixengine/adapter-engine-sharp
```

## Basic Usage

```typescript
import { PixEngine } from "@pixengine/core";
import { SharpEngine } from "@pixengine/adapter-engine-sharp";
import { LocalStorage } from "@pixengine/adapter-storage-local";

const engine = new PixEngine({
  engine: new SharpEngine(),
  storage: new LocalStorage({ root: "./uploads" }),
});

// Transform an image
const result = await engine.transform("input.jpg", {
  width: 800,
  format: "webp",
});
```
