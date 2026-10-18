# Blog posts

Drop a Markdown file here (e.g. `2026-10-19-morning-routine.md`) and commit to `main`.
A GitHub Action loads it into visualschedule.app as a **draft**. Publish it from `/admin/blog`.

```
---
title: Your post title
slug: optional-custom-slug
meta_description: Under 160 characters, for Google
keywords: visual schedule, autism, routine
cover_url: (optional image URL)
youtube_url: (optional)
---

Intro paragraph...

## A heading

- bullet
- **bold**, *italic*, [link](https://visualschedule.app)
```

Supported formatting: `##`/`###` headings, bold, italic, links, images, `-` bullet lists, paragraphs.
Once a post is published, committing the same slug again will NOT overwrite it.
Files starting with `_` are ignored.
