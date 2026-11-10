#!/usr/bin/env node
/*
 * End-to-end tests for build.js and verify.js on throwaway git repos.
 *   node test/run-tests.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const SCRIPTS = path.join(__dirname, '..', 'plugin', 'skills', 'build-architecture-map', 'scripts');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archmap-test-'));
const sh = (cwd, cmd, ...a) => execFileSync(cmd, a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const node = (...a) => spawnSync(process.execPath, a, { encoding: 'utf8' });
let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : '\n     ' + extra}`); if (!ok) failed++; };

/* two repos with an origin, the way a developer's clones look */
function makeRepo(name, files) {
  const bare = path.join(tmp, 'remote', name + '.git'), work = path.join(tmp, 'repos', name);
  fs.mkdirSync(bare, { recursive: true });
  sh(bare, 'git', 'init', '-q', '--bare', '-b', 'main');
  fs.mkdirSync(work, { recursive: true });
  sh(work, 'git', 'init', '-q', '-b', 'main');
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(work, f)), { recursive: true }); fs.writeFileSync(path.join(work, f), c); }
  sh(work, 'git', 'add', '.');
  sh(work, 'git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init');
  sh(work, 'git', 'remote', 'add', 'origin', bare);
  sh(work, 'git', 'push', '-q', 'origin', 'main');
  sh(work, 'git', 'remote', 'set-head', 'origin', 'main');
  sh(work, 'git', 'remote', 'set-url', 'origin', `git@github.com:acme/${name}.git`); // what --pin turns into a web link
  return work;
}
const orders = makeRepo('orders', {
  'src/main/scala/OrdersRoutes.scala': 'object OrdersRoutes {\n  val routes = path("orders") {\n    post { entity(as[NewOrder]) { o => complete(service.place(o)) } }\n  }\n}\n',
  'src/main/scala/PaymentsClient.scala': 'class PaymentsClient(base: Uri) {\n  def charge(c: Charge) = basicRequest.post(uri"$base/charges").body(c)\n}\n',
  'src/main/resources/application.conf': 'payments.base-url = ${?PAYMENTS_URL}\ndb.url = "jdbc:postgresql://db/orders"\n',
});
makeRepo('payments', { 'app/Routes.scala': 'val charges = path("charges") { post { complete(charge()) } }\n' });

const map = path.join(tmp, 'map');
fs.mkdirSync(map);
const write = (f, o) => fs.writeFileSync(path.join(map, f), typeof o === 'string' ? o : JSON.stringify(o, null, 2));
const E = (ref, quote) => ({ ref, quote });
write('map.json', { title: 'Acme Shop Map', reposDir: '../repos' });
write('components.json', {
  layers: [{ id: 'api', label: 'Services' }, { id: 'data', label: 'Data stores' }],
  components: [
    { id: 'orders', label: 'Orders', short: 'Order API', layer: 'api', repo: 'orders', purpose: 'Takes new orders over <b>HTTP</b>.', exposes: ['POST /orders'], stores: ['PostgreSQL orders'],
      evidence: [E('orders:src/main/scala/OrdersRoutes.scala:2', 'path("orders")')], links: [{ label: 'Dashboard', url: 'https://grafana.example.com/d/orders', kind: 'dashboard' }] },
    { id: 'payments', label: 'Payments', short: 'Charges cards', layer: 'api', repo: 'payments', purpose: 'Charges a card.', evidence: [E('payments:app/Routes.scala:1', 'path("charges")')] },
    { id: 'orders-db', label: 'Orders DB', short: 'PostgreSQL', layer: 'data', purpose: 'Order rows.', evidence: [E('orders:src/main/resources/application.conf:2', 'jdbc:postgresql://db/orders')] },
  ],
});
write('connections.json', [
  { from: 'orders', to: 'payments', protocol: 'HTTP', what: 'Charges the card for an order', evidence: [E('orders:src/main/scala/PaymentsClient.scala:2', 'basicRequest.post(uri"$base/charges")')] },
  { from: 'orders', to: 'orders-db', protocol: 'JDBC', what: 'Stores orders', evidence: [E('orders:src/main/resources/application.conf:2', 'jdbc:postgresql')] },
]);
write('flows.json', [{ id: 'place-order', title: 'Place an order', featured: true, summary: 'A customer places an order.', actors: ['orders', 'payments'], steps: [
  { from: 'orders', to: 'payments', kind: 'req', label: 'Charge the card', protocol: 'HTTP', call: { verb: 'POST', target: '/charges' }, request: { amount: '12.50' },
    description: 'Orders asks Payments to charge.', evidence: [E('orders:src/main/scala/PaymentsClient.scala:2', '.post(uri"$base/charges")')] },
  { from: 'payments', to: 'orders', kind: 'res', label: 'Charge result', noPayload: true, evidence: [E('payments:app/Routes.scala:1', 'complete(charge())')] },
] }]);
write('facts.json', [{ group: 'How it is configured', items: [{ text: 'The payments URL comes from <code>PAYMENTS_URL</code>.', evidence: [E('orders:src/main/resources/application.conf:1', '${?PAYMENTS_URL}')] }] }]);

let r = node(path.join(SCRIPTS, 'build.js'), map, '--pin', '--verify');
check('build --pin --verify passes on a correct map', r.status === 0 && /8\/8 references OK/.test(r.stdout), r.stdout + r.stderr);
const pins = JSON.parse(fs.readFileSync(path.join(map, 'pins.json'), 'utf8'));
check('pins record branch, sha and web link', pins.repos.orders.branch === 'main' && /^[0-9a-f]{40}$/.test(pins.repos.orders.sha) && pins.repos.orders.web === 'https://github.com/acme/orders', JSON.stringify(pins));
const html = fs.readFileSync(path.join(map, 'architecture.html'), 'utf8');
check('page has the title and GitHub links at the pinned commit', html.includes('<title>Acme Shop Map</title>') && html.includes(`https://github.com/acme/orders/blob/${pins.repos.orders.sha}/{path}#L{line}`));
const mdText = fs.readFileSync(path.join(map, 'ARCHITECTURE.md'), 'utf8');
check('ARCHITECTURE.md has mermaid, evidence links and facts', mdText.includes('```mermaid') && mdText.includes(`blob/${pins.repos.orders.sha}/src/main/scala/OrdersRoutes.scala#L2`) && mdText.includes('## Facts'));

/* drift: code changes on the default branch after the map was built */
const orders2 = path.join(tmp, 'repos', 'orders');
fs.writeFileSync(path.join(orders2, 'src/main/scala/OrdersRoutes.scala'), '// moved\n// down\n// three\n' + fs.readFileSync(path.join(orders2, 'src/main/scala/OrdersRoutes.scala'), 'utf8'));
fs.writeFileSync(path.join(orders2, 'src/main/scala/PaymentsClient.scala'), 'class PaymentsClient(base: Uri) {\n  def charge(c: Charge) = grpcStub.charge(c)\n}\n');
sh(orders2, 'git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-am', 'change');
sh(orders2, 'git', 'push', '-q', path.join(tmp, 'remote', 'orders.git'), 'main');
sh(orders2, 'git', 'fetch', '-q', path.join(tmp, 'remote', 'orders.git'), 'main:refs/remotes/origin/main');
r = node(path.join(SCRIPTS, 'verify.js'), map);
check('verify reports a moved quote with the new line', r.status === 1 && /quote moved to line 5 \(try orders:src\/main\/scala\/OrdersRoutes.scala:5\)/.test(r.stdout), r.stdout);
check('verify reports a quote that no longer exists', /PaymentsClient.scala:2  quote not found in the file/.test(r.stdout), r.stdout);
r = node(path.join(SCRIPTS, 'verify.js'), map, '--at', 'pinned');
check('verify --at pinned still passes on the old commits', r.status === 0, r.stdout + r.stderr);
r = node(path.join(SCRIPTS, 'verify.js'), map, '--json');
const j = JSON.parse(r.stdout);
check('verify --json lists failures', j.total === 8 && j.failures.length === 3, r.stdout);

/* the build refuses unsafe content */
const comps = JSON.parse(fs.readFileSync(path.join(map, 'components.json'), 'utf8'));
const bad = (mut, name, re) => {
  const copy = JSON.parse(JSON.stringify(comps)); mut(copy); write('components.json', copy);
  const x = node(path.join(SCRIPTS, 'build.js'), map);
  check(name, x.status === 1 && re.test(x.stderr), x.stdout + x.stderr);
};
bad(c => { c.components[0].purpose = 'Hi <img src=x onerror=alert(1)>'; }, 'build rejects script in HTML fields', /simple formatting/);
bad(c => { c.components[0].evidence.push(E('orders:certs/server.pem:1', 'BEGIN CERTIFICATE')); }, 'build rejects files that usually hold secrets', /never cite files that usually hold secrets/);
bad(c => { c.components[0].evidence.push(E('orders:.env:1', 'DB_PASSWORD=hunter2hunter2')); }, 'build rejects a quote that looks like a credential', /the quote looks like a credential/);
bad(c => { c.components[1].evidence = []; }, 'build rejects a component with no evidence', /payments: no evidence/);
bad(c => { c.components[1].layer = 'nope'; }, 'build rejects an unknown layer', /unknown layer/);
write('components.json', comps);
const conns = JSON.parse(fs.readFileSync(path.join(map, 'connections.json'), 'utf8'));
write('connections.json', [...conns, { from: 'orders', to: 'ghost', protocol: 'HTTP', evidence: conns[0].evidence }]);
r = node(path.join(SCRIPTS, 'build.js'), map);
check('build rejects a connection to an unknown component', r.status === 1 && /unknown component/.test(r.stderr), r.stderr);
write('connections.json', conns);

/* a secret on the cited line fails verification even when the quote itself is harmless */
fs.writeFileSync(path.join(orders2, 'src/main/resources/application.conf'), 'payments.base-url = ${?PAYMENTS_URL}\ndb.url = "jdbc:postgresql://db/orders"\ndb.password = "s3cretValue99"\n');
sh(orders2, 'git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-am', 'oops');
sh(orders2, 'git', 'push', '-q', path.join(tmp, 'remote', 'orders.git'), 'main');
sh(orders2, 'git', 'fetch', '-q', path.join(tmp, 'remote', 'orders.git'), 'main:refs/remotes/origin/main');
r = node(path.join(SCRIPTS, 'verify.js'), map);
check('verify fails a reference next to a credential', /application.conf:2  the cited lines look like they hold a credential/.test(r.stdout), r.stdout);

/* loophole: citing a harmless line while quoting the line next to a credential, and drift allowance right after --pin */
const facts0 = fs.readFileSync(path.join(map, 'facts.json'), 'utf8');
write('facts.json', [{ group: 'Config', items: [
  { text: 'Orders reads the payments URL from config.', evidence: [E('orders:src/main/resources/application.conf:1', 'jdbc:postgresql://db/orders')] }] }]);
r = node(path.join(SCRIPTS, 'verify.js'), map);
check('verify fails a quote taken from a line next to a credential',
  /application.conf:1  the cited lines look like they hold a credential/.test(r.stdout), r.stdout);
fs.mkdirSync(path.join(orders2, 'conf'), { recursive: true });
fs.writeFileSync(path.join(orders2, 'conf/db.conf'), 'name = "orders"\nmode = "prod"\nurl = "jdbc:postgresql://db/orders"\npassword = "s3cretValue99"\n', { flag: 'w' });
sh(orders2, 'git', 'add', 'conf/db.conf');
sh(orders2, 'git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'db conf');
sh(orders2, 'git', 'push', '-q', path.join(tmp, 'remote', 'orders.git'), 'main');
sh(orders2, 'git', 'fetch', '-q', path.join(tmp, 'remote', 'orders.git'), 'main:refs/remotes/origin/main');
write('facts.json', [{ group: 'Config', items: [
  { text: 'Orders uses PostgreSQL.', evidence: [E('orders:conf/db.conf:1', 'jdbc:postgresql://db/orders')] }] }]);
r = node(path.join(SCRIPTS, 'verify.js'), map);
check('verify fails a clean cited line whose quote sits next to a credential', /db.conf:1  the cited lines look like they hold a credential/.test(r.stdout), r.stdout);
write('facts.json', [{ group: 'Routes', items: [
  { text: 'Payments exposes charges.', evidence: [E('orders:src/main/scala/OrdersRoutes.scala:4', 'path("orders")')] }] }]);
r = node(path.join(SCRIPTS, 'verify.js'), map, '--exact');
check('verify --exact fails a quote two lines from the cited line', r.status === 1 && /OrdersRoutes.scala:4  quote is on line 5, not the cited line/.test(r.stdout), r.stdout);
r = node(path.join(SCRIPTS, 'verify.js'), map);
check('without --exact the same quote is only a note', /note fact "Routes" #1: orders:src\/main\/scala\/OrdersRoutes.scala:4  quote is on line 5/.test(r.stdout), r.stdout);
fs.writeFileSync(path.join(map, 'facts.json'), facts0);

/* the credential check: real literals are caught, types, placeholders and field names are not */
const L = require(path.join(SCRIPTS, 'lib.js'));
const credCases = [['case class Login_IN(login: String, password: String)', false], ['  password: Option[String] = None', false], ['password: string;', false],
  ['password = ${?DB_PASSWORD}', false], ['val hash = passwordHasher.hash(password)', false], ['password: changeme', false], ['VITE_API_URL=http://localhost:8080', false],
  ['      password: petclinic', true], ['db.password = "s3cretValue99"', true], ['PASSWORD=hunter2hunter2', true], ['"apiKey": "abcd1234efgh"', true]];
const wrongCred = credCases.filter(([t, want]) => L.looksSecret(t) !== want).map(([t]) => t);
check('credential check flags literal values but not types, placeholders or field names', !wrongCred.length, wrongCred.join(' | '));
check('.env files are judged by content, key files are refused by name', !L.SECRET_FILE.test('ui/.env.docker') && L.SECRET_FILE.test('certs/a.pem'));

/* show.js prints numbered lines from origin/HEAD, not the working tree */
fs.writeFileSync(path.join(orders2, 'src/main/scala/OrdersRoutes.scala'), 'uncommitted change\n');
r = node(path.join(SCRIPTS, 'show.js'), orders2, 'src/main/scala/OrdersRoutes.scala', '5', '5');
check('show.js prints a numbered line from the default branch', r.status === 0 && /^5 {2}.*path\("orders"\)/.test(r.stdout), r.stdout + r.stderr);

/* merge.js combines fragments, joins evidence on the same connection, and reports conflicts */
const frag = path.join(tmp, 'frag.json');
fs.writeFileSync(frag, JSON.stringify({
  components: [{ id: 'fraud', label: 'Fraud check', short: 'Optional', layer: 'api', repo: 'payments', purpose: 'Scores charges.', condition: 'Only when FRAUD_URL is set',
    evidence: [E('payments:app/Routes.scala:1', 'path("charges")')] }, { ...comps.components[1], purpose: 'Changed text' }],
  connections: [{ from: 'payments', to: 'fraud', protocol: 'HTTP', condition: 'Only when FRAUD_URL is set', evidence: [E('payments:app/Routes.scala:1', 'complete(charge())')] },
    { from: 'orders', to: 'payments', protocol: 'HTTP', evidence: [E('payments:app/Routes.scala:1', 'path("charges")')] }],
}));
r = node(path.join(SCRIPTS, 'merge.js'), map, frag);
const merged = JSON.parse(fs.readFileSync(path.join(map, 'connections.json'), 'utf8'));
check('merge.js adds new items, joins evidence and reports a conflicting component', r.status === 1 && /Added 1 components, 1 connections/.test(r.stdout) &&
  /component payments/.test(r.stdout) && merged.find(c => c.to === 'payments').evidence.length === 2, r.stdout + r.stderr);
r = node(path.join(SCRIPTS, 'build.js'), map);
const html2 = fs.readFileSync(path.join(map, 'architecture.html'), 'utf8'), md2 = fs.readFileSync(path.join(map, 'ARCHITECTURE.md'), 'utf8');
check('conditional parts are carried to the page and drawn dashed in Mermaid', r.status === 0 && html2.includes('Only when FRAUD_URL is set') &&
  md2.includes('n_payments -.->|"HTTP"| n_fraud') && md2.includes('*Optional: Only when FRAUD_URL is set*'), r.stdout + r.stderr);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} test(s) failed` : '\nall tests passed');
process.exit(failed ? 1 : 0);
