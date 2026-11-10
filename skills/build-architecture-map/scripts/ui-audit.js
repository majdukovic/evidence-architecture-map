// UI audit for a built architecture page. It is a single function expression so it can run two ways:
//  1. Playwright MCP: serve the map folder (python3 -m http.server 8790 --bind 127.0.0.1) and call
//     browser_run_code_unsafe with filename pointing at this file. It opens AUDIT_URL below.
//  2. Plain Playwright: node run-ui-audit.mjs <map-dir> (serves the folder itself and passes the URL).
// Returns { problems: [...], consoleErrors: [...], ...counts }. Both lists must be empty.
async (page, url) => {
  const AUDIT_URL = url || 'http://127.0.0.1:8790/architecture.html';
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const go = async (hash, w = 1440, h = 900, scheme = 'light') => {
    await page.setViewportSize({ width: w, height: h }); await page.emulateMedia({ colorScheme: scheme });
    await page.goto(`${AUDIT_URL}?audit=${Date.now()}#${hash}`);
  };
  await go('map'); await page.evaluate(() => { try { localStorage.clear(); } catch {} }); await go('map');

  const D = await page.evaluate(() => ({
    repos: ARCHMAP.meta.repos, nodes: ARCHMAP.nodes.map(n => [n.id, (n.tests || []).length]),
    flows: ARCHMAP.flows.map(f => [f.id, f.steps.length, (f.tests || []).length]),
    deg: Object.fromEntries(ARCHMAP.nodes.map(n => [n.id, [ARCHMAP.edges.filter(e => e.from === n.id).length, ARCHMAP.edges.filter(e => e.to === n.id).length]])),
  }));
  const problems = [];
  const expected = ref => {
    const m = /^([^:]+):(.+):(\d+)$/.exec(ref || ''); const t = m && D.repos[m[1]] && D.repos[m[1]].file;
    return t ? t.replace('{path}', m[2].split('/').map(encodeURIComponent).join('/')).replace('{line}', m[3]) : null;
  };
  const checkLinks = async (scope, where) => {
    const ls = await page.evaluate(sel => [...document.querySelectorAll(`${sel} a[data-ref]`)].map(a => ({ ref: a.dataset.ref, href: a.getAttribute('href') })), scope);
    for (const l of ls) { const want = expected(l.ref); if (!want || l.href !== want) problems.push(`${where}: link for ${l.ref} is ${l.href}, want ${want}`); }
    return ls.length;
  };
  const counts = { componentLinks: 0, stepLinks: 0, steps: 0 };

  // 1. every component card: connection counts, evidence links, tests section
  for (const [id, tests] of D.nodes) {
    await page.locator(`#mapSvg .node[data-id="${id}"]`).click();
    const r = await page.evaluate(() => {
      const s = document.querySelector('#side'), t = [...s.querySelectorAll('.sec-t')];
      const cnt = p => t.find(x => x.textContent.startsWith(p))?.nextElementSibling?.querySelectorAll('button.lnk').length || 0;
      return { title: s.querySelector('h2')?.textContent, o: cnt('Calls'), i: cnt('Called'), own: s.querySelectorAll(':scope > .ev').length,
        conns: [...s.querySelectorAll('details.conn > .c')].map(c => c.querySelectorAll('.ev a').length), tests: s.querySelectorAll('.qa .it').length, hash: location.hash };
    });
    if (!r.title) problems.push(`${id}: card did not open`);
    if (r.o !== D.deg[id][0] || r.i !== D.deg[id][1]) problems.push(`${id}: card shows ${r.o}/${r.i} connections, data has ${D.deg[id].join('/')}`);
    if (!r.own) problems.push(`${id}: no evidence shown`);
    if (r.conns.some(n => !n)) problems.push(`${id}: a connection has no evidence link`);
    if (r.tests !== tests) problems.push(`${id}: tests section shows ${r.tests} of ${tests}`);
    if (r.hash !== '#node.' + id) problems.push(`${id}: address is ${r.hash}`);
    counts.componentLinks += await checkLinks('#side', `component ${id}`);
  }

  // 2. every flow step, its test links, and Show on map
  if (D.flows.length) await page.click('#tab-flows');
  for (const [id, n, tests] of D.flows) {
    await page.click(`#flowlist [data-f="${id}"]`);
    const tl = await checkLinks('#flowHead', `flow ${id} tests`);
    if (tl !== tests) problems.push(`flow ${id}: ${tl} test links, data has ${tests}`);
    for (let i = 0; i < n; i++) {
      await page.locator('#seqSvg .seq-row').nth(i).click(); counts.steps++;
      const ok = await page.evaluate(([i, n]) => document.querySelector('#posT').textContent === `${i + 1} / ${n}`, [i, n]);
      if (!ok) problems.push(`flow ${id} step ${i + 1}: did not open`);
      const nl = await checkLinks('#inspector', `flow ${id} step ${i + 1}`);
      if (!nl) problems.push(`flow ${id} step ${i + 1}: no evidence shown`);
      counts.stepLinks += nl;
    }
    await page.click('#onMapB');
    const fm = await page.evaluate(() => document.querySelectorAll('#mapSvg .badge').length > 0 && getComputedStyle(document.querySelector('#flowBanner')).display !== 'none');
    if (!fm) problems.push(`flow ${id}: Show on map did not highlight the flow`);
    await page.click('#fbBack');
  }

  // 3. layout: no sideways scroll, no clipped map boxes, hidden elements really hidden
  const views = ['map', 'components', 'about'].concat(D.flows.length ? ['flows', 'mapflow.' + D.flows[0][0]] : []);
  for (const [w, h] of [[375, 812], [1024, 768], [1440, 900], [1920, 1080]]) for (const scheme of ['light', 'dark']) {
    for (const v of views) {
      await go(v, w, h, scheme);
      const q = await page.evaluate(() => {
        const a = document.querySelector('#mapScroll').getBoundingClientRect();
        return { ox: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          clipped: [...document.querySelectorAll('#mapSvg rect.box')].filter(b => { const x = b.getBoundingClientRect(); return x.width && (x.right > a.right + 1 || x.left < a.left - 1); }).length,
          hiddenShown: [...document.querySelectorAll('[hidden]')].filter(e => getComputedStyle(e).display !== 'none').length };
      });
      if (q.ox || q.clipped || q.hiddenShown) problems.push(`${w}px ${scheme} ${v}: sidewaysScroll=${q.ox} clippedBoxes=${q.clipped} hiddenShown=${q.hiddenShown}`);
    }
  }
  await go('map');
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  return { problems, consoleErrors: errors, ...counts };
}
