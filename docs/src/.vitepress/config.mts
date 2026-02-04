import { defineConfig } from "vitepress";

export default defineConfig({
  title: "PixEngine",
  description: "High-performance, policy-based image optimization engine",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Packages", link: "/packages/core" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Core Concepts", link: "/guide/concepts" },
        ],
      },
      {
        text: "Packages",
        items: [
          { text: "Core", link: "/packages/core" },
          { text: "React Components", link: "/packages/react" },
          { text: "JIT Middleware", link: "/packages/middleware-jit" },
          { text: "Adapters", link: "/packages/adapters" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/pixengine/pixengine" }],
  },
});
