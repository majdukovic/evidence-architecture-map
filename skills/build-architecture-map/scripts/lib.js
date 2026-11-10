// Shared helpers for build.js and verify.js. No dependencies beyond Node 18+ and git.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20 });

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing ${file}`);
  }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${file}: ${e.message}`); }
}

/* A map folder holds map.json, components.json, connections.json, flows.json and, optionally, facts.json,
   intro.html, about.html. pins.json is written by build.js --pin. */
function loadMap(dir) {
  dir = path.resolve(dir);
  const comp = readJson(path.join(dir, 'components.json'));
  const read = f => fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : null;
  return {
    dir,
    map: readJson(path.join(dir, 'map.json')),
    layers: comp.layers || [],
    components: comp.components || [],
    connections: readJson(path.join(dir, 'connections.json'), []),
    flows: readJson(path.join(dir, 'flows.json'), []),
    facts: readJson(path.join(dir, 'facts.json'), []),
    intro: read('intro.html'),
    about: read('about.html'),
    pins: readJson(path.join(dir, 'pins.json'), { verifiedOn: null, repos: {} }),
  };
}

const reposRoot = (m, override) => override ? path.resolve(override) : path.resolve(m.dir, m.map.reposDir || '..');
const repoConf = (m, name) => (m.map.repos || {})[name] || {};
const repoDir = (m, root, name) => path.resolve(root, repoConf(m, name).path || name);

/* The default branch as the remote sees it. Falls back to HEAD only for repos with no remote. */
function defaultRev(dir) {
  for (const ref of ['refs/remotes/origin/HEAD', 'refs/remotes/origin/main', 'refs/remotes/origin/master']) {
    try { git(dir, 'rev-parse', '--verify', '-q', ref); return { rev: ref, branch: branchOf(dir, ref) }; } catch { /* try next */ }
  }
  try { git(dir, 'rev-parse', '--verify', '-q', 'HEAD'); return { rev: 'HEAD', branch: null, warn: 'no origin remote, using HEAD' }; } catch { return null; }
}
function branchOf(dir, ref) {
  try { return git(dir, 'symbolic-ref', '--short', ref).trim().replace(/^origin\//, ''); } catch { return ref.split('/').pop(); }
}

/* Turn a git remote URL into the repo's web page. Returns null when it cannot tell. */
function webFromRemote(url) {
  if (!url) return null;
  url = url.trim().replace(/\.git$/, '');
  let m = /^git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/(.+)$/.exec(url);
  if (m) return `https://dev.azure.com/${m[1]}/${m[2]}/_git/${m[3]}`;
  m = /^(?:ssh:\/\/)?[^@/\s]+@([^:/\s]+)(?::\d+)?[:/](.+)$/.exec(url);
  if (m) return `https://${m[1]}/${m[2]}`;
  m = /^https?:\/\/(?:[^@/]+@)?(.+)$/.exec(url);
  if (m) return `https://${m[1]}`;
  return null;
}

function hostKind(web) {
  if (!web) return null;
  const h = new URL(web).hostname;
  if (/(^|\.)github\./.test(h) || h === 'github.com') return 'github';
  if (/gitlab/.test(h)) return 'gitlab';
  if (h === 'bitbucket.org') return 'bitbucket';
  if (/dev\.azure\.com$|visualstudio\.com$/.test(h)) return 'azure';
  if (/codeberg\.org$|gitea|forgejo/.test(h)) return 'gitea';
  return null;
}

/* Link templates per git host. {path} and {line} are filled in by the page. */
const TEMPLATES = {
  github: (w, sha) => [`${w}/blob/${sha}/{path}#L{line}`, `${w}/tree/${sha}`],
  gitlab: (w, sha) => [`${w}/-/blob/${sha}/{path}#L{line}`, `${w}/-/tree/${sha}`],
  bitbucket: (w, sha) => [`${w}/src/${sha}/{path}#lines-{line}`, `${w}/src/${sha}/`],
  'bitbucket-server': (w, sha) => [`${w}/browse/{path}?at=${sha}#{line}`, `${w}/browse?at=${sha}`],
  azure: (w, sha) => [`${w}?path=/{path}&version=GC${sha}&line={line}&lineEnd={line}&lineStartColumn=1&lineEndColumn=200`, `${w}?version=GC${sha}`],
  gitea: (w, sha) => [`${w}/src/commit/${sha}/{path}#L{line}`, `${w}/src/commit/${sha}`],
};
function linkTemplates(m, name) {
  const conf = repoConf(m, name), pin = m.pins.repos[name] || {};
  const web = (conf.web || pin.web || '').replace(/\/$/, ''), sha = pin.sha;
  if (conf.fileTemplate) {
    const fill = t => t.replace('{web}', web).replace('{sha}', sha);
    return { file: fill(conf.fileTemplate), tree: conf.treeTemplate ? fill(conf.treeTemplate) : null };
  }
  const kind = conf.link || m.map.link || hostKind(web);
  if (!web || !sha || !TEMPLATES[kind]) return { file: null, tree: null };
  const [file, tree] = TEMPLATES[kind](web, sha);
  return { file, tree };
}

/* Every evidence item in the map, with where it is used (for error messages). */
function collectEvidence(m) {
  const out = [];
  const add = (where, e) => out.push({ where, ...(e || {}) });
  m.components.forEach(c => {
    (c.evidence || []).forEach(e => add(`component ${c.id}`, e));
    (c.tests || []).forEach(e => add(`component ${c.id} tests`, e));
  });
  m.connections.forEach(c => (c.evidence || []).forEach(e => add(`connection ${c.from} -> ${c.to}`, e)));
  m.flows.forEach(f => {
    (f.steps || []).forEach((s, i) => {
      (s.evidence || []).forEach(e => add(`flow ${f.id} step ${i + 1}`, e));
      ['requestSchema', 'responseSchema'].forEach(k => { if (s[k]) add(`flow ${f.id} step ${i + 1} ${k}`, s[k]); });
    });
    (f.tests || []).forEach(e => add(`flow ${f.id} tests`, e));
  });
  m.facts.forEach(g => (g.items || []).forEach((it, i) => (it.evidence || []).forEach(e => add(`fact "${g.group}" #${i + 1}`, e))));
  return out;
}

const REF = /^([^:\s]+):([^:]+):(\d+)$/;
const parseRef = ref => { const x = REF.exec(ref || ''); return x ? { repo: x[1], path: x[2], line: +x[3] } : null; };

/* Never cite files that usually hold secrets, and never quote or link a line that looks like a credential. */
const SECRET_FILE = /(^|\/)([^/]*\.(pem|key|p12|pfx|jks|keystore|kdbx)|id_(rsa|dsa|ecdsa|ed25519)|\.netrc|\.npmrc|\.pypirc|credentials(\.\w+)?|secrets?\.(ya?ml|json|properties|conf|env))$/i;
const SECRET_KEY = '(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?key|auth[_-]?token|client[_-]?secret|private[_-]?key)';
const PLACEHOLDER = /^(?:null|none|nil|true|false|changeme|change-me|example|xxx+|\*+|<[^>]*>|your[-_ ].*|todo)$/i;
// a type or a variable, not a value: String, Option[String], string, str, Secret, cfg.password, getPassword()
const NOT_A_VALUE = /^(?:[A-Z][\w.]*(?:\[[^\]]*\]|<[^>]*>)?\??|string|str|int|bool|boolean|bytes|any|number|char\[\]|[a-z_][\w]*(?:\.[\w]+)+|[\w.]+\(.*\))$/;
// key names that only mention a secret: PasswordResetPath, API_KEY_HEADER, passwordField, secretName
const NAME_SUFFIX = /(?:path|url|uri|endpoint|route|name|field|header|param|label|placeholder|reset|hash|hasher|length|policy|regex|pattern|storage|file|env|var|id|type|prefix)s?$/i;
const isName = (key, value) => NAME_SUFFIX.test(key.replace(/["']/g, '')) || new RegExp(SECRET_KEY, 'i').test(value);
function credentialAssignment(line) {
  // a quoted literal: password = "s3cret", "apiKey": "abc123", password: 'x9y8z7'
  const q = new RegExp(`\\b([\\w.-]*${SECRET_KEY}[\\w.-]*)["']?\\s*[:=]\\s*["']([^"']{4,})["']`, 'i').exec(line);
  if (q && !/^[$%{<]/.test(q[2]) && !PLACEHOLDER.test(q[2].trim()) && !isName(q[1], q[2])) return true;
  // an unquoted value on a key-value line (.properties, .env, YAML): DB_PASSWORD=hunter2, password: petclinic
  const u = new RegExp(`^\\s*(?:export\\s+)?([\\w.-]*${SECRET_KEY}[\\w.-]*)\\s*[:=]\\s*([^\\s#"']{4,})\\s*(?:#.*)?$`, 'i').exec(line);
  if (u) { const v = u[2].replace(/[,;)]+$/, ''); if (!/^[$%{<]/.test(v) && !PLACEHOLDER.test(v) && !NOT_A_VALUE.test(v) && !isName(u[1], v)) return true; }
  return false;
}
const SECRET_TEXT = [
  /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/, /\bsk-[A-Za-z0-9_-]{20,}/, /hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+/,
  /webhook\.office\.com\/webhookb2\/[^\s"']+/, /:\/\/[^\s:/@"']+:[^\s@/"'$<{]{4,}@/,
];
const looksSecret = text => SECRET_TEXT.some(r => r.test(text || '')) || String(text || '').split('\n').some(credentialAssignment);

/* Rich text fields may hold simple HTML. Refuse anything that could run script. */
const UNSAFE_HTML = [/<\s*(script|iframe|object|embed|style|link|meta|base|form|input|frame)\b/i, /\son\w+\s*=/i, /javascript\s*:/i, /data\s*:\s*text\/html/i];
const unsafeHtml = text => UNSAFE_HTML.some(r => r.test(text || ''));

module.exports = { git, readJson, loadMap, reposRoot, repoConf, repoDir, defaultRev, webFromRemote, hostKind, linkTemplates,
  collectEvidence, parseRef, SECRET_FILE, looksSecret, unsafeHtml };
