---
title: "Vercel Image Optimization Bypass"
aliases: [vercel-unoptimized-images, bypass-vercel-limits]
tags: [vercel, infrastructure, optimization, troubleshooting]
sources:
  - "daily/2026-05-14.md"
created: 2026-05-14
updated: 2026-05-14
---

# Vercel Image Optimization Bypass

This article documents a temporary fix for when Vercel's "Image Optimization" usage limits are exceeded on the Hobby/Free tier.

## The Problem

Vercel has a monthly limit for image optimization (e.g., 1000 source images per month on the Hobby plan). Once this limit is reached, Vercel returns a `403 Forbidden` or `500` error for images requested via the `_next/image` endpoint, causing images on the site to appear broken.

## The Solution

To restore image visibility, we disable Next.js's automatic image optimization and force images to be served directly from the remote source.

### Implementation

Add `unoptimized: true` to the `images` block in `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-supabase-id.supabase.co',
        // ...
      },
    ],
  },
};
```

## Reverting the Change

This is a **temporary workaround**. Once the Vercel billing cycle resets (or the limits are cleared), this setting should be removed to benefit from Vercel's edge optimization (WebP/AVIF conversion, resizing, and caching).

**Estimated Revert Date:** ~2026-05-28 (2 weeks from initial implementation).

## Side Effects

- **Performance**: Images will be served in their original format and size. This may increase page weight and Largest Contentful Paint (LCP) if source images are very large.
- **Cost**: No impact on Vercel costs, but may slightly increase bandwidth usage on the image source (e.g., Supabase Storage).

## Sources

- [[daily/2026-05-14.md]] - Initial implementation of the bypass after limit exhaustion.
