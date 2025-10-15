// Minimal JS to load posts list and render posts.
// Exposes renderPostFromPath for post.html to use.

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to fetch ' + path);
  return res.json();
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
    posts.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
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
    const container = document.getElementById('posts');
    if (container) container.textContent = 'Could not load posts.';
    console.error(err);
  }
}

// Parse optional YAML front matter (very small/simple parser)
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
      return {fm, body};
    }
  }
  return {fm:null, body:md};
}

// Exported for post.html
window.renderPostFromPath = async function (path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      document.getElementById('post-body').textContent = 'Post not found.';
      return;
    }
    const md = await res.text();
    const {fm, body} = parseFrontMatter(md);
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
    // Use marked if available, otherwise show raw markdown
    if (window.marked) {
      document.getElementById('post-body').innerHTML = window.marked.parse(body);
    } else {
      document.getElementById('post-body').textContent = body;
    }
  } catch (err) {
    console.error(err);
    const bodyEl = document.getElementById('post-body');
    if (bodyEl) bodyEl.textContent = 'Error loading post.';
  }
};

// init for index page if element exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('posts')) {
    loadPostsList();
  }
});