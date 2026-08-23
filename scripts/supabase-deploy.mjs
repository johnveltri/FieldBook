import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const linkedProjectRefPath = resolve(repoRoot, 'backend/supabase/.temp/project-ref');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const targets = {
  staging: {
    label: 'STAGING',
    projectRef: 'anypejjoovlatmrkrxvx',
    requiredBranch: null,
  },
  production: {
    label: 'PRODUCTION',
    projectRef: 'gfvqmxsiuhhujnckghpa',
    requiredBranch: 'main',
  },
};

function usage() {
  console.log('Usage: node scripts/supabase-deploy.mjs <staging|production> [--apply]');
  console.log('Without --apply, the command verifies locally and performs a remote dry-run only.');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
  return result;
}

function gitOutput(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

const requestedTarget = process.argv[2];
if (!requestedTarget || requestedTarget === '--help' || requestedTarget === '-h') {
  usage();
  process.exit(requestedTarget ? 0 : 1);
}

const target = targets[requestedTarget];
if (!target) {
  usage();
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const unexpectedArgs = process.argv.slice(3).filter((arg) => arg !== '--apply');
if (unexpectedArgs.length > 0) {
  usage();
  process.exit(1);
}

const workingTreeStatus = gitOutput(['status', '--porcelain']);
if (workingTreeStatus) {
  console.error('Refusing a hosted database operation from a dirty working tree. Commit or stash first.');
  process.exit(1);
}

const currentBranch = gitOutput(['branch', '--show-current']);
if (target.requiredBranch && currentBranch !== target.requiredBranch) {
  console.error(
    `Refusing a ${target.label} database operation from branch "${currentBranch || '(detached)'}". `
      + `Use a clean ${target.requiredBranch} checkout.`,
  );
  process.exit(1);
}

console.log(`Target: ${target.label} (${target.projectRef})`);
console.log('Rebuilding and testing the local database before contacting the hosted project...');
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'db:verify']);

run(npxCommand, [
  'supabase',
  'link',
  '--workdir',
  'backend',
  '--project-ref',
  target.projectRef,
]);

if (!existsSync(linkedProjectRefPath)) {
  console.error('Supabase link completed without writing a linked project reference.');
  process.exit(1);
}

const linkedProjectRef = readFileSync(linkedProjectRefPath, 'utf8').trim();
if (linkedProjectRef !== target.projectRef) {
  console.error(
    `Refusing to continue: linked project is ${linkedProjectRef}, expected ${target.projectRef}.`,
  );
  process.exit(1);
}

console.log(`Verified linked project: ${linkedProjectRef}`);
run(npxCommand, ['supabase', 'migration', 'list', '--linked', '--workdir', 'backend']);
run(npxCommand, ['supabase', 'db', 'push', '--linked', '--dry-run', '--workdir', 'backend']);

if (!apply) {
  console.log(`Dry-run complete. Run the ${target.label} apply script only after reviewing it.`);
  process.exit(0);
}

if (!input.isTTY || !output.isTTY) {
  console.error('Refusing to apply migrations without an interactive confirmation.');
  process.exit(1);
}

const prompt = createInterface({ input, output });
const confirmation = await prompt.question(
  `Type the project ref ${target.projectRef} to apply migrations to ${target.label}: `,
);
prompt.close();

if (confirmation.trim() !== target.projectRef) {
  console.error('Confirmation did not match. No migrations were applied.');
  process.exit(1);
}

run(npxCommand, ['supabase', 'db', 'push', '--linked', '--workdir', 'backend']);
run(npxCommand, ['supabase', 'migration', 'list', '--linked', '--workdir', 'backend']);
console.log(`${target.label} database migrations applied and migration history rechecked.`);
