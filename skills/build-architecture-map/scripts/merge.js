#!/usr/bin/env node
/*
 * Merges draft fragments (from research agents) into a map folder.
 *
 *   node merge.js <map-dir> <fragment.json> [more.json ...]
 *
 * A fragment is { "components": [], "connections": [], "flows": [], "facts": [] }, any key optional.
 * Components and flows are matched by id, connections by from + to + protocol (evidence is combined),
 * facts by group. A component or flow that already exists with different content is kept as it is and
 * reported as a conflict for you to resolve by hand. Run build.js afterwards.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const [dir, ...frags] = process.argv.slice(2);
if (!dir || !frags.length) { console.error('Usage: node merge.js <map-dir> <fragment.json> [...]'); process.exit(2); }
const file = f => path.join(dir, f);
const comp = L.readJson(file('components.json'));
const conns = L.readJson(file('connections.json'), []), flows = L.readJson(file('flows.json'), []), facts = L.readJson(file('facts.json'), []);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const addEvidence = (into, list) => { for (const e of list || []) if (!into.some(x => x.ref === e.ref)) into.push(e); };
const conflicts = [], added = { components: 0, connections: 0, flows: 0, facts: 0 };
for (const f of frags) {
  const x = L.readJson(f);
  for (const c of x.components || []) {
    const old = comp.components.find(o => o.id === c.id);
    if (!old) { comp.components.push(c); added.components++; } else if (!same(old, c)) conflicts.push(`component ${c.id} (from ${f})`);
  }
  for (const c of x.connections || []) {
    const old = conns.find(o => o.from === c.from && o.to === c.to && o.protocol === c.protocol);
    if (!old) { conns.push(c); added.connections++; } else addEvidence(old.evidence = old.evidence || [], c.evidence);
  }
  for (const fl of x.flows || []) {
    const old = flows.find(o => o.id === fl.id);
    if (!old) { flows.push(fl); added.flows++; } else if (!same(old, fl)) conflicts.push(`flow ${fl.id} (from ${f})`);
  }
  for (const g of x.facts || []) {
    const old = facts.find(o => o.group === g.group);
    if (!old) { facts.push(g); added.facts += (g.items || []).length; continue; }
    for (const it of g.items || []) if (!old.items.some(o => o.text === it.text)) { old.items.push(it); added.facts++; }
  }
}
fs.writeFileSync(file('components.json'), JSON.stringify(comp, null, 2) + '\n');
fs.writeFileSync(file('connections.json'), JSON.stringify(conns, null, 2) + '\n');
fs.writeFileSync(file('flows.json'), JSON.stringify(flows, null, 2) + '\n');
fs.writeFileSync(file('facts.json'), JSON.stringify(facts, null, 2) + '\n');
console.log(`Added ${added.components} components, ${added.connections} connections, ${added.flows} flows, ${added.facts} facts.`);
const ids = new Set(comp.components.map(c => c.id));
const unknown = [...new Set(conns.flatMap(c => [c.from, c.to]).filter(i => !ids.has(i)))];
if (unknown.length) console.log(`Connections name components that do not exist yet: ${unknown.join(', ')}`);
if (conflicts.length) { console.log('Conflicts, kept the existing version:\n  ' + conflicts.join('\n  ')); process.exit(1); }
