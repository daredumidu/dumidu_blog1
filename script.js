// Client-side blog loader that discovers Markdown files by listing posts/ via the GitHub Contents API,
// fetches each .md, parses YAML frontmatter for metadata, and renders using marked.js.
// Configuration must be set in config.js as window.BLOG_CONFIG

const postsListEl = document.getElementById('posts-list');
const postTitleEl = document.getElementById('post-title');
const postMetaEl = document.getElementById('post-meta');
const postBodyEl = document.getElementById('post-body');

let posts = [];

function cfg() {
  const c = window.BLOG_CONFIG || {};
  if (!c.repoOwner || !c.repoName) {
    throw new Error('BLOG_CONFIG missing repoOwner or repoName in config.js');
  }
  return c;
}

async function listPostFiles() {
  const { repoOwner, repoName, branch } = cfg();
  let url = `https://api.github.com/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/contents/posts`;
  if (branch) url += `?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {cache: "no-cache"});
  if (!res.ok) throw new Error('Could not list posts folder: ' + res.statusText);
  const items = await res.json();
  // items is an array of file objects (type=file, name, download_url)
  return items.filter(i => i.type === 'file' && /\.md$/i.test(i.name)).map(i => ({ name: i.name, download_url: i.download_url }));
}

function parseFrontMatter(md) {
  const out = { data: {}, body: md };
  if (md.startsWith('---')) {
    const end = md.indexOf('\n---', 3);
    if (end !== -1) {
      const fmBlock = md.slice(3, end + 1).trim();
      out.body = md.slice(end + 5).replace(/^\s+/, '');
      // parse simple YAML key: value lines
      fmBlock.split(/\r?\n/).forEach(line => {
        const m = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.*)$/);
        if (m) {
          let key = m[1].trim();
          let val = m[2].trim();
          // strip surrounding quotes
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          out.data[key] = val;
        }
      });
    }
  }
  return out;
}

async function loadAllPosts() {
  try {
    postsListEl.innerHTML = '<li>Loading posts…</li>';
    const files = await listPostFiles();
    if (!files.length) {
      postsListEl.innerHTML = '<li>No posts found in posts/</li>';
      return;
    }
    // fetch each markdown file
    const fetches = files.map(f => fetch(f.download_url, {cache: "no-cache"})
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch ' + f.name);
        return r.text().then(text => ({ filename: f.name, text }));
      }));
    const results = await Promise.all(fetches);
    posts = results.map(r => {
      const parsed = parseFrontMatter(r.text);
      const meta = parsed.data || {};
      const title = meta.title || r.filename.replace(/\.md$/i, '');
      const date = meta.date || '';
      const slug = meta.slug || r.filename.replace(/\.md$/i, '');
      const excerpt = meta.excerpt || '';
      return {
        filename: r.filename,
        title, date, slug, excerpt,
        body: parsed.body
      };
    });

    // sort by date (desc) if date present, otherwise by filename
    posts.sort((a,b) => {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      return a.filename.localeCompare(b.filename);
    });

    renderList();
    // try to load from hash or first post
    const slugFromHash = getSlugFromHash();
    if (slugFromHash) {
      loadPostBySlug(slugFromHash);
    } else if (posts.length) {
      loadPostBySlug(posts[0].slug);
      history.replaceState(null, '', '#/post/' + posts[0].slug);
    }
  } catch (err) {
    postsListEl.innerHTML = '<li>Could not load posts.</li>';
    console.error(err);
  }
}

function renderList(){
  postsListEl.innerHTML = '';
  // build base URL (path) to ensure links point to this page with the hash
  const basePath = window.location.origin + window.location.pathname;
  posts.forEach(post => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    // Open post in a new tab: full path + hash. Encode slug in URL.
    a.href = basePath + '#/post/' + encodeURIComponent(post.slug);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `Open post ${post.title} in a new tab`);
    a.innerHTML = `<strong class="post-title-small">${escapeHtml(post.title)}</strong><div class="post-date">${escapeHtml(post.date)}</div><div class="post-excerpt" style="font-size:13px;color:#666">${escapeHtml(post.excerpt || '')}</div>`;
    // do not add in-place click handler; clicking should open a new tab
    li.appendChild(a);
    postsListEl.appendChild(li);
  })
}

function getSlugFromHash(){
  const h = location.hash || '';
  const m = h.match(/^#\/post\/(.+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function loadPostBySlug(slug){
  const postMeta = posts.find(p => p.slug === slug);
  if (!postMeta) {
    postTitleEl.textContent = 'Post not found';
    postMetaEl.textContent = '';
    postBodyEl.innerHTML = '<p>Sorry, post not found.</p>';
    return;
  }
  postTitleEl.textContent = postMeta.title;
  postMetaEl.textContent = `${postMeta.date}`;
  // render markdown body using marked
  postBodyEl.innerHTML = marked.parse(postMeta.body);
  postBodyEl.scrollTop = 0;
}

// small helper
function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

// handle back/forward and direct-hash navigation
window.addEventListener('hashchange', () => {
  const slug = getSlugFromHash();
  if (slug) loadPostBySlug(slug);
});

document.addEventListener('DOMContentLoaded', () => {
  // kick off loading posts
  loadAllPosts();
});