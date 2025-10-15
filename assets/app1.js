// assets/app.js (updated) - robust path resolution, better errors, dynamic marked loader
// Minimal JS to load posts list and render posts.
// Exposes renderPostFromPath for post.html to use.

function resolveUrl(path) {
  // Resolve relative to current document location so paths work in subpaths (e.g., /repo/)
  try {
    return new URL(path, location.href).toString();
  } catch (e) {
    // fallback: return path unchanged
    return path;
  }
}

async function fetchJSON(path) {
  const url = resolveUrl(path);
  console.log('Fetching JSON:', url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
  }
  return res.json();
}

async function fetchText(path) {
  const url = resolveUrl(path);
  console.log('Fetching text:', url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
  }
  return res.text();
}

function formatDate(s) {
  if (!s) return '';
  try {
    const d = new Date(s);
    return d.toLocaleDateString();
  } catch {
    return s;
  }
}

async function loadPostsList() {
  try {
    const posts = await fetchJSON('posts/posts.json');
    const container = document.getElementById('posts');
    if (!container) return;
    container.innerHTML = '';
    posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    posts.forEach(p => {
      const el = document.createElement('div');
      el.className = 'post-item';
      const link = document.createElement('a');
      const href = 'post.html?post=' + encodeURIComponent(p.file);
      link.href = href;
      const title = document.createElement('strong');
      title.textContent = p.title || p.file;
      const meta = document.createElement('div');
      meta.className = 'post-meta';
      meta.textContent = (p.date ? formatDate(p.date) + ' — ' : '') + (p.excerpt || '');
      link.appendChild(title);
      el.appendChild(link);
      el.appendChild(meta);
      container.appendChild(el);
    });
  } catch (err) {
    console.error('Error loading posts list:', err);
    const container = document.getElementById('posts');
    if (container) container.textContent = 'Could not load posts. See console for details.';
  }
}

// Simple YAML front matter parser (very small)
function parseFrontMatter(md) {
  if (md.startsWith('---')) {
    const end = md.indexOf('---', 3);
    if (end !== -1) {
      const fmRaw = md.slice(3, end).trim();
      const body = md.slice(end + 3).trim();
      const fm = {};
      fmRaw.split(/\r?\n/).forEach(line => {
        const [k, ...rest] = line.split(':');
        if (!k) return;
        fm[k.trim()] = rest.join(':').trim();
      });
      return { fm, body };
    }
  }
  return { fm: null, body: md };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(new Error('Failed to load script ' + src));
    document.head.appendChild(s);
  });
}

// Exported for post.html
window.renderPostFromPath = async function (path) {
  try {
    if (!path) {
      document.getElementById('post-body').textContent = 'No post specified.';
      return;
    }
    // Resolve path relative to current URL
    const resolved = resolveUrl(path);
    const md = await fetchText(resolved);
    const { fm, body } = parseFrontMatter(md);
    let title = fm && fm.title ? fm.title : null;
    let date = fm && fm.date ? fm.date : null;
    if (!title) {
      // extract first heading
      const m = body.match(/^\s*#\s+(.+)\s*$/m);
      if (m) title = m[1];
    }
    const meta = document.getElementById('post-meta');
    if (meta) {
      meta.innerHTML = '';
      if (title) {
        const h = document.createElement('h2');
        h.textContent = title;
        meta.appendChild(h);
      }
      if (date) {
        const d = document.createElement('div');
        d.className = 'post-meta';
        d.textContent = formatDate(date);
        meta.appendChild(d);
      }
    }

    // Ensure marked is available; if not, try to load it from CDN
    if (!window.marked) {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        console.log('Loaded marked.js from CDN');
      } catch (loadErr) {
        console.warn('Could not load marked.js, rendering raw markdown:', loadErr);
      }
    }

    if (window.marked) {
      document.getElementById('post-body').innerHTML = window.marked.parse(body);
    } else {
      // fallback: show raw markdown
      const pre = document.createElement('pre');
      pre.textContent = body;
      const container = document.getElementById('post-body');
      container.innerHTML = '';
      container.appendChild(pre);
    }
  } catch (err) {
    console.error('Error rendering post:', err);
    const bodyEl = document.getElementById('post-body');
    if (bodyEl) bodyEl.textContent = 'Error loading post. See console for details.';
  }
};

// init for index page if element exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('posts')) {
    loadPostsList();
  }
});
