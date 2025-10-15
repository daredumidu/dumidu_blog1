# Minimalist GitHub Pages Blog (frontmatter-based)

This repo contains a minimalist static blog that reads posts directly from Markdown files with YAML frontmatter. The client uses the GitHub Contents API to list files under posts/ and parses each file's frontmatter for metadata (title, date, excerpt, slug).

How to configure
1. Open config.js and set:
   - repoOwner: your GitHub username or org
   - repoName: repository name containing the posts/ folder
   - branch: optional (default branch used if omitted)

Example:
```js
window.BLOG_CONFIG = { repoOwner: "your-username", repoName: "your-blog-repo", branch: "main" };
```

How it works
- script.js lists the files in posts/ using the GitHub API, downloads each .md file, parses a simple YAML frontmatter block (between --- lines) and then renders the body with marked.js.
- Required frontmatter fields: title, date, slug, excerpt (excerpt optional but recommended).
- No posts/index.json needed.

Add a new post
1. Create a Markdown file in posts/, for example posts/my-new-post.md
2. Include frontmatter at top:
```yaml
---
title: "My new post"
date: "2025-10-15"
slug: "my-new-post"
excerpt: "Short excerpt here."
---
Post content...
```
3. Commit & push. The site will pick up the new post automatically.

Notes & limitations
- The client uses the GitHub REST API (contents endpoint). Public repositories work without authentication, but the API is rate-limited (unauthenticated requests are limited). If you need higher rate limits, use a GitHub token or generate a small build step to create an index.
- The frontmatter parser is intentionally simple: it parses basic "key: value" lines. For more advanced YAML (multiline values, arrays), consider adding a YAML parser (js-yaml) or using a build step.
- If you host the site on the same repository, you can keep everything in one place: posts/ and the site files.