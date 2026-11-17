import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const monorepo = fs.existsSync(path.join(root, 'apps/wayfare-mobile'));
const roots = monorepo ? ['apps/mobile/app', 'apps/mobile/src', 'apps/wayfare-mobile/app', 'apps/wayfare-mobile/src', 'apps/web/src', 'services/api/src', 'services/api/prisma', 'supabase', 'docs/wayfare-live', 'docs/wayfare-share'] : ['mobile/app', 'mobile/lib', 'mobile/components', 'src', 'server', 'supabase'];
const pattern = /useState\b|useReducer\b|BehaviorSubject\b|setInterval\(|setTimeout\(|onAuthStateChange\(|defineTask\(|let\s+(?:inFlight|active|cached\w*)\b|\b(?:CHECK|check)\s*\(|(?:status|state|phase|active|pending|failed|visibility|consumed_at|revoked_at|expires_at)\s*[:=]/;
const files = [];
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', 'dist', '__tests__', 'tests'].includes(name)) scan(full);
    } else if (/\.(?:[cm]?js|jsx|tsx?|sql|prisma|html)$/.test(name) && !/\.(?:test|spec)\./.test(name)) {
      const evidence = fs.readFileSync(full, 'utf8').split('\n').flatMap((text, i) =>
        pattern.test(text) ? [{ line: i + 1, text: text.trim().slice(0, 240) }] : []);
      if (evidence.length) files.push({ path: path.relative(root, full).split(path.sep).join('/'), evidence });
    }
  }
}
for (const dir of roots) scan(path.join(root, dir));
files.sort((a, b) => a.path.localeCompare(b.path));
const result = JSON.stringify({
  description: 'Source candidates for state-machine review, not proof of semantic exhaustiveness. UI input fields and schema constraints can be simple state; review the curated inventory for meaning.',
  roots, files
}, null, 2) + '\n';
const directory = path.join(root, 'docs/state-machines');
const workflows = [];
for (const inventory of monorepo ? ['WAYFARE.md', 'ARIYOO.md'] : ['README.md']) {
  for (const row of fs.readFileSync(path.join(directory, inventory), 'utf8').split('\n')) {
    if (!/^\| [RWA]\d\d /.test(row)) continue;
    const [label, sources, transitions, decision] = row.slice(1, -1).split('|').map(value => value.trim());
    const space = label.indexOf(' ');
    workflows.push({ id: label.slice(0, space), flow: label.slice(space + 1), sources, transitions, decision, inventory });
  }
}
if (new Set(workflows.map(flow => flow.id)).size !== workflows.length) throw new Error('Duplicate workflow IDs');
const catalog = JSON.stringify({
  description: 'Curated workflow families. Conceptual states are not new wire enums; source-index.json provides broader candidate evidence.',
  workflows
}, null, 2) + '\n';
for (const [name, content] of [['source-index.json', result], ['inventory.json', catalog]]) {
  const destination = path.join(directory, name);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== content) {
      console.error(name + ' is stale. Run node scripts/state-index.mjs and review the inventory.');
      process.exitCode = 1;
    }
  } else {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(destination, content);
  }
}
if (!process.exitCode) console.log('State inventory current: ' + workflows.length + ' workflows, ' + files.length + ' candidate files.');
