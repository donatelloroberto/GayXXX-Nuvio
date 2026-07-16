"use strict";

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function renderDirectoryPage(providerConfigs) {
  const providers = providerConfigs.map((provider) => ({
    id: provider.id,
    name: provider.name,
    description: provider.description || `${provider.name} Stremio addon`,
    logo: provider.logo || "",
    language: String(provider.language || "en").toUpperCase(),
    types: provider.supportedTypes || ["movie"],
    manifestId: `community.${provider.id}`
  }));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a090e">
  <meta name="description" content="Install individual GayXXX provider addons for Stremio.">
  <title>GayXXX Stremio Addons</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #09090c;
      --surface: #121116;
      --surface-raised: #18161f;
      --border: rgba(255,255,255,.085);
      --text: #f5f2fa;
      --muted: #9e99aa;
      --purple: #8b5cf6;
      --purple-bright: #a87cff;
      --purple-soft: rgba(139,92,246,.14);
      --green: #42d392;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-width: 320px;
      background: var(--bg);
      color: var(--text);
      font: 15px/1.55 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button, input, a { font: inherit; }
    .hero {
      position: relative;
      overflow: hidden;
      padding: 76px 24px 68px;
      text-align: center;
      border-bottom: 1px solid var(--border);
      background:
        radial-gradient(circle at 50% -25%, rgba(139,92,246,.34), transparent 43%),
        linear-gradient(180deg, #181421 0%, #100f16 100%);
    }
    .hero::after {
      content: "";
      position: absolute;
      width: 520px;
      height: 180px;
      left: 50%;
      bottom: -170px;
      transform: translateX(-50%);
      border-radius: 50%;
      background: var(--purple);
      filter: blur(90px);
      opacity: .15;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin-bottom: 18px;
      border: 1px solid rgba(168,124,255,.35);
      border-radius: 16px;
      background: rgba(139,92,246,.13);
      box-shadow: 0 12px 36px rgba(55,27,104,.35);
      color: var(--purple-bright);
    }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.25rem); line-height: 1.05; letter-spacing: -.045em; }
    .hero p { max-width: 650px; margin: 18px auto 0; color: #aea9b8; font-size: 1.08rem; }
    .hero-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 24px; }
    .hero-tag { padding: 7px 11px; border: 1px solid var(--border); border-radius: 999px; background: rgba(0,0,0,.18); color: #c9c4d2; font-size: .8rem; }
    .container { width: min(1240px, calc(100% - 40px)); margin: 0 auto; padding: 42px 0 72px; }
    .toolbar { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
    .toolbar h2 { margin: 0 0 2px; font-size: 1.65rem; letter-spacing: -.03em; }
    .toolbar p { margin: 0; color: var(--muted); }
    .search-wrap { position: relative; width: min(340px, 100%); }
    .search-wrap svg { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #716d7c; pointer-events: none; }
    #search {
      width: 100%;
      height: 46px;
      padding: 0 16px 0 44px;
      border: 1px solid var(--border);
      border-radius: 14px;
      outline: 0;
      background: #111015;
      color: var(--text);
      transition: border-color .2s, box-shadow .2s;
    }
    #search:focus { border-color: rgba(139,92,246,.65); box-shadow: 0 0 0 4px rgba(139,92,246,.11); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
    .card {
      display: flex;
      flex-direction: column;
      min-height: 340px;
      padding: 24px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(255,255,255,.018), transparent 55%), var(--surface);
      box-shadow: 0 15px 40px rgba(0,0,0,.12);
      transition: transform .2s, border-color .2s, background .2s;
    }
    .card:hover { transform: translateY(-3px); border-color: rgba(139,92,246,.35); background-color: #15131a; }
    .card-head { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .logo {
      display: grid;
      place-items: center;
      flex: 0 0 54px;
      width: 54px;
      height: 54px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 15px;
      background: #fff;
      color: #8b5cf6;
      font-weight: 800;
      font-size: 1.2rem;
    }
    .logo img { width: 100%; height: 100%; object-fit: contain; padding: 5px; }
    .card-title { min-width: 0; }
    .card-title h3 { overflow: hidden; margin: 0; font-size: 1.05rem; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
    .manifest-id { overflow: hidden; margin-top: 3px; color: var(--muted); font: .72rem/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
    .description { display: -webkit-box; min-height: 69px; margin: 22px 0 18px; overflow: hidden; color: #aaa5b1; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
    .details { display: flex; flex-wrap: wrap; gap: 7px; margin-top: auto; padding-top: 17px; border-top: 1px solid rgba(255,255,255,.055); }
    .chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 7px; background: rgba(255,255,255,.04); color: #aaa5b4; font-size: .72rem; }
    .actions { display: grid; grid-template-columns: 1fr 44px; gap: 9px; margin-top: 18px; }
    .install, .copy {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 44px;
      border-radius: 11px;
      cursor: pointer;
      text-decoration: none;
      transition: transform .15s, background .15s, border-color .15s;
    }
    .install { border: 1px solid #8b5cf6; background: var(--purple); color: white; font-weight: 700; }
    .install:hover { background: #9b6df8; transform: translateY(-1px); }
    .copy { border: 1px solid var(--border); background: #1a1820; color: #d7d2de; }
    .copy:hover { border-color: rgba(139,92,246,.55); background: var(--purple-soft); }
    .empty { display: none; padding: 70px 20px; text-align: center; color: var(--muted); }
    .toast {
      position: fixed;
      z-index: 10;
      right: 22px;
      bottom: 22px;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 13px 17px;
      border: 1px solid rgba(66,211,146,.3);
      border-radius: 12px;
      background: #151a18;
      color: #dff8eb;
      box-shadow: 0 18px 50px rgba(0,0,0,.42);
      opacity: 0;
      transform: translateY(14px);
      pointer-events: none;
      transition: opacity .2s, transform .2s;
    }
    .toast.visible { opacity: 1; transform: translateY(0); }
    footer { padding: 28px 20px; border-top: 1px solid var(--border); text-align: center; color: #77727f; font-size: .8rem; }
    @media (max-width: 1050px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 780px) {
      .hero { padding: 58px 20px 52px; }
      .container { width: min(100% - 28px, 620px); padding-top: 32px; }
      .toolbar { align-items: stretch; flex-direction: column; gap: 18px; }
      .search-wrap { width: 100%; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .card { min-height: 330px; padding: 20px; }
    }
    @media (max-width: 540px) { .grid { grid-template-columns: 1fr; } .card { min-height: 310px; } }
    @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; transition: none !important; } }
  </style>
</head>
<body>
  <header class="hero">
    <div class="brand" aria-hidden="true">
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none"><path d="M8 5.5v13l10-6.5L8 5.5Z" fill="currentColor"/></svg>
    </div>
    <h1>GayXXX Stremio Addons</h1>
    <p>Choose a provider and install it directly in Stremio. Every provider has its own independent manifest, catalog, metadata, and stream endpoint.</p>
    <div class="hero-tags"><span class="hero-tag">26 individual addons</span><span class="hero-tag">Catalog + Search</span><span class="hero-tag">Independent manifests</span></div>
  </header>
  <main class="container">
    <div class="toolbar">
      <div><h2>Available providers</h2><p><span id="count">${providers.length}</span> addons available for installation</p></div>
      <label class="search-wrap" aria-label="Search providers">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="search" type="search" placeholder="Search providers…" autocomplete="off">
      </label>
    </div>
    <section id="grid" class="grid" aria-live="polite"></section>
    <div id="empty" class="empty">No providers match your search.</div>
  </main>
  <footer>Manifest URLs are generated from this deployment. Install only providers you are legally permitted to access.</footer>
  <div id="toast" class="toast" role="status"><span>✓</span><span>Manifest URL copied</span></div>
  <script>
    const providers = ${escapeJson(providers)};
    const grid = document.querySelector("#grid");
    const search = document.querySelector("#search");
    const count = document.querySelector("#count");
    const empty = document.querySelector("#empty");
    const toast = document.querySelector("#toast");
    const icon = {
      install: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      copy: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" stroke-width="2"/></svg>'
    };
    const html = (value) => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
    const manifestUrl = provider => new URL('/' + provider.id + '/manifest.json', window.location.origin).href;
    const installUrl = provider => manifestUrl(provider).replace(/^https?:\\/\\//, 'stremio://');
    function render(items) {
      grid.innerHTML = items.map(provider => {
        const initials = provider.name.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase();
        const types = provider.types.map(type => '<span class="chip">' + html(type) + '</span>').join('');
        const logo = provider.logo ? '<img src="' + html(provider.logo) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '';
        return '<article class="card" data-search="' + html((provider.name + ' ' + provider.id + ' ' + provider.description).toLowerCase()) + '">' +
          '<div class="card-head"><div class="logo" aria-hidden="true"><span>' + html(initials) + '</span>' + logo + '</div><div class="card-title"><h3 title="' + html(provider.name) + '">' + html(provider.name) + '</h3><div class="manifest-id">' + html(provider.manifestId) + '</div></div></div>' +
          '<p class="description">' + html(provider.description) + '</p>' +
          '<div class="details"><span class="chip">◎ ' + html(provider.language) + '</span><span class="chip">⚡ catalog · meta · stream</span>' + types + '</div>' +
          '<div class="actions"><a class="install" href="' + html(installUrl(provider)) + '">' + icon.install + 'Install in Stremio</a><button class="copy" type="button" data-copy="' + html(manifestUrl(provider)) + '" aria-label="Copy ' + html(provider.name) + ' manifest URL" title="Copy manifest URL">' + icon.copy + '</button></div>' +
          '</article>';
      }).join('');
      count.textContent = items.length;
      empty.style.display = items.length ? 'none' : 'block';
    }
    let toastTimer;
    grid.addEventListener('click', async event => {
      const button = event.target.closest('[data-copy]');
      if (!button) return;
      const value = button.dataset.copy;
      try { await navigator.clipboard.writeText(value); }
      catch (_) { const area = document.createElement('textarea'); area.value = value; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
      toast.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('visible'), 1800);
    });
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      render(providers.filter(provider => (provider.name + ' ' + provider.id + ' ' + provider.description).toLowerCase().includes(query)));
    });
    render(providers);
  </script>
</body>
</html>`;
}

module.exports = { renderDirectoryPage };
