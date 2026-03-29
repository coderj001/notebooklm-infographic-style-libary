# Fixed Tag Bar After Hero

Date: 2026-03-29

## Summary
Introduce a scroll-triggered fixed state for the tag filter bar so it becomes fixed only after the hero section is scrolled past. Prevent overlap with gallery content by reserving space when fixed.

## Goals
- Tag filter bar becomes fixed only after the hero ends.
- No overlap between fixed tag bar and gallery content.
- Maintain visual clarity with an opaque background in the fixed state.
- Keep behavior consistent across desktop and mobile.

## Non-Goals
- No changes to data parsing or tag generation.
- No redesign of gallery or detail view.
- No new UI features beyond the fixed state.

## Architecture
- Add a scroll sentinel element immediately after the hero.
- Use `IntersectionObserver` to toggle a `filters-fixed` class on `body` when the sentinel scrolls out of view.
- In CSS, apply `position: fixed` styling to `.filters` only when `body.filters-fixed` is set.
- Apply a top padding/margin to `.gallery` in the fixed state equal to the fixed bar height.

## Components
- `site/index.html`
  - Insert a `div` sentinel after `.hero`.
- `site/app.js`
  - Add `IntersectionObserver` to toggle `body.filters-fixed`.
- `site/styles.css`
  - Add fixed-state styling for `.filters` (top, width, z-index, background).
  - Add `.gallery` offset when fixed to prevent overlap.

## Behavior
- While hero is visible: `.filters` remains in normal flow (not fixed).
- When sentinel exits the viewport: `body.filters-fixed` is added; `.filters` becomes fixed at the top.
- Gallery content is pushed down by the fixed bar height to avoid overlap.
- On mobile, fixed behavior remains enabled unless explicitly disabled later.

## Error Handling
- If `IntersectionObserver` is unavailable, fallback to non-fixed behavior (no class toggled).

## Testing / Validation
- Scroll from hero to gallery: verify filter bar becomes fixed at the correct point.
- Confirm gallery content never overlaps with filter bar in fixed state.
- Check mobile viewport behavior (tag wrapping, readability).

## Risks / Edge Cases
- Tag bar height can vary due to wrapping; use a CSS variable or measure height in JS if needed.
- If the hero height changes dynamically, sentinel placement still ensures correct trigger point.

## Open Questions
None.
