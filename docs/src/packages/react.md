# React Component

## Installation

```bash
pnpm add @pixengine/react
```

## Usage

Use `<PixImage />` to automatically generate optimized URLs and responsive `srcSet`.

```tsx
import { PixImage } from "@pixengine/react";

function App() {
  return (
    <PixImage
      baseUrl="https://img.mysite.com"
      src="/users/avatar.jpg"
      width={300}
      height={300}
      format="webp"
      quality={85}
      alt="User Avatar"
    />
  );
}
```

## Props

| Prop      | Type                                  | Description                               |
| --------- | ------------------------------------- | ----------------------------------------- |
| `baseUrl` | `string`                              | The base URL of your PixEngine JIT server |
| `src`     | `string`                              | The path to the image source              |
| `width`   | `number`                              | Target width                              |
| `height`  | `number`                              | Target height                             |
| `format`  | `'webp' \| 'avif' \| 'jpeg' \| 'png'` | Output format                             |
| `quality` | `number`                              | Quality (1-100)                           |
