import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // This is an internal, auth-gated admin tool — every page depends on the
  // session, so Cache Components' static-shell/Suspense model (built for
  // public, partially-static pages) just adds ceremony here. Plain dynamic
  // rendering (the pre-16 default) fits better.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
