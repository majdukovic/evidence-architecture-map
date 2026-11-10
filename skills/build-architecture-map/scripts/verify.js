#!/usr/bin/env node
/*
 * Checks every evidence reference in a map folder against the code.
 *
 *   node verify.js <map-dir> [--repos <dir>] [--at head|pinned] [--json]
 *
 * For each { ref: "repo:path:line", quote } it reads the file from the repo's default branch (origin/HEAD) with
 * git, never from the working tree, and checks the quote is on that line or within two lines of it. With
 * --at pinned it reads the commit recorded in pins.json instead. It also fails a reference whose nearby lines
 * look like a credential, so the page never links to one.
 *
 * Exit code: 0 all references OK, 1 some failed, 2 a repo could not be read.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const dirArg = args.find((a, i) => !a.startsWith('--') && !['--repos', '--at'].includes(args[i - 1]));
if (!dirArg) { console.error('Usage: node verify.js <map-dir> [--repos <dir>] [--at head|pinned] [--json]'); process.exit(2); }
const at = opt('--at', 'head');
const m = L.loadMap(dirArg);
const root = L.reposRoot(m, opt('--repos'));

const revs = {}, files = {}, setup = [];
function revFor(repo) {
  if (repo in revs) return revs[repo];
  const dir = L.repoDir(m, root, repo);
  if (!fs.existsSync(dir)) { setup.push(`${repo}: not cloned at ${dir}`); return (revs[repo] = null); }
  if (at === 'pinned') {
    const sha = (m.pins.repos[repo] || {}).sha;
    try { L.git(dir, 'cat-file', '-e', sha + '^{commit}'); return (revs[repo] = { dir, rev: sha }); }
    catch { setup.push(`${repo}: pinned commit ${sha || '(none)'} is not in the local clone; fetch it or use --at head`); return (revs[repo] = null); }
  }
  const d = L.defaultRev(dir);
  if (!d) { setup.push(`${repo}: cannot read a default branch at ${dir}`); return (revs[repo] = null); }
  return (revs[repo] = { dir, rev: d.rev });
}
function fileLines(repo, p) {
  const k = repo + ':' + p;
  if (!(k in files)) {
    const r = revFor(repo);
    try { files[k] = r ? L.git(r.dir, 'show', `${r.rev}:${p}`).split('\n') : null; } catch { files[k] = undefined; }
  }
  return files[k];
}

const results = L.collectEvidence(m).map(({ where, ref, quote }) => {
  const e = { where, ref, quote };
  const r = L.parseRef(e.ref);
  if (!r) return { ...e, ok: false, reason: 'malformed ref' };
  const lines = fileLines(r.repo, r.path);
  if (lines === null) return { ...e, ok: false, reason: 'repo not available', setup: true };
  if (lines === undefined) return { ...e, ok: false, reason: 'file not on the default branch' };
  const q = e.quote || '';
  const near = [];
  for (let d = 0; d <= 2; d++) for (const n of d ? [r.line - d, r.line + d] : [r.line]) if (n >= 1 && n <= lines.length) near.push(n);
  const window = lines.slice(Math.max(0, r.line - 3), r.line + 2).join('\n');
  if (L.looksSecret(window)) return { ...e, ok: false, reason: 'the cited lines look like they hold a credential; cite something else' };
  const hit = near.find(n => lines[n - 1].includes(q));
  if (hit === r.line) return { ...e, ok: true };
  if (hit) return { ...e, ok: true, note: `quote is on line ${hit}` };
  const elsewhere = lines.findIndex(x => x.includes(q));
  if (elsewhere >= 0) return { ...e, ok: false, reason: `quote moved to line ${elsewhere + 1}`, suggest: `${r.repo}:${r.path}:${elsewhere + 1}` };
  return { ...e, ok: false, reason: 'quote not found in the file' };
});

const bad = results.filter(x => !x.ok), notes = results.filter(x => x.ok && x.note);
if (args.includes('--json')) {
  console.log(JSON.stringify({ total: results.length, ok: results.length - bad.length, failures: bad, notes, setup }, null, 2));
} else {
  setup.forEach(s => console.error('setup: ' + s));
  bad.filter(x => !x.setup).forEach(x => console.log(`FAIL ${x.where}: ${x.ref}  ${x.reason}${x.suggest ? ` (try ${x.suggest})` : ''}\n     quote: ${JSON.stringify(x.quote)}`));
  notes.forEach(x => console.log(`note ${x.where}: ${x.ref}  ${x.note}`));
  console.log(`${results.length - bad.length}/${results.length} references OK` + (at === 'pinned' ? ' (at pinned commits)' : ' (on each default branch)'));
}
process.exit(setup.length ? 2 : bad.length ? 1 : 0);
