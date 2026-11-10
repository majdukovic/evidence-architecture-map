#!/usr/bin/env node
/*
 * Builds the interactive page and ARCHITECTURE.md from a map folder.
 *
 *   node build.js <map-dir>              check the data and build
 *   node build.js <map-dir> --verify     build, then check every evidence reference against the code
 *   node build.js <map-dir> --pin        record each cited repo's default-branch commit and web URL in pins.json,
 *                                        set "verified on" to today, then build
 *   --repos <dir>                        where the repos are cloned (default: map.json "reposDir", relative to the map folder)
 *
 * Node 18+ and git only. See ../references/data-format.md for the files a map folder holds.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('./lib');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const has = n => args.includes(n);
const dirArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--repos');
if (!dirArg) { console.error('Usage: node build.js <map-dir> [--pin] [--verify] [--repos <dir>]'); process.exit(2); }

const ASSETS = path.join(__dirname, '..', 'assets');
let m;
try { m = L.loadMap(dirArg); } catch (e) { console.error('Build failed: ' + e.message); process.exit(1); }
const root = L.reposRoot(m, opt('--repos'));

/* ---------- integrity checks ---------- */
const errs = [];
const ID = /^[a-z0-9][a-z0-9-]*$/;
const KINDS = ['req', 'res', 'async', 'self'];
const NOTES = ['no-body', 'sql', 'internal', 'unknown', 'class-fields'];
const ids = new Set(m.components.map(c => c.id)), layers = new Set(m.layers.map(l => l.id));
if (!m.map.title) errs.push('map.json: "title" is required');
if (!m.components.length) errs.push('components.json: no components');
if (layers.size !== m.layers.length) errs.push('components.json: duplicate layer ids');
if (ids.size !== m.components.length) errs.push('components.json: duplicate component ids');
m.components.forEach(c => {
  if (!ID.test(c.id || '')) errs.push(`component "${c.id}": id must be lower-case letters, digits and dashes`);
  if (!layers.has(c.layer)) errs.push(`component ${c.id}: unknown layer "${c.layer}"`);
  if (!c.label || !c.purpose) errs.push(`component ${c.id}: needs "label" and "purpose"`);
  if (!(c.evidence || []).length) errs.push(`component ${c.id}: no evidence`);
  (c.links || []).forEach(l => { if (!/^https?:\/\//.test(l.url || '') || !l.label) errs.push(`component ${c.id}: links need "label" and an http(s) "url"`); });
});
const seenConn = new Set();
m.connections.forEach(c => {
  const k = `${c.from} -> ${c.to}`;
  if (!ids.has(c.from) || !ids.has(c.to)) errs.push(`connection ${k}: unknown component`);
  if (!c.protocol) errs.push(`connection ${k}: needs "protocol"`);
  if (seenConn.has(k + c.protocol)) errs.push(`connection ${k} (${c.protocol}) appears twice`);
  seenConn.add(k + c.protocol);
  if (!(c.evidence || []).length) errs.push(`connection ${k}: no evidence`);
});
const flowIds = new Set();
m.flows.forEach(f => {
  if (!ID.test(f.id || '') || flowIds.has(f.id)) errs.push(`flow "${f.id}": missing, duplicate or badly formed id`);
  flowIds.add(f.id);
  if (!f.title || !(f.steps || []).length) errs.push(`flow ${f.id}: needs "title" and "steps"`);
  (f.actors || []).forEach(a => { if (!ids.has(a)) errs.push(`flow ${f.id}: unknown actor ${a}`); });
  (f.steps || []).forEach((s, i) => {
    const w = `flow ${f.id} step ${i + 1}`;
    if (!(f.actors || []).includes(s.from) || !(f.actors || []).includes(s.to)) errs.push(`${w}: ${s.from} -> ${s.to} is not in the flow's actors`);
    if (!KINDS.includes(s.kind)) errs.push(`${w}: kind must be one of ${KINDS.join(', ')}`);
    if (s.payloadNote && !NOTES.includes(s.payloadNote)) errs.push(`${w}: payloadNote must be one of ${NOTES.join(', ')}`);
    if (!(s.evidence || []).length) errs.push(`${w}: no evidence`);
  });
});
m.facts.forEach(g => (g.items || []).forEach((it, i) => { if (!(it.evidence || []).length) errs.push(`fact "${g.group}" #${i + 1}: no evidence`); }));

const evidence = L.collectEvidence(m);
evidence.forEach(e => {
  const r = L.parseRef(e.ref);
  if (!r) return errs.push(`${e.where}: malformed ref "${e.ref}" (want repo:path:line)`);
  if (typeof e.quote !== 'string' || e.quote.trim().length < 6 || e.quote.length > 120) errs.push(`${e.where}: ${e.ref}: quote must be 6 to 120 characters copied from that line`);
  if (L.SECRET_FILE.test(r.path)) errs.push(`${e.where}: ${e.ref}: never cite files that usually hold secrets`);
  if (L.looksSecret(e.quote)) errs.push(`${e.where}: ${e.ref}: the quote looks like a credential`);
});

const rich = [
  ...m.components.flatMap(c => [[`component ${c.id}`, c.purpose], [`component ${c.id}`, c.callout]]),
  ...m.flows.flatMap(f => [[`flow ${f.id}`, f.summary], ...(f.steps || []).map((s, i) => [`flow ${f.id} step ${i + 1}`, s.description])]),
  ...m.facts.flatMap(g => (g.items || []).map(it => [`fact "${g.group}"`, it.text])),
  ['intro.html', m.intro], ['about.html', m.about],
];
rich.forEach(([w, t]) => { if (t && L.unsafeHtml(t)) errs.push(`${w}: HTML may only use simple formatting (no script, iframe, style, on* handlers or javascript: links)`); });

const used = [...new Set(evidence.map(e => (L.parseRef(e.ref) || {}).repo).filter(Boolean))].sort();

/* ---------- pin commits ---------- */
if (has('--pin') && !errs.length) {
  for (const repo of used) {
    const dir = L.repoDir(m, root, repo);
    if (!fs.existsSync(dir)) { errs.push(`--pin: ${repo} is not cloned at ${dir}`); continue; }
    const d = L.defaultRev(dir);
    if (!d) { errs.push(`--pin: cannot read the default branch of ${repo} at ${dir}`); continue; }
    if (d.warn) console.warn(`warning: ${repo}: ${d.warn}`);
    let web = null;
    try { web = L.webFromRemote(L.git(dir, 'remote', 'get-url', 'origin')); } catch { /* no remote */ }
    m.pins.repos[repo] = { branch: d.branch, sha: L.git(dir, 'rev-parse', d.rev).trim(), web: L.repoConf(m, repo).web || web };
  }
  m.pins.verifiedOn = new Date().toISOString().slice(0, 10);
}
used.forEach(r => { if (!m.pins.repos[r] || !m.pins.repos[r].sha) errs.push(`no pinned commit for ${r} (run with --pin)`); });
if (errs.length) { console.error('Build failed:\n  ' + [...new Set(errs)].join('\n  ')); process.exit(1); }
if (has('--pin')) {
  m.pins.repos = Object.fromEntries(used.map(r => [r, m.pins.repos[r]]));
  fs.writeFileSync(path.join(m.dir, 'pins.json'), JSON.stringify(m.pins, null, 2) + '\n');
}
const links = Object.fromEntries(used.map(r => [r, L.linkTemplates(m, r)]));
const unlinked = used.filter(r => !links[r].file);
if (unlinked.length) console.warn(`warning: no web link for ${unlinked.join(', ')}; set "web" (and "link" if the host is self-hosted) in map.json repos`);

/* ---------- interactive page ---------- */
const PALETTE = ['#2f7fd1', '#c8457f', '#1f9d7a', '#b8901a', '#7b61c9', '#d9822b', '#3f8fa6', '#7a8899', '#a0522d', '#5b8c2a'];
const layersOut = m.layers.map((l, i) => ({ ...l, color: l.color || PALETTE[i % PALETTE.length] }));
const read = f => fs.readFileSync(path.join(ASSETS, f), 'utf8');
const title = m.map.title;
const key = (m.map.key || title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
const data = {
  meta: { title, key, verifiedOn: m.pins.verifiedOn, refCount: evidence.length,
    repos: Object.fromEntries(used.map(r => [r, { ...links[r], sha: m.pins.repos[r].sha, branch: m.pins.repos[r].branch }])) },
  layers: layersOut, nodes: m.components, edges: m.connections, flows: m.flows, facts: m.facts,
  mapIntro: m.intro || read('intro-default.html'),
  about: (m.about || read('about-default.html')) + read('about-verification.html'),
};
// keep the data inert inside the script tag
const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(new RegExp("[\\u2028\\u2029]", "g"), c => "\\u" + c.charCodeAt(0).toString(16));
const engine = read('engine.html');
const marker = '<script>\n/*__DATA__*/\n</script>';
if (!engine.includes(marker)) { console.error('Build failed: data marker not found in assets/engine.html'); process.exit(1); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const html = engine.replace('<title>__TITLE__</title>', () => `<title>${esc(title)}</title>`)
  .replace(marker, () => `<script id="map-data">\n/* Generated by build.js from ${esc(path.basename(m.dir))}/. Do not edit. */\nwindow.ARCHMAP = ${json};\n</script>`);
const out = m.map.output || {};
const htmlFile = path.join(m.dir, out.html || 'architecture.html');
fs.writeFileSync(htmlFile, html);

/* ---------- ARCHITECTURE.md ---------- */
const decode = s => s.replace(/&rarr;/g, '→').replace(/&larr;/g, '←').replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const md = s => decode(String(s || '')
  .replace(/<code>(.*?)<\/code>/gs, '`$1`').replace(/<(b|strong)>(.*?)<\/\1>/gs, '**$2**').replace(/<(i|em)>(.*?)<\/\1>/gs, '*$2*')
  .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs, '[$2]($1)').replace(/<br\s*\/?>/g, '  \n').replace(/<li>/g, '\n- ')
  .replace(/<\/(p|div|h[1-6]|ul|ol)>/g, '\n\n').replace(/<[^>]+>/g, '')).replace(/\n{3,}/g, '\n\n').trim();
const NODE = Object.fromEntries(m.components.map(c => [c.id, c]));
const evMd = e => {
  const r = L.parseRef(e.ref), t = links[r.repo].file;
  const url = t && t.replace('{path}', r.path.split('/').map(encodeURIComponent).join('/')).replace('{line}', r.line);
  const label = `${r.repo} › ${r.path.split('/').pop()}:${r.line}`;
  return `${url ? `[${label}](${url})` : label} \`${e.quote.replace(/`/g, "'")}\``;
};
const evBlock = list => (list || []).map(e => `  - ${evMd(e)}`).join('\n');
const mid = id => 'n_' + id.replace(/-/g, '_');
const mlabel = s => String(s).replace(/"/g, '#quot;').replace(/[;#]/g, ' ');
const lines = [];
const push = (...x) => lines.push(...x);
let kitUrl = null;
try { kitUrl = L.readJson(path.join(__dirname, '..', '..', '..', '.claude-plugin', 'plugin.json')).homepage; } catch { /* copied without the plugin folder */ }
push(`# ${title}`, '',
  `> Generated by ${kitUrl ? `[evidence-architecture-map](${kitUrl})` : 'evidence-architecture-map'} from the JSON files next to this one. Do not edit by hand.`,
  `> Every statement links to the line of code that supports it, at the commit checked on ${m.pins.verifiedOn}.`,
  `> The interactive version is \`${path.basename(htmlFile)}\`.`, '');
const intro = md(m.intro || '');
if (intro) push(intro, '');
push('## Overview', '', '```mermaid', 'flowchart LR');
m.layers.forEach(l => {
  const cs = m.components.filter(c => c.layer === l.id); if (!cs.length) return;
  push(`  subgraph ${mid('layer-' + l.id)}["${mlabel(l.label)}"]`, ...cs.map(c => `    ${mid(c.id)}["${mlabel(c.label)}"]`), '  end');
});
m.connections.forEach(c => push(`  ${mid(c.from)} -->|"${mlabel(c.protocol)}"| ${mid(c.to)}`));
push('```', '');
push('## Components', '');
m.layers.forEach(l => {
  const cs = m.components.filter(c => c.layer === l.id); if (!cs.length) return;
  push(`### ${l.label}`, '');
  cs.forEach(c => {
    push(`#### ${c.label}`, '', md(c.purpose), '');
    if (c.callout) push(`> ${md(c.callout).replace(/\n/g, '\n> ')}`, '');
    if (c.repo) push(`- **Repo:** ${links[c.repo] && links[c.repo].tree ? `[${c.repo}](${links[c.repo].tree})` : c.repo}`);
    if ((c.exposes || []).length) push(`- **Exposes:** ${c.exposes.map(x => '`' + x + '`').join(', ')}`);
    if ((c.stores || []).length) push(`- **Stores data in:** ${c.stores.join(', ')}`);
    const outs = m.connections.filter(e => e.from === c.id), ins = m.connections.filter(e => e.to === c.id);
    if (outs.length) push(`- **Calls / sends to:** ${outs.map(e => `${NODE[e.to].label} (${e.protocol})`).join(', ')}`);
    if (ins.length) push(`- **Called by / receives from:** ${ins.map(e => `${NODE[e.from].label} (${e.protocol})`).join(', ')}`);
    push('- **Evidence:**', evBlock(c.evidence));
    if ((c.tests || []).length) push('- **Tests and test helpers:**', ...c.tests.map(t => `  - ${t.name ? `\`${t.name}\` ` : ''}${evMd(t)}`));
    if ((c.links || []).length) push('- **Related links** (not evidence):', ...c.links.map(x => `  - [${x.label}](${x.url})`));
    push('');
  });
});
push('## Connections', '', '| From | To | Protocol | What | Evidence |', '|---|---|---|---|---|');
m.connections.forEach(c => push(`| ${NODE[c.from].label} | ${NODE[c.to].label} | ${c.protocol} | ${md(c.what || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')} | ${c.evidence.map(evMd).join('<br>').replace(/\|/g, '\\|')} |`));
push('');
if (m.flows.length) {
  push('## Flows', '');
  m.flows.forEach(f => {
    push(`### ${f.title}`, '');
    if (f.summary) push(md(f.summary), '');
    push('```mermaid', 'sequenceDiagram', ...f.actors.map(a => `  participant ${mid(a)} as ${mlabel(NODE[a].seqLabel || NODE[a].label)}`));
    f.steps.forEach(s => {
      const arrow = s.kind === 'res' ? '-->>' : s.kind === 'async' ? '-)' : '->>';
      push(`  ${mid(s.from)}${arrow}${mid(s.to)}: ${mlabel(s.label)}`);
    });
    push('```', '');
    f.steps.forEach((s, i) => {
      const hop = s.from === s.to ? `inside ${NODE[s.from].label}` : `${NODE[s.from].label} → ${NODE[s.to].label}`;
      push(`${i + 1}. **${s.label}** (${hop}${s.protocol ? ', ' + s.protocol : ''}). ${md(s.description || '').replace(/\n+/g, ' ')}`);
      if (s.call) push(`   - Call: \`${[s.call.verb, s.call.target].filter(Boolean).join(' ')}\``);
      push(evBlock(s.evidence).replace(/^ {2}/gm, '   '));
    });
    if ((f.tests || []).length) push('', '**Tested in:**', ...f.tests.map(t => `- ${t.name ? `\`${t.name}\` ` : ''}${evMd(t)}${t.why ? ': ' + t.why : ''}`));
    push('');
  });
}
if (m.facts.length) {
  push('## Facts', '');
  m.facts.forEach(g => { push(`### ${g.group}`, ''); g.items.forEach(it => push(`- ${md(it.text).replace(/\n+/g, ' ')}`, evBlock(it.evidence))); push(''); });
}
push('## Checking this document', '',
  `Every reference above is \`repo:path:line\` plus a quote from that line. To check them all against the repos' default branches:`, '',
  '```bash', `node <kit>/skills/build-architecture-map/scripts/verify.js ${path.basename(m.dir)} --repos <folder with the repos>`, '```', '');
const mdFile = path.join(m.dir, out.markdown || 'ARCHITECTURE.md');
fs.writeFileSync(mdFile, lines.join('\n'));

const steps = m.flows.reduce((a, f) => a + f.steps.length, 0);
console.log(`Built ${path.relative(process.cwd(), htmlFile)} and ${path.basename(mdFile)}: ${m.components.length} components, ${m.connections.length} connections, ` +
  `${m.flows.length} flows (${steps} steps), ${evidence.length} evidence references across ${used.length} repos (verified on ${m.pins.verifiedOn}).`);

if (has('--verify')) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'verify.js'), m.dir, '--repos', root], { stdio: 'inherit' });
  process.exit(r.status);
}
