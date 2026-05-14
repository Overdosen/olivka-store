---
title: "Store Reviews UI Polishing"
aliases: [reviews-styling, testimonials-ui]
tags: [frontend, ui, css, components]
sources:
  - "daily/2026-05-14.md"
created: 2026-05-14
updated: 2026-05-14
---

# Store Reviews UI Polishing

Strategies and styling decisions for the testimonials section of the store to ensure a premium and trustworthy appearance.

## Key Points

- **Manual Curation**: Reviews in `StoreReviews.jsx` are ordered manually in the `rawReviews` array to highlight the most impactful and diverse feedback first.
- **Minimalist Styling**: The title font weight was reduced to `400` in `index.css` to align with the "airy" and "premium" aesthetic of the brand.
- **Fixed Order**: Algorithmic sorting (e.g., by text length) is intentionally avoided to maintain the carefully selected order of testimonials.

## Details

The `StoreReviews` component displays a grid of customer feedback. To maintain a clean look:
1. The title `.reviews-title` uses a lighter weight and the primary brand color `#524f25`.
2. The grid initially shows 4 reviews, with an "Expand" option for more.
3. Content prioritization ensures that "short and sweet" reviews with high emotional impact (e.g., mentioning "ніжнятіна", "мілота") are visible first.

## Related Concepts

- [[concepts/footer-redesign]] - Shared aesthetic principles for section transitions.
- [[concepts/store-olivka-branding]] - Voice and tone of the customer reviews.

## Sources

- [[daily/2026-05-14.md]] - Observation of UI tweaks and component refactoring.
