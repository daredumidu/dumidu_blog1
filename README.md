# Minimal Blog for GitHub Pages

This is a tiny, minimalist static blog intended to be hosted with GitHub Pages.

How it works:
- Posts are plain Markdown files stored in the posts/ folder.
- posts/posts.json lists available posts (file path, title, date, excerpt).
- index.html reads posts/posts.json and shows the list.
- post.html fetches a Markdown file and renders it (uses marked.js from CDN).

To deploy:
1. Push this repository to GitHub.
2. In repository Settings → Pages, select branch `main` (or `gh-pages`) and root folder `/` as the site source.
3. Save. Your site will be available at https://<your-username>.github.io/<repo>/.

Adding a new post:
1. Create a new file posts/YYYY-MM-DD-slug.md (use front matter like in the examples).
2. Add an entry to posts/posts.json with the file path and metadata.
3. Commit and push.

Notes:
- This intentionally keeps things simple: posts.json is manually maintained. You can automate generation via a small script or GitHub Action if desired.
- For improved SEO or more features you can add a sitemap generator, RSS, or pagination later.