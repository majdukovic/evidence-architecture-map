#!/usr/bin/env node
/*
 * Creates a new map folder from the templates. Never overwrites existing files.
 *   node init.js <map-dir> [--title "Acme Platform Map"] [--repos <dir-with-the-repos>]
 */
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const dir = args.find((a, i) => !a.startsWith('--') && !['--title', '--repos'].includes(args[i - 1]));
if (!dir) { console.error('Usage: node init.js <map-dir> [--title "..."] [--repos <dir>]'); process.exit(2); }
const T = path.join(__dirname, '..', 'templates');
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) return console.log(`kept     ${to}`);
  fs.copyFileSync(from, to); console.log(`created  ${to}`);
};
for (const f of fs.readdirSync(path.join(T, 'map'))) copy(path.join(T, 'map', f), path.join(dir, f));
for (const f of fs.readdirSync(path.join(T, 'review'))) copy(path.join(T, 'review', f), path.join(dir, 'review', f));
const mapFile = path.join(dir, 'map.json'), map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
if (opt('--title') && map.title === 'System Map') map.title = opt('--title');
// --repos is a path from where you run this (or absolute); a path that only works from the map folder is accepted too
let reposAbs = opt('--repos') && path.resolve(opt('--repos'));
if (reposAbs && !fs.existsSync(reposAbs) && fs.existsSync(path.resolve(dir, opt('--repos')))) {
  reposAbs = path.resolve(dir, opt('--repos'));
  console.log(`note: ${opt('--repos')} does not exist from here, using it relative to the map folder: ${reposAbs}`);
}
if (reposAbs && !fs.existsSync(reposAbs)) console.warn(`warning: ${reposAbs} does not exist yet`);
if (reposAbs && map.reposDir === '..') map.reposDir = path.relative(path.resolve(dir), reposAbs) || '.';
fs.writeFileSync(mapFile, JSON.stringify(map, null, 2) + '\n');
if (!opt('--repos')) console.warn(`\nwarning: no --repos given, so map.json says the clones are in ${path.resolve(dir, map.reposDir)}. Edit "reposDir" if they are elsewhere.`);
const rel = path.relative(process.cwd(), path.join(__dirname, 'build.js'));
console.log(`\nNext: fill components.json, connections.json and flows.json, then run\n  node ${rel.startsWith('..') ? path.join(__dirname, 'build.js') : rel} ${dir} --pin --verify`);
