#!/usr/bin/env node
/*
 * Prints a file from a repo's default branch with line numbers, so evidence can be copied exactly.
 *
 *   node show.js <repo-dir> <path> [from] [to]      e.g. node show.js ../repos/orders src/Main.scala 30 60
 *
 * Reads origin/HEAD (falls back to origin/main, origin/master, then HEAD), never the working tree.
 * One plain command, so agent permission checks can allow it without prompting.
 */
const L = require('./lib');
const [dir, file, from, to] = process.argv.slice(2);
if (!dir || !file) { console.error('Usage: node show.js <repo-dir> <path> [from] [to]'); process.exit(2); }
const d = L.defaultRev(dir);
if (!d) { console.error(`cannot read a default branch in ${dir}`); process.exit(2); }
if (d.warn) console.error(`warning: ${d.warn}`);
let text;
try { text = L.git(dir, 'show', `${d.rev}:${file}`); } catch { console.error(`${file} is not on ${d.rev} in ${dir}`); process.exit(1); }
const lines = text.split('\n');
const a = Math.max(1, +from || 1), b = Math.min(lines.length, +to || lines.length);
const w = String(b).length;
for (let i = a; i <= b; i++) console.log(`${String(i).padStart(w)}  ${lines[i - 1]}`);
