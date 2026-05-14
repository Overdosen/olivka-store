---
title: "Google Merchant Center Synchronization"
aliases: [gmc-sync, merchant-center-integration]
tags: [seo, marketing, integration, scripts]
sources:
  - "daily/2026-05-14.md"
created: 2026-05-14
updated: 2026-05-14
---

# Google Merchant Center Synchronization

Implementation of product feed synchronization with Google Merchant Center using the Google Content API for Shopping via Membrane.

## Key Points

- **Membrane CLI Integration**: Uses `membrane action run` to push product data. This simplifies authentication and API handling.
- **Categorization Mapping**: Uses a local mapping (`googleCategoryMap`) to convert store categories to Google Product Category IDs (e.g., 'body' -> '541', 'pants' -> '540').
- **Data Enrichment**: 
    - **Age Group**: Automatically assigned based on category ('newborn' for swaddles/cocoons, 'infant' for others).
    - **Gender**: Mapped from Ukrainian terms ('Хлопчик' -> 'male', 'Дівчинка' -> 'female', 'Унісекс' -> 'unisex').
    - **Product Types**: Includes the category name as a breadcrumb string.
- **Image Handling**: Includes both main `image_url` and `additionalImageLinks` from the `gallery` array.

## Implementation Details

The sync scripts are located in `scripts/`:
- `sync-gmc-all.js`: Full store synchronization.
- `sync-gmc-bodies.js`: Targetted sync for bodysuits.
- `sync-gmc-sets.js`: Targetted sync for clothing sets.

The process fetches published products with `stock > 0` from Supabase, enriches them with category data, and pushes them to GMC using the `insertProductActionId` defined in the scripts.

## Related Concepts

- [[concepts/supabase-realtime-orders]] - Connection to database architecture.
- [[concepts/store-olivka-branding]] - Ensures brand consistency in titles and descriptions.

## Sources

- [[daily/2026-05-14.md]] - Documentation of recent changes and script implementation.
