import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mobileEnvPath = resolve(repoRoot, 'apps/mobile-expo/.env.local');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runSupabase(args, options = {}) {
  return spawnSync(npxCommand, ['supabase', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function parseEnvOutput(output) {
  const values = new Map();

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }

  return values;
}

function replaceManagedValues(existing, managedValues) {
  const managedNames = new Set(managedValues.map(([name]) => name));
  const managedComments = new Set([
    '# Managed by `npm run local:setup`.',
    '# Local-only values; this file is ignored by Git.',
    '# Preserved local overrides',
  ]);
  const preserved = existing
    .split(/\r?\n/)
    .filter((line) => {
      const match = line.match(/^([A-Z0-9_]+)=/);
      return !match || !managedNames.has(match[1]);
    })
    .filter((line) => !managedComments.has(line));

  while (preserved.length > 0 && preserved[0] === '') preserved.shift();
  while (preserved.length > 0 && preserved.at(-1) === '') preserved.pop();

  const generated = [
    '# Managed by `npm run local:setup`.',
    '# Local-only values; this file is ignored by Git.',
    ...managedValues.map(([name, value]) => `${name}=${value}`),
  ];

  if (preserved.length > 0) {
    generated.push('', '# Preserved local overrides', ...preserved);
  }

  return `${generated.join('\n')}\n`;
}

console.log('Starting the local Supabase stack...');
const start = runSupabase(['start', '--workdir', 'backend'], { stdio: 'inherit' });
if (start.status !== 0) {
  console.error('Local Supabase did not start. Make sure Docker Desktop is running, then retry.');
  process.exit(start.status ?? 1);
}

const status = runSupabase(['status', '--workdir', 'backend', '--output', 'env']);
if (status.status !== 0) {
  if (status.stderr) process.stderr.write(status.stderr);
  console.error('Could not read local Supabase connection values.');
  process.exit(status.status ?? 1);
}

const statusValues = parseEnvOutput(status.stdout);
const apiUrl = statusValues.get('API_URL');
const publishableKey = statusValues.get('PUBLISHABLE_KEY') ?? statusValues.get('ANON_KEY');

if (!apiUrl || !publishableKey) {
  console.error('Supabase status did not include API_URL and a publishable/anon key.');
  process.exit(1);
}

let apiHost;
try {
  apiHost = new URL(apiUrl).hostname;
} catch {
  console.error('Supabase returned an invalid local API URL.');
  process.exit(1);
}

if (!['127.0.0.1', 'localhost', '::1'].includes(apiHost)) {
  console.error(`Refusing to write a non-local Supabase URL to ${mobileEnvPath}.`);
  process.exit(1);
}

const managedValues = [
  ['EXPO_PUBLIC_APP_ENV', 'development'],
  ['EXPO_PUBLIC_SUPABASE_URL', apiUrl],
  ['EXPO_PUBLIC_SUPABASE_ANON_KEY', publishableKey],
  ['EXPO_PUBLIC_ANALYTICS_PROVIDER', 'none'],
  ['EXPO_PUBLIC_POSTHOG_KEY', ''],
  ['EXPO_PUBLIC_JOB_DETAIL_FULLSCREEN_EDIT', 'true'],
  ['EXPO_PUBLIC_ANALYTICS_DEBUG_RICH', 'false'],
  ['EXPO_PUBLIC_IS_TESTFLIGHT', 'false'],
];
const existing = existsSync(mobileEnvPath) ? readFileSync(mobileEnvPath, 'utf8') : '';

writeFileSync(mobileEnvPath, replaceManagedValues(existing, managedValues), {
  encoding: 'utf8',
  mode: 0o600,
});
chmodSync(mobileEnvPath, 0o600);

console.log(`Configured ${mobileEnvPath} for ${apiUrl}.`);
console.log('Local Supabase is ready. Run `npm run mobile` or use `npm run dev:local` next time.');
