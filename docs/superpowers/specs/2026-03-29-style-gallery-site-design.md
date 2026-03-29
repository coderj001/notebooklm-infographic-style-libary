# Static Style Gallery Site Design

Date: 2026-03-29

## Summary
Build a GitHub Pages-ready static site in `site/` that presents the style prompts from `README.md` as a visual gallery with search and tag filters. Data is generated at build time into `site/data/styles.json`. The UI uses the Midnight Galaxy theme and a visual, image-led gallery layout with full-page detail views.

## Goals
- Provide fast, visual browsing of all styles with search and tag filters.
- Keep hosting fully static and free on GitHub Pages.
- Maintain a single source of truth in `README.md`.

## Non-Goals
- No server-side search or database.
- No CMS/editor UI.
- No automated image hosting changes.

## Chosen Approach
Approach A: Build-time index + static app.

A small script parses `README.md` and emits `site/data/styles.json`. The front-end reads this JSON and renders the gallery, filters, and detail page. Changes to `README.md` require re-running the build script.

## UX and IA
- Home: Hero (brand, short value line, search input), tag filter rail, total count, and image-first gallery tiles.
- Tile: Primary image, title, and quick tag chips. Hover state reveals tags if not always visible.
- Detail: Full-page view with hero image, title, tags, prompt block, and source link.
- CTA: Link to contribution guidance in `README.md`.

## Visual Direction
- Visual thesis: bold editorial gallery with strong imagery, restrained UI chrome, high-contrast typography.
- Interactions:
  - Hero entrance: staggered reveal of text and first row of tiles.
  - Subtle scroll-linked parallax/scale on hero imagery strip.
  - Tile hover: lift + image brightness shift + tag chip fade-in.
- Theme: Midnight Galaxy from Theme Factory.

## Data Model
Each style record:
- id: slug derived from heading title, deduped with numeric suffix if needed
- title: section title from `README.md`
- images[]: list of image URLs from markdown images
- prompt: full prompt block text (fenced code or text block)
- tags[]: parsed from Tags if present
- source: optional source URL line
- section_order: numeric order from README for stable sorting

## Parsing Rules
- Each `## **Title**` starts a new style record.
- Images are consecutive markdown image lines following the title.
- Prompt is the next fenced code block or text block after images.
- Tags are extracted from Tags lines inside the section.
- Source line is parsed if present (e.g., `source:` or `*source:*`).

## Edge Cases
- Missing tags: tags is empty.
- Missing images: render a placeholder tile background.
- Duplicate titles: suffix id with -2, -3, etc.
- Sections missing prompt: parser fails with a clear error.

## Validation
- Build script prints counts, missing fields, and exits non-zero on missing title or prompt.
- Manual sanity check by loading `site/index.html` and confirming search/tag filters work.

## Deployment
- GitHub Pages serves from `site/`.
- Include deployment notes in `README.md`.

## Open Questions
None.
