import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Without this, Turbopack walks up the filesystem looking for a lockfile and
  // can settle on one outside the project. Pinning the root keeps the build
  // reproducible regardless of what happens to live in the parent directory.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
