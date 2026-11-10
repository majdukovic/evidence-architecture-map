#!/usr/bin/env node
// Runs ui-audit.js with plain Playwright, without an MCP server.
//   npm i -D playwright && npx playwright install chromium
//   node run-ui-audit.mjs <map-dir> [page.html]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const [dir, page = 'architecture.html'] = process.argv.slice(2);
if (!dir) { console.error('Usage: node run-ui-audit.mjs <map-dir> [page.html]'); process.exit(2); }
let chromium;
// Playwright installed next to this script, or in the folder you run it from (npm i -D playwright there)
try { ({ chromium } = await import('playwright')); } catch {
  try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(2); }
}

const root = path.resolve(dir);
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const url = `http://127.0.0.1:${server.address().port}/${page}`;

const audit = (0, eval)(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'ui-audit.js'), 'utf8'));
const browser = await chromium.launch();
try {
  const result = await audit(await browser.newPage(), url);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.problems.length || result.consoleErrors.length ? 1 : 0;
} finally { await browser.close(); server.close(); }
